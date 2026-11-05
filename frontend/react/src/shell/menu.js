// O menu inteiro descrito uma vez. Quem vê cada item depende só do perfil; o item atual, só da tela e da seção.
// Minhas Lojas = Cadastros (rotas de sempre); Escala traz Diagnóstico e Simulações.
const ITENS = [
  {
    id: "lojas", rotulo: "Minhas Lojas", icone: "loja", tela: "cadastros",
    filhos: [
      { id: "lojas-lista", rotulo: "Lojas", icone: "loja", tela: "cadastros", secao: "lojas" },
      { id: "lojas-parametros", rotulo: "Parâmetros legais", icone: "parametros", tela: "cadastros", secao: "parametros", soOperador: true },
    ],
  },
  {
    id: "escala", rotulo: "Escala", icone: "calendario", tela: "escala",
    filhos: [
      { id: "escala-diagnostico", rotulo: "Diagnóstico", icone: "prancheta", tela: "escala", secao: "diagnostico" },
      { id: "escala-simulacoes", rotulo: "Simulações", icone: "play", tela: "escala", secao: "grade" },
    ],
  },
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
