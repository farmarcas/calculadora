// Sugestão de contratação por horas semanais. Spec 044: só se contrata integral; o parcial e a variante de 26 h com horas
// extras saíram. Funções puras, sem banco. (As constantes e os campos de parcial ficam só para ler simulações antigas.)
export const PARCIAL = {
  maxHorasSemana: 30,
  variante: { baseH: 26, extrasMaxH: 6 },
  // Adicional da hora extra sobre a hora normal.
  extrasAdicionalPct: 50,
} as const;

export type TipoContratacao = 'parcial' | 'integral' | 'integral_parcial';

export type Sugestao = {
  tipo: TipoContratacao;
  inteiras: number;
  // Horas semanais do contrato parcial (na variante, as 26 h do contrato).
  parcialH: number | null;
  // Horas extras semanais previstas (só na variante com hora extra).
  extrasH: number;
  variante: 'com_hora_extra' | null;
  horasContratadas: number;
  horasUsadas: number;
  horasOciosas: number;
  ociosidadePct: number;
  // Nulo quando falta o salário médio do cargo.
  custoMensal: number | null;
  // Avisos que acompanham a sugestão (CRF do farmacêutico parcial, dias que podem ficar descobertos).
  avisos: string[];
};

export type EntradaContratacao = {
  gapH: number;
  // Jornada integral de uma pessoa nesta regra (a efetiva: 40 h na regra de 42 h sem convenção).
  jornadaIntegralH: number;
  divisor: number;
  salarioMedio?: number | null;
  encargosPct?: number;
};

export type SugestoesContratacao = { principal: Sugestao; alternativa: Sugestao | null };

const EPS = 1e-9;
const arred = (n: number) => Math.round(n * 100) / 100;

// Custo mensal (sem arredondar) de um contrato de `h` horas semanais: salário médio × h × 5 ÷ divisor × (1 + encargos).
const custoBruto = (a: EntradaContratacao, h: number, adicionalPct = 0) =>
  (((a.salarioMedio ?? 0) * h * 5) / a.divisor) *
  (1 + adicionalPct / 100) *
  (1 + (a.encargosPct ?? 0) / 100);

const monta = (
  a: EntradaContratacao,
  inteiras: number,
  parcialH: number | null,
  extrasH = 0,
): Sugestao => {
  const contratadas = inteiras * a.jornadaIntegralH + (parcialH ?? 0) + extrasH;
  const ociosas = arred(Math.max(0, contratadas - a.gapH));
  // Soma sem arredondar e arredonda uma vez, como o custo das vagas no resto do sistema.
  const custoMensal = a.salarioMedio
    ? arred(
        inteiras * custoBruto(a, a.jornadaIntegralH) +
          (parcialH ? custoBruto(a, parcialH) : 0) +
          (extrasH ? custoBruto(a, extrasH, PARCIAL.extrasAdicionalPct) : 0),
      )
    : null;
  return {
    tipo: inteiras === 0 ? 'parcial' : parcialH ? 'integral_parcial' : 'integral',
    inteiras,
    parcialH,
    extrasH,
    variante: extrasH > 0 ? 'com_hora_extra' : null,
    horasContratadas: arred(contratadas),
    horasUsadas: arred(Math.min(a.gapH, contratadas)),
    horasOciosas: ociosas,
    ociosidadePct: contratadas > 0 ? Math.round((ociosas / contratadas) * 1000) / 10 : 0,
    custoMensal,
    avisos: [],
  };
};

// Gap nulo (ou desprezível) não gera sugestão.
export const sugerirContratacao = (a: EntradaContratacao): SugestoesContratacao | null => {
  const gap = arred(a.gapH);
  if (gap <= EPS || a.jornadaIntegralH <= 0) return null;
  // Só contratação integral (spec 044): quantas pessoas de jornada cheia cobrem o gap; o que sobra da última é hora ociosa.
  // Não há mais parcial nem a variante com hora extra.
  const principal = monta(a, Math.ceil(gap / a.jornadaIntegralH - EPS), null);
  return { principal, alternativa: null };
};
