// Perfil de demonstração (sem login real nesta fase). Enviado em todo pedido.
let perfil = localStorage.getItem("perfil") || "TENANT_ADMIN";

// GE de demonstração (sem login real nesta fase). Enquanto a tela de escolha do GE não existe, usa o GE inicial.
const GE_INICIAL = "00000000-0000-7000-8000-000000000001";
let ge = localStorage.getItem("ge") || GE_INICIAL;

export const getGe = () => ge;
export const setGe = (id) => {
  ge = id;
  localStorage.setItem("ge", id);
};
const cabecalhos = () => ({ "X-Perfil": perfil, "X-GE": ge });

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
  const headers = cabecalhos();
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

export async function baixarArquivo(caminho, nome) {
  const res = await fetch(`/api/v1${caminho}`, { headers: cabecalhos() });
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const baixarModelo = () => baixarArquivo("/planilha-modelo", "modelo-cadastro-escala.xlsx");
