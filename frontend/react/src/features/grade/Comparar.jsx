import { useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Botao, Cartao, Ficha } from "../../components/ui/index.jsx";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const STATUS = { rascunho: ["atencao", "Rascunho"], gravada: ["ok", "Gravada"], em_uso: ["ok", "Em uso"], substituida: ["neutro", "Substituída"] };

// Para cada indicador: rótulo, valor e quando "maior" é melhor ou pior (cor da diferença frente à em uso).
const LINHAS = [
  { grupo: "Conformidade" },
  { k: "erros", r: "Erros nas regras", melhor: "menor" },
  { k: "avisos", r: "Avisos", melhor: "menor" },
  { k: "semFarmaceutico", r: "Farmacêutico em todo o horário", bool: true },
  { grupo: "Atendimento" },
  { k: "coberturaPct", r: "Cobertura das horas exigidas", un: "%", melhor: "maior" },
  { k: "horasFalta", r: "Horas-pessoa em falta", un: "h", melhor: "menor" },
  { k: "horasSobra", r: "Horas-pessoa em sobra", un: "h", melhor: "menor" },
  { grupo: "Pessoas" },
  { k: "pessoas", r: "Pessoas no quadro" },
  { k: "horasPlanejadas", r: "Horas planejadas por semana", un: "h" },
  { k: "horasContratadas", r: "Horas contratadas por semana", un: "h" },
  { k: "folgasPorPessoa", r: "Folgas por pessoa na semana" },
  { k: "domingosTrabalhados", r: "Turnos aos domingos" },
];

export default function Comparar({ lojaId, ids, onVoltar, onAprovar, podeAprovar }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api(`/lojas/${lojaId}/simulacoes/comparar?ids=${ids.join(",")}`).then(setDados).catch((e) => setErro(e.message));
  }, [lojaId, ids]);

  if (erro) return <Aviso>{erro}</Aviso>;
  if (!dados) return <p className="text-sm text-ink-500">Comparando…</p>;
  const ref = dados.simulacoes.find((s) => s.referencia);
  // O bloco de custo só vem da API para o dono do grupo.
  const temCusto = dados.simulacoes.some((s) => s.custo);
  const semCustos = temCusto && dados.simulacoes.some((s) => s.custo && !s.custo.informado);
  const faltam = [...new Set(dados.simulacoes.flatMap((s) => (s.custo?.informado ? s.custo.faltamInformar : [])))];
  const celulaCusto = (s, f) => {
    if (!s.custo) return null;
    if (!s.custo.informado) return <span className="text-ink-500">informe os custos</span>;
    if (s.custo.mensal === null) return <span className="text-attention-700">falta salário: {s.custo.faltamInformar.join(", ")}</span>;
    return f(s.custo);
  };

  const diferenca = (l, s) => {
    if (!ref || s.referencia || l.bool || typeof s.indicadores[l.k] !== "number") return null;
    const d = Math.round((s.indicadores[l.k] - ref.indicadores[l.k]) * 100) / 100;
    if (d === 0) return null;
    const bom = l.melhor ? (l.melhor === "maior" ? d > 0 : d < 0) : null;
    return <span className={`ml-2 text-xs ${bom === null ? "text-ink-500" : bom ? "text-success-600" : "text-error-600"}`}>{d > 0 ? "+" : ""}{d}{l.un ?? ""}</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div><Botao tipo="texto" onClick={onVoltar}>← Voltar às simulações</Botao></div>
      <Cartao titulo="Comparação de simulações" subtitulo={ref ? `A simulação em uso (${ref.nome}) entra sempre como referência; as diferenças são frente a ela.` : "Não há simulação em uso para servir de referência."}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[640px]">
            <thead>
              <tr>
                <th className="px-6 py-3" />
                {dados.simulacoes.map((s) => {
                  const [tom, r] = STATUS[s.status] ?? ["neutro", s.status];
                  return (
                    <th key={s.id} className="px-6 py-3 text-left align-top">
                      <div className="font-medium">{s.nome}</div>
                      <div className="mt-1 flex flex-wrap gap-1"><Ficha tom={tom}>{r}</Ficha>{s.referencia && <Ficha tom="neutro">Referência</Ficha>}<Ficha tom="neutro">{s.regra}</Ficha></div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {LINHAS.map((l, i) =>
                l.grupo ? (
                  <tr key={i}><td colSpan={dados.simulacoes.length + 1} className="px-6 py-2 bg-surface-page text-[11px] font-bold uppercase tracking-wide text-ink-500 border-t border-line">{l.grupo}</td></tr>
                ) : (
                  <tr key={i} className="border-t border-line">
                    <td className="px-6 py-3 text-ink-700">{l.r}</td>
                    {dados.simulacoes.map((s) => {
                      const v = s.indicadores[l.k];
                      return (
                        <td key={s.id} className="px-6 py-3">
                          {l.bool ? <Ficha tom={v ? "erro" : "ok"}>{v ? "Falta" : "Cobre tudo"}</Ficha> : <>{v}{l.un ?? ""}{diferenca(l, s)}</>}
                        </td>
                      );
                    })}
                  </tr>
                ),
              )}
              {temCusto && (
                <>
                  <tr><td colSpan={dados.simulacoes.length + 1} className="px-6 py-2 bg-surface-page text-[11px] font-bold uppercase tracking-wide text-ink-500 border-t border-line">Custo · estimativa gerencial por média de função</td></tr>
                  <tr className="border-t border-line">
                    <td className="px-6 py-3 text-ink-700">Custo mensal</td>
                    {dados.simulacoes.map((s) => <td key={s.id} className="px-6 py-3">{celulaCusto(s, (c) => brl(c.mensal))}</td>)}
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-6 py-3 text-ink-700">Custo anual</td>
                    {dados.simulacoes.map((s) => <td key={s.id} className="px-6 py-3">{celulaCusto(s, (c) => brl(c.anual))}</td>)}
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-6 py-3 text-ink-700">Diferença mensal frente à em uso</td>
                    {dados.simulacoes.map((s) => (
                      <td key={s.id} className="px-6 py-3">
                        {s.referencia ? <span className="text-ink-500">referência</span> : s.custo?.diferencaMensalFrenteEmUso == null ? "—" : (
                          <span className={s.custo.diferencaMensalFrenteEmUso > 0 ? "text-error-600" : "text-success-600"}>{s.custo.diferencaMensalFrenteEmUso > 0 ? "+" : ""}{brl(s.custo.diferencaMensalFrenteEmUso)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-line">
                    <td className="px-6 py-3 text-ink-700 align-top">Como foi calculado</td>
                    {dados.simulacoes.map((s) => (
                      <td key={s.id} className="px-6 py-3 align-top">
                        {s.custo?.informado && s.custo.memoria.length > 0 && (
                          <details><summary className="cursor-pointer text-xs text-system-700">ver a conta</summary><ul className="mt-1 mb-0 pl-4 text-xs text-ink-700">{s.custo.memoria.map((m, i) => <li key={i}>{m}</li>)}</ul></details>
                        )}
                      </td>
                    ))}
                  </tr>
                </>
              )}
              <tr className="border-t border-line">
                <td className="px-6 py-3 text-ink-700 align-top">Síntese</td>
                {dados.simulacoes.map((s) => <td key={s.id} className="px-6 py-3 text-xs text-ink-700 align-top">{s.sintese}</td>)}
              </tr>
              {podeAprovar && (
                <tr className="border-t border-line">
                  <td className="px-6 py-3" />
                  {dados.simulacoes.map((s) => (
                    <td key={s.id} className="px-6 py-3">
                      {s.status === "gravada" && <Botao disabled={!s.podeAprovar} onClick={() => onAprovar(s.id)}>Aprovar esta</Botao>}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {semCustos && <div className="px-6 py-3 border-t border-line"><Aviso tom="atencao">Custos não informados: preencha o salário médio por função em Cadastros › Lojas › Editar › Funcionários e configuração para ver os valores.</Aviso></div>}
        {faltam.length > 0 && <div className="px-6 py-3 border-t border-line"><Aviso tom="atencao">Falta o salário médio de: {faltam.join(", ")}. Sem ele, o total não é mostrado.</Aviso></div>}
        {temCusto && <p className="m-0 px-6 py-3 text-xs text-ink-500 border-t border-line">Estimativa gerencial por média de função. Quem já é contratado mantém o salário; vaga nova custa proporcional à carga. Valores das regras ainda sem validação jurídica.</p>}
      </Cartao>
    </div>
  );
}
