import { textoDaFolha } from "./linha-regras.js";

const ESTILO_DO_CHIP = {
  aumenta: { background: "var(--chip-aumenta-fundo)", color: "var(--chip-aumenta-texto)", borderColor: "var(--chip-aumenta-borda)" },
  diminui: { background: "var(--chip-diminui-fundo)", color: "var(--chip-diminui-texto)", borderColor: "var(--chip-diminui-borda)" },
  igual: { background: "var(--chip-igual-fundo)", color: "var(--chip-igual-texto)", borderColor: "var(--chip-igual-borda)" },
};

// O chip: o sinal ou o texto sempre acompanham a cor (aumenta "+1,7%", diminui "−0,6%", igual "folha igual").
const Chip = ({ chip, ariaLabel }) => (
  <span
    role="img"
    aria-label={ariaLabel}
    data-testid="chip-folha"
    data-tom={chip.tom}
    className="inline-block rounded-full border px-2 py-0 text-xs leading-5 font-bold"
    style={ESTILO_DO_CHIP[chip.tom]}
  >
    {chip.texto}
  </span>
);

// A célula "Folha no faturamento" (spec 050, layout A3). Dono: peso depois em destaque com "do faturamento", "hoje X,X%" e o
// chip à direita, e os reais (ou "Sobe só porque a venda cai.") na última linha. Gestor e consulta: só o chip. Sem dados: uma
// frase de 13 px, sem números.
export default function CelulaFolha({ linha, dono }) {
  const t = textoDaFolha(linha, dono);
  if (t.tipo === "falta") {
    return <p className="m-0 text-[13px] leading-[18px] text-[var(--text-secondary)]" data-testid="folha-falta">{t.frase}</p>;
  }
  if (t.tipo === "chip") {
    return <Chip chip={t.chip} ariaLabel={t.ariaLabel} />;
  }
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-x-3" data-testid="celula-folha">
      <div className="min-w-0">
        <div className="text-xl leading-6 font-bold text-[var(--text-strong)]" data-testid="folha-peso">{t.peso}</div>
        <div className="text-xs leading-4 text-[var(--text-secondary)]">do faturamento</div>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span className="text-xs leading-4 text-[var(--text-secondary)]" data-testid="folha-hoje">{t.hoje}</span>
        <Chip chip={t.chip} ariaLabel={t.ariaLabel} />
      </div>
      {t.reais && <div className="col-span-2 mt-1 text-xs leading-4 text-[var(--text-secondary)]" data-testid="folha-reais">{t.reais}</div>}
    </div>
  );
}
