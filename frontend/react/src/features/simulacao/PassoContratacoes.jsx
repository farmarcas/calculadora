import { Passo } from "../../components/ui/index.jsx";
import { corDaFuncao, ORDEM_FUNCOES, reais } from "./formato.js";

const BTN = "h-8 rounded-btn border border-[var(--system-500)] bg-transparent px-3 text-xs font-bold text-[var(--system-500)] cursor-pointer hover:bg-[var(--system-50)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-50";

const IconeAlerta = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" /></svg>
);

const tipo = (cargaH, teto) => (cargaH >= teto ? `Integral ${cargaH}h` : `Parcial ${cargaH}h`);

export default function PassoContratacoes({ sim, editavel, dono, onSalvar }) {
  const r = sim.resultado;
  const teto = Math.round(sim.regraInfo.teto);
  const vagas = sim.quadro.filter((p) => p.vaga);
  const lista = (v) => v.map(({ matricula, funcao, cargaH }) => ({ matricula, funcao, cargaH }));
  const adicionar = (funcao, cargaH) => onSalvar({ vagas: [...lista(vagas), { funcao, cargaH }] });
  const remover = (matricula) => onSalvar({ vagas: lista(vagas.filter((v) => v.matricula !== matricula)) });

  const funcoes = [...r.funcoes].sort((a, b) => {
    const ia = ORDEM_FUNCOES.indexOf(a.funcao);
    const ib = ORDEM_FUNCOES.indexOf(b.funcao);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const total = r.funcoes.reduce((s, f) => s + f.contratacoes.length, 0);
  const regraNome = sim.regra === "r40" ? "40h" : sim.regra === "r42" ? "42h" : "44h";
  const opcoes = [[teto, `Integral ${teto}h`], [16, "Parcial 16h"], [24, "Parcial 24h"]];
  const encargos = sim.loja.encargosPct != null ? ` Custo = salário médio da função × carga × (1 + encargos de ${String(sim.loja.encargosPct).replace(".", ",")}%).` : "";

  return (
    <Passo numero={2} titulo="Contratações por função" subtitulo={`Contratação simulada não cria funcionário.${dono ? encargos : ""}`} semMargem>
      <div className="border-t border-[var(--border-subtle)]">
        <div className="sim-contr-cab bg-[var(--surface-subtle)] px-6 py-3 text-xs font-bold uppercase text-[var(--text-strong)]">
          <span>Função</span><span>Situação hoje</span><span>Contratações na simulação</span><span>Resultado</span><span className="text-right">Custo por mês</span>
        </div>
        {funcoes.length === 0 && <p className="m-0 px-6 py-5 text-sm text-[var(--text-secondary)]">Nenhuma função com falta ou contratação nesta regra.</p>}
        {funcoes.map((f) => (
          <div key={f.funcao} className="sim-contr-linha">
            <div className="a-fn flex items-center gap-2 text-sm font-bold text-[var(--text-strong)]">
              <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-[2px]" style={{ background: corDaFuncao(f.funcao) }} />{f.funcao}
            </div>
            <div className="a-sit">
              <div className="sim-rot">Situação hoje</div>
              {f.faltaHoje > 0 ? (
                <>
                  <div className="flex items-center gap-1 text-sm font-bold text-[var(--text-danger)]"><IconeAlerta />Faltam {f.faltaHoje}h por semana</div>
                  <div className="text-xs text-[var(--text-secondary)]">{f.diasDeTrabalho} {f.diasDeTrabalho === 1 ? "dia" : "dias"} de trabalho</div>
                </>
              ) : (
                <div className="text-sm text-[var(--text-secondary)]">Equipe cobre as horas</div>
              )}
            </div>
            <div className="a-con min-w-0">
              <div className="sim-rot">Contratações na simulação</div>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {f.contratacoes.map((c, i) => (
                  <li key={c.matricula} className="flex items-center gap-3 rounded-btn bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm text-[var(--system-800)]">
                    <strong className="flex-1">+1 · {tipo(c.cargaH, teto)}</strong>
                    {dono && c.custoMensal != null && <span>{reais(c.custoMensal)}</span>}
                    {editavel && <button type="button" onClick={() => remover(c.matricula)} aria-label={`Remover contratação ${i + 1} de ${f.funcao}`} className="border-0 bg-transparent p-0 text-sm text-[var(--system-800)] underline cursor-pointer">Remover</button>}
                  </li>
                ))}
              </ul>
              {editavel && (
                <div className={`flex flex-wrap gap-2 ${f.contratacoes.length ? "mt-2" : ""}`}>
                  {opcoes.map(([h, rotulo]) => <button key={rotulo} type="button" className={BTN} disabled={vagas.length >= 20} onClick={() => adicionar(f.funcao, h)}>+ {rotulo}</button>)}
                </div>
              )}
            </div>
            <div className="a-res">
              <div className="sim-rot">Resultado</div>
              <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold text-[var(--text-strong)]" style={{ background: f.resultado.coberto ? "var(--func-success-100)" : "var(--func-attention-100)" }}>{f.resultado.coberto ? "Coberto" : "Ainda falta"}</span>
              <div className="mt-1 text-xs text-[var(--text-secondary)]">{f.resultado.coberto ? (f.resultado.horas > 0 ? `Sobram ${f.resultado.horas}h por semana` : "Sem sobra nem falta") : `Faltam ${f.resultado.horas}h por semana`}</div>
            </div>
            <div className="a-cus text-sm font-bold text-[var(--text-strong)]">
              <div className="sim-rot">Custo por mês</div>
              {dono ? (f.custoMensal == null || f.contratacoes.length === 0 ? "—" : `+${reais(f.custoMensal)}`) : "—"}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-card bg-[var(--surface-subtle)] px-6 py-4">
          <div>
            <strong className="block text-sm text-[var(--text-strong)]">{r.horaExtra === 0 || r.horaExtra == null ? "Sem hora extra" : `Hora extra: ${reais(r.horaExtra)} por mês`}</strong>
            <span className="text-xs text-[var(--text-secondary)]">{r.horaExtra === 0 || r.horaExtra == null ? `O quadro cobre as horas da regra de ${regraNome}.` : "Parte das horas que faltam seria coberta com hora extra."}</span>
          </div>
          <div className="text-right">
            <strong className="block text-base text-[var(--text-strong)]">{dono && r.folhaExtra != null ? `+${reais(r.folhaExtra)} por mês` : "—"}</strong>
            <span className="text-xs text-[var(--text-secondary)]">{total} {total === 1 ? "contratação simulada" : "contratações simuladas"}</span>
          </div>
        </div>
      </div>
    </Passo>
  );
}
