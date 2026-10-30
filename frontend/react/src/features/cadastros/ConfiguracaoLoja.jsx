import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso } from "../../components/ui/index.jsx";
import Configuracao from "../diagnostico/Configuracao.jsx";

// Tudo o que a Escala precisa para simular desta loja: convenção, turnos e metas por turno e (só o dono) os custos.
// Fica dentro da edição da loja; ao salvar, o Diagnóstico e as Simulações já usam os novos valores.
export default function ConfiguracaoLoja({ lojaId, perfil, podeEscrever }) {
  const [diag, setDiag] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    setDiag(null);
    setErro(null);
    api(`/lojas/${lojaId}/diagnostico`).then(setDiag).catch((e) => setErro(e.message));
  }, [lojaId, perfil]);

  return (
    <div className="flex flex-col gap-4">
      {erro && <Aviso>{erro}</Aviso>}
      {!diag && !erro && <p className="m-0 text-sm text-ink-500">Carregando a configuração…</p>}
      {diag && <Configuracao key={lojaId} diag={diag} podeEscrever={podeEscrever} lojaId={lojaId} onSalvo={setDiag} perfil={perfil} />}
    </div>
  );
}
