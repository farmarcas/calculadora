import { useCallback, useEffect, useState } from "react";
import { api, baixarModelo } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha } from "../../components/ui/index.jsx";
import FormLoja from "./FormLoja.jsx";
import ImportarPlanilha from "./ImportarPlanilha.jsx";
import ParametrosLegais from "../parametros/ParametrosLegais.jsx";
import { cuidaDoGrupo, editaLoja, ehOperador, formatarCnpj } from "../../api/perfis.js";

const SECOES = [["cadastro", "Lojas"], ["parametros", "Parâmetros legais"]];

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3";
const TD = "px-6 py-3 border-t border-line";


export default function CadastrosPage({ perfil }) {
  // A loja vem da plataforma (o operador cria e remove); o empresário corrige a loja e cuida da equipe.
  const operador = ehOperador(perfil);
  const podeEscrever = cuidaDoGrupo(perfil);
  const podeEditarLoja = editaLoja(perfil);
  const [secao, setSecao] = useState("cadastro");
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

  const remover = async (tipo, r) => {
    if (!window.confirm(`Remover ${r.nome}?`)) return;
    try {
      await api(`/${tipo}/${r.id}`, { method: "DELETE" });
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const vazio = lojas.meta.total === 0 && !busca;

  // Editar (ou criar) a loja abre a página inteira, com a equipe dentro dela; "Voltar" leva de volta à lista.
  if (form?.tipo === "loja")
    return <FormLoja registro={form.registro} perfil={perfil} onClose={() => setForm(null)} onSalvo={() => { setForm(null); carregar(); }} />;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">Cadastros</h1>
          <p className="mt-1 mb-0 text-sm text-ink-500">Tudo o que a Escala precisa para simular: as lojas do seu grupo (carregadas pela plataforma, você corrige o que precisar), a equipe de cada uma, a configuração e as regras legais.</p>
        </div>
        {secao === "cadastro" && (
          <div className="flex flex-wrap gap-2">
            <Botao tipo="secundario" onClick={baixarModelo}>Baixar planilha modelo</Botao>
            {(podeEscrever || operador) && <Botao onClick={() => setImportando(true)}>{operador ? "Importar planilha" : "Importar equipe por planilha"}</Botao>}
          </div>
        )}
      </div>

      {perfil === "SCHEDULE_VIEWER" && <Aviso tom="neutro">Você está como "Somente consulta": não pode criar, editar nem importar.</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}

      <div className="flex gap-6 border-b border-line" role="tablist" aria-label="Seções do cadastro">
        {SECOES.map(([id, r]) => (
          <button
            key={id}
            role="tab"
            aria-selected={secao === id}
            onClick={() => setSecao(id)}
            className={`py-3 text-sm font-medium ${secao === id ? "text-ink-900" : "text-ink-500"}`}
            style={{ boxShadow: secao === id ? "inset 0 -2px 0 0 #006FF7" : "none" }}
          >
            {r}
          </button>
        ))}
      </div>

      {secao === "parametros" && <ParametrosLegais perfil={perfil} />}

      {secao === "cadastro" && (<>
      {vazio && (
        <Cartao>
          <div className="p-10 text-center">
            <p className="m-0 text-base font-medium">Nada cadastrado ainda</p>
            <p className="mt-2 mb-4 text-sm text-ink-500">{operador ? "Carregue as lojas deste grupo na tela Grupos (Excel da plataforma)." : "As lojas deste grupo ainda não foram carregadas pela plataforma. Quando estiverem aqui, você cadastra a equipe de cada uma."}</p>
          </div>
        </Cartao>
      )}

      <Cartao
        titulo={`Lojas (${lojas.meta.total})`}
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
            {operador && <Botao tipo="secundario" onClick={() => setForm({ tipo: "loja", registro: null })}>Nova loja</Botao>}
          </>
        }
      >
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr><th className={TH}>Código</th><th className={TH}>Nome</th><th className={TH}>CNPJ</th><th className={TH}>UF</th><th className={TH}>Funcionamento</th><th className={TH}>Funcionários</th><th className={TH} /></tr></thead>
              <tbody>
                {lojas.data.map((l) => (
                  <tr key={l.id}>
                    <td className={TD}>{l.codigo}</td>
                    <td className={TD}>{l.nome}</td>
                    <td className={TD}>{l.cnpj ? formatarCnpj(l.cnpj) : <Ficha tom="atencao">CNPJ pendente</Ficha>}</td>
                    <td className={TD}>{l.uf || "—"}</td>
                    <td className={TD}>{l.horariosResumo ?? "—"}</td>
                    <td className={TD}>{funcs.data.filter((f) => f.lojaId === l.id).length}</td>
                    <td className={`${TD} text-right`}>
                      {podeEditarLoja && <Botao tipo="texto" onClick={() => setForm({ tipo: "loja", registro: l })}>Editar</Botao>}
                      {operador && <Botao tipo="texto" onClick={() => remover("lojas", l)}>Remover</Botao>}
                    </td>
                  </tr>
                ))}
                {lojas.data.length === 0 && <tr><td className={`${TD} text-ink-500`} colSpan={7}>Nenhuma loja.</td></tr>}
              </tbody>
            </table>
        </div>
      </Cartao>
      </>)}

      {importando && <ImportarPlanilha podeLojas={operador} onClose={() => setImportando(false)} onConcluido={carregar} />}
    </>
  );
}
