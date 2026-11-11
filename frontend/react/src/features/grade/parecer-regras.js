import { dataBR } from "../../components/importacao/formato.js";

// O parecer do cenário salvo (specs 056 e 057), regras puras e sem React. O conteúdo já vem pronto do servidor, na versão do perfil;
// aqui ficam os textos fixos, o subtítulo, o nome do arquivo e as cores dos chips.
export const AVISO_DE_ESTIMATIVA = "Estimativa feita com os dados importados da loja. Não altera o Cadastro.";
export const AVISO_SO_DONO = "Valores em reais aparecem só para o dono do grupo.";
export const AVISO_MONTADO_AGORA = "Cenário salvo antes do parecer: texto montado agora.";
export const MENSAGEM_ERRO_PDF = "Não foi possível baixar o PDF. Tente de novo.";

// "Salvo em 11/11/2026 pelo dono". Se o sistema passar a guardar o nome da pessoa, ele entra no lugar do papel.
const PAPEIS = { TENANT_ADMIN: "pelo dono", SCHEDULE_MANAGER: "pelo gestor", SCHEDULE_VIEWER: "pela consulta" };
export const papelDeQuemSalvou = (salvoPor) => PAPEIS[salvoPor] ?? null;

export const tituloDoParecer = (p) => `Parecer do cenário · ${p.loja}`;

// As duas linhas do subtítulo: "Cosmópolis · Regra de 42h · Cenário 5" e "Salvo em 11/11/2026 pelo dono".
export const linhasDoSubtitulo = (p) => {
  const cenario = p.numeroCenario != null ? ` · Cenário ${p.numeroCenario}` : "";
  const papel = papelDeQuemSalvou(p.salvoPor);
  return [`${p.loja} · ${p.regra}${cenario}`, `Salvo em ${dataBR(String(p.salvoEm).slice(0, 10))}${papel ? ` ${papel}` : ""}`];
};

// O nome do arquivo do PDF: o mesmo que o servidor usa ("parecer-cosmopolis-cenario-5.pdf").
export const nomeDoArquivoPdf = (loja, numeroCenario) => {
  const limpo = String(loja ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `parecer-${limpo || "loja"}${numeroCenario != null ? `-cenario-${numeroCenario}` : ""}.pdf`;
};

// Cores dos chips. O âmbar (#B45F00 / #8F4A00) e o verde (#3E7500) estão fora do Alquimia DS: usamos os tokens `--chip-*` que a coluna
// Folha dos Cenários já criou com esses valores (contraste AA verificado sobre os fundos). A cor nunca vai sozinha: o texto do chip
// traz o sinal (+, −) ou a palavra (Aumenta, Igual, Diminui, coberto…).
export const estiloDoChip = (tom) =>
  ({
    verde: { background: "var(--chip-diminui-fundo)", color: "var(--chip-diminui-texto)", borderColor: "var(--chip-diminui-borda)" },
    ambar: { background: "var(--chip-aumenta-fundo)", color: "var(--chip-aumenta-texto)", borderColor: "var(--chip-aumenta-borda)" },
    vermelho: { background: "var(--func-warning-100)", color: "var(--text-danger)", borderColor: "var(--func-warning-300)" },
    neutro: { background: "var(--chip-igual-fundo)", color: "var(--chip-igual-texto)", borderColor: "var(--chip-igual-borda)" },
  })[tom] ?? {};

// A cor do texto da coluna "Mudança": verde melhora, âmbar piora, neutro para "—".
export const corDaMudanca = (tom) =>
  ({ verde: "var(--chip-diminui-texto)", ambar: "var(--chip-aumenta-borda)", vermelho: "var(--text-danger)", neutro: "var(--text-secondary)" })[tom] ?? "var(--text-secondary)";

// O símbolo do chip de status (✓ cobre, ✕ não recomendado, ! atenção); os demais chips não têm símbolo.
export const textoDoStatus = (chip) => `${{ verde: "✓ ", vermelho: "✕ ", ambar: "! " }[chip.tom] ?? ""}${chip.texto}`;

// Só cenário salvo (não rascunho nem descartado) tem parecer.
export const temParecer = (s) => s?.status === "gravada" || s?.status === "aprovada" || s?.status === "vigente";
