import { useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, entrada } from "../../components/ui/index.jsx";
import Custos from "./Custos.jsx";
import TurnosLoja from "./TurnosLoja.jsx";

const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];

export default function Configuracao({ diag, podeEscrever, lojaId, onSalvo, perfil }) {
  const [conv, setConv] = useState(diag.config.convencao8h24);
  const [min, setMin] = useState(diag.config.minimos);
  const [turnos, setTurnos] = useState(diag.config.turnos ?? null);
  const [erro, setErro] = useState(null);
  const [ok, setOk] = useState(false);

  const salvar = async () => {
    setErro(null);
    setOk(false);
    try {
      const r = await api(`/lojas/${lojaId}/configuracao`, { method: "PUT", body: { convencao8h24: conv, minimos: min, turnos } });
      onSalvo(r);
      setOk(true);
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {erro && <Aviso>{erro}</Aviso>}
      {ok && <Aviso tom="ok">Configuração salva. O Diagnóstico e as Simulações da Escala já usam os novos valores.</Aviso>}
      <Cartao titulo="Convenção coletiva" subtitulo="Define se a regra de 42h é atingível em 5 dias">
        <label className="flex items-center gap-3 px-6 py-4 cursor-pointer">
          <input type="checkbox" checked={conv} disabled={!podeEscrever} onChange={(e) => setConv(e.target.checked)} className="h-5 w-5" />
          <span>
            <span className="block text-sm font-medium">Permite 8h24 por dia na transição</span>
            <span className="block text-xs text-ink-500 mt-0.5">
              {conv ? "Na regra de 42h, cada pessoa pode fazer até 42h em 5 dias (8h24 por dia)." : "Sem autorização, a regra de 42h vira 40h na prática (5 dias × 8h)."}
            </span>
          </span>
        </label>
      </Cartao>
      <TurnosLoja horarios={diag.loja.horarios} minimosUnicos={min} turnos={turnos} onChange={setTurnos} avisos={diag.config.turnosAvisos} podeEscrever={podeEscrever} />
      <Cartao titulo="Mínimo e metas por função" subtitulo={turnos ? "Meta única do dia inteiro: só vale para a hora fora de qualquer turno. As metas dos turnos estão no quadro acima." : "O farmacêutico é obrigatório em todo o horário. Nos demais cargos a meta é opcional: sem meta vale o nível de hoje"}>
        {FUNCOES.map((f) => (
          <div key={f} className="flex items-center justify-between gap-4 px-6 py-3 border-t border-line first:border-0">
            <div>
              <div className="text-sm font-medium">{f}</div>
              {f === "Farmacêutico" ? <div className="text-xs text-ink-500">Mínimo 1 sempre: a lei exige farmacêutico em todo o horário</div> : <div className="text-xs text-ink-500">Meta (opcional): deixe 0 para manter o nível de hoje</div>}
            </div>
            <input
              type="number"
              aria-label={f === "Farmacêutico" ? `Mínimo de ${f}` : `Meta de ${f}`}
              min={f === "Farmacêutico" ? 1 : 0}
              max={10}
              disabled={!podeEscrever}
              value={min[f] ?? 0}
              onChange={(e) => setMin({ ...min, [f]: Number(e.target.value) })}
              className={`${entrada} w-20`}
            />
          </div>
        ))}
      </Cartao>
      {podeEscrever && <div><Botao onClick={salvar}>Salvar configuração</Botao></div>}
      {perfil === "TENANT_ADMIN" && <Custos lojaId={lojaId} />}
    </div>
  );
}
