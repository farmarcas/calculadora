// Papéis de demonstração (sem login real: o SSO virá depois).
export const PERFIS = {
  PLATFORM_OPERATOR: "Operador da plataforma",
  TENANT_ADMIN: "Dono do grupo",
  SCHEDULE_MANAGER: "Gestor de escala",
  SCHEDULE_VIEWER: "Somente consulta",
};

export const ehOperador = (p) => p === "PLATFORM_OPERATOR";
// Quem cuida da equipe e da configuração do seu grupo.
export const cuidaDoGrupo = (p) => p === "TENANT_ADMIN" || p === "SCHEDULE_MANAGER";
// Quem corrige os dados de uma loja: o empresário (e o operador).
export const editaLoja = (p) => cuidaDoGrupo(p) || ehOperador(p);

export const formatarCnpj = (v) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : v ?? "";
};
