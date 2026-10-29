import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Ficha, Modal, entrada } from "../../components/ui/index.jsx";

const confianca = (c) => (c >= 0.85 ? ["ok", "entendi bem"] : c > 0 ? ["atencao", "confira"] : ["erro", "não entendi"]);

function Mapa({ titulo, parte, abas, campos, sugestoes, valor, onChange }) {
  const aba = abas.find((a) => a.nome === valor?.aba);
  const sug = (chave) => sugestoes.find((s) => s.campo === chave);
  return (
    <section className="border border-line rounded-card">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
        <h3 className="m-0 text-sm font-medium">{titulo}</h3>
        <select
          aria-label={`Aba de ${titulo}`}
          className={entrada}
          value={valor?.aba ?? ""}
          onChange={(e) => onChange(e.target.value ? { aba: e.target.value, colunas: {} } : null)}
        >
          <option value="">Não importar</option>
          {abas.map((a) => <option key={a.nome} value={a.nome}>{a.nome} ({a.total} linhas)</option>)}
        </select>
      </header>
      {aba && (
        <table className="w-full text-sm border-collapse">
          <tbody>
            {campos.filter((c) => !c.legado || valor.colunas[c.chave] != null).map((c) => {
              const atual = valor.colunas[c.chave] ?? null;
              const s = sug(c.chave);
              const [tom, texto] = atual !== null && s?.coluna === atual ? confianca(s.confianca) : atual !== null ? ["atencao", "escolhido por você"] : [c.obrigatorio ? "erro" : "neutro", c.obrigatorio ? "falta indicar" : "opcional"];
              return (
                <tr key={c.chave} className="border-t border-line first:border-0">
                  <td className="px-4 py-2 w-1/3">{c.rotulo}{c.obrigatorio && " *"}</td>
                  <td className="px-2 py-2">
                    <select
                      aria-label={c.rotulo}
                      className={`${entrada} w-full`}
                      value={atual ?? ""}
                      onChange={(e) => onChange({ ...valor, colunas: { ...valor.colunas, [c.chave]: e.target.value === "" ? null : Number(e.target.value) } })}
                    >
                      <option value="">— nenhuma —</option>
                      {aba.cabecalhos.map((h, i) => <option key={i} value={i}>{h || `(coluna ${i + 1})`}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 w-40"><Ficha tom={tom}>{texto}</Ficha></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function ImportarPlanilha({ onClose, onConcluido, podeLojas = false }) {
  const [prev, setPrev] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro(null);
    setOcupado(true);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      const r = await api("/importacoes/cadastro", { method: "POST", form });
      setPrev(r);
      setMapa(r.mapeamento);
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
    }
  };

  const confirmar = async () => {
    setErro(null);
    setOcupado(true);
    try {
      setResumo(await api(`/importacoes/cadastro/${prev.id}/confirmar`, { method: "POST", body: { mapeamento: mapa } }));
      onConcluido();
    } catch (err) {
      setErro(err.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Modal titulo="Importar planilha" onClose={onClose} largo>
      <div className="flex flex-col gap-4">
        {erro && <Aviso>{erro}</Aviso>}

        {!prev && (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm text-ink-700">Envie a planilha preenchida (.xlsx ou .csv). Se ela não seguir o modelo, o sistema tenta entender sozinho e mostra o que entendeu antes de gravar.</p>
            <input type="file" accept=".xlsx,.csv" onChange={enviar} disabled={ocupado} aria-label="Arquivo da planilha" />
          </div>
        )}

        {prev && !resumo && (
          <>
            <Aviso tom="neutro">Arquivo <strong>{prev.arquivo}</strong>. Confira o que o sistema entendeu e ajuste se precisar. Nada foi gravado ainda.</Aviso>
            {/* As lojas vêm da plataforma: quem cuida de um grupo importa só a equipe. */}
            {podeLojas && <Mapa titulo="Lojas" abas={prev.abas} campos={prev.campos.lojas} sugestoes={prev.sugestoes.lojas} valor={mapa.lojas} onChange={(v) => setMapa({ ...mapa, lojas: v })} />}
            <Mapa titulo="Funcionários" abas={prev.abas} campos={prev.campos.funcionarios} sugestoes={prev.sugestoes.funcionarios} valor={mapa.funcionarios} onChange={(v) => setMapa({ ...mapa, funcionarios: v })} />
            <div className="flex justify-end gap-2">
              <Botao tipo="texto" onClick={onClose}>Cancelar</Botao>
              <Botao onClick={confirmar} disabled={ocupado}>Confirmar e gravar</Botao>
            </div>
          </>
        )}

        {resumo && (
          <>
            <Aviso tom="ok">
              Lojas: {resumo.lojas.novos} novas, {resumo.lojas.atualizados} atualizadas. Funcionários: {resumo.funcionarios.novos} novos, {resumo.funcionarios.atualizados} atualizados.
            </Aviso>
            {resumo.erros.length > 0 && (
              <div>
                <p className="m-0 mb-2 text-sm font-medium">{resumo.erros.length} linha(s) não entraram:</p>
                <ul className="m-0 pl-5 text-sm text-ink-700">
                  {resumo.erros.map((e, i) => <li key={i}>{e.aba}{e.linha ? `, linha ${e.linha}` : ""}: {e.motivo}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end"><Botao onClick={onClose}>Fechar</Botao></div>
          </>
        )}
      </div>
    </Modal>
  );
}
