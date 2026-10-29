// Alertas que marcam a simulação em uso como "desatualizada" (RN-E10). Nada é alterado sozinho.
export type Limites = { horaExtraPct: number; semanasSeguidas: number; aderenciaMinPct: number };
export const LIMITES_PADRAO: Limites = { horaExtraPct: 5, semanasSeguidas: 2, aderenciaMinPct: 90 };

export type Semana = {
  inicio: string;
  fim: string;
  aderenciaPct: number | null;
  horaExtraH: number;
  horasPlanejadas: number;
  faltas: number;
};

export const horaExtraPctDe = (s: Semana) =>
  s.horasPlanejadas > 0 ? Math.round((s.horaExtraH / s.horasPlanejadas) * 1000) / 10 : 0;

export const avaliarAlertas = (
  semanas: Semana[],
  limites: Limites,
): { tipo: 'hora_extra' | 'aderencia'; texto: string }[] => {
  const alertas: { tipo: 'hora_extra' | 'aderencia'; texto: string }[] = [];
  const ultimas = semanas.slice(-limites.semanasSeguidas);
  if (
    ultimas.length === limites.semanasSeguidas &&
    ultimas.every((s) => horaExtraPctDe(s) > limites.horaExtraPct)
  )
    alertas.push({
      tipo: 'hora_extra',
      texto: `Hora extra acima de ${limites.horaExtraPct}% do planejado por ${limites.semanasSeguidas} semana(s) seguida(s) (${ultimas.map((s) => `${horaExtraPctDe(s)}%`).join(', ')}).`,
    });
  const ultima = semanas[semanas.length - 1];
  if (ultima && ultima.aderenciaPct != null && ultima.aderenciaPct < limites.aderenciaMinPct)
    alertas.push({
      tipo: 'aderencia',
      texto: `Aderência de ${ultima.aderenciaPct}% na última semana (mínimo ${limites.aderenciaMinPct}%).`,
    });
  return alertas;
};
