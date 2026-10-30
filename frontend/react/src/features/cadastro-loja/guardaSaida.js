// Avisa quem tenta sair (trocar de loja, de tela ou fechar a página) com alterações não salvas.
let pendentes = 0;
const aoFechar = (e) => {
  if (pendentes > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
};
let ligado = false;

export const marcarAlteracoes = (n) => {
  pendentes = n;
  if (n > 0 && !ligado) {
    window.addEventListener("beforeunload", aoFechar);
    ligado = true;
  } else if (n === 0 && ligado) {
    window.removeEventListener("beforeunload", aoFechar);
    ligado = false;
  }
};
export const temAlteracoes = () => pendentes > 0;
// true = pode seguir (sem alterações ou a pessoa aceitou descartar).
export const confirmarSaida = () => pendentes === 0 || window.confirm("Descartar alterações? O que não foi salvo nesta loja será perdido.");
