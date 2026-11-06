import { situacaoDoCadastro, type CadastroDaLoja } from './situacao.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { CAMPOS_FUNCIONARIO, CAMPOS_LOJA } from '../planilhas/campos.js';
import { inferirMapeamento, type Mapeamento } from '../planilhas/inferencia.js';
import { lerPlanilha, type Aba } from '../planilhas/leitor.js';
import type { FuncionarioBody, LojaBody } from './cadastros.schemas.js';
import { formatarCnpj, normalizarCnpj, validarCnpj } from '../ge/cnpj.js';
import { semanalDeMensal } from './carga.js';
import { soDigitos } from './documentos.js';
import { validarIntervalo } from './intervalo.js';
import { processarLinhas, type FuncionarioInput, type LojaInput } from './processar.js';

export type LojaRegistro = LojaBody & {
  id: string;
  horariosResumo?: string;
  // Quantos funcionários ativos a loja tem (só na listagem).
  funcionarios?: number;
};
export type FuncionarioRegistro = Omit<FuncionarioBody, 'funcaoEscala'> & {
  id: string;
  funcaoEscala: string | null;
};
export type Pagina<T> = { data: T[]; meta: { page: number; pageSize: number; total: number } };
export type Filtro = {
  page: number;
  pageSize: number;
  busca?: string;
  lojaId?: string;
  lojaIds?: string[];
};
export type FiltroLojas = Filtro & { uf?: string; situacao?: 'completo' | 'revisar' };
export type ImportacaoRegistro = { id: string; arquivo: string; status: string; abas: Aba[] };

export type CadastrosRepository = {
  listarLojas: (f: Filtro) => Promise<{ data: LojaRegistro[]; total: number }>;
  // Todas as lojas ativas do GE, com os farmacêuticos ativos de cada uma (para a situação do cadastro e os filtros).
  lojasComEquipe: () => Promise<
    { loja: LojaRegistro; farmaceuticos: number; cadastro: CadastroDaLoja }[]
  >;
  buscarLoja: (id: string) => Promise<LojaRegistro | null>;
  buscarLojaPorCodigo: (codigo: string) => Promise<LojaRegistro | null>;
  buscarLojaPorCnpj: (cnpj: string) => Promise<LojaRegistro | null>;
  // Vale no sistema todo (o CNPJ é único entre todos os GEs); só diz se está em uso, sem mostrar de quem.
  cnpjEmUso: (cnpj: string, exceto?: string) => Promise<boolean>;
  criarLoja: (i: LojaBody) => Promise<LojaRegistro>;
  atualizarLoja: (id: string, i: Partial<LojaBody>) => Promise<LojaRegistro>;
  configuracaoDaLoja: (id: string) => Promise<{
    convencao8h24: boolean;
    minimos: Record<string, number>;
    custos: { salarioMedio: Record<string, number>; encargos?: object } | null;
  }>;
  gravarConfiguracao: (
    id: string,
    c: {
      convencao8h24?: boolean;
      minimos?: Record<string, number>;
      custos?: { salarioMedio: Record<string, number>; encargos?: object };
    },
  ) => Promise<void>;
  removerLoja: (id: string) => Promise<void>;
  contarFuncionariosDaLoja: (lojaId: string) => Promise<number>;
  listarFuncionarios: (f: Filtro) => Promise<{ data: FuncionarioRegistro[]; total: number }>;
  buscarFuncionario: (id: string) => Promise<FuncionarioRegistro | null>;
  cpfsDaLoja: (lojaId: string) => Promise<{ id: string; cpf: string }[]>;
  buscarFuncionarioPorMatricula: (m: string) => Promise<FuncionarioRegistro | null>;
  criarFuncionario: (i: FuncionarioBody) => Promise<FuncionarioRegistro>;
  atualizarFuncionario: (id: string, i: Partial<FuncionarioBody>) => Promise<FuncionarioRegistro>;
  removerFuncionario: (id: string) => Promise<void>;
  criarImportacao: (arquivo: string, abas: Aba[]) => Promise<ImportacaoRegistro>;
  buscarImportacao: (id: string) => Promise<ImportacaoRegistro | null>;
  fecharImportacao: (id: string, mapeamento: Mapeamento, resumo: unknown) => Promise<void>;
};

export type ResumoImportacao = {
  lojas: { novos: number; atualizados: number };
  funcionarios: { novos: number; atualizados: number };
  erros: { aba: string; linha: number; motivo: string }[];
  // O que foi ignorado ou ajustado sem travar a importação (permissão, CNPJ diferente, custo incompleto).
  avisos: string[];
};

const pagina = <T>(r: { data: T[]; total: number }, f: Filtro): Pagina<T> => ({
  data: r.data,
  meta: { page: f.page, pageSize: f.pageSize, total: r.total },
});

// Regras de funcionário que valem na criação e na edição: carga semanal derivada da mensal,
// entrada e saída juntas e diferentes, dias sem repetição e CPF único na loja.
const prepararFuncionario = async <T extends Partial<FuncionarioBody>>(
  repo: CadastrosRepository,
  body: T,
  atual?: FuncionarioRegistro,
): Promise<T> => {
  const preparado = { ...body };
  if (body.cargaMensalH !== undefined && body.cargaSemanalH === undefined)
    preparado.cargaSemanalH = semanalDeMensal(body.cargaMensalH);
  if (body.dias) preparado.dias = [...new Set(body.dias)].sort();
  if (body.entrada !== undefined || body.saida !== undefined) {
    const entrada = body.entrada === undefined ? atual?.entrada : body.entrada;
    const saida = body.saida === undefined ? atual?.saida : body.saida;
    if (!!entrada !== !!saida)
      throw new ValidationError('Informe a entrada e a saída (ou deixe as duas em branco)');
    if (entrada && entrada === saida)
      throw new ValidationError('A saída deve ser diferente da entrada');
  }
  // Intervalo: vale o que veio na requisição, e o que já estava gravado para o que não veio.
  if (
    body.entrada !== undefined ||
    body.saida !== undefined ||
    body.iniIntervalo !== undefined ||
    body.fimIntervalo !== undefined
  ) {
    const erro = validarIntervalo({
      entrada: body.entrada === undefined ? atual?.entrada : body.entrada,
      saida: body.saida === undefined ? atual?.saida : body.saida,
      ini: body.iniIntervalo === undefined ? atual?.iniIntervalo : body.iniIntervalo,
      fim: body.fimIntervalo === undefined ? atual?.fimIntervalo : body.fimIntervalo,
    });
    if (erro) throw new ValidationError(erro);
  }
  if (body.cpf) {
    const lojaId = body.lojaId ?? atual?.lojaId;
    const digitos = soDigitos(body.cpf);
    if (
      lojaId &&
      (await repo.cpfsDaLoja(lojaId)).some(
        (o) => o.id !== atual?.id && soDigitos(o.cpf) === digitos,
      )
    )
      throw new ConflictError('Já existe funcionário com esse CPF nesta loja', 'CPF_DUPLICADO');
  }
  return preparado;
};

// O operador recebe o que o sistema entendeu. O dono recebe a aba Lojas só quando ela tem as colunas obrigatórias (uma planilha
// só de equipe também parece "lojas" para a inferência e não deve exigir colunas de loja); o gestor importa só a equipe.
const mapeamentoOferecido = (m: Mapeamento, perfil: string): Mapeamento => {
  if (perfil === 'PLATFORM_OPERATOR') return m;
  if (perfil !== 'TENANT_ADMIN' || !m.lojas) return { ...m, lojas: null };
  const completa =
    CAMPOS_LOJA.filter((c) => c.obrigatorio).every((c) => m.lojas!.colunas[c.chave] != null) &&
    (m.lojas.colunas.cnpj != null || m.lojas.colunas.codigo != null);
  return completa ? m : { ...m, lojas: null };
};

// Lê e (se não for só simular) grava a importação do Cadastro. Com `simular`, faz as mesmas leituras e decisões sem escrever nada.
const executarImportacao = async (
  repo: CadastrosRepository,
  auditar: Auditor,
  id: string,
  mapeamento: Mapeamento,
  perfil: string,
  simular: boolean,
): Promise<{ resumo: ResumoImportacao; arquivo: string }> => {
    const imp = await repo.buscarImportacao(id);
    if (!imp) throw new NotFoundError('Importação não encontrada', 'IMPORTACAO_NAO_ENCONTRADA');
    if (imp.status === 'confirmada')
      throw new ConflictError('Esta importação já foi confirmada', 'IMPORTACAO_JA_CONFIRMADA');

    for (const [chave, campos, parte] of [
      ['lojas', CAMPOS_LOJA, mapeamento.lojas],
      ['funcionarios', CAMPOS_FUNCIONARIO, mapeamento.funcionarios],
    ] as const) {
      if (!parte) continue;
      const falta = campos
        .filter((c) => c.obrigatorio && parte.colunas[c.chave] == null)
        .map((c) => c.rotulo);
      // A loja é identificada pelo CNPJ; planilha antiga, sem a coluna de CNPJ, pode usar o código.
      const [porCnpj, porCodigo] =
        chave === 'lojas' ? (['cnpj', 'codigo'] as const) : (['cnpj_loja', 'loja'] as const);
      if (parte.colunas[porCnpj] == null && parte.colunas[porCodigo] == null)
        falta.push(chave === 'lojas' ? 'CNPJ' : 'CNPJ da loja');
      if (falta.length)
        throw new ValidationError(
          `Não encontramos a coluna ${falta.join(', ')}. Baixe o modelo e confira os nomes das colunas.`,
        );
    }
    if (!mapeamento.lojas && !mapeamento.funcionarios)
      throw new ValidationError('Indique ao menos uma aba (Lojas ou Funcionários).');
    const proc = processarLinhas(imp.abas, mapeamento);
    const operador = perfil === 'PLATFORM_OPERATOR';
    const dono = perfil === 'TENANT_ADMIN';
    // Quem importa lojas: o operador (cria e atualiza) e o dono (só atualiza as que existem). Os demais perfis importam só a equipe.
    const avisos: string[] = [];
    let lojasDaPlanilha = proc.lojas as LojaInput[];
    if (mapeamento.lojas && !operador && !dono) {
      lojasDaPlanilha = [];
      avisos.push(
        'A aba Lojas foi ignorada: só o operador e o dono do grupo importam lojas. A equipe foi importada normalmente.',
      );
    }
    const resumo: ResumoImportacao = {
      lojas: { novos: 0, atualizados: 0 },
      funcionarios: { novos: 0, atualizados: 0 },
      erros: [...proc.erros],
      avisos,
    };
    const abaLojas = mapeamento.lojas?.aba ?? 'Lojas';
    const semPermissaoDeValores = new Set<string>();

    const lojaIds = new Map<string, string>();
    for (const loja of lojasDaPlanilha) {
      const { linha, configuracao, faturamento, ...dados } = loja;
      const n = linha ?? 0;
      const rotulo = dados.cnpj ? `CNPJ ${formatarCnpj(dados.cnpj)}` : `Loja ${dados.codigo}`;
      const erro = (motivo: string) => resumo.erros.push({ aba: abaLojas, linha: n, motivo });
      const l = { ...dados } as LojaInput;
      // Faturamento, salário e encargos são valores em reais: só o dono grava.
      if (dono && faturamento) l.faturamento = faturamento;
      if (!dono && (faturamento || configuracao?.custos)) semPermissaoDeValores.add(rotulo);

      // O CNPJ identifica a loja; sem loja com esse CNPJ no grupo, vale o código (planilha antiga).
      const porCnpj = l.cnpj ? await repo.buscarLojaPorCnpj(l.cnpj) : null;
      const porCodigo = !porCnpj && l.codigo ? await repo.buscarLojaPorCodigo(l.codigo) : null;
      const existente = porCnpj ?? porCodigo;
      if (!existente && l.cnpj && !l.codigo) {
        erro('CNPJ não encontrado entre as lojas do grupo');
        continue;
      }
      if (!existente && !operador) {
        erro(`${rotulo} não cadastrada: só o operador cria lojas`);
        continue;
      }
      if (!existente && (!l.codigo || !l.nome)) {
        erro('Para criar uma loja informe o código e o nome da loja');
        continue;
      }
      // Achada pelo CNPJ: o código e o CNPJ cadastrados não mudam por aqui.
      if (porCnpj) {
        delete l.codigo;
        delete l.cnpj;
      }
      if (porCodigo && !operador) {
        // O CNPJ identifica a loja na carga da plataforma: o dono não muda.
        if (l.cnpj && normalizarCnpj(l.cnpj) !== (existente?.cnpj ?? undefined))
          avisos.push(`${rotulo}: o CNPJ da planilha foi ignorado (só o operador altera o CNPJ).`);
        delete l.cnpj;
      }
      if (l.cnpj && (await repo.cnpjEmUso(l.cnpj, existente?.id))) {
        erro(`${rotulo}: este CNPJ já está cadastrado`);
        continue;
      }
      let lojaId: string;
      if (existente) {
        if (!simular) await repo.atualizarLoja(existente.id, l);
        lojaId = existente.id;
        resumo.lojas.atualizados++;
      } else {
        // Na revisão (simular) nada é criado: a loja nova recebe um identificador provisório.
        lojaId = simular
          ? `provisorio-${n}`
          : (await repo.criarLoja({ ...l, codigo: l.codigo!, nome: l.nome! })).id;
        resumo.lojas.novos++;
      }
      if (dados.codigo) lojaIds.set(`codigo:${dados.codigo}`, lojaId);
      if (dados.cnpj) lojaIds.set(`cnpj:${dados.cnpj}`, lojaId);
      if (existente?.cnpj) lojaIds.set(`cnpj:${existente.cnpj}`, lojaId);

      if (configuracao && simular) {
        if (dono && configuracao.custos?.encargosPct !== undefined)
          avisos.push(
            `${rotulo}: a coluna Encargos (%) foi ignorada, o encargo agora vem do regime tributário da loja.`,
          );
      } else if (configuracao) {
        const atual = await repo.configuracaoDaLoja(lojaId);
        const grava: Parameters<CadastrosRepository['gravarConfiguracao']>[1] = {};
        if (configuracao.convencao8h24 !== undefined)
          grava.convencao8h24 = configuracao.convencao8h24;
        if (configuracao.minimos)
          grava.minimos = { ...atual.minimos, ...(configuracao.minimos as Record<string, number>) };
        if (dono && configuracao.custos) {
          // O encargo vem do regime tributário da loja: a coluna "Encargos (%)" da planilha não vale mais.
          if (configuracao.custos.encargosPct !== undefined)
            avisos.push(
              `${rotulo}: a coluna Encargos (%) foi ignorada, o encargo agora vem do regime tributário da loja.`,
            );
          // Os ajustes antigos de RAT/FAP/rescisão que já estavam guardados seguem como estão (o `...atual.custos` os mantém).
          const salarios = configuracao.custos.salarioMedio as Record<string, number>;
          if (Object.keys(salarios).length)
            grava.custos = {
              ...(atual.custos ?? {}),
              salarioMedio: { ...(atual.custos?.salarioMedio ?? {}), ...salarios },
            };
        }
        if (Object.keys(grava).length) await repo.gravarConfiguracao(lojaId, grava);
      }
    }
    if (semPermissaoDeValores.size)
      avisos.push(
        `Faturamento, salário médio e encargos foram ignorados em ${semPermissaoDeValores.size} loja(s): só o dono do grupo grava esses valores.`,
      );

    for (const f of proc.funcionarios as FuncionarioInput[]) {
      // A loja de lotação: pelo CNPJ (modelo novo) ou, planilha antiga, pelo código.
      const lojaId = f.lojaCnpj
        ? (lojaIds.get(`cnpj:${f.lojaCnpj}`) ?? (await repo.buscarLojaPorCnpj(f.lojaCnpj))?.id)
        : (lojaIds.get(`codigo:${f.lojaCodigo}`) ??
          (await repo.buscarLojaPorCodigo(f.lojaCodigo ?? ''))?.id);
      if (!lojaId) {
        resumo.erros.push({
          aba: mapeamento.funcionarios!.aba,
          linha: f.linha ?? 0,
          motivo: f.lojaCnpj
            ? `Funcionário ${f.matricula}: CNPJ ${formatarCnpj(f.lojaCnpj)} não encontrado entre as lojas do grupo`
            : `Funcionário ${f.matricula}: loja ${f.lojaCodigo} não existe`,
        });
        continue;
      }
      const { lojaCodigo: _omit, lojaCnpj: _omitCnpj, linha: _linha, ...dados } = f;
      void _omit;
      void _omitCnpj;
      void _linha;
      const corpo = { ...dados, lojaId };
      const existente = await repo.buscarFuncionarioPorMatricula(f.matricula);
      if (existente) {
        if (!simular) await repo.atualizarFuncionario(existente.id, corpo);
        resumo.funcionarios.atualizados++;
      } else {
        if (!simular) await repo.criarFuncionario(corpo);
        resumo.funcionarios.novos++;
      }
    }

    if (simular) return { resumo, arquivo: imp.arquivo };
    await repo.fecharImportacao(id, mapeamento, resumo);
    await auditar({
      acao: 'cadastro.importado',
      perfil,
      alvoTipo: 'importacao',
      alvoId: id,
      detalhe: {
        arquivo: imp.arquivo,
        lojas: resumo.lojas,
        funcionarios: resumo.funcionarios,
        erros: resumo.erros.length,
        avisos: resumo.avisos.length,
      },
    });
    return { resumo, arquivo: imp.arquivo };
};


export const makeCadastrosService = (repo: CadastrosRepository, auditar: Auditor) => ({
  // A situação do cadastro (Completo/Revisar) depende da equipe, do funcionamento e do faturamento: é calculada para as lojas
  // do grupo e a busca, os filtros e a paginação acontecem em memória (um grupo tem centenas de lojas, não milhares).
  async listarLojas(f: FiltroLojas) {
    const todas = (await repo.lojasComEquipe()).map(({ loja, farmaceuticos, cadastro }) => ({
      ...loja,
      situacao: situacaoDoCadastro(
        loja as unknown as Parameters<typeof situacaoDoCadastro>[0],
        farmaceuticos,
        cadastro,
      ),
    }));
    const termo = f.busca?.trim().toLowerCase() ?? '';
    const digitos = termo.replace(/\D/g, '');
    const filtradas = todas.filter((l) => {
      if (f.lojaIds && !f.lojaIds.includes(l.id)) return false;
      if (f.uf && l.uf !== f.uf) return false;
      if (f.situacao && l.situacao.status !== f.situacao) return false;
      if (!termo) return true;
      return (
        l.nome.toLowerCase().includes(termo) ||
        l.codigo.toLowerCase().includes(termo) ||
        (digitos.length >= 3 && (l.cnpj ?? '').replace(/\D/g, '').includes(digitos))
      );
    });
    const ini = (f.page - 1) * f.pageSize;
    return pagina({ data: filtradas.slice(ini, ini + f.pageSize), total: filtradas.length }, f);
  },
  listarFuncionarios: async (f: Filtro) => pagina(await repo.listarFuncionarios(f), f),

  async criarLoja(body: LojaBody, perfil: string) {
    if (await repo.buscarLojaPorCodigo(body.codigo))
      throw new ConflictError('Já existe loja com esse código', 'LOJA_DUPLICADA');
    if (body.cnpj && (await repo.cnpjEmUso(body.cnpj)))
      throw new ConflictError('Este CNPJ já está cadastrado', 'CNPJ_EM_USO');
    const loja = await repo.criarLoja(body);
    await auditar({ acao: 'loja.criada', perfil, alvoTipo: 'loja', alvoId: loja.id });
    return loja;
  },
  async editarLoja(id: string, body: Partial<LojaBody>, perfil: string) {
    const atual = await repo.buscarLoja(id);
    if (!atual) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    if (body.cnpj !== undefined) {
      if (perfil === 'PLATFORM_OPERATOR') {
        if (body.cnpj !== atual.cnpj && (await repo.cnpjEmUso(body.cnpj, id)))
          throw new ConflictError('Este CNPJ já está cadastrado', 'CNPJ_EM_USO');
      } else if (body.cnpj !== (atual.cnpj ?? undefined)) {
        // O CNPJ identifica a loja na carga da plataforma: só o operador muda.
        throw new AppError(
          'O CNPJ da loja só pode ser alterado por quem cuida da plataforma',
          400,
          'CNPJ_NAO_EDITAVEL',
        );
      }
    }
    // O código vem do Id da plataforma e a carga o mantém: só o operador muda.
    if (body.codigo !== undefined && body.codigo !== atual.codigo && perfil !== 'PLATFORM_OPERATOR')
      throw new AppError(
        'O código da loja só pode ser alterado por quem cuida da plataforma',
        400,
        'CODIGO_NAO_EDITAVEL',
      );
    if (body.codigo) {
      const outra = await repo.buscarLojaPorCodigo(body.codigo);
      if (outra && outra.id !== id)
        throw new ConflictError('Já existe loja com esse código', 'LOJA_DUPLICADA');
    }
    const loja = await repo.atualizarLoja(id, body);
    await auditar({ acao: 'loja.editada', perfil, alvoTipo: 'loja', alvoId: id });
    return loja;
  },
  async removerLoja(id: string, perfil: string) {
    if (!(await repo.buscarLoja(id)))
      throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    if ((await repo.contarFuncionariosDaLoja(id)) > 0)
      throw new ConflictError(
        'A loja ainda tem funcionários. Mude a lotação deles antes.',
        'LOJA_COM_FUNCIONARIOS',
      );
    await repo.removerLoja(id);
    await auditar({ acao: 'loja.removida', perfil, alvoTipo: 'loja', alvoId: id });
  },

  async criarFuncionario(body: FuncionarioBody, perfil: string) {
    if (!(await repo.buscarLoja(body.lojaId)))
      throw new ValidationError('Loja de lotação não existe');
    if (await repo.buscarFuncionarioPorMatricula(body.matricula))
      throw new ConflictError('Já existe funcionário com essa matrícula', 'FUNCIONARIO_DUPLICADO');
    const f = await repo.criarFuncionario(await prepararFuncionario(repo, body));
    await auditar({ acao: 'funcionario.criado', perfil, alvoTipo: 'funcionario', alvoId: f.id });
    return f;
  },
  async editarFuncionario(id: string, body: Partial<FuncionarioBody>, perfil: string) {
    const atual = await repo.buscarFuncionario(id);
    if (!atual) throw new NotFoundError('Funcionário não encontrado', 'FUNCIONARIO_NAO_ENCONTRADO');
    if (body.lojaId && !(await repo.buscarLoja(body.lojaId)))
      throw new ValidationError('Loja de lotação não existe');
    if (body.matricula) {
      const outro = await repo.buscarFuncionarioPorMatricula(body.matricula);
      if (outro && outro.id !== id)
        throw new ConflictError(
          'Já existe funcionário com essa matrícula',
          'FUNCIONARIO_DUPLICADO',
        );
    }
    const f = await repo.atualizarFuncionario(id, await prepararFuncionario(repo, body, atual));
    await auditar({ acao: 'funcionario.editado', perfil, alvoTipo: 'funcionario', alvoId: id });
    return f;
  },
  async removerFuncionario(id: string, perfil: string) {
    if (!(await repo.buscarFuncionario(id)))
      throw new NotFoundError('Funcionário não encontrado', 'FUNCIONARIO_NAO_ENCONTRADO');
    await repo.removerFuncionario(id);
    await auditar({ acao: 'funcionario.removido', perfil, alvoTipo: 'funcionario', alvoId: id });
  },

  // Passo 1 da importação: lê, entende as colunas e devolve a sugestão para a pessoa confirmar.
  async receberPlanilha(arquivo: string, buffer: Buffer, perfil: string) {
    const abas = (await lerPlanilha(buffer, arquivo)).filter(
      (a) => !/como preencher/i.test(a.nome),
    );
    if (abas.length === 0 || abas.every((a) => a.linhas.length === 0))
      throw new ValidationError(
        'A planilha está vazia. Preencha a partir da linha 2 do modelo e envie de novo.',
      );
    const imp = await repo.criarImportacao(arquivo, abas);
    const inf = inferirMapeamento(abas);
    return {
      id: imp.id,
      arquivo,
      abas: abas.map((a) => ({
        nome: a.nome,
        cabecalhos: a.cabecalhos,
        total: a.linhas.length,
        amostra: a.linhas.slice(0, 5),
      })),
      // A aba de lojas é oferecida ao operador e ao dono do grupo; o gestor importa só a equipe.
      mapeamento: mapeamentoOferecido(inf.mapeamento, perfil),
      sugestoes: inf.sugestoes,
      campos: {
        lojas: CAMPOS_LOJA.map(({ chave, rotulo, obrigatorio, obrigatorioNoModelo, legado }) => ({
          chave,
          rotulo,
          obrigatorio: obrigatorio || !!obrigatorioNoModelo,
          legado: !!legado,
        })),
        funcionarios: CAMPOS_FUNCIONARIO.map(
          ({ chave, rotulo, obrigatorio, obrigatorioNoModelo, legado }) => ({
            chave,
            rotulo,
            obrigatorio: obrigatorio || !!obrigatorioNoModelo,
            legado: !!legado,
          }),
        ),
      },
    };
  },

  // Passo 2: grava o que foi confirmado. Linhas com erro não travam as demais; reenviar atualiza sem duplicar.
  async confirmarImportacao(
    id: string,
    mapeamento: Mapeamento,
    perfil: string,
  ): Promise<ResumoImportacao> {
    return (await executarImportacao(repo, auditar, id, mapeamento, perfil, false)).resumo;
  },

  // Revisão antes de gravar: o mesmo caminho da gravação, sem escrever nada e sem fechar a importação.
  async revisarImportacao(id: string, mapeamento: Mapeamento, perfil: string) {
    const { resumo, arquivo } = await executarImportacao(repo, auditar, id, mapeamento, perfil, true);
    const abaLojas = mapeamento.lojas?.aba;
    const abaFuncionarios = mapeamento.funcionarios?.aba;
    const comErro = (aba: string | undefined) =>
      aba ? resumo.erros.filter((e) => e.aba === aba).length : 0;
    return {
      arquivo,
      lojas: {
        atualiza: resumo.lojas.atualizados,
        novas: resumo.lojas.novos,
        comErro: comErro(abaLojas),
      },
      funcionarios: {
        atualiza: resumo.funcionarios.atualizados,
        novas: resumo.funcionarios.novos,
        comErro: comErro(abaFuncionarios),
      },
      erros: resumo.erros,
      avisos: resumo.avisos,
    };
  },
});

export type CadastrosService = ReturnType<typeof makeCadastrosService>;
