// Todo dado de ponto/apuração leva este rótulo (RN-E18).
export const ROTULO_GERENCIAL = "apuração gerencial — não substitui o registro oficial de ponto";

export default function RotuloGerencial() {
  return (
    <p className="m-0 text-xs text-attention-700 bg-attention-50 rounded-input px-3 py-2" role="note">
      {ROTULO_GERENCIAL[0].toUpperCase() + ROTULO_GERENCIAL.slice(1)}.
    </p>
  );
}
