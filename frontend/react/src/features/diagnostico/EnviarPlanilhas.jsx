import { useState } from "react";
import { api, baixarArquivo } from "../../api/client.js";
import { Aviso, Botao, Ficha, Modal } from "../../components/ui/index.jsx";

function Bloco({ titulo, descricao, caminho, modelo, nomeModelo, onConcluido }) {
  const [res, setRes] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro(null);
    setRes(null);
    setOcupado(true);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      setRes(await api(caminho, { method: "POST", form }));
      onConcluido();
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
      e.target.value = "";
    }
  };

  return (
    <section className="border border-line rounded-card p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="m-0 text-sm font-medium">{titulo}</h3>
          <p className="mt-1 mb-0 text-xs text-ink-500">{descricao}</p>
        </div>
        <Botao tipo="secundario" onClick={() => baixarArquivo(modelo, nomeModelo)}>Baixar modelo</Botao>
      </div>
      <input type="file" accept=".xlsx,.csv" onChange={enviar} disabled={ocupado} aria-label={`Arquivo: ${titulo}`} />
      {ocupado && <p className="m-0 text-sm text-ink-500">Lendo a planilha…</p>}
      {erro && <Aviso>{erro}</Aviso>}
      {res && (
        <div className="flex flex-col gap-3">
          <details>
            <summary className="cursor-pointer text-sm text-system-700">O que o sistema entendeu das colunas</summary>
            <ul className="mt-2 mb-0 pl-5 text-sm text-ink-700">
              {res.entendi.map((e) => (
                <li key={e.campo}>{e.campo}: {e.coluna ? <strong>{e.coluna}</strong> : <em>não encontrada</em>}</li>
              ))}
            </ul>
          </details>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-500"><th className="py-1">Loja</th><th>Aceitas</th><th>Rejeitadas</th><th>Situação</th></tr>
            </thead>
            <tbody>
              {res.lojas.map((l) => (
                <tr key={l.codigo} className="border-t border-line">
                  <td className="py-2">{l.codigo}{l.nome ? ` · ${l.nome}` : ""}</td>
                  <td>{l.aceitas}</td>
                  <td>{l.rejeitadas}</td>
                  <td><Ficha tom={l.situacao === "Importada" ? "ok" : "erro"}>{l.situacao}</Ficha></td>
                </tr>
              ))}
            </tbody>
          </table>
          {res.totalErros > 0 && (
            <div>
              <p className="m-0 mb-1 text-sm font-medium">{res.totalErros} linha(s) não entraram:</p>
              <ul className="m-0 pl-5 text-sm text-ink-700">
                {res.erros.slice(0, 20).map((e, i) => <li key={i}>Linha {e.linha}{e.loja ? ` (loja ${e.loja})` : ""}: {e.motivo}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function EnviarPlanilhas({ onClose, onConcluido }) {
  return (
    <Modal titulo="Enviar planilhas" onClose={onClose} largo>
      <div className="flex flex-col gap-4">
        <Aviso tom="neutro">Pode vir mais de uma loja no mesmo arquivo: cada linha vai para a loja do código informado. Uma nova planilha da mesma loja substitui a anterior, que fica no histórico.</Aviso>
        <Bloco
          titulo="Escala atual"
          descricao="Uma linha por colaborador, com dias de trabalho, entrada, intervalo e saída."
          caminho="/cargas/escala"
          modelo="/planilha-modelo-escala"
          nomeModelo="modelo-escala-atual.xlsx"
          onConcluido={onConcluido}
        />
        <Bloco
          titulo="Base comercial"
          descricao="Opcional. Vendas por data e hora: mostra os horários de maior movimento e deixa a estimativa dos cenários mais precisa. Sem ela, o Diagnóstico usa o faturamento cadastrado na loja."
          caminho="/cargas/base"
          modelo="/planilha-modelo-base"
          nomeModelo="modelo-base-comercial.xlsx"
          onConcluido={onConcluido}
        />
        <div className="flex justify-end"><Botao onClick={onClose}>Fechar</Botao></div>
      </div>
    </Modal>
  );
}
