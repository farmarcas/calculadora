const ICONES = { x: "✕", alta: "▲", baixa: "▼", alerta: "!", ok: "✓" };
const CORES = {
  perigo: "bg-[var(--func-warning-50)] text-[#8b0020]",
  sucesso: "bg-[var(--func-success-100)] text-[var(--text-success-strong)]",
  atencao: "bg-[var(--func-attention-100)] text-[var(--neutral-dark-900)]",
};

// Pill de status compacta: 11 px, 18 px de altura, padding 1px 8px, sem quebra de linha. Ícone e texto andam juntos: a cor
// nunca vai sozinha. Nas linhas rebaixadas (não resolve) a pill é vermelha com texto branco.
export default function PillDeStatus({ rotulo, rebaixado = false }) {
  if (!rotulo) return null;
  const cor = rebaixado && rotulo.tom === "perigo" ? "bg-[var(--func-warning-300)] text-white" : CORES[rotulo.tom];
  return (
    <span className={`inline-flex h-[18px] w-fit items-center gap-1 rounded-full px-2 py-px text-[11px] leading-4 font-bold whitespace-nowrap ${cor}`}>
      <span aria-hidden="true">{ICONES[rotulo.icone]}</span>
      {rotulo.texto}
    </span>
  );
}
