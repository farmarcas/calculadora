// Hora extra antes de contratar (spec 063), pura e sem banco: quanto da falta de cobertura uma função pode fechar com hora extra
// de quem já está escalado, e quanto isso custa. É a regra única que os Cenários e a Simulação compartilham (nunca duas cópias).
// Referência da CLT (2 h por dia); a equipe jurídica confirma os limites.
export const HORA_EXTRA = {
  maxPorDiaH: 2,
  maxPorSemanaH: 10,
  // Adicional da hora extra sobre a hora normal.
  adicionalPct: 50,
  // O custo mensal usa 5 semanas por mês (mesma conta de `calcularCusto` e das vagas).
  semanasNaFolha: 5,
} as const;

const EPS = 1e-9;
const arred = (n: number) => Math.round(n * 100) / 100;

export type EntradaCobertura = {
  // Horas por semana que a função ainda não cobre.
  faltaH: number;
  // Quantas pessoas da função podem fazer hora extra.
  pessoas: number;
  // Com a cobertura real: a falta de cada dia (0 = segunda … 6 = domingo) e quantas pessoas da função trabalham em cada dia.
  faltaPorDiaH?: number[] | null;
  pessoasPorDia?: number[] | null;
};

// Quantas horas de hora extra cabem: por pessoa, até 2 h por dia (e só no que falta naquele dia) e 10 h por semana. Sem o detalhe
// por dia, vale só o teto da semana.
export const capacidadeDeHoraExtraH = (e: EntradaCobertura): number => {
  if (e.pessoas <= 0 || e.faltaH <= EPS) return 0;
  const semana = e.pessoas * HORA_EXTRA.maxPorSemanaH;
  if (!e.faltaPorDiaH || !e.pessoasPorDia) return semana;
  const porDia = e.faltaPorDiaH.reduce(
    (s, f, d) => s + Math.min(f, (e.pessoasPorDia![d] ?? 0) * HORA_EXTRA.maxPorDiaH),
    0,
  );
  return Math.min(semana, porDia);
};

// Cobre a falta com hora extra até o limite: o que sobra é o que ainda precisa de contratação.
export const coberturaComHoraExtra = (e: EntradaCobertura) => {
  const horaExtraH = arred(Math.min(Math.max(0, e.faltaH), capacidadeDeHoraExtraH(e)));
  return { horaExtraH, restanteH: arred(Math.max(0, e.faltaH - horaExtraH)) };
};

// Sem a cobertura real (conta por horas): quantas contratações integrais ainda são precisas e quanto fica de hora extra. Uma
// contratação integral cobre as horas dela; a hora extra só entra no que passa disso (se uma pessoa nova já cobre tudo, não há
// por que pagar hora extra).
export const decidirPorHoras = (e: { gapH: number; jornadaIntegralH: number; pessoas: number }) => {
  const gap = Math.max(0, e.gapH);
  if (gap <= EPS) return { horaExtraH: 0, contratarInteiras: 0 };
  const cap = capacidadeDeHoraExtraH({ faltaH: gap, pessoas: e.pessoas });
  if (e.jornadaIntegralH <= 0)
    return { horaExtraH: arred(Math.min(gap, cap)), contratarInteiras: 0 };
  const inteiras = Math.max(0, Math.ceil((gap - cap) / e.jornadaIntegralH - EPS));
  const horaExtraH = arred(Math.max(0, gap - inteiras * e.jornadaIntegralH));
  return { horaExtraH, contratarInteiras: inteiras };
};

// Custo mensal (sem arredondar) de `horasSemana` de hora extra: hora normal × (1 + 50%) × encargos × 5 semanas. Nulo sem salário.
export const custoBrutoDaHoraExtra = (e: {
  horasSemana: number;
  salarioMedio?: number | null;
  divisor: number;
  encargosPct?: number | null;
}): number | null => {
  if (e.horasSemana <= EPS) return 0;
  if (!e.salarioMedio) return null;
  return (
    e.horasSemana *
    HORA_EXTRA.semanasNaFolha *
    (e.salarioMedio / e.divisor) *
    (1 + HORA_EXTRA.adicionalPct / 100) *
    (1 + (e.encargosPct ?? 0) / 100)
  );
};
export const custoMensalDaHoraExtra = (e: Parameters<typeof custoBrutoDaHoraExtra>[0]) => {
  const c = custoBrutoDaHoraExtra(e);
  return c === null ? null : arred(c);
};

// O alerta de "hora extra demais" (spec 063): contratar sairia mais barato, ou a hora extra bateu no teto. Os valores em reais só
// entram na frase quando `comValores` (dono); os demais perfis recebem a frase sem números.
export const alertasDeHoraExtra = (e: {
  funcao: string;
  horaExtraH: number;
  horaExtraCustoMensal: number | null;
  // O custo mensal da contratação integral que cobriria a mesma falta.
  contratarCustoMensal: number | null;
  // O que sobrou depois da hora extra (precisa de contratação) e se a hora extra bateu no teto.
  restanteH: number;
  comValores: boolean;
}): string[] => {
  const nome = e.funcao.toLowerCase();
  const alertas: string[] = [];
  if (
    e.horaExtraH > EPS &&
    e.horaExtraCustoMensal !== null &&
    e.contratarCustoMensal !== null &&
    e.horaExtraCustoMensal > e.contratarCustoMensal + EPS
  ) {
    alertas.push(
      e.comValores
        ? `Contratar ${nome} sairia mais barato: a hora extra custa R$ ${Math.round(e.horaExtraCustoMensal).toLocaleString('pt-BR')} por mês e contratar, R$ ${Math.round(e.contratarCustoMensal).toLocaleString('pt-BR')}.`
        : `Contratar ${nome} sairia mais barato que a hora extra.`,
    );
  }
  if (e.restanteH > EPS) {
    alertas.push(
      `A hora extra de ${nome} não basta: o que passa de ${HORA_EXTRA.maxPorDiaH} h por dia e ${HORA_EXTRA.maxPorSemanaH} h por semana por pessoa vira contratação.`,
    );
  }
  return alertas;
};
