import { useCallback, useEffect, useState } from "react";
import { api, getGe, getPerfil, setGe, setPerfil } from "./api/client.js";
import { PERFIS, ehOperador } from "./api/perfis.js";
import CadastrosPage from "./features/cadastros/CadastrosPage.jsx";
import EscalaPage from "./features/diagnostico/EscalaPage.jsx";
import GruposPage from "./features/ge/GruposPage.jsx";

const MENU = [
  { id: "grupos", rotulo: "Grupos", soOperador: true },
  { id: "cadastros", rotulo: "Cadastros" },
  { id: "escala", rotulo: "Escala" },
];

export default function App() {
  const [perfil, setP] = useState(getPerfil());
  const [ge, setG] = useState(getGe());
  const [ges, setGes] = useState([]);
  // Em tela estreita (celular) o menu começa recolhido.
  const [aberto, setAberto] = useState(() => window.innerWidth >= 768);
  const [tela, setTela] = useState("cadastros");

  // Ao estreitar a janela (ou girar o celular) o menu recolhe sozinho; ao alargar, abre.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const ajustar = (e) => setAberto(e.matches);
    mq.addEventListener("change", ajustar);
    return () => mq.removeEventListener("change", ajustar);
  }, []);

  // Sem login (o SSO virá depois): o papel e o grupo são escolhidos aqui, só para demonstração.
  const carregarGes = useCallback(async () => {
    try {
      const lista = (await api("/ge")).data;
      setGes(lista);
      // Grupo guardado que não existe mais ou foi desativado: cai no primeiro da lista.
      if (lista.length && !lista.some((g) => g.id === getGe())) escolherGe(lista[0].id);
    } catch {
      setGes([]);
    }
  }, []);
  useEffect(() => { carregarGes(); }, [carregarGes]);

  const escolherGe = (id) => {
    setGe(id);
    setG(id);
  };
  const trocar = (p) => {
    setPerfil(p);
    setP(p);
    // Só o operador vê "Grupos".
    if (!ehOperador(p) && tela === "grupos") setTela("cadastros");
  };

  const menu = MENU.filter((m) => !m.soOperador || ehOperador(perfil));
  const atual = menu.find((m) => m.id === tela) ?? menu[0];
  const geAtual = ges.find((g) => g.id === ge);

  return (
    <div className="flex min-h-screen">
      <nav className={`${aberto ? "w-56" : "w-[72px]"} shrink-0 bg-white border-r border-line transition-all`} aria-label="Menu">
        <div className="h-16 flex items-center justify-between px-4 border-b border-line">
          {aberto && <strong className="text-system-700">Suíte</strong>}
          <button aria-label="Recolher menu" onClick={() => setAberto(!aberto)} className="text-ink-500">☰</button>
        </div>
        <ul className="list-none m-0 p-2 flex flex-col gap-1">
          {menu.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => setTela(m.id)}
                aria-current={atual.id === m.id ? "page" : undefined}
                className={`w-full text-left rounded-btn px-3 h-9 flex items-center text-sm ${
                  atual.id === m.id ? "bg-system-200 text-ink-900 font-medium" : "text-ink-700 hover:bg-surface-subtle"
                }`}
              >
                <span title={m.rotulo}>{aberto ? m.rotulo : m.rotulo[0]}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-line flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 sm:px-6 py-3 min-h-16">
          <span className="text-ink-500 text-sm">
            Escala · {atual.rotulo}
            {geAtual && atual.id !== "grupos" && <strong className="ml-2 text-ink-900" data-testid="ge-atual">· {geAtual.nome}</strong>}
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-ink-500">
              {ehOperador(perfil) ? "Grupo aberto" : "Grupo (demonstração)"}
              <select
                aria-label="Grupo"
                value={ge}
                onChange={(e) => escolherGe(e.target.value)}
                className="h-9 max-w-56 rounded-input border border-ink-300 bg-white px-2 text-sm text-ink-900"
              >
                {ges.map((g) => (
                  <option key={g.id} value={g.id}>{g.nome} ({g.identificacao})</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-ink-500">
              Papel de demonstração
              <select
                aria-label="Papel de demonstração"
                value={perfil}
                onChange={(e) => trocar(e.target.value)}
                className="h-9 rounded-input border border-ink-300 bg-white px-2 text-sm text-ink-900"
              >
                {Object.entries(PERFIS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <main className="p-4 sm:p-6 flex flex-col gap-6">
          {atual.id === "grupos" && <GruposPage geAtual={ge} onAbrir={(id) => { escolherGe(id); setTela("cadastros"); }} onMudou={carregarGes} />}
          {/* Trocar de grupo recarrega a tela inteira: nada do grupo anterior fica. */}
          {atual.id === "cadastros" && <CadastrosPage key={ge} perfil={perfil} />}
          {atual.id === "escala" && <EscalaPage key={ge} perfil={perfil} onIrCadastros={() => setTela("cadastros")} />}
        </main>
      </div>
    </div>
  );
}
