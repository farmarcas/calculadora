import { LIMITES_EXTENSAO } from '../escala/ajustes-fim-de-semana.js';
import { SEMANAS_NO_MES } from '../escala/cenarios-dias.js';
import type { VendaDiaHora } from '../escala/vendas.js';
import type { DiaAberto } from '../regras/capacidade.js';

// Venda estimada das horas novas da Simulação (spec 025): horas que o horário simulado abre e o do Cadastro não abre, em
// qualquer dia da semana. É a mesma regra dos cenários (`ganhoDasHorasNovas`, que só cobre o fim de semana): hora com venda
// registrada vale o registrado; sem registro vale `fator` (50%) da hora de borda do Cadastro, a mais próxima no mesmo dia.
// Dia fechado no Cadastro não tem hora de borda: só vale a venda registrada, se houver.

const arred = (n: number) => Math.round(n * 100) / 100;

const abertaNaHora = (dias: DiaAberto[], dia: number, h: number) => {
  const d = dias.find((x) => x.dia === dia);
  return !!d && h >= d.abre - 1e-9 && h + 1 <= d.fecha + 1e-9;
};

// Matriz 7 × 24: verdadeiro na hora aberta na simulação e fechada no Cadastro.
export const horasNovas = (diasCadastro: DiaAberto[], dias: DiaAberto[]): boolean[][] =>
  Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => abertaNaHora(dias, d, h) && !abertaNaHora(diasCadastro, d, h)),
  );

// Hora de borda do Cadastro para uma hora nova: a primeira hora aberta (se a nova vem antes) ou a última (se vem depois).
const horaDeBorda = (cad: DiaAberto | undefined, h: number): number | null => {
  if (!cad) return null;
  if (h < cad.abre) return Math.ceil(cad.abre - 1e-9);
  return Math.floor(cad.fecha + 1e-9) - 1;
};

export type VendaEstimada = {
  // Venda média estimada de cada hora nova (zero nas outras), em R$ por hora de um dia.
  porHora: number[][];
  // Soma por mês: média de um dia × 52 ÷ 12 (a mesma conta dos cenários).
  vendaMes: number;
};

// Sem a tabela de venda por hora não há como estimar: devolve nulo.
export const vendaEstimadaDasHorasNovas = (
  diasCadastro: DiaAberto[],
  dias: DiaAberto[],
  tabela: VendaDiaHora | null,
  fator: number = LIMITES_EXTENSAO.fatorHoraNova,
): VendaEstimada | null => {
  if (!tabela) return null;
  const novas = horasNovas(diasCadastro, dias);
  const porHora = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  let total = 0;
  for (let d = 0; d < 7; d++) {
    const cad = diasCadastro.find((x) => x.dia === d);
    for (let h = 0; h < 24; h++) {
      if (!novas[d]![h]) continue;
      const registrada = tabela.venda[d]?.[h] ?? 0;
      let valor = registrada;
      if (registrada <= 0) {
        const borda = horaDeBorda(cad, h);
        valor = borda === null ? 0 : fator * (tabela.venda[d]?.[borda] ?? 0);
      }
      porHora[d]![h] = arred(valor);
      total += valor;
    }
  }
  return { porHora, vendaMes: arred(total * SEMANAS_NO_MES) };
};
