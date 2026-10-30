import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Ficha, Modal, Toast } from "../../components/ui/index.jsx";
import ImportarPlanilha from "../cadastros/ImportarPlanilha.jsx";
import { formularioDe, formularioVazio, funcionarioParaApi, mascararCpf, resumoDeDias } from "./equipe.js";
import FormFuncionario from "./FormFuncionario.jsx";

const VISIVEIS = 6;
const COLUNAS = "minmax(150px,1.5fr) 120px 100px 70px 100px 80px 110px";

// Equipe da loja: cada ação (salvar, editar, remover) grava na hora, com aviso e, na remoção, "Desfazer".
export default function AbaEquipe({ lojaId, podeEscrever, aoMudar }) {
  const [lista, setLista] = useState(null);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState("");
  const [todos, setTodos] = useState(false);
  const [form, setForm] = useState(null); // { id?, inicial }
  const [salvando, setSalvando] = useState(false);
  const [remover, setRemover] = useState(null);
  const [toast, setToast] = useState(null);
  const [erro, setErro] = useState(null);
  const [importando, setImportando] = useState(false);
  const timer = useRef(null);

  const carregar = useCallback(async () => {
    try {
      const q = new URLSearchParams({ lojaId, pageSize: "100", ...(busca.trim() ? { busca: busca.trim() } : {}) });
      const r = await api(`/funcionarios?${q}`);
      setLista(r.data);
      setTotal(r.meta.total);
    } catch (e) {
      setErro(e.message);
    }
  }, [lojaId, busca]);
  useEffect(() => {
    const t = setTimeout(carregar, 250);
    return () => clearTimeout(t);
  }, [carregar]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const avisar = (mensagem, acao) => {
    clearTimeout(timer.current);
    setToast({ mensagem, acao });
    timer.current = setTimeout(() => setToast(null), 7000);
  };
  const aposMudar = async () => { await carregar(); aoMudar?.(); };

  const salvar = async (v) => {
    setErro(null);
    setSalvando(true);
    try {
      await api(form.id ? `/funcionarios/${form.id}` : "/funcionarios", { method: form.id ? "PATCH" : "POST", body: funcionarioParaApi(v, lojaId, !form.id) });
      setForm(null);
      avisar("Funcionário salvo");
      await aposMudar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRemocao = async () => {
    const f = remover;
    setRemover(null);
    try {
      await api(`/funcionarios/${f.id}`, { method: "DELETE" });
      avisar("Funcionário removido", {
        rotulo: "Desfazer",
        fn: async () => {
          try {
            // Desfazer recria o funcionário com os mesmos dados (a remoção é lógica, o histórico segue guardado).
            await api("/funcionarios", { method: "POST", body: funcionarioParaApi({ ...formularioDe(f), matricula: f.matricula }, lojaId, false) });
            avisar("Remoção desfeita");
            await aposMudar();
          } catch (e) {
            setErro(`Não foi possível desfazer: ${e.message}`);
          }
        },
      });
      await aposMudar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const mostradas = lista ? (todos || busca ? lista : lista.slice(0, VISIVEIS)) : [];
  return (
    <section aria-label="Equipe da loja" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-bold text-[var(--text-strong)]">Equipe da loja {lista ? `(${total})` : ""}</h3>
          <p className="m-0 text-xs text-[var(--text-secondary)]">Os funcionários são salvos na hora.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="Buscar na equipe" placeholder="Buscar por nome ou cargo" value={busca} onChange={(e) => setBusca(e.target.value)} className="h-10 w-56 rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm" />
          {podeEscrever && <Botao tipo="secundario" onClick={() => setImportando(true)}>Importar equipe</Botao>}
          {podeEscrever && !form && <Botao onClick={() => setForm({ inicial: formularioVazio() })}>Adicionar funcionário</Botao>}
        </div>
      </div>
      {erro && <Aviso>{erro}</Aviso>}

      {form && <FormFuncionario key={form.id ?? "novo"} inicial={form.inicial} editando={!!form.id} salvando={salvando} onSalvar={salvar} onCancelar={() => { setForm(null); setErro(null); }} />}

      {lista && lista.length === 0 && <p className="m-0 text-sm text-[var(--text-secondary)]">{busca ? "Ninguém encontrado." : "Nenhum funcionário cadastrado nesta loja."}</p>}
      {lista && lista.length > 0 && (
        <div className="overflow-hidden rounded-card border border-[var(--border-subtle)]">
          <div className="cl-eq-cab bg-[var(--surface-subtle)] px-4 py-3 text-xs font-bold uppercase text-[var(--text-strong)]" style={{ "--eq-cols": COLUNAS }}>
            <span>Nome</span><span>Cargo</span><span>CPF</span><span>Carga mensal</span><span>Entrada–saída</span><span>Dias</span><span />
          </div>
          {mostradas.map((f) => (
            <div key={f.id} className="cl-eq-linha border-t border-[var(--border-subtle)] px-4 py-3" style={{ "--eq-cols": COLUNAS }}>
              <div className="min-w-0 text-sm font-bold text-[var(--text-strong)]">
                {f.nome}
                {!f.funcaoEscala && <span className="ml-2 align-middle" title="Não entra no cálculo da escala"><Ficha tom="atencao">Fora do cálculo</Ficha></span>}
              </div>
              <span className="text-sm text-[var(--text-strong)]"><span className="cl-eq-rot">Cargo</span>{f.cargo || f.funcaoEscala || "—"}</span>
              <span className="text-sm text-[var(--text-strong)]"><span className="cl-eq-rot">CPF</span>{mascararCpf(f.cpf)}</span>
              <span className="text-sm text-[var(--text-strong)]"><span className="cl-eq-rot">Carga mensal</span>{f.cargaMensalH ? `${f.cargaMensalH}h` : "—"}</span>
              <span className="text-sm text-[var(--text-strong)]"><span className="cl-eq-rot">Entrada–saída</span>{f.entrada && f.saida ? `${f.entrada}–${f.saida}` : "—"}</span>
              <span className="text-sm text-[var(--text-strong)]"><span className="cl-eq-rot">Dias</span>{resumoDeDias(f.dias)}</span>
              <span className="flex items-center justify-end gap-3 text-sm">
                {podeEscrever && (
                  <>
                    <button type="button" className="border-0 bg-transparent p-0 font-bold text-[var(--text-link)] cursor-pointer" aria-label={`Editar ${f.nome}`} onClick={() => setForm({ id: f.id, inicial: formularioDe(f) })}>Editar</button>
                    <button type="button" className="border-0 bg-transparent p-0 font-bold text-[var(--text-strong)] underline cursor-pointer" aria-label={`Remover ${f.nome}`} onClick={() => setRemover(f)}>Remover</button>
                  </>
                )}
              </span>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--text-secondary)]">
            <span aria-live="polite">Mostrando {mostradas.length} de {total} funcionários</span>
            {!busca && lista.length > VISIVEIS && <button type="button" className="border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={() => setTodos(!todos)}>{todos ? "Ver menos" : "Ver todos"}</button>}
          </div>
        </div>
      )}
      {total > 100 && <p className="m-0 text-xs text-[var(--text-secondary)]">A lista traz até 100 pessoas. Use a busca para achar as outras.</p>}

      {remover && (
        <Modal titulo="Remover funcionário" onClose={() => setRemover(null)}>
          <p className="m-0 text-sm text-[var(--text-strong)]">Remover <strong>{remover.nome}</strong>? Ele sai do cálculo da escala desta loja.</p>
          <div className="mt-6 flex justify-end gap-2">
            <Botao tipo="secundario" onClick={() => setRemover(null)}>Manter</Botao>
            <Botao tipo="perigo" onClick={confirmarRemocao}>Remover funcionário</Botao>
          </div>
        </Modal>
      )}
      {importando && <ImportarPlanilha podeLojas={false} operador={false} onClose={() => setImportando(false)} onConcluido={aposMudar} />}
      {toast && <Toast mensagem={toast.mensagem} acao={toast.acao} onFechar={() => setToast(null)} />}
    </section>
  );
}
