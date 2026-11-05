// Regras puras do modal "Enviar base comercial".

// Resultado do envio (`POST /cargas/base`) → { lojas: quantas lojas receberam a base, naoGravadas: linhas que ficaram de fora }.
export const resumoDoEnvio = (res) => ({
  lojas: (res?.lojas ?? []).filter((l) => l.situacao === "Importada").length,
  naoGravadas: (res?.totalErros ?? 0) + (res?.lojas ?? []).reduce((s, l) => s + (l.situacao === "Importada" ? 0 : l.rejeitadas), 0),
});

// Se a revisão permite enviar: precisa haver ao menos uma loja cadastrada no arquivo.
export const podeEnviar = (revisao) => !!revisao && revisao.lojas > 0;

// Aviso das lojas do arquivo que não estão cadastradas (nulo quando todas estão).
export const textoLojasNaoCadastradas = (codigos = []) => {
  if (!codigos.length) return null;
  const lista = codigos.slice(0, 5).join(", ") + (codigos.length > 5 ? ` e mais ${codigos.length - 5}` : "");
  return codigos.length === 1
    ? `A loja ${lista} não está cadastrada e fica de fora. Cadastre antes de enviar.`
    : `${codigos.length} lojas do arquivo não estão cadastradas e ficam de fora: ${lista}. Cadastre antes de enviar.`;
};
