import { useRef } from "react";
import { Chave } from "../../components/ui/index.jsx";
import { NOMES_DIA, copiarHorarioDaSegunda, erroDoDia, faturamentoDaSemana, horasDaSemana, horasDoDia, lojaEh24h, semana24h } from "./calculos.js";

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]";
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const IconeErro = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
);

// Tabela única do funcionamento: uma linha por dia, com o faturamento médio do dia (só o dono) na mesma linha.
export default function TabelaFuncionamento({ horarios, faturamento, dono, editavel, mostrarErros, onHorarios, onFaturamento }) {
  const antes24 = useRef(null);
  const colunas = dono ? "76px 116px 84px 84px 64px minmax(110px,1fr) 52px" : "90px 130px 100px 100px 80px 60px";
  const dia = (i, parte) => onHorarios({ ...horarios, dias: horarios.dias.map((d, j) => (j === i ? { ...d, ...parte } : d)) });
  const fatDia = (i, v) => onFaturamento({ ...faturamento, dias: faturamento.dias.map((x, j) => (j === i ? v : x)) });

  const alternarAberta = (i, aberta) => {
    if (aberta) dia(i, { aberta: true, h24: false, abre: horarios.dias[i].abre || "08:00", fecha: horarios.dias[i].fecha || "20:00" });
    else {
      dia(i, { aberta: false });
      // O faturamento de um dia fechado não existe: o valor digitado é descartado.
      if (dono && faturamento?.dias[i] !== "") fatDia(i, "");
    }
  };
  const loja24h = (liga) => {
    if (liga) {
      antes24.current = horarios;
      onHorarios(semana24h());
    } else onHorarios(antes24.current ?? { ...horarios, dias: horarios.dias.map((d) => ({ ...d, h24: false, abre: "08:00", fecha: "22:00" })) });
  };

  return (
    <section aria-labelledby="titulo-funcionamento">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h3 id="titulo-funcionamento" className="m-0 text-base font-bold text-[var(--text-strong)]">Funcionamento{dono ? " e faturamento" : ""} da semana</h3>
          <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Informe o horário de cada dia{dono ? " e o faturamento médio que a loja faz nele" : ""}.</p>
        </div>
        {editavel && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <label className="flex items-center gap-2 text-[var(--text-strong)]">
              <Chave marcado={lojaEh24h(horarios)} onChange={loja24h} rotulo="Loja 24 horas" />Loja 24 horas
            </label>
            <button type="button" className="border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={() => onHorarios(copiarHorarioDaSegunda(horarios))}>Copiar horário da segunda para os outros dias</button>
          </div>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-card border border-[var(--border-subtle)]">
        <div className="cl-func-cab bg-[var(--surface-subtle)] px-4 py-3 text-xs font-bold uppercase text-[var(--text-strong)]" style={{ "--cl-cols": colunas }}>
          <span>Dia</span><span>Situação</span><span>Abre</span><span>Fecha</span><span>24 horas</span>{dono && <span>Faturamento médio</span>}<span className="text-right">Horas</span>
        </div>
        {horarios.dias.map((d, i) => {
          const erro = mostrarErros ? erroDoDia(d) : null;
          const idErro = `erro-dia-${i}`;
          const fechada = !d.aberta;
          const bloqueado = fechada || d.h24 || !editavel;
          return (
            <div key={i} className="cl-func-linha border-t border-[var(--border-subtle)] px-4 py-2" style={{ "--cl-cols": colunas }}>
              <strong className="text-sm text-[var(--text-strong)]">{NOMES_DIA[i]}</strong>
              <label className="flex items-center gap-2 text-sm text-[var(--text-strong)]">
                <Chave marcado={d.aberta} onChange={(v) => alternarAberta(i, v)} rotulo={`${NOMES_DIA[i]}: aberta`} desabilitado={!editavel} />{d.aberta ? "Aberta" : "Fechada"}
              </label>
              {["abre", "fecha"].map((k) => (
                <div key={k} className="cl-func-hora">
                  <span className="cl-func-rot">{k === "abre" ? "Abre" : "Fecha"}</span>
                  <input data-campo={`dia-${i}`} aria-label={`${NOMES_DIA[i]}: ${k === "abre" ? "abertura" : "fechamento"}`} inputMode="numeric" maxLength={5} placeholder={bloqueado ? "—" : "HH:mm"} className={CAMPO}
                    disabled={bloqueado} aria-invalid={!!erro} aria-describedby={erro ? idErro : undefined} value={bloqueado ? (fechada ? "" : k === "abre" ? "00:00" : "00:00") : d[k] ?? ""}
                    onChange={(e) => dia(i, { [k]: e.target.value })} />
                </div>
              ))}
              <label className="flex items-center gap-2 text-sm text-[var(--text-strong)]">
                <input type="checkbox" className="h-4 w-4" checked={!!d.h24} disabled={fechada || !editavel} onChange={(e) => dia(i, e.target.checked ? { h24: true, abre: "00:00", fecha: "00:00" } : { h24: false, abre: "08:00", fecha: "20:00" })} />24h
              </label>
              {dono && (
                <div className="cl-func-fat">
                  <span className="cl-func-rot">Faturamento médio</span>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">R$</span>
                    <input data-campo={`fat-${i}`} type="number" min={0} step="any" aria-label={`Faturamento médio de ${NOMES_DIA[i]}`} placeholder={fechada ? "—" : ""} className={`${CAMPO} pl-8`} disabled={fechada || !editavel}
                      value={fechada ? "" : faturamento?.dias[i] ?? ""} onChange={(e) => fatDia(i, e.target.value)} />
                  </div>
                </div>
              )}
              <span className="cl-func-horas text-right text-sm text-[var(--text-strong)]"><span className="cl-func-rot">Horas</span>{fechada ? "—" : `${horasDoDia(d)}h`}</span>
              {erro && <p id={idErro} role="alert" className="cl-func-erro m-0 flex items-center gap-1 text-xs text-[var(--text-danger)]"><IconeErro />{erro}</p>}
            </div>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-strong)]">
          <strong aria-live="polite">{horasDaSemana(horarios)}h abertas por semana</strong>
          {dono && <span aria-live="polite"><strong>{brl(faturamentoDaSemana(horarios, faturamento?.dias))}</strong> por semana</span>}
        </div>
      </div>
    </section>
  );
}
