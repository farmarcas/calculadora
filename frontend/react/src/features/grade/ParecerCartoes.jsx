import { estiloDoChip } from "./parecer-regras.js";

// Os três números grandes do parecer (spec 057), em cartões de fundo suave: Folha no faturamento (ou Custo de pessoal), Equipe e
// Farmacêutico faltando. O chip nunca depende só da cor: o texto traz o sinal ou a palavra.
const Chip = ({ chip }) => (
  <span className="inline-block rounded-full border px-2 py-0 text-xs leading-5 font-bold" style={estiloDoChip(chip.tom)} data-testid="chip-parecer" data-tom={chip.tom}>
    {chip.texto}
  </span>
);

const Cartao = ({ c, id }) => (
  <div className="min-w-0 rounded-card bg-[var(--surface-subtle)] px-4 py-3" data-testid={id}>
    <div className="text-xs leading-4 text-[var(--text-secondary)]">{c.titulo}</div>
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-2xl leading-8 font-bold text-[var(--text-strong)]">{c.valor}</span>
      {c.chip && <Chip chip={c.chip} />}
    </div>
    {c.apoio && <div className="mt-1 text-xs leading-4 text-[var(--text-secondary)]">{c.apoio}</div>}
  </div>
);

export default function ParecerCartoes({ cartoes }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="parecer-cartoes">
      <Cartao c={cartoes.folha} id="cartao-folha" />
      <Cartao c={cartoes.equipe} id="cartao-equipe" />
      <Cartao c={cartoes.farmaceutico} id="cartao-farmaceutico" />
    </div>
  );
}
