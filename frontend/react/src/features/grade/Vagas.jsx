import { useState } from "react";
import { Botao, Cartao, Ficha, entrada } from "../../components/ui/index.jsx";

const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];
const CARGAS = [8, 12, 16, 20, 24, 28, 30, 32, 36, 40, 42, 44];

// Contratações e desligamentos SIMULADOS: nada disso chega ao cadastro de funcionários.
export default function Vagas({ quadro, editavel, onSalvar }) {
  const [funcao, setFuncao] = useState("Atendimento");
  const [carga, setCarga] = useState(24);
  const vagas = quadro.filter((p) => p.vaga);
  const pessoas = quadro.filter((p) => !p.vaga);
  const desligados = pessoas.filter((p) => p.desligado).map((p) => p.matricula);
  const lista = (v) => v.map(({ matricula, funcao: f, cargaH }) => ({ matricula, funcao: f, cargaH }));

  return (
    <Cartao
      titulo="Vagas e desligamentos simulados"
      subtitulo="Teste contratar ou desligar sem mexer no cadastro. Vaga simulada nunca vira funcionário."
    >
      <div className="px-6 py-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
            Função
            <select className={entrada} value={funcao} onChange={(e) => setFuncao(e.target.value)} disabled={!editavel}>
              {FUNCOES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
            Carga semanal
            <select className={entrada} value={carga} onChange={(e) => setCarga(Number(e.target.value))} disabled={!editavel}>
              {CARGAS.map((c) => <option key={c} value={c}>{c}h</option>)}
            </select>
          </label>
          {editavel && <Botao tipo="secundario" onClick={() => onSalvar({ vagas: [...lista(vagas), { funcao, cargaH: carga }] })}>Adicionar vaga</Botao>}
        </div>

        {vagas.length > 0 && (
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {vagas.map((v) => (
              <li key={v.matricula} className="flex items-center justify-between gap-3 text-sm border border-line rounded-input px-3 py-2">
                <span><strong>{v.nome}</strong> · {v.funcao} · {v.cargaH}h por semana <Ficha tom="atencao">Simulada</Ficha></span>
                {editavel && <Botao tipo="texto" onClick={() => onSalvar({ vagas: lista(vagas.filter((x) => x.matricula !== v.matricula)) })}>Remover</Botao>}
              </li>
            ))}
          </ul>
        )}

        <details>
          <summary className="cursor-pointer text-sm text-system-700">Desligamentos simulados ({desligados.length})</summary>
          <ul className="list-none m-0 mt-2 p-0 flex flex-col gap-1">
            {pessoas.map((p) => (
              <li key={p.matricula} className="flex items-center justify-between gap-3 text-sm">
                <span className={p.desligado ? "line-through text-ink-500" : ""}>{p.nome} · {p.funcao}</span>
                {editavel && (
                  <Botao
                    tipo="texto"
                    onClick={() => onSalvar({ desligados: p.desligado ? desligados.filter((m) => m !== p.matricula) : [...desligados, p.matricula] })}
                  >
                    {p.desligado ? "Desfazer" : "Desligar"}
                  </Botao>
                )}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </Cartao>
  );
}
