import type { Prisma } from '../../generated/prisma/client.js';
import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { Aba } from '../planilhas/leitor.js';
import {
  colunasPorCnpj,
  erroDoPeriodo,
  faturamentoDaBase,
  interpretarPorCnpj,
  mesclarCadastro,
  soDigitos,
} from './base-por-cnpj.js';
import type { EscalaRepository } from './escala.repository.js';
import type { VendaLinha } from './vendas.js';

// Revisão e importação da base comercial por CNPJ e dia da semana (spec 036). Só contagens e listas de CNPJ saem daqui:
// nenhum valor em reais vai na resposta.

export type PeriodoEntrada = { inicio?: string | null; fim?: string | null };

// Para contar o que não depende do período (lojas, avisos, CNPJs sem loja) enquanto a pessoa ainda não o informou.
const PROVISORIO = { inicio: '2026-01-05', fim: '2026-01-11' };

// A aba que está neste formato, ou nulo (o fluxo atual, por código da loja e data, segue como está).
export const abaPorCnpj = (abas: Aba[]) => {
  for (const aba of abas.filter((a) => !/como preencher/i.test(a.nome))) {
    const colunas = colunasPorCnpj(aba.cabecalhos);
    if (colunas) return { aba, colunas };
  }
  return null;
};

const NOMES_AVISO = {
  linhaZerada: 'linha_zerada',
  unidadesMenoresQueClientes: 'unidades_menores_que_clientes',
  cmvMaiorQueVenda: 'cmv_maior_que_venda',
  lojaComPoucosDias: 'loja_com_poucos_dias',
} as const;

const LIMITE_LISTA = 100;
const EM_PARALELO = 8;

// Grava a base de UMA loja: a ativa vira inativa e a nova entra; o faturamento do Cadastro é preenchido só onde está vazio.
// Usada pela importação da tela (um grupo econômico) e pelo comando que carrega o arquivo de todos os grupos de uma vez.
export const gravarBaseDaLoja = async (
  repo: EscalaRepository,
  a: {
    loja: { id: string; faturamento: unknown };
    linhas: VendaLinha[];
    arquivo: string;
    rejeitadas: number;
    periodo: { inicio: string; fim: string };
  },
) => {
  await repo.substituirBaseEmLote(a.loja.id, a.arquivo, a.linhas, a.rejeitadas, a.periodo);
  const m = mesclarCadastro(a.loja.faturamento, faturamentoDaBase(a.linhas));
  if (m.novo) await repo.gravarFaturamento(a.loja.id, m.novo as Prisma.InputJsonValue);
  return { preencheuCadastro: m.novo !== null, jaTinhaValor: m.jaTinha };
};

export const makeBasePorCnpj = (repo: EscalaRepository, auditar: Auditor) => {
  const preparar = async (
    leitura: NonNullable<ReturnType<typeof abaPorCnpj>>,
    entrada: PeriodoEntrada,
  ) => {
    const erroPeriodo = erroDoPeriodo(entrada.inicio, entrada.fim);
    const periodo = erroPeriodo ? PROVISORIO : { inicio: entrada.inicio!, fim: entrada.fim! };
    const lidas = interpretarPorCnpj(leitura.aba, leitura.colunas, periodo);
    const lojasDoGe = await repo.lojasDoGeComCnpj();
    const porDigitos = new Map<string, typeof lojasDoGe>();
    for (const l of lojasDoGe) {
      if (!l.cnpj) continue;
      const k = soDigitos(l.cnpj);
      porDigitos.set(k, [...(porDigitos.get(k) ?? []), l]);
    }
    const cnpjs = [...lidas.porCnpj.keys()].sort();
    const casados = cnpjs.filter((c) => porDigitos.has(c));
    const semLoja = cnpjs.filter((c) => !porDigitos.has(c));
    const alvos = casados.flatMap((cnpj) =>
      (porDigitos.get(cnpj) ?? []).map((loja) => ({ cnpj, loja })),
    );
    return { erroPeriodo, periodo, lidas, lojasDoGe, alvos, semLoja };
  };

  return {
    // Lê o arquivo e diz o que aconteceria, sem gravar nada.
    async revisar(
      arquivo: string,
      leitura: NonNullable<ReturnType<typeof abaPorCnpj>>,
      entrada: PeriodoEntrada,
    ) {
      const p = await preparar(leitura, entrada);
      const anteriores = p.alvos.length
        ? await repo.basesAtivasDasLojas(p.alvos.map((a) => a.loja.id))
        : [];
      let preencheFaturamento = 0;
      let preencheCmv = 0;
      let jaTinhamValor = 0;
      for (const { cnpj, loja } of p.alvos) {
        const m = mesclarCadastro(loja.faturamento, faturamentoDaBase(p.lidas.porCnpj.get(cnpj)!));
        if (m.preencheuDias > 0) preencheFaturamento++;
        if (m.preencheuCmv) preencheCmv++;
        if (m.jaTinha) jaTinhamValor++;
      }
      return {
        formato: 'por_cnpj' as const,
        arquivo,
        linhas: p.lidas.aceitas,
        periodo: p.erroPeriodo
          ? null
          : { inicio: p.periodo.inicio, fim: p.periodo.fim, diasDaSemana: p.lidas.vezes },
        precisaPeriodo: p.erroPeriodo !== null,
        erroPeriodo: entrada.inicio || entrada.fim ? p.erroPeriodo : null,
        lojas: p.alvos.length,
        substitui: anteriores.length,
        mantidas: p.lojasDoGe.length - p.alvos.length,
        cnpjsSemLoja: p.semLoja.slice(0, LIMITE_LISTA),
        totalCnpjsSemLoja: p.semLoja.length,
        preencheCadastro: { faturamento: preencheFaturamento, cmvPct: preencheCmv, jaTinhamValor },
        avisos: (Object.keys(NOMES_AVISO) as (keyof typeof NOMES_AVISO)[])
          .map((k) => ({ tipo: NOMES_AVISO[k], quantidade: p.lidas.avisos[k] }))
          .filter((a) => a.quantidade > 0),
        erros: p.lidas.erros.slice(0, LIMITE_LISTA),
        totalErros: p.lidas.erros.length,
      };
    },

    async importar(
      arquivo: string,
      leitura: NonNullable<ReturnType<typeof abaPorCnpj>>,
      entrada: PeriodoEntrada,
      perfil: string,
    ) {
      const p = await preparar(leitura, entrada);
      if (p.erroPeriodo) throw new AppError(p.erroPeriodo, 422, 'PERIODO_INVALIDO');
      const errosPorCnpj = new Map<string, number>();
      for (const e of p.lidas.erros)
        if (e.loja) errosPorCnpj.set(e.loja, (errosPorCnpj.get(e.loja) ?? 0) + 1);

      const resultado: {
        cnpj: string;
        codigo: string;
        nome: string | null;
        aceitas: number;
        rejeitadas: number;
        situacao: string;
      }[] = [];
      let cadastroPreenchido = 0;
      let jaTinhamValor = 0;

      const gravar = async ({ cnpj, loja }: (typeof p.alvos)[number]) => {
        const linhas = p.lidas.porCnpj.get(cnpj)!;
        const rejeitadas = errosPorCnpj.get(cnpj) ?? 0;
        const base = {
          cnpj,
          codigo: loja.codigo,
          nome: loja.nome,
          aceitas: linhas.length,
          rejeitadas,
        };
        try {
          const g = await gravarBaseDaLoja(repo, {
            loja,
            linhas,
            arquivo,
            rejeitadas,
            periodo: p.periodo,
          });
          if (g.preencheuCadastro) cadastroPreenchido++;
          if (g.jaTinhaValor) jaTinhamValor++;
          resultado.push({ ...base, situacao: 'Importada' });
        } catch {
          // Uma loja com problema não desfaz as outras: ela aparece no resultado e o resto segue.
          resultado.push({ ...base, situacao: 'Não gravada: erro inesperado ao salvar esta loja' });
        }
      };
      const fila = [...p.alvos];
      await Promise.all(
        Array.from({ length: Math.min(EM_PARALELO, fila.length) }, async () => {
          for (let a = fila.shift(); a; a = fila.shift()) await gravar(a);
        }),
      );
      resultado.sort((a, b) => a.cnpj.localeCompare(b.cnpj));

      await auditar({
        acao: 'base-comercial.importada',
        perfil,
        alvoTipo: 'carga',
        detalhe: {
          arquivo,
          formato: 'por_cnpj',
          periodo: p.periodo,
          lojas: resultado.filter((r) => r.situacao === 'Importada').length,
          cnpjsSemLoja: p.semLoja.length,
          linhas: p.lidas.aceitas,
          erros: p.lidas.erros.length,
        },
      });
      return {
        formato: 'por_cnpj' as const,
        arquivo,
        periodo: p.periodo,
        lojas: resultado,
        cnpjsSemLoja: p.semLoja.slice(0, LIMITE_LISTA),
        totalCnpjsSemLoja: p.semLoja.length,
        cadastro: { preenchidas: cadastroPreenchido, jaTinhamValor },
        erros: p.lidas.erros.slice(0, LIMITE_LISTA),
        totalErros: p.lidas.erros.length,
      };
    },
  };
};
