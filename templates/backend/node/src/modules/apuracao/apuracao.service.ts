import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { diasAbertos } from '../escala/diagnostico.js';
import type { EscalaRepository } from '../escala/escala.repository.js';
import { FUNCOES_PADRAO_MINIMO } from '../regras/perfis.js';
import { exigenciasDaLoja } from '../regras/turnos.js';
import type { SimulacoesRepository } from '../simulacoes/simulacoes.repository.js';
import type { ApuracaoRepository } from './apuracao.repository.js';
import { gerarExcelApuracao } from './exportar.js';
import { avaliarAlertas, LIMITES_PADRAO, type Limites, type Semana } from './alertas.js';
import { apurarPeriodo, datas, diaDaSemana } from './periodo.js';

const somarDias = (data: string, n: number) => {
  const [a, m, d] = data.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
};

export const makeApuracaoService = (
  repo: ApuracaoRepository,
  simulacoes: SimulacoesRepository,
  lojas: EscalaRepository,
  auditar: Auditor,
) => {
  const contexto = async (lojaId: string, de?: string, ate?: string) => {
    const loja = await lojas.lojaParaDiagnostico(lojaId);
    if (!loja) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    const emUso = await simulacoes.emUso(lojaId);
    if (!emUso)
      throw new ConflictError('Gerenciar exige uma simulação em uso.', 'SEM_SIMULACAO_EM_USO');
    const cobertos = await repo.periodosCobertos(lojaId);
    // Sem datas pedidas: as últimas 4 semanas até o fim do que o ponto importado cobre.
    const fimDados = cobertos.reduce((m, p) => (p.fim > m ? p.fim : m), '0000-00-00');
    const ateFinal =
      ate ?? (fimDados > '0000-00-00' ? fimDados : new Date().toISOString().slice(0, 10));
    const deFinal = de ?? somarDias(ateFinal, -27);
    return { loja, emUso, cobertos, de: deFinal, ate: ateFinal };
  };

  const calcular = async (lojaId: string, de?: string, ate?: string) => {
    const c = await contexto(lojaId, de, ate);
    const p = c.emUso.premissas;
    const horarios = p?.horarios ?? c.loja.horarios;
    const minimos =
      p?.minimos ??
      exigenciasDaLoja({ ...FUNCOES_PADRAO_MINIMO, ...(c.loja.minimos ?? {}) }, c.loja.turnos);
    const batidas = await repo.batidas(lojaId, c.de, c.ate);
    const r = apurarPeriodo({
      de: c.de,
      ate: c.ate,
      vigenciaInicio: c.emUso.vigenciaInicio?.toISOString().slice(0, 10) ?? '0000-00-00',
      quadro: c.emUso.quadro,
      turnos: c.emUso.turnos,
      dias: diasAbertos(horarios),
      minimos,
      batidas,
      periodosCobertos: c.cobertos,
    });
    return { r, loja: c.loja, simulacao: { id: c.emUso.id, nome: c.emUso.nome } };
  };

  const limitesDa = async (lojaId: string): Promise<Limites> => {
    const { existe, alertas } = await repo.limites(lojaId);
    if (!existe) throw new NotFoundError('Loja não encontrada', 'LOJA_NAO_ENCONTRADA');
    return { ...LIMITES_PADRAO, ...(alertas ?? {}) } as Limites;
  };

  // Semanas (segunda a domingo) do ponto importado, da mais antiga à mais recente.
  const semanas = async (lojaId: string, quantas = 8): Promise<Semana[]> => {
    const cobertos = await repo.periodosCobertos(lojaId);
    const fim = cobertos.reduce((m, p) => (p.fim > m ? p.fim : m), '0000-00-00');
    if (fim === '0000-00-00') return [];
    const segundaDoFim = somarDias(fim, -diaDaSemana(fim));
    const lista: Semana[] = [];
    for (let k = quantas - 1; k >= 0; k--) {
      const inicio = somarDias(segundaDoFim, -7 * k);
      const ate = somarDias(inicio, 6);
      if (!cobertos.some((p) => p.fim >= inicio && p.inicio <= ate)) continue;
      const { r } = await calcular(lojaId, inicio, ate);
      if (r.periodo.diasApurados === 0) continue;
      lista.push({
        inicio,
        fim: ate,
        aderenciaPct: r.loja.aderenciaPct,
        horaExtraH: r.loja.horaExtraH,
        horasPlanejadas: r.loja.horasPlanejadas,
        faltas: r.loja.faltas,
      });
    }
    return lista;
  };

  return {
    calcular,
    semanas,
    limites: limitesDa,
    async gravarLimites(lojaId: string, l: Limites, perfil: string) {
      await limitesDa(lojaId);
      await repo.gravarLimites(lojaId, l);
      await auditar({
        acao: 'gerenciar.limites',
        perfil,
        alvoTipo: 'loja',
        alvoId: lojaId,
        detalhe: l,
      });
      return l;
    },
    // Motivos de "desatualizada" que vêm do ponto (hora extra recorrente, aderência baixa).
    async motivosDoPonto(lojaId: string): Promise<string[]> {
      const emUso = await simulacoes.emUso(lojaId);
      if (!emUso) return [];
      const lista = await semanas(lojaId);
      return avaliarAlertas(lista, await limitesDa(lojaId)).map((a) => a.texto);
    },
    async painel(lojaId: string) {
      const limites = await limitesDa(lojaId);
      if (!(await simulacoes.emUso(lojaId)))
        return {
          semSimulacaoEmUso: true as const,
          mensagem:
            'Esta loja só tem planejamento: aprove uma simulação e importe o ponto (AFD) para gerenciar.',
          limites,
        };
      const { r, simulacao, emUso } = await (async () => {
        const c = await calcular(lojaId);
        return { r: c.r, simulacao: c.simulacao, emUso: await simulacoes.emUso(lojaId) };
      })();
      const lista = await semanas(lojaId);
      const ultima = await repo.ultimaImportacao(lojaId);
      return {
        rotulo: r.rotulo,
        simulacao: {
          ...simulacao,
          vigenciaInicio: emUso?.vigenciaInicio?.toISOString().slice(0, 10) ?? null,
        },
        ultimaImportacao: ultima && {
          arquivo: ultima.arquivo,
          status: ultima.status.toLowerCase(),
          enviadaEm: ultima.criadoEm,
        },
        pendenciasAbertas: await repo.pendentesAbertas(lojaId),
        periodo: r.periodo,
        aderenciaPct: r.loja.aderenciaPct,
        horaExtraH: r.loja.horaExtraH,
        faltas: r.loja.faltas,
        tendencia: lista,
        alertas: avaliarAlertas(lista, limites),
        limites,
      };
    },
    // Visão por pessoa e por dia: só dono e gestor.
    async porPessoa(lojaId: string, de?: string, ate?: string) {
      const { r, simulacao } = await calcular(lojaId, de, ate);
      return {
        rotulo: r.rotulo,
        simulacao,
        periodo: r.periodo,
        pessoas: r.pessoas.map((p) => ({
          ...p,
          dias: p.dias.filter((d) => d.situacao !== 'folga' || d.batidas.length > 0),
        })),
      };
    },
    // Agregado da loja: sem nome, sem batida.
    async daLoja(lojaId: string, de?: string, ate?: string) {
      const { r, simulacao } = await calcular(lojaId, de, ate);
      return { rotulo: r.rotulo, simulacao, periodo: r.periodo, loja: r.loja };
    },
    async exportar(
      lojaId: string,
      de: string | undefined,
      ate: string | undefined,
      perfil: string,
    ) {
      const { r, loja, simulacao } = await calcular(lojaId, de, ate);
      const buffer = await gerarExcelApuracao({
        lojaNome: `${loja.codigo} · ${loja.nome}`,
        periodo: { de: r.periodo.de, ate: r.periodo.ate },
        pessoas: r.pessoas,
        resumo: { 'Simulação em uso': simulacao.nome, ...r.loja },
      });
      await auditar({
        acao: 'apuracao.exportada',
        perfil,
        alvoTipo: 'loja',
        alvoId: lojaId,
        detalhe: { de: r.periodo.de, ate: r.periodo.ate },
      });
      return { buffer, nome: `apuracao-${loja.codigo}-${r.periodo.de}-a-${r.periodo.ate}.xlsx` };
    },
    datas,
  };
};
export type ApuracaoService = ReturnType<typeof makeApuracaoService>;
