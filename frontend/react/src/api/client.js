// Base das chamadas: respeita o subpath do build (/ em local, /escala/ no Radar).
const API = `${import.meta.env.BASE_URL}api/v1`;

// Token do login do Radar. Como /escala é o MESMO domínio do Radar, o localStorage é
// compartilhado: o token que o Radar grava em "core/auth/token" já fica visível aqui.
const lerToken = () => {
  try {
    return localStorage.getItem("core/auth/token") || "";
  } catch {
    return "";
  }
};
export const temToken = () => lerToken() !== "";

// Para onde mandar quem não está logado (página de login do Radar, no mesmo host).
const LOGIN_URL = import.meta.env.VITE_RADAR_LOGIN_URL || "/authentication";
export const irParaLogin = () => {
  window.location.href = LOGIN_URL;
};

// Perfil de demonstração (usado só no modo local/header; no Radar o perfil vem do /session).
let perfil = localStorage.getItem("perfil") || "TENANT_ADMIN";

// GE escolhido. No Radar, só pode ser um dos GEs do usuário (o servidor confere).
export const GE_INICIAL = "00000000-0000-7000-8000-000000000001";
let ge = localStorage.getItem("ge") || GE_INICIAL;

export const getGe = () => ge;
export const setGe = (id) => {
  ge = id;
  localStorage.setItem("ge", id);
};

let comSessao = false;
let aoPerderSessao = null;

export const usarSessao = (aviso) => {
  comSessao = true;
  aoPerderSessao = aviso;
};

export const esquecerConta = () => {
  localStorage.removeItem("ge");
  localStorage.removeItem("perfil");
  ge = GE_INICIAL;
  perfil = "TENANT_ADMIN";
};

const cabecalhos = () => {
  if (comSessao) return { "X-GE": ge };
  const h = { "X-Perfil": perfil, "X-GE": ge };
  const t = lerToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
};

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
  const res = await fetch(`${API}${path}`, { method, headers, body: payload });
  // Sessão do Radar ausente/expirada: volta para o login.
  if (res.status === 401 && !comSessao && !path.startsWith("/auth/")) {
    irParaLogin();
    throw new ApiError("Faça login no Radar", "NAO_AUTENTICADO");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    if (comSessao && e?.code === "NAO_AUTENTICADO") aoPerderSessao?.();
    throw new ApiError(e?.message || "Algo deu errado. Tente de novo.", e?.code, e?.details);
  }
  return data;
}

export async function baixarArquivo(caminho, nome) {
  const res = await fetch(`${API}${caminho}`, { headers: cabecalhos() });
  if (res.status === 401) {
    if (comSessao) {
      aoPerderSessao?.();
      return;
    }
    irParaLogin();
    throw new ApiError("Faça login no Radar", "NAO_AUTENTICADO");
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const baixarModelo = () => baixarArquivo("/planilha-modelo", "modelo-cadastro-escala.xlsx");
