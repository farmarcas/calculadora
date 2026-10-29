import { useCallback, useEffect, useState } from "react";
import { api, baixarArquivo } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";
import CargaLojas from "./CargaLojas.jsx";
import GrupoForm from "./GrupoForm.jsx";

const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-6 py-3";
const TD = "px-6 py-3 border-t border-line";
const POR_PAGINA = 50;

// Tela do operador da plataforma: grupos (um por empresário), andamento do cadastro e carga das lojas por Excel.
export default function GruposPage({ geAtual, onAbrir, onMudou }) {
  const [grupos, setGrupos] = useState([]);
  const [busca, setBusca] = useState("");
  const [mostrar, setMostrar] = useState(POR_PAGINA);
  const [erro, setErro] = useState(null);
  const [form, setForm] = useState(null);
  const [carga, setCarga] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setGrupos((await api("/ge/resumo")).data);
    } catch (e) {
      setErro(e.message);
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const depois = () => { carregar(); onMudou(); };
  const alternar = async (g) => {
    if (g.ativo && !window.confirm(`Desativar ${g.nome}? Ninguém mais entra nesse grupo, mas os dados ficam guardados.`)) return;
    try {
      await api(`/ge/${g.id}`, { method: "PATCH", body: { ativo: !g.ativo } });
      depois();
    } catch (e) {
      setErro(e.message);
    }
  };

  const filtrados = grupos.filter((g) => `${g.nome} ${g.identificacao} ${g.responsavel ?? ""}`.toLowerCase().includes(busca.toLowerCase()));
  const totalLojas = grupos.reduce((s, g) => s + g.lojas, 0);
  const totalEquipe = grupos.reduce((s, g) => s + g.lojasComEquipe, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">Grupos econômicos</h1>
          <p className="mt-1 mb-0 text-sm text-ink-500">Um grupo por empresário. Você carrega as lojas por Excel; o empresário cadastra só a equipe.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao tipo="secundario" onClick={() => baixarArquivo("/cargas-lojas/modelo", "modelo-lojas.xlsx")}>Baixar modelo do Excel</Botao>
          <Botao tipo="secundario" onClick={() => setForm({ registro: null })}>Novo grupo</Botao>
          <Botao onClick={() => setCarga(true)}>Enviar Excel de lojas</Botao>
        </div>
      </div>

      {erro && <Aviso>{erro}</Aviso>}

      <Cartao
        titulo={`Grupos (${grupos.length})`}
        subtitulo={`${totalLojas} lojas no total, ${totalEquipe} já com equipe cadastrada · Dados fictícios enquanto o parecer de proteção de dados não existir`}
        acoes={<input aria-label="Buscar grupo" placeholder="Buscar por nome, número ou responsável" value={busca} onChange={(e) => { setBusca(e.target.value); setMostrar(POR_PAGINA); }} className={`${entrada} w-72`} />}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead><tr><th className={TH}>Nº</th><th className={TH}>Grupo</th><th className={TH}>Responsável</th><th className={TH}>Lojas</th><th className={TH}>Com equipe</th><th className={TH}>Situação</th><th className={TH} /></tr></thead>
            <tbody>
              {filtrados.slice(0, mostrar).map((g) => (
                <tr key={g.id}>
                  <td className={TD}>{g.identificacao}</td>
                  <td className={TD}>{g.nome} {g.id === geAtual && <Ficha tom="ok">aberto</Ficha>}</td>
                  <td className={TD}>{g.responsavel || "—"}</td>
                  <td className={TD}>{g.lojas}</td>
                  <td className={TD}>{g.lojasComEquipe}{g.lojas > 0 && <span className="text-ink-500"> de {g.lojas}</span>}</td>
                  <td className={TD}>{g.ativo ? <Ficha tom="ok">Ativo</Ficha> : <Ficha tom="atencao">Desativado</Ficha>}</td>
                  <td className={`${TD} text-right whitespace-nowrap`}>
                    {g.ativo && <Botao tipo="texto" onClick={() => onAbrir(g.id)}>Abrir</Botao>}
                    <Botao tipo="texto" onClick={() => setForm({ registro: g })}>Editar</Botao>
                    <Botao tipo="texto" onClick={() => alternar(g)}>{g.ativo ? "Desativar" : "Reativar"}</Botao>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td className={`${TD} text-ink-500`} colSpan={7}>Nenhum grupo.</td></tr>}
            </tbody>
          </table>
        </div>
        {filtrados.length > mostrar && <div className="p-3 text-center"><Botao tipo="texto" onClick={() => setMostrar(mostrar + POR_PAGINA)}>Mostrar mais ({filtrados.length - mostrar})</Botao></div>}
      </Cartao>

      {form && <GrupoForm registro={form.registro} onClose={() => setForm(null)} onSalvo={() => { setForm(null); depois(); }} />}
      {carga && <CargaLojas onClose={() => setCarga(false)} onConcluido={depois} />}
    </>
  );
}
