// Apuração de UM dia de UMA pessoa: o turno planejado contra as batidas. Funções puras, sem banco.
export type TurnoPlanejado = {
  entrada: number;
  saida: number;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
};
export type Faixa = [number, number]; // horas decimais
export type Ocorrencia = { tipo: string; texto: string; minutos?: number };

export type DiaApurado = {
  situacao: 'folga' | 'falta' | 'cumprido' | 'folga_trabalhada' | 'incompleto';
  ocorrencias: Ocorrencia[];
  planejadoH: number;
  // null quando as batidas estão incompletas: o dia não entra em aderência nem em hora extra.
  realizadoH: number | null;
  horaExtraH: number;
  trabalho: Faixa[]; // o que foi efetivamente trabalhado (sem o intervalo)
  primeira: number | null; // minuto da primeira batida
  ultima: number | null;
};

export const TOLERANCIA_PADRAO_MIN = 10;
const arred = (n: number) => Math.round(n * 100) / 100;
const tam = (f: Faixa[]) => f.reduce((s, [a, b]) => s + Math.max(0, b - a), 0);
const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const faixasPlanejadas = (t: TurnoPlanejado): Faixa[] =>
  t.iniIntervalo != null && t.fimIntervalo != null
    ? [
        [t.entrada, t.iniIntervalo],
        [t.fimIntervalo, t.saida],
      ]
    : [[t.entrada, t.saida]];

export const sobreposicao = (a: Faixa[], b: Faixa[]) =>
  a.reduce(
    (s, [a1, a2]) =>
      s + b.reduce((t, [b1, b2]) => t + Math.max(0, Math.min(a2, b2) - Math.max(a1, b1)), 0),
    0,
  );

export const horasPlanejadas = (t: TurnoPlanejado) => tam(faixasPlanejadas(t));

export const apurarDia = (
  plano: TurnoPlanejado | null,
  minutos: number[],
  tolerancia = TOLERANCIA_PADRAO_MIN,
): DiaApurado => {
  const planejadoH = plano ? arred(horasPlanejadas(plano)) : 0;
  const base = {
    planejadoH,
    horaExtraH: 0,
    trabalho: [] as Faixa[],
    primeira: null as number | null,
    ultima: null as number | null,
  };

  if (minutos.length === 0)
    return plano
      ? {
          ...base,
          situacao: 'falta',
          ocorrencias: [{ tipo: 'falta', texto: 'Faltou: há turno planejado e nenhuma batida.' }],
          realizadoH: 0,
        }
      : { ...base, situacao: 'folga', ocorrencias: [], realizadoH: 0 };

  const m = [...minutos].sort((x, y) => x - y);
  const primeira = m[0]!;
  const ultima = m[m.length - 1]!;
  if (m.length !== 2 && m.length !== 4)
    return {
      ...base,
      primeira,
      ultima,
      situacao: 'incompleto',
      realizadoH: null,
      ocorrencias: [
        {
          tipo: 'batidas_incompletas',
          texto: `${m.length} batida(s) no dia (${m.map(hhmm).join(', ')}): esperado 2 ou 4. O dia não entra na aderência nem na hora extra.`,
        },
      ],
    };

  const ocorrencias: Ocorrencia[] = [];
  const ent = primeira / 60;
  const sai = ultima / 60;
  let trabalho: Faixa[];
  let intervaloReal: number | null = null;
  if (m.length === 4) {
    trabalho = [
      [ent, m[1]! / 60],
      [m[2]! / 60, sai],
    ];
    intervaloReal = (m[2]! - m[1]!) / 60;
  } else if (plano && plano.iniIntervalo != null && plano.fimIntervalo != null) {
    // Só entrada e saída batidas: desconta o intervalo planejado e avisa.
    trabalho = [
      [ent, Math.min(sai, plano.iniIntervalo)],
      [Math.max(ent, plano.fimIntervalo), sai],
    ].filter(([a, b]) => b! > a!) as Faixa[];
    ocorrencias.push({
      tipo: 'intervalo_nao_batido',
      texto: 'O intervalo não foi registrado: foi descontado o intervalo planejado.',
    });
  } else {
    trabalho = [[ent, sai]];
  }
  const realizadoH = arred(tam(trabalho));

  if (!plano) {
    ocorrencias.push({
      tipo: 'trabalho_em_folga',
      texto: `Trabalhou em dia sem escala (${hhmm(primeira)} às ${hhmm(ultima)}).`,
    });
    return {
      ...base,
      primeira,
      ultima,
      situacao: 'folga_trabalhada',
      ocorrencias,
      realizadoH,
      horaExtraH: realizadoH,
      trabalho,
    };
  }

  const atraso = primeira - Math.round(plano.entrada * 60);
  if (atraso > tolerancia)
    ocorrencias.push({
      tipo: 'atraso',
      minutos: atraso,
      texto: `Atraso de ${atraso} min (entrou ${hhmm(primeira)}, previsto ${hhmm(Math.round(plano.entrada * 60))}).`,
    });
  const antecipada = Math.round(plano.saida * 60) - ultima;
  if (antecipada > tolerancia)
    ocorrencias.push({
      tipo: 'saida_antecipada',
      minutos: antecipada,
      texto: `Saiu ${antecipada} min antes (${hhmm(ultima)}, previsto ${hhmm(Math.round(plano.saida * 60))}).`,
    });

  if (intervaloReal !== null) {
    const planejado =
      plano.iniIntervalo != null && plano.fimIntervalo != null
        ? plano.fimIntervalo - plano.iniIntervalo
        : 0;
    const exigido = plano.saida - plano.entrada > 6 ? Math.max(planejado, 1) : planejado;
    if (intervaloReal * 60 < exigido * 60 - tolerancia)
      ocorrencias.push({
        tipo: 'intervalo_reduzido',
        minutos: Math.round(intervaloReal * 60),
        texto: `Intervalo de ${Math.round(intervaloReal * 60)} min (esperado ${Math.round(exigido * 60)} min).`,
      });
  }

  const diferenca = realizadoH - arred(horasPlanejadas(plano));
  const horaExtraH = diferenca * 60 > tolerancia ? arred(diferenca) : 0;
  if (horaExtraH > 0)
    ocorrencias.push({
      tipo: 'hora_extra',
      minutos: Math.round(horaExtraH * 60),
      texto: `Hora extra estimada: ${horaExtraH}h.`,
    });

  return {
    ...base,
    primeira,
    ultima,
    situacao: 'cumprido',
    ocorrencias,
    realizadoH,
    horaExtraH,
    trabalho,
  };
};
