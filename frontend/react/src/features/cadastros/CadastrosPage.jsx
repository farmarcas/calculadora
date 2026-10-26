import { useCallback, useEffect, useState } from "react";
import { api, baixarModelo } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha } from "../../components/ui/index.jsx";
import FormLoja from "./FormLoja.jsx";
import FormFuncionario from "./FormFuncionario.jsx";
import ImportarPlanilha from "./ImportarPlanilha.jsx";

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3";
const TD = "px-6 py-3 border-t border-line";

const horarioTxt = (h) => (h?.semana ? `${h.semana.abre}–${h.semana.fecha}` : "—");

export default function CadastrosPage({ perfil }) {
  const podeEscrever = perfil !== "SCHEDULE_VIEWER";
  const [aba, setAba] = useState("lojas");
  const [lojas, setLojas] = useState({ data: [], meta: { total: 0 } });
  const [funcs, setFuncs] = useState({ data: [], meta: { total: 0 } });
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState(null);
  const [form, setForm] = useState(null); // { tipo, registro }
  const [importando, setImportando] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const q = new URLSearchParams({ pageSize: "100", ...(busca ? { busca } : {}) });
      const [l, f] = await Promise.all([api(`/lojas?${q}`), api(`/funcionarios?${q}`)]);
      setLojas(l);
      setFuncs(f);
    } catch (e) {
      setErro(e.message);
    }
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(carregar, 250);
    return () => clearTimeout(t);
  }, [carregar]);

  const nomeLoja = (id) => lojas.data.find((l) => l.id === id);

  const remover = async (tipo, r) => {
    if (!window.confirm(`Remover ${r.nome}?`)) return;
    try {
      await api(`/${tipo}/${r.id}`, { method: "DELETE" });
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const vazio = lojas.meta.total === 0 && funcs.meta.total === 0 && !busca;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">Cadastros</h1>
          <p className="mt-1 mb-0 text-sm text-ink-500">Lojas e funcionários que alimentam a Escala. O jeito mais rápido é por planilha.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao tipo="secundario" onClick={baixarModelo}>Baixar planilha modelo</Botao>
          {podeEscrever && <Botao onClick={() => setImportando(true)}>Importar planilha</Botao>}
        </div>
      </div>

      {perfil === "SCHEDULE_VIEWER" && <Aviso tom="neutro">Você está como "Somente consulta": não pode criar, editar nem importar.</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}

      {vazio && (
        <Cartao>
          <div className="p-10 text-center">
            <p className="m-0 text-base font-medium">Nada cadastrado ainda</p>
            <p className="mt-2 mb-4 text-sm text-ink-500">Baixe a planilha modelo, preencha com as lojas e os funcionários e importe aqui.</p>
          </div>
        </Cartao>
      )}

      <Cartao
        titulo={aba === "lojas" ? `Lojas (${lojas.meta.total})` : `Funcionários (${funcs.meta.total})`}
        subtitulo="Dados fictícios enquanto o parecer de proteção de dados não existir"
        acoes={
          <>
            <input
              aria-label="Buscar"
              placeholder="Buscar por nome ou código"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 w-64 rounded-input border border-ink-300 px-3 text-sm"
            />
            {podeEscrever && (
              <Botao tipo="secundario" onClick={() => setForm({ tipo: aba === "lojas" ? "loja" : "funcionario", registro: null })}>
                {aba === "lojas" ? "Nova loja" : "Novo funcionário"}
              </Botao>
            )}
          </>
        }
      >
        <div className="flex gap-6 px-6 border-b border-line" role="tablist">
          {[["lojas", "Lojas"], ["funcionarios", "Funcionários"]].map(([id, r]) => (
            <button
              key={id}
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className={`py-3 text-sm font-medium ${aba === id ? "text-ink-900" : "text-ink-500"}`}
              style={{ boxShadow: aba === id ? "inset 0 -2px 0 0 #006FF7" : "none" }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          {aba === "lojas" ? (
            <table className="w-full border-collapse text-sm">
              <thead><tr><th className={TH}>Código</th><th className={TH}>Nome</th><th className={TH}>UF</th><th className={TH}>Seg a sex</th><th className={TH}>Funcionários</th><th className={TH} /></tr></thead>
              <tbody>
                {lojas.data.map((l) => (
                  <tr key={l.id}>
                    <td className={TD}>{l.codigo}</td>
                    <td className={TD}>{l.nome}</td>
                    <td className={TD}>{l.uf || "—"}</td>
                    <td className={TD}>{horarioTxt(l.horarios)}</td>
                    <td className={TD}>{funcs.data.filter((f) => f.lojaId === l.id).length}</td>
                    <td className={`${TD} text-right`}>
                      {podeEscrever && (
                        <>
                          <Botao tipo="texto" onClick={() => setForm({ tipo: "loja", registro: l })}>Editar</Botao>
                          <Botao tipo="texto" onClick={() => remover("lojas", l)}>Remover</Botao>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {lojas.data.length === 0 && <tr><td className={`${TD} text-ink-500`} colSpan={6}>Nenhuma loja.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead><tr><th className={TH}>Matrícula</th><th className={TH}>Nome</th><th className={TH}>Loja</th><th className={TH}>Cargo</th><th className={TH}>Função de escala</th><th className={TH}>Carga</th><th className={TH} /></tr></thead>
              <tbody>
                {funcs.data.map((f) => (
                  <tr key={f.id}>
                    <td className={TD}>{f.matricula}</td>
                    <td className={TD}>{f.nome}</td>
                    <td className={TD}>{nomeLoja(f.lojaId)?.codigo ?? "—"}</td>
                    <td className={TD}>{f.cargo || "—"}</td>
                    <td className={TD}>{f.funcaoEscala ? <Ficha tom="ok">{f.funcaoEscala}</Ficha> : <Ficha tom="atencao">Fora do cálculo</Ficha>}</td>
                    <td className={TD}>{f.cargaSemanalH ? `${f.cargaSemanalH}h` : "—"}</td>
                    <td className={`${TD} text-right`}>
                      {podeEscrever && (
                        <>
                          <Botao tipo="texto" onClick={() => setForm({ tipo: "funcionario", registro: f })}>Editar</Botao>
                          <Botao tipo="texto" onClick={() => remover("funcionarios", f)}>Remover</Botao>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {funcs.data.length === 0 && <tr><td className={`${TD} text-ink-500`} colSpan={7}>Nenhum funcionário.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </Cartao>

      {form?.tipo === "loja" && <FormLoja registro={form.registro} onClose={() => setForm(null)} onSalvo={() => { setForm(null); carregar(); }} />}
      {form?.tipo === "funcionario" && <FormFuncionario registro={form.registro} lojas={lojas.data} onClose={() => setForm(null)} onSalvo={() => { setForm(null); carregar(); }} />}
      {importando && <ImportarPlanilha onClose={() => setImportando(false)} onConcluido={carregar} />}
    </>
  );
}
