import { useId, useRef, useState } from "react";
import { Botao, IconeUpload } from "../ui/index.jsx";
import { LIMITE_MB } from "./formato.js";

// Área de envio: arrastar e soltar ou "Escolher arquivo". O campo de arquivo do navegador fica escondido e é acionado
// pelo botão (operável por teclado); nada nativo aparece na tela. O arquivo escolhido é entregue a `onArquivo`.
export default function AreaDeEnvio({ onArquivo, desabilitado = false }) {
  const idLegenda = useId();
  const input = useRef(null);
  const [sobre, setSobre] = useState(false);

  const abrir = () => input.current?.click();
  const soltar = (e) => {
    e.preventDefault();
    setSobre(false);
    if (desabilitado) return;
    const arquivo = e.dataTransfer?.files?.[0];
    if (arquivo) onArquivo(arquivo);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!desabilitado) setSobre(true); }}
      onDragLeave={() => setSobre(false)}
      onDrop={soltar}
      className={`flex min-h-[76px] flex-wrap items-center gap-3 rounded-[8px] border-[1.5px] border-dashed px-4 py-3 ${sobre ? "border-system-500 bg-[var(--color-primary-soft)]" : "border-[var(--border-strong)] bg-[var(--surface-subtle)]"}`}
    >
      <span className="text-system-500"><IconeUpload tamanho={22} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-[var(--text-strong)]">Arraste a planilha aqui</div>
        <div id={idLegenda} className="text-xs text-[var(--text-secondary)]">Formatos aceitos: .xlsx ou .csv · até {LIMITE_MB} MB</div>
      </div>
      <Botao tipo="secundario" onClick={abrir} disabled={desabilitado} aria-describedby={idLegenda}>Escolher arquivo</Botao>
      <input
        ref={input}
        type="file"
        accept=".xlsx,.csv"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => { const a = e.target.files?.[0]; e.target.value = ""; if (a) onArquivo(a); }}
      />
    </div>
  );
}
