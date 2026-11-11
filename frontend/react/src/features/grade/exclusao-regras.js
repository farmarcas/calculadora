// Excluir uma simulação da lista (regras puras e sem React). "Excluir" usa o descarte que o servidor já tem: a simulação some da
// lista, fica guardada e volta a aparecer em "Mostrar descartadas". Nada do Cadastro muda.

// Quem pode excluir: quem escreve, e só simulação que ainda está na lista (não descartada).
export const podeExcluir = (s, podeEscrever) => !!podeEscrever && !!s && s.status !== "descartada";

export const tituloDaExclusao = () => "Excluir simulação";
export const textoDaExclusao = (nome) => `Excluir "${nome}"? Ela some da lista de simulações. Para vê-la de novo, marque "Mostrar descartadas". O Cadastro não muda.`;
export const rotuloDoBotaoExcluir = (nome) => `Excluir ${nome}`;
export const avisoDeExcluida = (nome) => `"${nome}" excluída. Ela continua em "Mostrar descartadas".`;
export const mensagemDeErroAoExcluir = (e) => e?.message || "Não foi possível excluir a simulação. Tente de novo.";
