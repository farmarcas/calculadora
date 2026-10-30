import { useEffect, useState } from "react";
import { Passo } from "../../components/ui/index.jsx";
import GraficoVendas from "./GraficoVendas.jsx";
import { NOMES_DIA, faixa, lerHora, minutos } from "./formato.js";

const CAIXA = "rounded-card border border-[var(--border-subtle)] overflow-hidden";
const CAMPO = "h-10 w-16 rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-2 text-center text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)]";

const PASSO = "h-10 w-8 rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] text-base font-bold text-[var(--text-strong)] cursor-pointer hover:bg-[var(--surface-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-40";

const IconeErro = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
);

// Linha só de leitura: dia, faixa e total do dia.
const LinhaLeitura = ({ d }) => (
  <li className="flex min-h-11 items-center gap-3 border-t border-[var(--border-subtle)] px-4 text-sm first:border-t-0">
    <strong className="w-12 text-[var(--text-strong)]">{NOMES_DIA[d.dia]}</strong>
    <span className={`flex-1 ${d.aberta ? "text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}`}>{faixa(d)}</span>
    <span className="text-xs text-[var(--text-secondary)]">{d.aberta ? `${d.horas}h` : "—"}</span>
  </li>
);

// Linha editável: abertura e fechamento (HH:mm). O erro aparece em texto e ícone, ligado ao campo.
function LinhaEditavel({ d, cad, texto, tocado, onTexto, onTocado, onAjustar, onFechar, onReabrir, ultimoAberto }) {
  const erroH = (() => {
    if (!cad.aberta || texto.fechado) return null;
    const a = lerHora(texto.abre);
    const f = lerHora(texto.fecha, true);
    if (!a || !f) return "Use o formato HH:mm (ex.: 08:00).";
    if (minutos(f) <= minutos(a)) return "O fechamento precisa ser depois da abertura.";
    return null;
  })();
  const erro = tocado && erroH;
  const a0 = lerHora(texto.abre);
  const f0 = lerHora(texto.fecha, true);
  // Cada passo mexe 1 hora no fechamento: não deixa fechar antes de 1 h depois da abertura nem passar de 24:00.
  const podeMenos = !!a0 && !!f0 && minutos(f0) - 60 >= minutos(a0) + 60;
  const podeMais = !!f0 && minutos(f0) + 60 <= 24 * 60;
  const idErro = `erro-horario-${d.dia}`;
  if (!cad.aberta)
    return (
      <li className="flex min-h-[52px] items-center gap-3 border-t border-[var(--border-subtle)] px-4 text-sm first:border-t-0">
        <strong className="w-12 text-[var(--text-strong)]">{NOMES_DIA[d.dia]}</strong>
        <input disabled aria-label={`${NOMES_DIA[d.dia]}: fechado no Cadastro`} value="Fechado" readOnly className={`${CAMPO} w-full flex-1 bg-[var(--surface-muted)] text-[var(--text-secondary)]`} />
        <span className="w-8 text-right text-xs text-[var(--text-secondary)]">—</span>
      </li>
    );
  if (texto.fechado)
    return (
      <li className="border-t border-[var(--border-subtle)] px-4 py-1.5 first:border-t-0">
        <div className="flex min-h-10 items-center gap-2">
          <div className="w-11 shrink-0">
            <strong className="block text-sm leading-4 text-[var(--text-strong)]">{NOMES_DIA[d.dia]}</strong>
            <span className="text-xs leading-4 text-[var(--text-secondary)]">—</span>
          </div>
          <input disabled readOnly aria-label={`${NOMES_DIA[d.dia]}: fechado nesta simulação`} value="Fechado nesta simulação" className={`${CAMPO} w-full flex-1 bg-[var(--surface-muted)] text-[var(--text-secondary)]`} />
          <button type="button" className="h-10 shrink-0 rounded-[6px] border border-[var(--system-500)] bg-transparent px-3 text-xs font-bold text-[var(--system-500)] cursor-pointer hover:bg-[var(--system-50)] focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]" onClick={onReabrir}>Reabrir</button>
        </div>
        <span className="mt-1 inline-block rounded-full bg-[var(--color-primary-soft)] px-2 text-[11px] font-bold text-[var(--system-800)]">Alterado</span>
      </li>
    );
  return (
    <li className="border-t border-[var(--border-subtle)] px-4 py-1.5 first:border-t-0">
      <div className="flex min-h-10 items-center gap-2">
        <div className="w-11 shrink-0">
          <strong className="block text-sm leading-4 text-[var(--text-strong)]">{NOMES_DIA[d.dia]}</strong>
          <span className="text-xs leading-4 text-[var(--text-secondary)]">{d.aberta ? `${d.horas}h` : ""}</span>
        </div>
        <input aria-label={`${NOMES_DIA[d.dia]}: abertura`} inputMode="numeric" maxLength={5} placeholder="HH:mm" className={CAMPO} value={texto.abre} aria-invalid={!!erro} aria-describedby={erro ? idErro : undefined}
          onChange={(e) => onTexto({ ...texto, abre: e.target.value })} onBlur={onTocado} />
        <span aria-hidden="true" className="text-[var(--text-secondary)]">–</span>
        <input aria-label={`${NOMES_DIA[d.dia]}: fechamento`} inputMode="numeric" maxLength={5} placeholder="HH:mm" className={CAMPO} value={texto.fecha} aria-invalid={!!erro} aria-describedby={erro ? idErro : undefined}
          onChange={(e) => onTexto({ ...texto, fecha: e.target.value })} onBlur={onTocado} />
        <div role="group" aria-label={`${NOMES_DIA[d.dia]}: horas abertas`} className="ml-auto flex shrink-0 gap-1">
          <button type="button" className={PASSO} disabled={!!erroH || !podeMenos} aria-label={`Reduzir 1 hora do fechamento de ${NOMES_DIA[d.dia]}`} title="Fechar 1 hora mais cedo" onClick={() => onAjustar(-1)}>−</button>
          <button type="button" className={PASSO} disabled={!!erroH || !podeMais} aria-label={`Aumentar 1 hora no fechamento de ${NOMES_DIA[d.dia]}`} title="Fechar 1 hora mais tarde" onClick={() => onAjustar(1)}>+</button>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        {d.alterado && !erro ? <span className="inline-block rounded-full bg-[var(--color-primary-soft)] px-2 text-[11px] font-bold text-[var(--system-800)]">Alterado</span> : <span />}
        <button type="button" className="border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-link)] underline cursor-pointer disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50" disabled={ultimoAberto} title={ultimoAberto ? "A loja precisa ficar aberta em ao menos um dia" : `Fechar a loja na ${NOMES_DIA[d.dia]}`} onClick={onFechar}>Fechar dia</button>
      </div>
      {erro && <p id={idErro} role="alert" className="m-0 mt-1 flex items-center gap-1 text-xs text-[var(--text-danger)]"><IconeErro />{erro}</p>}
    </li>
  );
}

export default function PassoHorario({ sim, editavel, modo, onSalvarHorarios }) {
  const r = sim.resultado;
  const [dia, setDia] = useState(() => Math.max(0, r.horario.cadastro.findIndex((c) => c.aberta)));
  const [texto, setTexto] = useState([]);
  const [tocado, setTocado] = useState([]);

  // O texto dos campos nasce do horário simulado e volta a ele quando a simulação muda de fora (restaurar, trocar).
  const assinatura = JSON.stringify(r.horario.dias.map((d) => [d.abre, d.fecha, d.aberta]));
  useEffect(() => {
    setTexto(r.horario.dias.map((d, i) => ({ abre: d.abre ?? r.horario.cadastro[i].abre ?? "", fecha: d.fecha ?? r.horario.cadastro[i].fecha ?? "", fechado: !d.aberta && r.horario.cadastro[i].aberta })));
    setTocado([]);
  }, [assinatura, sim.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = (i, novo) => {
    const lista = texto.map((t, j) => (j === i ? novo : t));
    setTexto(lista);
    // Só manda quando todos os dias abertos estão válidos; o erro aparece ao sair do campo.
    const dias = r.horario.cadastro.map((c, j) => {
      if (!c.aberta || lista[j].fechado) return { aberta: false };
      const a = lerHora(lista[j].abre);
      const f = lerHora(lista[j].fecha, true);
      return a && f && minutos(f) > minutos(a) ? { aberta: true, abre: a, fecha: f } : null;
    });
    if (dias.every(Boolean)) onSalvarHorarios({ versao: 2, dias });
  };

  // − e +: fecha 1 hora mais cedo ou mais tarde (o campo de fechamento acompanha).
  const ajustar = (i, delta) => {
    const f = lerHora(texto[i].fecha, true);
    if (!f) return;
    const m = minutos(f) + delta * 60;
    mudar(i, { ...texto[i], fecha: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}` });
  };

  const fechar = (i) => mudar(i, { ...texto[i], fechado: true });
  const reabrir = (i) => mudar(i, { abre: r.horario.cadastro[i].abre, fecha: r.horario.cadastro[i].fecha, fechado: false });
  const abertosAgora = texto.filter((t, i) => r.horario.cadastro[i].aberta && !t.fechado).length;

  const editando = modo === "mudar" && editavel;
  const totalLinha = (
    <p className="m-0 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
      <strong className="text-[var(--text-strong)]">{r.horasAbertas}h abertas por semana</strong> · antes {r.horasAbertasAntes}h
    </p>
  );

  return (
    <Passo numero={1} titulo="Horário e vendas" subtitulo={modo === "manter" ? "Os horários seguem o Cadastro. Para testar outros dias e horas, escolha \"Mudar horários\" acima." : "Edite os dias e horários da loja para testar outro funcionamento. O Cadastro não muda."}>
      <div className="sim-passo1">
        <div className={CAIXA}>
          <div className="bg-[var(--surface-subtle)] px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase text-[var(--text-strong)]">Horário da loja</span>
              {editando ? (
                <button type="button" className="border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-link)] underline cursor-pointer" onClick={() => onSalvarHorarios(null)}>Restaurar do Cadastro</button>
              ) : (
                <span className="text-xs text-[var(--text-secondary)]">{r.horario.mudou ? "Editado nesta simulação" : "Igual ao Cadastro"}</span>
              )}
            </div>
            {editando && <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Edite abertura e fechamento de cada dia.</p>}
          </div>
          <ul className="m-0 list-none p-0">
            {r.horario.dias.map((d, i) =>
              editando && texto[i] ? (
                <LinhaEditavel key={d.dia} d={d} cad={r.horario.cadastro[i]} texto={texto[i]} tocado={!!tocado[i]} onTexto={(t) => mudar(i, t)} onTocado={() => setTocado((x) => { const n = [...x]; n[i] = true; return n; })} onAjustar={(delta) => ajustar(i, delta)} onFechar={() => fechar(i)} onReabrir={() => reabrir(i)} ultimoAberto={abertosAgora <= 1} />
              ) : (
                <LinhaLeitura key={d.dia} d={d} />
              ),
            )}
          </ul>
          {totalLinha}
        </div>
        <GraficoVendas resultado={r} dia={dia} onDia={setDia} modo={modo} />
      </div>
    </Passo>
  );
}
