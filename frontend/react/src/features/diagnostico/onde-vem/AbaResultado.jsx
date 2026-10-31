import BlocoOito24 from "./BlocoOito24.jsx";
import TabelaRegras from "./TabelaRegras.jsx";

export default function AbaResultado({ dados, lojaId, irCadastros }) {
  if (!dados) return <p className="m-0 p-6 text-sm text-[var(--text-secondary)]">Sem resultado por regra: importe a escala atual da loja.</p>;
  return (
    <div className="p-6">
      <TabelaRegras regras={dados} />
      <BlocoOito24 oito24={dados.oito24} lojaId={lojaId} irCadastros={irCadastros} />
    </div>
  );
}
