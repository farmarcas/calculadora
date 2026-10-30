import type { DiaAberto } from '../regras/capacidade.js';
import type { TurnoPessoa } from './cobertura.js';

export type BlocoParcial = { dia: number; de: string; ate: string; horas: number };
export type DistribuicaoParcial = {
  blocos: BlocoParcial[];
  // Sem ninguém no cargo (ou sem exigência por hora) a distribuição é só uma sugestão de partida.
  estimativa: boolean;
  // Horas do parcial que não coube em até 5 dias de até 8 h.
  semLugarH: number;
};

const MAX_DIAS = 5;
const MAX_HORAS_DIA = 8;
const EPS = 1e-9;
const arred = (n: number) => Math.round(n * 100) / 100;

const hhmm = (h: number) => {
  const total = Math.round(h * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// A pessoa cobre a célula [ini, ini + len] se está no posto o tempo todo e fora do intervalo.
const cobreCelula = (t: TurnoPessoa, dia: number, ini: number, len: number) =>
  t.dias.includes(dia) &&
  t.entrada <= ini + EPS &&
  t.saida >= ini + len - EPS &&
  !(
    t.iniIntervalo != null &&
    t.fimIntervalo != null &&
    t.iniIntervalo < ini + len - EPS &&
    t.fimIntervalo > ini + EPS
  );

type Faixa = { ini: number; fim: number };

// Faixas contínuas do dia em que as pessoas do cargo não bastam para a exigência (em células de 1 h).
const faixasDescobertas = (d: DiaAberto, doCargo: TurnoPessoa[], exigido: number): Faixa[] => {
  const faixas: Faixa[] = [];
  for (let ini = d.abre; ini < d.fecha - EPS; ini += 1) {
    const len = Math.min(1, d.fecha - ini);
    const presentes = doCargo.filter((t) => cobreCelula(t, d.dia, ini, len)).length;
    if (presentes >= exigido) continue;
    const ultima = faixas[faixas.length - 1];
    if (ultima && Math.abs(ultima.fim - ini) < EPS) ultima.fim = ini + len;
    else faixas.push({ ini, fim: ini + len });
  }
  return faixas;
};

// Aloca as horas de um contrato parcial nos dias e horários que mais ajudam: blocos de até 8 h por dia, em até 5 dias,
// começando pelos dias com mais horas descobertas. Sem ninguém no cargo, tudo está descoberto e o resultado é estimativa.
export const distribuirParcial = (
  dias: DiaAberto[],
  doCargo: TurnoPessoa[],
  parcialH: number,
  exigido = 1,
  estimativa = doCargo.length === 0,
): DistribuicaoParcial => {
  const porDia = dias.map((d) => ({
    dia: d.dia,
    faixas: faixasDescobertas(d, doCargo, exigido),
  }));
  const descoberto = (f: Faixa[]) => f.reduce((s, x) => s + (x.fim - x.ini), 0);
  const ordem = porDia
    .filter((p) => p.faixas.length > 0)
    .sort((a, b) => descoberto(b.faixas) - descoberto(a.faixas) || a.dia - b.dia);

  const blocos: BlocoParcial[] = [];
  let resta = parcialH;
  for (const p of ordem) {
    if (resta <= EPS || blocos.length >= MAX_DIAS) break;
    // a maior faixa contínua do dia (primeira em caso de empate)
    const faixa = p.faixas.reduce((m, x) => (x.fim - x.ini > m.fim - m.ini + EPS ? x : m));
    const horas = Math.min(resta, MAX_HORAS_DIA, faixa.fim - faixa.ini);
    blocos.push({
      dia: p.dia,
      de: hhmm(faixa.ini),
      ate: hhmm(faixa.ini + horas),
      horas: arred(horas),
    });
    resta -= horas;
  }
  return {
    blocos: blocos.sort((a, b) => a.dia - b.dia),
    estimativa,
    semLugarH: arred(Math.max(0, resta)),
  };
};
