// Textos de ajuda dos campos de encargos (Regras e custos). Para mudar uma explicação, edite só este arquivo.
export const DICAS_DE_ENCARGOS = {
  rat: "Contribuição que a empresa paga sobre a folha para cobrir acidentes de trabalho. Varia conforme o risco da atividade: 1%, 2% ou 3%. Na dúvida, mantenha 2% e confirme com seu contador.",
  fap: "Fator de 0,5 a 2,0 que ajusta o RAT conforme o histórico de acidentes da sua empresa. 1 = sem desconto nem acréscimo. Seu contador sabe o valor do ano. Custo = RAT × FAP. Exemplo: 2% × 1,5 = 3% do salário.",
  rescisao:
    "Reserva mensal para o custo de uma futura demissão (multa do FGTS, aviso prévio). Usamos 8,33% do salário como estimativa. Não é um imposto. Marque para um cálculo mais cauteloso.",
  // Texto de apoio abaixo do link "Ver composição".
  composicao: "Veja item a item o que compõe o custo de cada funcionário além do salário.",
  // No Simples Nacional RAT e FAP ficam desabilitados e esta mensagem ocupa o lugar da explicação.
  simples: "No Simples Nacional, o RAT já está incluído no imposto (DAS). Este campo não altera o resultado.",
};

// "Com os seus valores: 3% do salário" (RAT × FAP, 1 casa decimal); nulo enquanto RAT ou FAP não foram preenchidos.
export const linhaComSeusValores = (ratPct, fap) => {
  const rat = Number(ratPct);
  const f = Number(fap);
  if (String(ratPct ?? "").trim() === "" || String(fap ?? "").trim() === "" || !Number.isFinite(rat) || !Number.isFinite(f)) return null;
  return `Com os seus valores: ${(Math.round(rat * f * 10) / 10).toFixed(1).replace(".", ",")}% do salário`;
};
