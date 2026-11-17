import { faixaDeDesligados } from "./desligados-regras.js";

// "Desligados na simulação (N)" (spec 054): quem foi tirado do quadro só desta simulação, com "Religar" ao lado de cada nome.
// Sem desligados, a faixa não aparece. Em simulação gravada ou para quem não edita, fica só leitura (sem "Religar").
export default function FaixaDeDesligados({ quadro, editavel, onReligar }) {
  const f = faixaDeDesligados(quadro, editavel);
  if (!f) return null;
  return (
    <section aria-label={f.titulo} data-testid="faixa-desligados" className="rounded-card border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3">
      <h3 className="m-0 text-sm leading-5 font-bold text-[var(--text-strong)]">{f.titulo}</h3>
      <p className="m-0 mt-0.5 text-xs leading-4 text-[var(--text-secondary)]">Estas pessoas não contam nesta simulação. O Cadastro não muda.</p>
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
        {f.pessoas.map((p) => (
          <li key={p.matricula} className="flex items-center gap-2 text-[13px] leading-5" data-testid="desligado">
            <span className="font-bold text-[var(--text-strong)]">{p.nome}</span>
            <span className="text-[var(--text-secondary)]">{p.funcao}</span>
            {f.podeReligar && onReligar && (
              <button type="button" onClick={() => onReligar(p.matricula)} aria-label={p.rotulo} className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--color-primary)] hover:underline">Religar</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
