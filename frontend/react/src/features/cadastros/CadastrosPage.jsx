import { useState } from "react";
import { Abas, Aviso, Botao, IconeUpload } from "../../components/ui/index.jsx";
import CadastroLojaPage from "../cadastro-loja/CadastroLojaPage.jsx";
import FormLoja from "./FormLoja.jsx";
import ImportarPlanilha from "./ImportarPlanilha.jsx";
import ParametrosLegais from "../parametros/ParametrosLegais.jsx";
import { cuidaDoGrupo, ehOperador } from "../../api/perfis.js";

const SECOES = [["cadastro", "Lojas"], ["parametros", "Parâmetros legais"]];

export default function CadastrosPage({ perfil }) {
  // A loja vem da plataforma (o operador cria e remove); o empresário corrige a loja e cuida da equipe.
  const operador = ehOperador(perfil);
  const podeEscrever = cuidaDoGrupo(perfil);
  const [secao, setSecao] = useState("cadastro");
  const [novaLoja, setNovaLoja] = useState(false);
  const [importando, setImportando] = useState(false);
  const [versao, setVersao] = useState(0);

  // Cadastrar loja (operador) ainda usa o formulário em página inteira; o modo "Nova loja" do painel chega em outra etapa.
  if (novaLoja)
    return <FormLoja registro={null} perfil={perfil} onClose={() => setNovaLoja(false)} onSalvo={() => { setNovaLoja(false); setVersao((v) => v + 1); }} />;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">Cadastro de loja</h1>
          <p className="mt-1 mb-0 text-sm text-ink-500">As lojas vêm da plataforma. Corrija o que precisar e cadastre a equipe de cada uma.</p>
        </div>
        {secao === "cadastro" && (podeEscrever || operador) && (
          <Botao tipo="secundario" onClick={() => setImportando(true)}><IconeUpload />Importar em massa</Botao>
        )}
      </div>

      {perfil === "SCHEDULE_VIEWER" && <Aviso tom="neutro">Você está como "Somente consulta": não pode criar, editar nem importar.</Aviso>}

      <Abas opcoes={SECOES} valor={secao} onChange={setSecao} rotulo="Seções do cadastro" />

      {secao === "parametros" && <ParametrosLegais perfil={perfil} />}
      {secao === "cadastro" && <CadastroLojaPage key={versao} perfil={perfil} onNova={() => setNovaLoja(true)} />}

      {importando && <ImportarPlanilha podeLojas={operador || perfil === "TENANT_ADMIN"} operador={operador} onClose={() => setImportando(false)} onConcluido={() => setVersao((v) => v + 1)} />}
    </>
  );
}
