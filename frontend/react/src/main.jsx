import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AvisoProvider } from "./shell/AvisoGlobal.jsx";

createRoot(document.getElementById("root")).render(<AvisoProvider><App /></AvisoProvider>);
