import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import PortaoDeLogin from "./auth/PortaoDeLogin.jsx";
import { AvisoProvider } from "./shell/AvisoGlobal.jsx";

createRoot(document.getElementById("root")).render(<AvisoProvider><PortaoDeLogin>{(sessao, sair) => <App sessao={sessao} onSair={sair} />}</PortaoDeLogin></AvisoProvider>);
