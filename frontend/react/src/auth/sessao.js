export const CAMINHO_INICIAL = import.meta.env.BASE_URL;
export const CAMINHO_DE_RETORNO = `${CAMINHO_INICIAL}sso/callback`;

export const faseDaFalha = (code) => {
  if (code === "SEM_ACESSO") return "sem-acesso";
  if (code === "LOGIN_INVALIDO" || code === "VALIDATION_ERROR") return "login-invalido";
  return "indisponivel";
};

export const grupoInicial = (guardado, grupos) => (grupos.some((g) => g.id === guardado) ? guardado : grupos[0]?.id ?? guardado);

export const perfilNoGrupo = (sessao, geId) =>
  sessao.operador ? "PLATFORM_OPERATOR" : sessao.grupos.find((g) => g.id === geId)?.perfil ?? "SCHEDULE_VIEWER";

export const acessoTotalNoGrupo = (sessao, geId) =>
  !sessao?.sso || sessao.operador || Boolean(sessao.grupos.find((g) => g.id === geId)?.acessoTotal);
