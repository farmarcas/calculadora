import { useCallback, useEffect, useState } from "react";
import { api, getGe, getPerfil, GE_INICIAL, setGe, setPerfil } from "./api/client.js";
import { ehOperador, cuidaDoGrupo } from "./api/perfis.js";
import CadastrosPage from "./features/cadastros/CadastrosPage.jsx";
import EscalaPage from "./features/diagnostico/EscalaPage.jsx";
import EnviarPlanilhas from "./features/diagnostico/EnviarPlanilhas.jsx";
import { confirmarSaida } from "./features/cadastro-loja/guardaSaida.js";
import { lerUrl } from "./features/cadastro-loja/urlDaLoja.js";
import GruposPage from "./features/ge/GruposPage.jsx";
import AppShell from "./shell/AppShell.jsx";
import FaixaDeContexto from "./shell/FaixaDeContexto.jsx";
import MenuDaConta from "./shell/MenuDaConta.jsx";
import { horasDeFuncionamento } from "./shell/horas.js";
import { SECAO_INICIAL, folhaAtual, folhas, telaTemFaixa } from "./shell/menu.js";

const TELAS = ["cadastros", "escala", "grupos"];

export default function App() {
  const [perfil, setP] = useState(getPerfil());
  const [ge, setG] = useState(getGe());
  const [ges, setGes] = useState([]);
  const [tela, setTela] = useState(() => (TELAS.includes(lerUrl().tela) ? lerUrl().tela : "cadastros"));
  const [secao, setSecao] = useState(() => SECAO_INICIAL[TELAS.includes(lerUrl().tela) ? lerUrl().tela : "cadastros"]);
  // Lojas do grupo e a loja escolhida: o filtro da faixa é o único lugar de trocar de loja.
  const [lojas, setLojas] = useState(null);
  const [lojaId, setLojaId] = useState("");
  const [importando, setImportando] = useState(false);
  const [versaoDados, setVersaoDados] = useState(0);

  // O papel pode não ver a tela atual (ex.: sair de operador estando em Grupos): vai para a primeira permitida.
  const folha = folhaAtual(perfil, tela, secao);

  const irPara = (f) => {
    if (f.tela !== folha.tela && !confirmarSaida()) return;
    setTela(f.tela);
    setSecao(f.secao ?? null);
    if (f.tela !== "cadastros") window.history.replaceState(null, "", `${window.location.pathname}?tela=${f.tela}`);
  };
  const irParaInicio = () => irPara(folhas(perfil)[0]);

  // Sem login (o SSO virá depois): o papel e o grupo são escolhidos no menu da conta, só para demonstração.
  const escolherGe = useCallback((id) => {
    setGe(id);
    setG(id);
  }, []);
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
  useEffect(() => { carregarGes(); }, [carregarGes]);

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
  const sair = () => {
    // Sem login não há sessão para encerrar: volta ao padrão de demonstração.
    trocarPerfil("TENANT_ADMIN");
    escolherGe(GE_INICIAL);
  };

  const geAtual = ges.find((g) => g.id === ge);
  const lojaAtual = lojas?.find((l) => l.id === lojaId);
  const podeEscrever = cuidaDoGrupo(perfil);

  const faixa = telaTemFaixa(folha.tela) ? (
    <FaixaDeContexto
      lojas={lojas ?? []}
      lojaId={lojaId}
      onLoja={setLojaId}
      horas={horasDeFuncionamento(lojaAtual?.horarios)}
      podeImportar={podeEscrever}
      onImportar={() => setImportando(true)}
    />
  ) : null;

  return (
    <>
      <AppShell
        perfil={perfil}
        folha={folha}
        onNavegar={irPara}
        onInicio={irParaInicio}
        faixa={faixa}
        conta={<MenuDaConta perfil={perfil} ge={ge} ges={ges} geAtual={geAtual} onPerfil={trocarPerfil} onGe={escolherGe} onSair={sair} />}
      >
        {folha.tela === "grupos" && ehOperador(perfil) && <GruposPage geAtual={ge} onAbrir={(id) => { escolherGe(id); irPara(folhas(perfil).find((f) => f.tela === "cadastros")); }} onMudou={carregarGes} />}
        {/* Trocar de grupo recarrega a tela inteira: nada do grupo anterior fica. */}
        {folha.tela === "cadastros" && <CadastrosPage key={ge} perfil={perfil} secao={folha.secao} />}
        {folha.tela === "escala" && (
          <EscalaPage
            key={ge}
            perfil={perfil}
            lojaId={lojaId}
            semLojas={lojas !== null && lojas.length === 0}
            secao={folha.secao}
            versaoDados={versaoDados}
            onImportar={() => setImportando(true)}
            onSecao={(s) => irPara(folhas(perfil).find((f) => f.tela === "escala" && f.secao === s))}
            onIrCadastros={() => irPara(folhas(perfil).find((f) => f.tela === "cadastros"))}
          />
        )}
      </AppShell>
      {importando && <EnviarPlanilhas onClose={() => setImportando(false)} onConcluido={() => setVersaoDados((v) => v + 1)} />}
    </>
  );
}
