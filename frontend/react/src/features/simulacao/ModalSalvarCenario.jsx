import { useState } from "react";
import { Aviso, Botao, Campo, Modal, entrada } from "../../components/ui/index.jsx";
import { NOME_MAXIMO, OBSERVACAO_MAXIMA, contagemDaObservacao, corpoParaGravar, erroDaObservacao, erroDoNome, mensagemDoErroAoSalvar, nomeSugerido } from "./salvar-regras.js";

// A janela de "Salvar como cenário N" (spec 056): o nome (sugestão "Cenário N", editável) e uma observação opcional que entra no
// parecer. Se o servidor recusar (nome repetido, por exemplo), a janela continua aberta com o que foi digitado.
export default function ModalSalvarCenario({ numero, salvando, onConfirmar, onFechar }) {
  const [nome, setNome] = useState(nomeSugerido(numero));
  const [observacao, setObservacao] = useState("");
  const [tentou, setTentou] = useState(false);
  const [erroDoServidor, setErroDoServidor] = useState(null);
  const erroNome = tentou ? erroDoNome(nome) : null;
  const erroObs = erroDaObservacao(observacao);

  const confirmar = async (e) => {
    e.preventDefault();
    setTentou(true);
    setErroDoServidor(null);
    if (erroDoNome(nome) || erroDaObservacao(observacao)) return;
    try {
      await onConfirmar(corpoParaGravar({ nome, observacao }));
    } catch (err) {
      setErroDoServidor(mensagemDoErroAoSalvar(err));
    }
  };

  return (
    <Modal titulo="Salvar cenário" onClose={salvando ? () => {} : onFechar}>
      <form onSubmit={confirmar} className="flex flex-col gap-4" data-testid="form-salvar-cenario">
        <Campo rotulo="Nome do cenário">
          <input className={entrada} value={nome} maxLength={NOME_MAXIMO + 20} onChange={(e) => setNome(e.target.value)} aria-invalid={!!erroNome} aria-describedby="erro-nome-cenario" autoFocus data-testid="campo-nome-cenario" />
          {erroNome && <span id="erro-nome-cenario" role="alert" className="text-xs text-[var(--text-danger)]">{erroNome}</span>}
        </Campo>
        <Campo rotulo="Observação (opcional)">
          <textarea className={`${entrada} h-28 py-2`} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Por que este cenário? O que foi combinado? Aparece no parecer." data-testid="campo-observacao-cenario" />
          <span className={`flex justify-between text-xs ${erroObs ? "text-[var(--text-danger)]" : "text-[var(--text-secondary)]"}`}>
            <span>{erroObs ?? "Entra no parecer, separada do texto automático."}</span>
            <span aria-live="polite">{contagemDaObservacao(observacao)}</span>
          </span>
        </Campo>
        {erroDoServidor && <Aviso>{erroDoServidor}</Aviso>}
        <div className="flex justify-end gap-3">
          <Botao tipo="secundario" type="button" onClick={onFechar} disabled={salvando}>Cancelar</Botao>
          <Botao type="submit" disabled={salvando || !!erroObs}>{salvando ? "Salvando…" : "Salvar cenário"}</Botao>
        </div>
      </form>
    </Modal>
  );
}
