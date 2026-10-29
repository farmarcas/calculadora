import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { CAMPOS_FUNCIONARIO, CAMPOS_LOJA } from '../planilhas/campos.js';
import { inferirMapeamento, type Mapeamento } from '../planilhas/inferencia.js';
import { lerPlanilha, type Aba } from '../planilhas/leitor.js';
import type { FuncionarioBody, LojaBody } from './cadastros.schemas.js';
import { processarLinhas, type FuncionarioInput, type LojaInput } from './processar.js';

export type LojaRegistro = LojaBody & { id: string; horariosResumo?: string };
export type FuncionarioRegistro = Omit<FuncionarioBody, 'funcaoEscala'> & {
  id: string;
  funcaoEscala: string | null;
};
export type Pagina<T> = { data: T[]; meta: { page: number; pageSize: number; total: number } };
export type Filtro = { page: number; pageSize: number; busca?: string; lojaId?: string };
export type ImportacaoRegistro = { id: string; arquivo: string; status: string; abas: Aba[] };

export type CadastrosRepository = {
  listarLojas: (f: Filtro) => Promise<{ data: LojaRegistro[]; total: number }>;
  buscarLoja: (id: string) => Promise<LojaRegistro | null>;
  buscarLojaPorCodigo: (codigo: string) => Promise<LojaRegistro | null>;
  criarLoja: (i: LojaBody) => Promise<LojaRegistro>;
  atualizarLoja: (id: string, i: Partial<LojaBody>) => Promise<LojaRegistro>;
  removerLoja: (id: string) => Promise<void>;
  contarFuncionariosDaLoja: (lojaId: string) => Promise<number>;
  listarFuncionarios: (f: Filtro) => Promise<{ data: FuncionarioRegistro[]; total: number }>;
  buscarFuncionario: (id: string) => Promise<FuncionarioRegistro | null>;
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
};

const pagina = <T>(r: { data: T[]; total: number }, f: Filtro): Pagina<T> => ({
  data: r.data,
  meta: { page: f.page, pageSize: f.pageSize, total: r.total },
});

export const makeCadastrosService = (repo: CadastrosRepository, auditar: Auditor) => ({
  listarLojas: async (f: Filtro) => pagina(await repo.listarLojas(f), f),
  listarFuncionarios: async (f: Filtro) => pagina(await repo.listarFuncionarios(f), f),

  async criarLoja(body: LojaBody, perfil: string) {
    if (await repo.buscarLojaPorCodigo(body.codigo))
      throw new ConflictError('Já existe loja com esse código', 'LOJA_DUPLICADA');
    const loja = await repo.criarLoja(body);
    await auditar({ acao: 'loja.criada', perfil, alvoTipo: 'loja', alvoId: loja.id });
    return loja;
  },
  async editarLoja(id: string, body: Partial<LojaBody>, perfil: string) {
    if (!(await repo.buscarLoja(id)))
      throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
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
    const f = await repo.criarFuncionario(body);
    await auditar({ acao: 'funcionario.criado', perfil, alvoTipo: 'funcionario', alvoId: f.id });
    return f;
  },
  async editarFuncionario(id: string, body: Partial<FuncionarioBody>, perfil: string) {
    if (!(await repo.buscarFuncionario(id)))
      throw new NotFoundError('Funcionário não encontrado', 'FUNCIONARIO_NAO_ENCONTRADO');
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
    const f = await repo.atualizarFuncionario(id, body);
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
  async receberPlanilha(arquivo: string, buffer: Buffer) {
    const abas = (await lerPlanilha(buffer, arquivo)).filter(
      (a) => !/como preencher/i.test(a.nome),
    );
    if (abas.length === 0) throw new ValidationError('Não encontrei abas com dados.');
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
      mapeamento: inf.mapeamento,
      sugestoes: inf.sugestoes,
      campos: {
        lojas: CAMPOS_LOJA.map(({ chave, rotulo, obrigatorio, legado }) => ({
          chave,
          rotulo,
          obrigatorio,
          legado: !!legado,
        })),
        funcionarios: CAMPOS_FUNCIONARIO.map(({ chave, rotulo, obrigatorio }) => ({
          chave,
          rotulo,
          obrigatorio,
        })),
      },
    };
  },

  // Passo 2: grava o que foi confirmado. Linhas com erro não travam as demais; reenviar atualiza sem duplicar.
  async confirmarImportacao(
    id: string,
    mapeamento: Mapeamento,
    perfil: string,
  ): Promise<ResumoImportacao> {
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
      if (falta.length)
        throw new ValidationError(`Faltou indicar a coluna: ${falta.join(', ')} (${chave})`);
    }
    if (!mapeamento.lojas && !mapeamento.funcionarios)
      throw new ValidationError('Indique ao menos uma aba (Lojas ou Funcionários).');

    const proc = processarLinhas(imp.abas, mapeamento);
    const resumo: ResumoImportacao = {
      lojas: { novos: 0, atualizados: 0 },
      funcionarios: { novos: 0, atualizados: 0 },
      erros: [...proc.erros],
    };

    const lojaIds = new Map<string, string>();
    for (const l of proc.lojas as LojaInput[]) {
      const existente = await repo.buscarLojaPorCodigo(l.codigo);
      if (existente) {
        await repo.atualizarLoja(existente.id, l);
        lojaIds.set(l.codigo, existente.id);
        resumo.lojas.atualizados++;
      } else {
        lojaIds.set(l.codigo, (await repo.criarLoja(l)).id);
        resumo.lojas.novos++;
      }
    }

    for (const f of proc.funcionarios as FuncionarioInput[]) {
      const lojaId =
        lojaIds.get(f.lojaCodigo) ?? (await repo.buscarLojaPorCodigo(f.lojaCodigo))?.id;
      if (!lojaId) {
        resumo.erros.push({
          aba: mapeamento.funcionarios!.aba,
          linha: 0,
          motivo: `Funcionário ${f.matricula}: loja ${f.lojaCodigo} não existe`,
        });
        continue;
      }
      const { lojaCodigo: _omit, ...dados } = f;
      void _omit;
      const corpo = { ...dados, lojaId };
      const existente = await repo.buscarFuncionarioPorMatricula(f.matricula);
      if (existente) {
        await repo.atualizarFuncionario(existente.id, corpo);
        resumo.funcionarios.atualizados++;
      } else {
        await repo.criarFuncionario(corpo);
        resumo.funcionarios.novos++;
      }
    }

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
      },
    });
    return resumo;
  },
});

export type CadastrosService = ReturnType<typeof makeCadastrosService>;
