import { useCallback, useEffect, useState } from "react";
import { api, esquecerConta, getGe, setGe, usarSessao } from "../api/client.js";
import { Botao } from "../components/ui/index.jsx";
import { confirmarSaida } from "../features/cadastro-loja/guardaSaida.js";
import { CAMINHO_DE_RETORNO, CAMINHO_INICIAL, faseDaFalha, grupoInicial } from "./sessao.js";

const RADAR_URL = import.meta.env.VITE_RADAR_URL;
const VOLTAR_PELO_RADAR = "Volte ao Radar e abra a calculadora pelo menu Aplicações.";

const TELAS = {
  carregando: { titulo: "Conectando…" },
  "sem-sessao": {
    titulo: "Sessão encerrada",
    texto: `O acesso à calculadora é feito pelo Radar. ${VOLTAR_PELO_RADAR}`,
    radar: true,
  },
  saiu: {
    titulo: "Você saiu da calculadora",
    texto: VOLTAR_PELO_RADAR,
    radar: true,
  },
  "login-invalido": {
    titulo: "Não foi possível confirmar o seu login",
    texto: `O link usado venceu ou já foi usado. ${VOLTAR_PELO_RADAR}`,
    radar: true,
  },
  indisponivel: {
    titulo: "Não foi possível falar com o Radar",
    texto: "Tente de novo em alguns instantes.",
  },
  "sem-acesso": {
    titulo: "Sua conta não tem acesso à calculadora",
    texto: "Peça ao dono da sua loja ou ao seu contato na Farmarcas para liberar o acesso no Radar.",
    radar: true,
  },
};

function TelaDeAcesso({ fase, onTentarDeNovo }) {
  const { titulo, texto, radar } = TELAS[fase];
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface-subtle)] p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-card border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 text-center">
        <h1 className="text-base font-bold text-[var(--text-strong)]">{titulo}</h1>
        {texto && <p className="text-sm text-[var(--text-secondary)]">{texto}</p>}
        {radar && <Botao onClick={() => window.location.assign(RADAR_URL)}>Ir para o Radar</Botao>}
        {fase === "indisponivel" && <Botao onClick={onTentarDeNovo}>Tentar de novo</Botao>}
      </div>
    </main>
  );
}

export default function PortaoDeLogin({ children }) {
  const [fase, setFase] = useState("carregando");
  const [sessao, setSessao] = useState(null);

  const perderSessao = useCallback(() => {
    setSessao(null);
    setFase("sem-sessao");
  }, []);

  const entrar = useCallback((dados) => {
    if (dados.sso) {
      usarSessao(perderSessao);
      setGe(grupoInicial(getGe(), dados.grupos));
    }
    setSessao(dados);
    setFase("pronto");
  }, [perderSessao]);

  const abrir = useCallback(async () => {
    try {
      entrar(await api("/auth/sessao"));
    } catch (e) {
      setFase(e.code === "NAO_AUTENTICADO" ? "sem-sessao" : "indisponivel");
    }
  }, [entrar]);

  const voltarDoRadar = useCallback(async () => {
    const code = new URLSearchParams(window.location.search).get("code");
    window.history.replaceState(null, "", CAMINHO_INICIAL);
    if (!code) {
      setFase("login-invalido");
      return;
    }
    try {
      entrar(await api("/auth/sso/exchange", { method: "POST", body: { code } }));
    } catch (e) {
      setFase(faseDaFalha(e.code));
    }
  }, [entrar]);

  useEffect(() => {
    if (window.location.pathname === CAMINHO_DE_RETORNO) voltarDoRadar();
    else abrir();
  }, [abrir, voltarDoRadar]);

  const tentarDeNovo = () => {
    setFase("carregando");
    abrir();
  };

  const sair = async () => {
    if (!confirmarSaida()) return;
    try {
      await api("/auth/sair", { method: "POST" });
      esquecerConta();
      setSessao(null);
      setFase("saiu");
    } catch {
      setFase("indisponivel");
    }
  };

  if (fase === "pronto") return children(sessao, sair);
  return <TelaDeAcesso fase={fase} onTentarDeNovo={tentarDeNovo} />;
}
