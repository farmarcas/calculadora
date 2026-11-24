// Gancho para as telas lerem flags e versões de experimento sem falar com o Mixpanel.
// Devolve o padrão até as flags chegarem e re-renderiza quando chegam (ou quando a pessoa sai).
import { useSyncExternalStore } from "react";
import { aoMudarFlags, flagLigada, variante, versaoDasFlags } from "./servico.js";

const useVersaoDasFlags = () => useSyncExternalStore(aoMudarFlags, versaoDasFlags, versaoDasFlags);

export const useFlag = (nome) => {
  useVersaoDasFlags();
  return flagLigada(nome);
};

export const useVariante = (nome, padrao) => {
  useVersaoDasFlags();
  return variante(nome, padrao);
};
