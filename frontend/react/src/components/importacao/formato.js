// Funções puras dos modais de importação: tamanho, datas, mensagens e a lista de erros em CSV.

export const LIMITE_MB = 20;

const fmt = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 0 });

// 124 KB, 3,2 MB.
export const tamanhoLegivel = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${fmt(bytes / (1024 * 1024))} MB`;
};

// AAAA-MM-DD → dd/mm/aaaa.
export const dataBR = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

export const periodoTexto = (p) => (p?.inicio && p?.fim ? `${dataBR(p.inicio)} a ${dataBR(p.fim)}` : "");

export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export const extensaoValida = (nome) => /\.(xlsx|csv)$/i.test(nome ?? "");

export const MENSAGEM_FORMATO = "Este arquivo não é .xlsx nem .csv. Salve a planilha em um desses formatos e envie de novo.";
export const MENSAGEM_TAMANHO = `O arquivo tem mais de ${LIMITE_MB} MB. Divida a planilha em arquivos menores.`;

// Erro do arquivo escolhido antes mesmo de falar com o servidor; nulo quando está tudo bem.
export const erroDoArquivo = (arquivo) => {
  if (!arquivo) return null;
  if (!extensaoValida(arquivo.name)) return MENSAGEM_FORMATO;
  if (arquivo.size > LIMITE_MB * 1024 * 1024) return MENSAGEM_TAMANHO;
  return null;
};

// "3,2 MB · 14 lojas · 01/10/2026 a 31/10/2026"
export const apoioDaBase = ({ bytes, lojas, periodo }) =>
  [tamanhoLegivel(bytes), lojas == null ? "" : plural(lojas, "loja", "lojas"), periodoTexto(periodo)].filter(Boolean).join(" · ");

// Aviso do envio que será substituído: { titulo, apoio } ou nulo quando nenhuma loja tinha base.
export const textoDeSubstituicao = (substitui = []) => {
  if (!substitui.length) return null;
  const datas = [...new Set(substitui.map((s) => s.desde))].sort();
  const titulo = datas.length === 1
    ? `Este envio substitui o de ${dataBR(datas[0])}.`
    : `Este envio substitui envios de ${dataBR(datas[0])} a ${dataBR(datas[datas.length - 1])}.`;
  const n = substitui.length;
  const apoio = n === 1
    ? "A loja passa a usar a nova planilha. A anterior fica no histórico."
    : `As ${n} lojas passam a usar a nova planilha. A anterior fica no histórico.`;
  return { titulo, apoio };
};

// Mensagens de sucesso (mostradas depois que o modal fecha).
export const sucessoDoCadastro = ({ lojas, funcionarios, erros = [] }) => {
  const gravadas = lojas.novos + lojas.atualizados;
  const gravados = funcionarios.novos + funcionarios.atualizados;
  const base = `${plural(gravadas, "loja", "lojas")} e ${plural(gravados, "funcionário", "funcionários")} gravados.`;
  return erros.length ? `${base} ${plural(erros.length, "linha não foi gravada", "linhas não foram gravadas")}.` : base;
};
export const sucessoDaBase = ({ lojas, naoGravadas = 0 }) => {
  const base = `Base comercial enviada para ${plural(lojas, "loja", "lojas")}.`;
  return naoGravadas ? `${base} ${plural(naoGravadas, "linha não foi gravada", "linhas não foram gravadas")}.` : base;
};

// Texto do botão de gravar da revisão.
export const textoGravar = ({ lojas, funcionarios }) => {
  const l = lojas.atualiza + lojas.novas;
  const f = funcionarios.atualiza + funcionarios.novas;
  return `Gravar ${plural(l, "loja", "lojas")} e ${plural(f, "funcionário", "funcionários")}`;
};

// "Lojas, linha 14: CNPJ não encontrado entre as lojas do grupo."
export const linhaDeErro = (e) => {
  const onde = [e.aba, e.linha ? `linha ${e.linha}` : ""].filter(Boolean).join(", ");
  const motivo = e.motivo ?? "";
  return `${onde ? `${onde}: ` : ""}${motivo}${/[.!?]$/.test(motivo) ? "" : "."}`;
};

const aspas = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
// CSV (separador ;, com BOM para o Excel abrir com acentos) das linhas que não serão gravadas.
export const listaDeErrosCsv = (erros = []) =>
  `﻿${["Aba;Linha;Motivo", ...erros.map((e) => [aspas(e.aba), e.linha ?? "", aspas(e.motivo)].join(";"))].join("\r\n")}\r\n`;

export const baixarTexto = (nome, texto, tipo = "text/csv;charset=utf-8") => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
};
