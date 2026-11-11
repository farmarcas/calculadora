import { dataBR } from "../../components/importacao/formato.js";

// O parecer do cenário salvo (spec 056), regras puras e sem React. O texto já vem pronto do servidor, na versão do perfil.
export const FRASE_FINAL = "Esta é uma estimativa e não altera o Cadastro.";
export const AVISO_MONTADO_AGORA = "Cenário salvo antes do parecer: texto montado agora.";

const PERFIS = { TENANT_ADMIN: "Dono", SCHEDULE_MANAGER: "Gestor", SCHEDULE_VIEWER: "Consulta" };
export const rotuloDoPerfil = (perfil) => PERFIS[perfil] ?? null;

export const tituloDoParecer = (p) => `Parecer: ${p.nome}`;

// "Loja: Cosmópolis · Regra: Regra de 42h" e "Salvo em 11/11/2026 por Dono".
export const linhasDoCabecalho = (p) => {
  const por = rotuloDoPerfil(p.salvoPor);
  return [`Loja: ${p.loja} · Regra: ${p.regra}`, `Salvo em ${dataBR(String(p.salvoEm).slice(0, 10))}${por ? ` por ${por}` : ""}`];
};

// O nome do arquivo do PDF: o mesmo que o servidor usa.
export const nomeDoArquivoPdf = (nome) => {
  const limpo = String(nome ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `parecer-${limpo || "cenario"}.pdf`;
};

// Só cenário salvo (não rascunho nem descartado) tem parecer.
export const temParecer = (s) => s?.status === "gravada" || s?.status === "aprovada" || s?.status === "vigente";
