// Sugestão de contratação por horas semanais. Gap até 30 h vira 1 contrato de tempo parcial (CLT art. 58-A); acima
// disso, integral, ou integrais mais um parcial quando isso reduz as horas ociosas. Nunca um parcial acima de 30 h.
// A variante de 26 h (contrato) com até 6 h extras é uma opção secundária, identificada. Funções puras, sem banco.
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
};

export type EntradaContratacao = {
  gapH: number;
  // Jornada integral de uma pessoa nesta regra (a efetiva: 40 h na regra de 42 h sem convenção).
  jornadaIntegralH: number;
  divisor: number;
  salarioMedio?: number | null;
  encargosPct?: number;
};

export type OpcoesContratacao = { principal: Sugestao; alternativa: Sugestao | null };

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
  };
};

// Menos horas ociosas; em empate, o menor custo (se houver); depois menos contratos.
const melhor = (lista: Sugestao[]) =>
  [...lista].sort(
    (x, y) =>
      x.horasOciosas - y.horasOciosas ||
      (x.custoMensal ?? 0) - (y.custoMensal ?? 0) ||
      x.inteiras + (x.parcialH ? 1 : 0) - (y.inteiras + (y.parcialH ? 1 : 0)),
  )[0]!;

// Gap nulo (ou desprezível) não gera sugestão.
export const sugerirContratacao = (a: EntradaContratacao): OpcoesContratacao | null => {
  const gap = arred(a.gapH);
  if (gap <= EPS || a.jornadaIntegralH <= 0) return null;
  const J = a.jornadaIntegralH;
  const padrao: Sugestao[] = [];
  for (let n = Math.floor(gap / J + EPS); n <= Math.ceil(gap / J - EPS); n++) {
    const resto = arred(gap - n * J);
    if (resto <= EPS) padrao.push(monta(a, n, null));
    else if (resto <= PARCIAL.maxHorasSemana + EPS) padrao.push(monta(a, n, resto));
  }
  // Sempre existe a opção só de integrais, que cobre qualquer gap.
  padrao.push(monta(a, Math.ceil(gap / J - EPS), null));
  const principal = melhor(padrao);

  // Variante com hora extra: o resto entre 30 h e 32 h vira um contrato de 26 h mais até 6 h extras.
  const { baseH, extrasMaxH } = PARCIAL.variante;
  let alternativa: Sugestao | null = null;
  for (let n = 0; n <= Math.floor(gap / J + EPS); n++) {
    const resto = arred(gap - n * J);
    if (resto > PARCIAL.maxHorasSemana + EPS && resto <= baseH + extrasMaxH + EPS) {
      const candidata = monta(a, n, baseH, arred(resto - baseH));
      if (candidata.horasOciosas < principal.horasOciosas - EPS) alternativa = candidata;
    }
  }
  return { principal, alternativa };
};
