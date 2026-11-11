// Desligar pessoa na simulação (spec 054), regras puras e sem React. O servidor guarda `desligado: true` no quadro da simulação e
// espera a lista COMPLETA de desligados a cada salvamento; os turnos de quem sai ficam guardados, então religar traz tudo de volta.

// Quem está desligado: só funcionário que já existe (vaga simulada não se desliga), na ordem do quadro.
export const desligadosDoQuadro = (quadro = []) => quadro.filter((p) => p.desligado && !p.vaga);

const matriculasDosDesligados = (quadro) => desligadosDoQuadro(quadro).map((p) => p.matricula);

// A lista completa que o servidor espera depois de desligar (ou religar) uma pessoa; sem repetir ninguém.
export const listaAposDesligar = (quadro = [], matricula) => {
  const lista = matriculasDosDesligados(quadro);
  return lista.includes(matricula) ? lista : [...lista, matricula];
};
export const listaAposReligar = (quadro = [], matricula) => matriculasDosDesligados(quadro).filter((m) => m !== matricula);

// "Desligar" só em funcionário existente que ainda está na simulação, e só com a simulação editável.
export const podeDesligar = (pessoa, editavel) => !!editavel && !!pessoa && !pessoa.vaga && !pessoa.desligado;

export const tituloDaFaixa = (n) => `Desligados na simulação (${n})`;

export const rotuloDoBotao = (acao, nome) => `${acao === "religar" ? "Religar" : "Desligar"} ${nome}`;

// O que a faixa mostra: nulo sem desligados (a faixa não aparece).
export const faixaDeDesligados = (quadro = [], editavel = false) => {
  const lista = desligadosDoQuadro(quadro);
  if (lista.length === 0) return null;
  return {
    titulo: tituloDaFaixa(lista.length),
    pessoas: lista.map((p) => ({ matricula: p.matricula, nome: p.nome, funcao: p.funcao, rotulo: rotuloDoBotao("religar", p.nome) })),
    podeReligar: !!editavel,
  };
};
