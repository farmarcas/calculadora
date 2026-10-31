import { useState } from "react";
import { Aviso, Botao, Cartao } from "../../components/ui/index.jsx";
import QuadroCentral from "./QuadroCentral.jsx";
import OndeVemSecao from "./onde-vem/OndeVemSecao.jsx";
import Comparativo from "./Comparativo.jsx";

export default function Diagnostico({ diag, podeEscrever, onEnviar, onSimular, onRecarregar, onDefinirFuncao }) {
  const [regraId, setRegraId] = useState("r42");

  if (diag.status === "pendente")
    return (
      <div className="flex flex-col gap-6">
      {diag.avisoEstimativa && <Aviso tom="atencao">{diag.avisoEstimativa}</Aviso>}
      <Cartao>
        <div className="p-10 text-center">
          <p className="m-0 text-base font-medium">{diag.mensagem}</p>
          <p className="mt-2 mb-4 text-sm text-ink-500">Sem a escala atual não há quadro por função, capacidade de horas e turnos nem cobertura por faixa.</p>
          {podeEscrever && <Botao onClick={onEnviar}>Enviar planilhas</Botao>}
        </div>
      </Cartao>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      {diag.avisoEstimativa && <Aviso tom="atencao">{diag.avisoEstimativa}</Aviso>}
      <QuadroCentral diag={diag} regraId={regraId} onRegra={setRegraId} podeEscrever={podeEscrever} onEnviar={onEnviar} onRecarregar={onRecarregar} onDefinirFuncao={onDefinirFuncao} />

      {/* Logo depois do diagnóstico: os caminhos lado a lado (o detalhe de cada cenário saiu da página). */}
      {regraId === "atual" ? (
        <Aviso tom="neutro">Os cenários de economia e equilíbrio valem para as regras que vêm aí (42h e 40h). Escolha uma delas acima para vê-los. Aqui você vê como a loja está hoje, na regra de 44h.</Aviso>
      ) : (
        <Comparativo comparativo={diag.cenarios?.[regraId]?.comparativo} cenarios={diag.cenarios?.[regraId]} lojaId={diag.loja.id} podeEscrever={podeEscrever} onSimular={onSimular} />
      )}

      <OndeVemSecao diag={diag} regraId={regraId} podeEscrever={podeEscrever} onEnviar={onEnviar} onRecarregar={onRecarregar} irCadastros={onDefinirFuncao} />
    </div>
  );
}
