// Regras puras da revisão da importação de lojas e funcionários (o que a tabela mostra e se há o que gravar).
export const linhasDaRevisao = (revisao, podeLojas) => [
  ...(podeLojas ? [{ chave: "lojas", rotulo: "Lojas", ...revisao.lojas }] : []),
  { chave: "funcionarios", rotulo: "Funcionários", ...revisao.funcionarios },
];

// Quantas linhas serão gravadas (as com erro não entram).
export const totalAGravar = (revisao, podeLojas) =>
  linhasDaRevisao(revisao, podeLojas).reduce((s, l) => s + l.atualiza + l.novas, 0);

// Totais do botão "Gravar X lojas e Y funcionários": para quem não importa lojas, o número de lojas é zero.
export const totaisDoBotao = (revisao, podeLojas) => ({
  lojas: podeLojas ? revisao.lojas : { atualiza: 0, novas: 0, comErro: 0 },
  funcionarios: revisao.funcionarios,
});
