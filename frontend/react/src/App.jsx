import { useState } from "react";
import { getPerfil, setPerfil } from "./api/client.js";
import CadastrosPage from "./features/cadastros/CadastrosPage.jsx";
import EscalaPage from "./features/diagnostico/EscalaPage.jsx";

const PERFIS = {
  TENANT_ADMIN: "Dono do grupo",
  SCHEDULE_MANAGER: "Gestor de escala",
  SCHEDULE_VIEWER: "Somente consulta",
};

const MENU = [
  { id: "cadastros", rotulo: "Cadastros" },
  { id: "escala", rotulo: "Escala" },
];

export default function App() {
  const [perfil, setP] = useState(getPerfil());
  const [aberto, setAberto] = useState(true);
  const [tela, setTela] = useState("cadastros");

  const trocar = (p) => {
    setPerfil(p);
    setP(p);
  };

  return (
    <div className="flex min-h-screen">
      <nav className={`${aberto ? "w-56" : "w-[72px]"} shrink-0 bg-white border-r border-line transition-all`} aria-label="Menu">
        <div className="h-16 flex items-center justify-between px-4 border-b border-line">
          {aberto && <strong className="text-system-700">Suíte</strong>}
          <button aria-label="Recolher menu" onClick={() => setAberto(!aberto)} className="text-ink-500">☰</button>
        </div>
        <ul className="list-none m-0 p-2 flex flex-col gap-1">
          {MENU.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => setTela(m.id)}
                aria-current={tela === m.id ? "page" : undefined}
                className={`w-full text-left rounded-btn px-3 h-9 flex items-center text-sm ${
                  tela === m.id ? "bg-system-200 text-ink-900 font-medium" : "text-ink-700 hover:bg-surface-subtle"
                }`}
              >
                <span title={m.rotulo}>{aberto ? m.rotulo : m.rotulo[0]}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-line flex items-center justify-between px-6">
          <span className="text-ink-500 text-sm">Escala · {MENU.find((m) => m.id === tela).rotulo}</span>
          <label className="flex items-center gap-2 text-xs text-ink-500">
            Papel de demonstração
            <select
              value={perfil}
              onChange={(e) => trocar(e.target.value)}
              className="h-9 rounded-input border border-ink-300 bg-white px-2 text-sm text-ink-900"
            >
              {Object.entries(PERFIS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </header>
        <main className="p-6 flex flex-col gap-6">
          {tela === "cadastros" && <CadastrosPage perfil={perfil} />}
          {tela === "escala" && <EscalaPage perfil={perfil} />}
        </main>
      </div>
    </div>
  );
}
