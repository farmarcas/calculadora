// Ícones da casca (Lucide, traço de 2 px). Decorativos: o nome acessível está no botão ou no item.
const Base = ({ tamanho = 22, children, ...p }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...p}>
    {children}
  </svg>
);

export const IconeLoja = (p) => (
  <Base {...p}>
    <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" />
    <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244" />
    <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" />
  </Base>
);
export const IconeCalendario = (p) => (
  <Base {...p}>
    <path d="M8 2v4M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </Base>
);
export const IconePrancheta = (p) => (
  <Base {...p}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </Base>
);
export const IconePlay = (p) => (
  <Base {...p}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </Base>
);
export const IconeGrupo = (p) => (
  <Base {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Base>
);
export const IconeParametros = (p) => (
  <Base {...p}>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4" />
  </Base>
);
export const IconeEnvio = (p) => (
  <Base {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Base>
);
export const IconeMenu = (p) => (
  <Base {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Base>
);
// Menu aberto: o botão que recolhe (painel com a seta para dentro, "panel-right-open" do Lucide).
export const IconeRecolherMenu = (p) => (
  <Base {...p}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M15 3v18" />
    <path d="m10 15-3-3 3-3" />
  </Base>
);
export const IconeSeta = ({ aberta = false, ...p }) => (
  <Base {...p} style={{ transform: aberta ? "rotate(180deg)" : undefined, transition: "transform 150ms" }}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);
export const ICONES = { loja: IconeLoja, calendario: IconeCalendario, prancheta: IconePrancheta, play: IconePlay, grupo: IconeGrupo, parametros: IconeParametros };
