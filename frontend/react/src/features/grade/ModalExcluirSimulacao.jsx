import { useState } from "react";
import { Aviso, Botao, Modal } from "../../components/ui/index.jsx";
import { mensagemDeErroAoExcluir, textoDaExclusao, tituloDaExclusao } from "./exclusao-regras.js";

// A confirmação de "Excluir simulação": diz o que acontece (a simulação some da lista e continua em "Mostrar descartadas") e só
// exclui ao confirmar. O foco volta ao ícone da lixeira ao fechar.
export default function ModalExcluirSimulacao({ nome, onConfirmar, onFechar, abridor = null }) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState(null);
  const confirmar = async () => {
    setExcluindo(true);
    setErro(null);
    try {
      await onConfirmar();
    } catch (e) {
      setErro(mensagemDeErroAoExcluir(e));
      setExcluindo(false);
    }
  };
  return (
    <Modal
      titulo={tituloDaExclusao()}
      onClose={excluindo ? () => {} : onFechar}
      devolverFocoPara={abridor}
      rodape={
        <div className="flex justify-end gap-2">
          <Botao tipo="secundario" onClick={onFechar} disabled={excluindo}>Cancelar</Botao>
          <Botao tipo="perigo" onClick={confirmar} disabled={excluindo} data-testid="confirmar-exclusao">{excluindo ? "Excluindo…" : "Excluir"}</Botao>
        </div>
      }
    >
      <p className="m-0 text-sm leading-5 text-[var(--text-strong)]" data-testid="texto-da-exclusao">{textoDaExclusao(nome)}</p>
      {erro && <div className="mt-3"><Aviso>{erro}</Aviso></div>}
    </Modal>
  );
}
