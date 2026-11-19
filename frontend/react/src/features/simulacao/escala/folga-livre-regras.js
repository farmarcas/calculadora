// Folga livre na simulação (spec 061), pura e sem React: dar folga a quem trabalha no dia e escalar quem está de folga, em qualquer
// dia aberto, sem nenhuma trava. A cobertura e os avisos de regra mostram o efeito; quem decide é a pessoa que simula. Usa as mesmas
// contas da Escala por hora (`semTurnoNoDia` e `novoTurnoNaFolga`), então o comportamento é o mesmo nas duas telas.
import { novoTurnoNaFolga, semTurnoNoDia, turnoDoDia } from "./escala-regras.js";

// Os turnos sem o da pessoa naquele dia (vira folga). Sem turno nesse dia, nada muda.
export const darFolga = (turnos, matricula, dia) => (turnoDoDia(turnos, matricula, dia) ? semTurnoNoDia(turnos, matricula, dia) : turnos);

// Os turnos com um turno novo da pessoa naquele dia (o habitual dela). Já trabalhando nesse dia, ou com a loja fechada (`aba`
// ausente), nada muda.
export const escalarNoDia = ({ turnos, matricula, dia, aba, regra }) => {
  if (!aba || turnoDoDia(turnos, matricula, dia)) return turnos;
  return [...turnos, novoTurnoNaFolga({ turnos, matricula, dia, aba, regra })];
};
