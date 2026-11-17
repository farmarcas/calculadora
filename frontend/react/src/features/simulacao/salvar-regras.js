// Salvar o cenário com nome e observação (spec 056), regras puras e sem React.
export const NOME_MAXIMO = 60;
export const OBSERVACAO_MAXIMA = 1000;

// O nome sugerido na janela: "Cenário N".
export const nomeSugerido = (numero) => `Cenário ${numero ?? ""}`.trim();

// Mensagem de erro do nome (nulo quando está bom).
export const erroDoNome = (nome) => {
  const t = String(nome ?? "").trim();
  if (!t) return "Dê um nome ao cenário.";
  if (t.length > NOME_MAXIMO) return `O nome pode ter até ${NOME_MAXIMO} caracteres.`;
  return null;
};

export const contagemDaObservacao = (obs) => `${String(obs ?? "").length}/${OBSERVACAO_MAXIMA}`;
export const observacaoPassouDoLimite = (obs) => String(obs ?? "").length > OBSERVACAO_MAXIMA;
export const erroDaObservacao = (obs) => (observacaoPassouDoLimite(obs) ? `A observação pode ter até ${OBSERVACAO_MAXIMA} caracteres.` : null);

// O corpo que vai ao servidor: sem observação, ela nem vai.
export const corpoParaGravar = ({ nome, observacao }) => {
  const obs = String(observacao ?? "").trim();
  return { comoCenario: true, nome: String(nome ?? "").trim(), ...(obs ? { observacao: obs } : {}) };
};

// A mensagem de erro que a janela mostra, em linguagem simples.
export const mensagemDoErroAoSalvar = (e) => (e?.code === "NOME_REPETIDO" ? "Já existe um cenário com esse nome nesta loja. Escolha outro nome." : e?.message || "Não foi possível salvar. Tente de novo.");
