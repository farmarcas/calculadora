// Mover e redimensionar um turno na grade (spec 039), puros e sem React. Tudo de 15 em 15 minutos, dentro das horas do dia.
import { limitar, quarto } from "../../grade/tempo.js";

export const MINIMO_DO_TURNO_H = 1;

const FOLGA = 1e-9;
// Arredonda para o quarto de hora sem sair de [a, b]. Quem encosta num limite fica exatamente nele, mesmo que o limite não seja
// um quarto de hora (turno 12h36–22h: o limite da direita é a entrada 12h36). Sem isso o arredondamento empurrava o turno para
// trás ao arrastar para a direita (virava 12h30–21h54) ou, em outros casos, para além da hora de fechar.
const quartoDentro = (h, a, b) => {
  const c = limitar(h, a, b);
  if (c >= b - FOLGA) return b;
  if (c <= a + FOLGA) return a;
  const q = quarto(c);
  if (q > b + FOLGA) return Math.floor((b + FOLGA) * 4) / 4;
  if (q < a - FOLGA) return Math.ceil((a - FOLGA) * 4) / 4;
  return q;
};

// Move o turno inteiro (e o intervalo junto) sem sair da janela [min, max] do dia.
export const moverTurno = (t, delta, { min, max }) => {
  const len = t.saida - t.entrada;
  const entrada = quartoDentro(t.entrada + delta, min, Math.max(min, max - len));
  const d = entrada - t.entrada;
  return {
    ...t,
    entrada,
    // Spec 047: o turno guarda minutos inteiros (14h38, 15h24); mover mantém a duração e o intervalo, sem arredondar a saída.
    saida: entrada + len,
    iniIntervalo: t.iniIntervalo == null ? null : t.iniIntervalo + d,
    fimIntervalo: t.fimIntervalo == null ? null : t.fimIntervalo + d,
  };
};

// Puxa uma borda ("esq" mexe na entrada, "dir" na saída), com no mínimo 1 h de turno; o intervalo que ficar fora do turno some.
export const redimensionarTurno = (t, borda, delta, { min, max }, minimo = MINIMO_DO_TURNO_H) => {
  let { entrada, saida } = t;
  if (borda === "esq") entrada = quartoDentro(t.entrada + delta, min, t.saida - minimo);
  else saida = quartoDentro(t.saida + delta, t.entrada + minimo, max);
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
