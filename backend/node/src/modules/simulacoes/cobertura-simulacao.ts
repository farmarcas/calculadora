import { cobertura, type TurnoPessoa } from '../escala/cobertura.js';
import { semValorPorHora } from '../escala/diagnostico.js';
import { resumirVendas, type VendaLinha } from '../escala/vendas.js';
import type { HorariosSemana } from '../cadastros/horarios.js';
import type { DiaAberto } from '../regras/capacidade.js';
import type { Minimos } from '../regras/requisitos.js';
import type { TurnosLoja } from '../regras/turnos.js';
import type { PessoaSim, TurnoSim } from './avaliar.js';

export type EntradaCoberturaSimulacao = {
  // Horário simulado (dias abertos) e o mesmo horário no formato da semana, para o aviso de vendas fora do horário.
  dias: DiaAberto[];
  horarios: HorariosSemana | null;
  quadro: PessoaSim[];
  turnos: TurnoSim[];
  minimos: Minimos;
  vendas: VendaLinha[];
  turnosDaLoja?: TurnosLoja | null;
  // Valores em reais só para o dono do grupo.
  dono: boolean;
};

// A cobertura hora a hora da simulação: a mesma conta do Diagnóstico (pior dia de cada hora, intervalos descontados),
// aplicada ao horário simulado e ao quadro simulado. Desligado não cobre nada; vaga só cobre com turnos.
export const coberturaDaSimulacao = (e: EntradaCoberturaSimulacao) => {
  const ativos = e.quadro.filter((p) => !p.desligado && p.funcao);
  const funcaoDe = new Map(ativos.map((p) => [p.matricula, p.funcao!]));
  const turnosDeFuncao: TurnoPessoa[] = e.turnos
    .filter((t) => funcaoDe.has(t.matricula))
    .map((t) => ({
      funcao: funcaoDe.get(t.matricula)!,
      dias: [t.dia],
      entrada: t.entrada,
      saida: t.saida,
      iniIntervalo: t.iniIntervalo,
      fimIntervalo: t.fimIntervalo,
    }));
  const comTurno = new Set(e.turnos.map((t) => t.matricula));
  const vagasSemTurnos = e.quadro.filter(
    (p) => p.vaga && !p.desligado && !comTurno.has(p.matricula),
  ).length;

  const { horas, funcoes } = cobertura(e.dias, turnosDeFuncao, e.minimos);
  const resumo = resumirVendas(e.vendas);

  return {
    horas,
    funcoes,
    vendas: resumo && (e.dono ? resumo : semValorPorHora(resumo)),
    vagasSemTurnos,
    horarios: e.horarios,
    turnosDaLoja: e.turnosDaLoja
      ? { modoMinimo: e.turnosDaLoja.modo ?? 'turnos', turnos: e.turnosDaLoja.turnos }
      : null,
  };
};
