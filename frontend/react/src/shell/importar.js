// O que o menu "Importar" oferece a cada perfil. O operador importa lojas e funcionários; o dono e o gestor também importam
// a base comercial (vendas hora a hora); quem só consulta não importa nada.
export const ITENS_DE_IMPORTACAO = {
  cadastro: { id: "cadastro", rotulo: "Importar lojas e funcionários" },
  base: { id: "base", rotulo: "Vendas hora a hora" },
};

export const itensDoMenuImportar = (perfil, acessoTotal = true) => {
  if (!acessoTotal) return [];
  if (perfil === "PLATFORM_OPERATOR") return [ITENS_DE_IMPORTACAO.cadastro];
  if (perfil === "TENANT_ADMIN" || perfil === "SCHEDULE_MANAGER") return [ITENS_DE_IMPORTACAO.cadastro, ITENS_DE_IMPORTACAO.base];
  return [];
};

// Qual item recebe o foco ao usar as setas no menu aberto (circula nas pontas).
export const proximoItem = (atual, total, tecla) => {
  if (total === 0) return -1;
  if (tecla === "Home") return 0;
  if (tecla === "End") return total - 1;
  if (tecla === "ArrowDown") return atual < 0 ? 0 : (atual + 1) % total;
  if (tecla === "ArrowUp") return atual < 0 ? total - 1 : (atual - 1 + total) % total;
  return atual;
};
