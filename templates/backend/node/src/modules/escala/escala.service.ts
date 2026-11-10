import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { CAMPOS_BASE, type CampoDef } from '../planilhas/campos.js';
import { inferirUmaAba } from '../planilhas/inferencia.js';
import { lerPlanilha, type Aba } from '../planilhas/leitor.js';
import { calcularCusto } from '../custos/custo.js';
import {
  normalizarTurnos,
  validarTurnos,
  type TurnoLoja,
  type ModoMinimo,
  type TurnosLoja,
} from '../regras/turnos.js';
import { diasAbertos, montarDiagnostico } from './diagnostico.js';
import { interpretarBase, somarPorHora, type ErroLinha } from './interpretar.js';
import type { EscalaRepository } from './escala.repository.js';
import { premissasDe, type PremissasEntrada } from './premissas.js';
import { abaPorCnpj, makeBasePorCnpj, type PeriodoEntrada } from './base-por-cnpj.service.js';

const entendi = (
  campos: CampoDef[],
  aba: { cabecalhos: string[] },
  colunas: Record<string, number | null>,
  sug: { campo: string; confianca: number }[],
) =>
  campos.map((c) => {
    const i = colunas[c.chave] ?? null;
    return {
      campo: c.rotulo,
      coluna: i === null ? null : aba.cabecalhos[i] || `coluna ${i + 1}`,
      confianca: sug.find((s) => s.campo === c.chave)?.confianca ?? 0,
    };
  });

const porLoja = <T extends { loja: string }>(itens: T[]) => {
  const m = new Map<string, T[]>();
  for (const i of itens) m.set(i.loja, [...(m.get(i.loja) ?? []), i]);
  return m;
};
const errosPorLoja = (erros: ErroLinha[]) => {
  const m = new Map<string, number>();
  for (const e of erros) if (e.loja) m.set(e.loja, (m.get(e.loja) ?? 0) + 1);
  return m;
};

export const makeEscalaService = (repo: EscalaRepository, auditar: Auditor) => {
  const abrir = async (
    arquivo: string,
    buffer: Buffer,
    campos: CampoDef[],
    _nomeModelo: string,
    jaLidas?: Aba[],
  ) => {
    const abas = jaLidas ?? (await lerPlanilha(buffer, arquivo));
    if (abas.filter((a) => !/como preencher/i.test(a.nome)).every((a) => a.linhas.length === 0))
      throw new ValidationError(
        'A planilha está vazia. Preencha a partir da linha 2 do modelo e envie de novo.',
      );
    const inf = inferirUmaAba(
      abas.filter((a) => !/como preencher/i.test(a.nome)),
      campos,
    );
    if (!inf || inf.faltam.length)
      throw new ValidationError(
        `Não encontramos a coluna ${(inf?.faltam ?? campos.filter((c) => c.obrigatorio).map((c) => c.rotulo)).join(', ')}. Baixe o modelo e confira os nomes das colunas.`,
      );
    return inf;
  };

  const porCnpj = makeBasePorCnpj(repo, auditar);

  return {
    // Revisão da base comercial: lê, resume e diz o que seria substituído, sem gravar nada.
    async revisarBase(arquivo: string, buffer: Buffer, periodo: PeriodoEntrada = {}) {
      const abas = await lerPlanilha(buffer, arquivo);
      const cnpj = abaPorCnpj(abas);
      if (cnpj) return porCnpj.revisar(arquivo, cnpj, periodo);
      const inf = await abrir(arquivo, buffer, CAMPOS_BASE, 'modelo de base comercial', abas);
      const { vendas, erros } = interpretarBase(inf.aba, inf.colunas);
      const codigos = [...new Set(vendas.map((v) => v.loja))];
      const lojas = await repo.lojasPorCodigos(codigos);
      const porCodigo = new Map(lojas.map((l) => [l.codigo, l]));
      const anteriores = lojas.length ? await repo.basesAtivasDasLojas(lojas.map((l) => l.id)) : [];
      const desde = new Map(anteriores.map((c) => [c.lojaId, c.recebidaEm]));
      const datas = vendas
        .filter((v) => porCodigo.has(v.loja))
        .map((v) => v.data)
        .sort();
      return {
        arquivo,
        linhas: vendas.length,
        lojas: lojas.length,
        lojasNaoCadastradas: codigos.filter((c) => !porCodigo.has(c)),
        periodo: datas.length ? { inicio: datas[0]!, fim: datas[datas.length - 1]! } : null,
        substitui: lojas
          .filter((l) => desde.has(l.id))
          .map((l) => ({ codigo: l.codigo, desde: desde.get(l.id)!.toISOString().slice(0, 10) })),
        erros: erros.slice(0, 100),
        totalErros: erros.length,
      };
    },

    async importarBase(
      arquivo: string,
      buffer: Buffer,
      perfil: string,
      periodo: PeriodoEntrada = {},
    ) {
      const abas = await lerPlanilha(buffer, arquivo);
      const cnpj = abaPorCnpj(abas);
      if (cnpj) return porCnpj.importar(arquivo, cnpj, periodo, perfil);
      const inf = await abrir(arquivo, buffer, CAMPOS_BASE, 'modelo de base comercial', abas);
      const { vendas, erros } = interpretarBase(inf.aba, inf.colunas);
      const lojas = await repo.lojasPorCodigos([
        ...new Set([
          ...vendas.map((v) => v.loja),
          ...erros.map((e) => e.loja).filter((x): x is string => !!x),
        ]),
      ]);
      const id = new Map(lojas.map((l) => [l.codigo, l]));
      const rej = errosPorLoja(erros);

      const resultado: {
        codigo: string;
        nome: string | null;
        aceitas: number;
        rejeitadas: number;
        situacao: string;
      }[] = [];
      for (const [codigo, vs] of porLoja(vendas)) {
        const loja = id.get(codigo);
        if (!loja) {
          resultado.push({
            codigo,
            nome: null,
            aceitas: 0,
            rejeitadas: vs.length,
            situacao: 'Loja não cadastrada: cadastre antes de importar',
          });
          continue;
        }
        const somadas = somarPorHora(vs);
        await repo.substituirBase(loja.id, arquivo, somadas, rej.get(codigo) ?? 0);
        resultado.push({
          codigo,
          nome: loja.nome,
          aceitas: vs.length,
          rejeitadas: rej.get(codigo) ?? 0,
          situacao: 'Importada',
        });
      }
      await auditar({
        acao: 'base-comercial.importada',
        perfil,
        alvoTipo: 'carga',
        detalhe: { arquivo, lojas: resultado.length, linhas: vendas.length, erros: erros.length },
      });
      return {
        arquivo,
        entendi: entendi(CAMPOS_BASE, inf.aba, inf.colunas, inf.sugestoes),
        lojas: resultado,
        erros: erros.slice(0, 100),
        totalErros: erros.length,
      };
    },

    async diagnostico(lojaId: string, perfil?: string, simulacao?: PremissasEntrada) {
      const loja = await repo.lojaParaDiagnostico(lojaId);
      if (!loja) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
      // A equipe vem só do Cadastro (função, carga, dias, entrada, saída e intervalo de cada funcionário).
      const [base, turnosFinais, parametros, fixos] = await Promise.all([
        repo.baseAtiva(lojaId),
        repo.turnosDoCadastro(lojaId),
        repo.parametrosVigentes(),
        repo.matriculasHorarioFixo(lojaId),
      ]);
      const escala =
        turnosFinais.length > 0
          ? {
              arquivo: 'Cadastro de funcionários',
              recebidaEm: new Date(),
              linhasAceitas: turnosFinais.length,
              linhasRejeitadas: 0,
            }
          : null;
      const diag = montarDiagnostico({
        loja,
        escala,
        turnos: turnosFinais,
        horarioFixo: fixos,
        base: base?.meta ?? null,
        vendas: base?.vendas ?? [],
        dono: perfil === 'TENANT_ADMIN',
        parametros,
        premissas: premissasDe(simulacao).valores,
        foraDaConta: await repo.foraDaEscala(
          lojaId,
          turnosFinais.map((t) => t.matricula),
        ),
      });
      // Folha mensal atual: custo, então só o dono do grupo recebe (o campo nem existe para os outros).
      if (perfil !== 'TENANT_ADMIN' || diag.status === 'pendente') return diag;
      const quadro = turnosFinais
        .filter((t) => t.funcao)
        .map((t) => ({ matricula: t.matricula, nome: t.nome, funcao: t.funcao, cargaH: t.cargaH }));
      const custo = calcularCusto({
        regra: 'atual',
        quadro,
        custos: loja.custos ?? null,
        parametros,
      });
      return {
        ...diag,
        folhaMensal: custo.informado
          ? {
              informado: true as const,
              mensal: custo.mensal,
              faltamInformar: custo.faltamInformar,
              encargosPct: loja.custos?.encargosPct ?? 0,
              // O encargo vem do regime tributário da loja: total, composição e o alerta quando o regime falta.
              ...(loja.encargos
                ? {
                    regimeTributario: loja.encargos.regime,
                    regimeAusente: loja.encargos.regimeAusente,
                    encargos: loja.encargos,
                    ...(loja.encargos.regimeAusente
                      ? {
                          alertaRegime:
                            'Não encontramos o regime tributário da loja. Calculamos com Lucro Presumido. Confirme o regime para um resultado mais preciso.',
                        }
                      : {}),
                  }
                : {}),
            }
          : { informado: false as const },
      };
    },

    async configurar(
      lojaId: string,
      c: {
        convencao8h24?: boolean;
        minimos?: Record<string, number>;
        turnos?: TurnoLoja[] | null;
        modoMinimo?: ModoMinimo;
      },
      perfil: string,
    ) {
      const loja = await repo.lojaParaDiagnostico(lojaId);
      if (!loja) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
      let turnos: TurnosLoja | null | undefined;
      if (c.turnos === null) turnos = null;
      else if (c.turnos) {
        const normalizados = normalizarTurnos(c.turnos);
        const erros = validarTurnos(normalizados, diasAbertos(loja.horarios));
        if (erros.length) throw new ValidationError(erros.join(' '));
        const modo = c.modoMinimo ?? loja.turnos?.modo;
        turnos = { versao: 1, ...(modo ? { modo } : {}), turnos: normalizados };
      } else if (c.modoMinimo && loja.turnos) turnos = { ...loja.turnos, modo: c.modoMinimo };
      const { modoMinimo: _modo, ...resto } = c;
      await repo.atualizarConfiguracao(lojaId, { ...resto, turnos });
      await auditar({
        acao: 'loja.configuracao',
        perfil,
        alvoTipo: 'loja',
        alvoId: lojaId,
        detalhe: { ...c, turnos: c.turnos ? c.turnos.length : c.turnos },
      });
      return this.diagnostico(lojaId, perfil);
    },

    async historico(lojaId: string) {
      if (!(await repo.lojaParaDiagnostico(lojaId)))
        throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
      return { data: await repo.historico(lojaId) };
    },
  };
};
