import { IconeAlerta, IconeInfo } from "./icones.jsx";

// Caixa de aviso dos modais. Sempre com ícone e texto (nunca só cor). "info" é o aviso azul; "atencao" e "erro" avisam.
const tons = {
  info: { classe: "border border-[var(--system-50)] bg-[var(--color-primary-soft)] text-[var(--system-800)]", Icone: IconeInfo, papel: "note" },
  atencao: { classe: "bg-[var(--func-attention-100)] text-[#7a5200]", Icone: IconeAlerta, papel: "status" },
  erro: { classe: "bg-[var(--func-warning-50)] text-[#8b0020]", Icone: IconeAlerta, papel: "alert" },
};
export default function AvisoCaixa({ tom = "info", titulo, children, id }) {
  const { classe, Icone, papel } = tons[tom];
  return (
    <div id={id} role={papel} className={`flex items-start gap-2.5 rounded-[8px] px-4 py-3 text-sm ${classe}`}>
      <span className="mt-0.5"><Icone /></span>
      <div className="min-w-0 flex-1">
        {titulo && <div className="font-bold">{titulo}</div>}
        {children}
      </div>
    </div>
  );
}
