import { useCallback, useEffect, useState } from "react";
import { api, getGe, getPerfil, GE_INICIAL, setGe, setPerfil, irParaLogin } from "./api/client.js";
import { acessoTotalNoGrupo, perfilNoGrupo } from "./auth/sessao.js";
import { ehOperador, cuidaDoGrupo } from "./api/perfis.js";
import CadastrosPage from "./features/cadastros/CadastrosPage.jsx";
import EscalaPage from "./features/diagnostico/EscalaPage.jsx";
import ModalEnviarBase from "./features/diagnostico/ModalEnviarBase.jsx";
import ModalImportarCadastro from "./features/cadastros/ModalImportarCadastro.jsx";
import { confirmarSaida } from "./features/cadastro-loja/guardaSaida.js";
import { lerUrl } from "./features/cadastro-loja/urlDaLoja.js";
import GruposPage from "./features/ge/GruposPage.jsx";
import AppShell from "./shell/AppShell.jsx";
import FaixaDeContexto from "./shell/FaixaDeContexto.jsx";
import MenuDaConta from "./shell/MenuDaConta.jsx";
import { horasDeFuncionamento } from "./shell/horas.js";
import { SECAO_INICIAL, folhaAtual, folhas, telaTemFaixa, telaTemFiltroDeGrupo } from "./shell/menu.js";

const TELAS = ["cadastros", "escala", "grupos"];

export default function App({ sessao, onSair }) {
  const sso = Boolean(sessao?.sso);
  const [perfilDemonstracao, setP] = useState(getPerfil());
  const [ge, setG] = useState(getGe());
  const perfil = sso ? perfilNoGrupo(sessao, ge) : perfilDemonstracao;
  const acessoTotal = acessoTotalNoGrupo(sessao, ge);
  const [ges, setGes] = useState([]);
  const [tela, setTela] = useState(() => (TELAS.includes(lerUrl().tela) ? lerUrl().tela : "cadastros"));
  const [secao, setSecao] = useState(() => SECAO_INICIAL[TELAS.includes(lerUrl().tela) ? lerUrl().tela : "cadastros"]);
  // Lojas do grupo e a loja escolhida: o filtro da faixa é o único lugar de trocar de loja.
  const [lojas, setLojas] = useState(null);
  const [lojaId, setLojaId] = useState("");
  // Qual importação está aberta: "cadastro" (lojas e funcionários) ou "base" (vendas hora a hora).
  const [importando, setImportando] = useState(null);
  const [versaoDados, setVersaoDados] = useState(0);
  // Muda só quando a importação de Cadastro termina (recria a tela de Cadastro); a base comercial só recarrega o painel aberto.
  const [versaoCadastro, setVersaoCadastro] = useState(0);
  // Login do Radar ativo? Quando sim, perfil e GEs vêm do /session, não do menu de demonstração.
  const [radar, setRadar] = useState(false);

  // O papel pode não ver a tela atual (ex.: sair de operador estando em Grupos): vai para a primeira permitida.
  const folha = folhaAtual(perfil, tela, secao);

  const irPara = (f) => {
    if (f.tela !== folha.tela && !confirmarSaida()) return;
    setTela(f.tela);
    setSecao(f.secao ?? null);
    if (f.tela !== "cadastros") window.history.replaceState(null, "", `${window.location.pathname}?tela=${f.tela}`);
  };

  const escolherGe = useCallback((id) => {
    setGe(id);
    setG(id);
  }, []);
  // Modo local/demonstração: o grupo é escolhido no menu da conta e lido de /ge.
  const carregarGes = useCallback(async () => {
    try {
      const lista = (await api("/ge")).data;
      setGes(lista);
      // Grupo guardado que não existe mais ou foi desativado: cai no primeiro da lista.
      if (lista.length && !lista.some((g) => g.id === getGe())) escolherGe(lista[0].id);
    } catch {
      setGes([]);
    }
  }, [escolherGe]);

  // Na carga: tenta a sessão do Radar. Se houver login, perfil e GEs vêm dela; senão, modo local.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const s = await api("/session");
        if (!vivo) return;
        if (s?.modo === "radar") {
          setRadar(true);
          setGes(s.ges);
          const inicial = s.ges.find((g) => g.id === getGe()) ?? s.ges[0];
          if (inicial) escolherGe(inicial.id);
          return;
        }
      } catch {
        // 401 já redireciona para o login; outros erros caem no modo local.
      }
      if (vivo) carregarGes();
    })();
    return () => {
      vivo = false;
    };
  }, [carregarGes, escolherGe]);

  // No Radar o perfil acompanha o GE selecionado (dono = gestor; demais = consulta).
  useEffect(() => {
    if (!radar) return;
    const p = ges.find((g) => g.id === ge)?.perfil;
    if (p && p !== perfil) {
      setPerfil(p);
      setP(p);
    }
  }, [radar, ge, ges, perfil]);

  // Lojas do grupo (recarrega ao trocar de grupo e depois de uma importação).
  useEffect(() => {
    let vivo = true;
    api("/lojas?pageSize=100")
      .then((r) => {
        if (!vivo) return;
        setLojas(r.data);
        setLojaId((atual) => (r.data.some((l) => l.id === atual) ? atual : r.data[0]?.id ?? ""));
      })
      .catch(() => vivo && setLojas([]));
    return () => { vivo = false; };
  }, [ge, versaoDados]);

  const trocarPerfil = (p) => {
    setPerfil(p);
    setP(p);
  };
  const trocarGrupo = (id) => {
    if (confirmarSaida()) escolherGe(id);
  };
  const sair = () => {
    if (sso) {
      onSair();
      return;
    }
    if (radar) {
      // Encerra a sessão do Radar: descarta o token e volta para o login.
      try {
        localStorage.removeItem("core/auth/token");
      } catch {
        /* localStorage indisponível: segue para o login mesmo assim */
      }
      irParaLogin();
      return;
    }
    // Sem login não há sessão para encerrar: volta ao padrão de demonstração.
    trocarPerfil("TENANT_ADMIN");
    escolherGe(GE_INICIAL);
  };

  const geAtual = ges.find((g) => g.id === ge);
  const lojaAtual = lojas?.find((l) => l.id === lojaId);
  const podeEscrever = cuidaDoGrupo(perfil);

  const comFiltroDeGrupo = telaTemFiltroDeGrupo(folha, sso);
  const faixa = telaTemFaixa(folha.tela) || comFiltroDeGrupo ? (
    <FaixaDeContexto
      soGrupo={!telaTemFaixa(folha.tela)}
      grupos={comFiltroDeGrupo ? ges : null}
      grupoId={ge}
      onGrupo={trocarGrupo}
      acessoTotal={acessoTotal}
      lojas={lojas ?? []}
      lojaId={lojaId}
      onLoja={setLojaId}
      horas={horasDeFuncionamento(lojaAtual?.horarios)}
      perfil={perfil}
      onImportar={setImportando}
    />
  ) : null;

  return (
    <>
      <AppShell
        perfil={perfil}
        folha={folha}
        onNavegar={irPara}
        faixa={faixa}
        conta={<MenuDaConta perfil={perfil} ge={ge} ges={ges} geAtual={geAtual} onPerfil={trocarPerfil} onGe={escolherGe} onSair={sair} usuario={sessao?.usuario} radar={radar} demonstracao={sso ? false : undefined} />}
      >
        {folha.tela === "grupos" && ehOperador(perfil) && <GruposPage geAtual={ge} onAbrir={(id) => { escolherGe(id); irPara(folhas(perfil).find((f) => f.tela === "cadastros")); }} onMudou={carregarGes} />}
        {/* Trocar de grupo recarrega a tela inteira: nada do grupo anterior fica. */}
        {folha.tela === "cadastros" && <CadastrosPage key={ge} perfil={perfil} acessoTotal={acessoTotal} secao={folha.secao} versaoCadastro={versaoCadastro} versaoDados={versaoDados} onImportar={setImportando} />}
        {folha.tela === "escala" && (
          <EscalaPage
            key={ge}
            perfil={perfil}
            lojaId={lojaId}
            semLojas={lojas !== null && lojas.length === 0}
            secao={secao ?? folha.secao}
            versaoDados={versaoDados}
            onImportar={() => setImportando("base")}
            onSecao={(s) => { setTela("escala"); setSecao(s); }}
            onIrCadastros={() => irPara(folhas(perfil).find((f) => f.tela === "cadastros"))}
          />
        )}
      </AppShell>
      {importando === "base" && <ModalEnviarBase onClose={() => setImportando(null)} onConcluido={() => setVersaoDados((v) => v + 1)} />}
      {importando === "cadastro" && <ModalImportarCadastro podeLojas={ehOperador(perfil) || perfil === "TENANT_ADMIN"} onClose={() => setImportando(null)} onConcluido={() => { setVersaoDados((v) => v + 1); setVersaoCadastro((v) => v + 1); }} />}
    </>
  );
}
