import { Aviso } from "../../components/ui/index.jsx";
import MenuImportar from "../../shell/MenuImportar.jsx";
import { itensDoMenuImportar } from "../../shell/importar.js";
import CadastroLojaPage from "../cadastro-loja/CadastroLojaPage.jsx";
import ParametrosLegais from "../parametros/ParametrosLegais.jsx";
import { cuidaDoGrupo, ehOperador } from "../../api/perfis.js";

// A seção ("lojas" ou "parametros") vem do menu lateral. Parâmetros legais e encargos valem para toda a plataforma: só o operador vê.
// `versaoCadastro` muda quando a importação de Cadastro termina (o App dono dos modais): recria a tela. `versaoDados` muda em
// qualquer importação (inclusive a base comercial): a tela aberta só recarrega o painel, sem perder o que a pessoa editou.
export default function CadastrosPage({ perfil, acessoTotal = true, secao = "lojas", versaoCadastro = 0, versaoDados = 0, onImportar }) {
  // A loja vem da plataforma (o operador cria e remove); o empresário corrige a loja e cuida da equipe.
  const operador = ehOperador(perfil);
  const podeEnviarBase = itensDoMenuImportar(perfil, acessoTotal).some((i) => i.id === "base");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">Cadastro de loja</h1>
          <p className="mt-1 mb-0 text-sm text-ink-500">As lojas vêm da plataforma. Corrija o que precisar e cadastre a equipe de cada uma.</p>
        </div>
        {secao === "lojas" && <MenuImportar itens={itensDoMenuImportar(perfil, acessoTotal)} onEscolher={onImportar} />}
      </div>

      {perfil === "SCHEDULE_VIEWER" && <Aviso tom="neutro">Você está como "Somente consulta": não pode criar, editar nem importar.</Aviso>}

      {secao === "parametros" && operador && <ParametrosLegais perfil={perfil} />}
      {secao === "lojas" && <CadastroLojaPage key={versaoCadastro} perfil={perfil} versaoBase={versaoDados} onEnviarBase={podeEnviarBase ? () => onImportar?.("base") : undefined} />}
    </>
  );
}
