// Perfil de demonstração (sem login real nesta fase). Enviado em todo pedido.
let perfil = localStorage.getItem("perfil") || "TENANT_ADMIN";

export const getPerfil = () => perfil;
export const setPerfil = (p) => {
  perfil = p;
  localStorage.setItem("perfil", p);
};

export class ApiError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = { "X-Perfil": perfil };
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`/api/v1${path}`, { method, headers, body: payload });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(e?.message || "Algo deu errado. Tente de novo.", e?.code, e?.details);
  }
  return data;
}

export async function baixarModelo() {
  const res = await fetch("/api/v1/planilha-modelo", { headers: { "X-Perfil": perfil } });
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "modelo-cadastro-escala.xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
}
