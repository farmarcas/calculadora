import { useState } from "react";
import { Aviso, Botao, IconeUpload } from "../../components/ui/index.jsx";
import CadastroLojaPage from "../cadastro-loja/CadastroLojaPage.jsx";
import ImportarPlanilha from "./ImportarPlanilha.jsx";
import ParametrosLegais from "../parametros/ParametrosLegais.jsx";
import { cuidaDoGrupo, ehOperador } from "../../api/perfis.js";

// A seção ("lojas" ou "parametros") vem do menu lateral. Parâmetros legais e encargos valem para toda a plataforma: só o operador vê.
export default function CadastrosPage({ perfil, secao = "lojas" }) {
  // A loja vem da plataforma (o operador cria e remove); o empresário corrige a loja e cuida da equipe.
  const operador = ehOperador(perfil);
  const podeEscrever = cuidaDoGrupo(perfil);
  const [importando, setImportando] = useState(false);
  const [versao, setVersao] = useState(0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">Cadastro de loja</h1>
          <p className="mt-1 mb-0 text-sm text-ink-500">As lojas vêm da plataforma. Corrija o que precisar e cadastre a equipe de cada uma.</p>
        </div>
        {secao === "lojas" && (podeEscrever || operador) && (
          <Botao tipo="secundario" onClick={() => setImportando(true)}><IconeUpload />Importar em massa</Botao>
        )}
      </div>

      {perfil === "SCHEDULE_VIEWER" && <Aviso tom="neutro">Você está como "Somente consulta": não pode criar, editar nem importar.</Aviso>}

      {secao === "parametros" && operador && <ParametrosLegais perfil={perfil} />}
      {secao === "lojas" && <CadastroLojaPage key={versao} perfil={perfil} />}

      {importando && <ImportarPlanilha podeLojas={operador || perfil === "TENANT_ADMIN"} operador={operador} onClose={() => setImportando(false)} onConcluido={() => setVersao((v) => v + 1)} />}
    </>
  );
}
