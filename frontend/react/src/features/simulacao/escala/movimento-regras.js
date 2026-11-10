// Mover e redimensionar um turno na grade (spec 039), puros e sem React. Tudo de 15 em 15 minutos, dentro das horas do dia.
import { limitar, quarto } from "../../grade/tempo.js";

export const MINIMO_DO_TURNO_H = 1;

// Move o turno inteiro (e o intervalo junto) sem sair da janela [min, max] do dia.
export const moverTurno = (t, delta, { min, max }) => {
  const len = t.saida - t.entrada;
  const entrada = quarto(limitar(t.entrada + delta, min, Math.max(min, max - len)));
  const d = entrada - t.entrada;
  return {
    ...t,
    entrada,
    saida: entrada + len,
    iniIntervalo: t.iniIntervalo == null ? null : t.iniIntervalo + d,
    fimIntervalo: t.fimIntervalo == null ? null : t.fimIntervalo + d,
  };
};

// Puxa uma borda ("esq" mexe na entrada, "dir" na saída), com no mínimo 1 h de turno; o intervalo que ficar fora do turno some.
export const redimensionarTurno = (t, borda, delta, { min, max }, minimo = MINIMO_DO_TURNO_H) => {
  let { entrada, saida } = t;
  if (borda === "esq") entrada = quarto(limitar(t.entrada + delta, min, t.saida - minimo));
  else saida = quarto(limitar(t.saida + delta, t.entrada + minimo, max));
  const dentro = t.iniIntervalo != null && t.fimIntervalo != null && t.iniIntervalo >= entrada && t.fimIntervalo <= saida;
  return { ...t, entrada, saida, iniIntervalo: dentro ? t.iniIntervalo : null, fimIntervalo: dentro ? t.fimIntervalo : null };
};

// O teclado na barra: setas movem o turno; Shift com as setas mexe na saída. Cada toque vale 15 minutos.
export const movimentoPorTecla = (tecla, shift = false) => {
  const delta = tecla === "ArrowRight" ? 0.25 : tecla === "ArrowLeft" ? -0.25 : null;
  if (delta === null) return null;
  return shift ? { modo: "dir", delta } : { modo: "mover", delta };
};

// Aplica um movimento (mouse ou teclado) ao turno.
export const aplicarMovimento = (t, modo, delta, janela) =>
  modo === "mover" ? moverTurno(t, delta, janela) : redimensionarTurno(t, modo, delta, janela);
