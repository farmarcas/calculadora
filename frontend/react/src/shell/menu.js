// O menu inteiro descrito uma vez. Quem vê cada item depende só do perfil; o item atual, só da tela e da seção.
// Minhas Lojas = Cadastros (rotas de sempre); Escala leva à tela da Escala, que tem as abas Diagnóstico e Simulações.
const ITENS = [
  { id: "lojas", rotulo: "Minhas Lojas", icone: "loja", tela: "cadastros", secao: "lojas" },
  // Parâmetros legais valem para toda a plataforma: só o operador vê, como item próprio.
  { id: "parametros", rotulo: "Parâmetros legais", icone: "parametros", tela: "cadastros", secao: "parametros", soOperador: true },
  // Diagnóstico e Simulações ficam nas abas da própria tela da Escala; o menu leva à Escala (que abre no Diagnóstico).
  { id: "escala", rotulo: "Escala", icone: "calendario", tela: "escala", secao: "diagnostico" },
  { id: "grupos", rotulo: "Grupos", icone: "grupo", tela: "grupos", soOperador: true },
];

export const SECAO_INICIAL = { cadastros: "lojas", escala: "diagnostico", grupos: null };

// Itens (e subitens) que o perfil pode ver.
export const itensDoMenu = (perfil) => {
  const operador = perfil === "PLATFORM_OPERATOR";
  return ITENS.filter((i) => !i.soOperador || operador).map((i) => ({
    ...i,
    filhos: i.filhos?.filter((f) => !f.soOperador || operador),
  }));
};

// Folhas navegáveis (o subitem, ou o item que não tem subitens), na ordem do menu.
export const folhas = (perfil) => itensDoMenu(perfil).flatMap((i) => (i.filhos?.length ? i.filhos : [i]));

// Folha atual para uma tela e seção; cai na primeira folha da tela se a seção não existir para o perfil.
export const folhaAtual = (perfil, tela, secao) => {
  const todas = folhas(perfil);
  return todas.find((f) => f.tela === tela && (f.secao ?? null) === (secao ?? null)) ?? todas.find((f) => f.tela === tela) ?? todas[0];
};

// Item de primeiro nível que contém a folha atual (para destacar o grupo e abrir o submenu).
export const itemDaFolha = (perfil, folha) => itensDoMenu(perfil).find((i) => i.id === folha.id || i.filhos?.some((f) => f.id === folha.id));

// Para onde ir ao clicar em um item de primeiro nível com subitens (o primeiro subitem).
export const destinoDoItem = (item) => (item.filhos?.length ? item.filhos[0] : item);

// Telas em que a faixa de contexto (loja e Importar) faz sentido: as da Escala.
export const telaTemFaixa = (tela) => tela === "escala";

export const telaTemFiltroDeGrupo = (folha, sso) => sso && (folha.tela === "escala" || folha.secao === "lojas");
