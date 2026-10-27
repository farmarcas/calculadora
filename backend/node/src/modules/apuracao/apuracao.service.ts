import type { Auditor } from '../../shared/auditoria/auditoria.js';
import { ConflictError } from '../../shared/errors/conflict-error.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { diasAbertos, type LojaDiag } from '../escala/diagnostico.js';
import type { EscalaRepository } from '../escala/escala.repository.js';
import { FUNCOES_PADRAO_MINIMO } from '../regras/perfis.js';
import type { SimulacoesRepository } from '../simulacoes/simulacoes.repository.js';
import type { ApuracaoRepository } from './apuracao.repository.js';
import { gerarExcelApuracao } from './exportar.js';
import { apurarPeriodo, datas } from './periodo.js';

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
    const horarios = (p?.horarios ?? c.loja.horarios) as LojaDiag['horarios'];
    const minimos = p?.minimos ?? { ...FUNCOES_PADRAO_MINIMO, ...(c.loja.minimos ?? {}) };
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

  return {
    calcular,
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
