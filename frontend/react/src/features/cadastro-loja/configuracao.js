import { FUNCOES, janelaDaLoja, turnosIniciais } from "./turnos.js";

// Convenção, mínimos e turnos como a tela edita (modo "turnos" ou "unico"; o que não está em uso fica guardado).
// Loja sem turnos guardados abre em "Por turnos" com os turnos iniciais (cópia do mínimo atual): é só o ponto de partida da
// tela, e o salvo e o rascunho são iguais, então abrir a aba não conta como alteração. Quem guardou "Mínimo único do dia"
// (turnos guardados com esse modo) continua nele.
export const baseDaConfiguracao = (config, horarios) => {
  const minimos = Object.fromEntries(FUNCOES.map((f) => [f, config.minimos?.[f] ?? (f === "Farmacêutico" ? 1 : 0)]));
  const guardados = config.turnos?.length ? config.turnos : null;
  return {
    convencao8h24: !!config.convencao8h24,
    minimos,
    turnos: guardados ?? turnosIniciais(janelaDaLoja(horarios), minimos),
    modoMinimo: guardados && config.modoMinimo === "unico" ? "unico" : "turnos",
  };
};
