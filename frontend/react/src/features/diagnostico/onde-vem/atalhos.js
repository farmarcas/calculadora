// Atalhos para o Cadastro de loja: grava loja e aba no endereço (o painel do Cadastro lê isso ao abrir) e troca de tela.
export const abrirNoCadastro = ({ lojaId, aba, irCadastros }) => {
  window.history.replaceState(null, "", `${window.location.pathname}?tela=cadastros&loja=${lojaId}&aba=${aba}`);
  irCadastros?.();
};
