import { corDaFuncao } from "../../simulacao/formato.js";
import { horas, saldoTxt } from "../cardDiagnostico.js";
import { equipeToda, seta, textoHoras } from "./tabela-regras.js";

const TH = "px-1 sm:px-2 py-1.5 text-[11px] sm:text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]";
// Em tela estreita os números quebram de linha ("78h →" / "120h") para a tabela caber sem rolagem lateral.
const NUM = "px-1 sm:px-2 py-2 text-right text-xs sm:text-[13px] leading-4 text-[var(--text-strong)] sm:whitespace-nowrap";

// Pílulas de status: com texto, nunca só cor. "Obrigatório" escuro, "Desejável" só com contorno, "Sem falta" em texto.
function Status({ status }) {
  if (status === "obrigatorio") return <span className="rounded-full bg-[var(--neutral-dark-900)] px-2 py-0.5 text-[11px] leading-4 font-bold text-white">Obrigatório</span>;
  if (status === "desejavel") return <span className="rounded-full border border-[var(--border-strong)] px-2 py-0.5 text-[11px] leading-4 font-bold text-[var(--text-strong)]">Desejável</span>;
  return <span className="text-[11px] leading-4 text-[var(--text-secondary)]">Sem falta</span>;
}

// A falta por semana: "21h → 0h" com o 0h final numa pílula verde (texto, não só cor); sem falta fica "—".
function Falta({ falta }) {
  if (falta.hoje <= 0 && falta.depois <= 0) return <>—</>;
  return (
    <>
      {horas(falta.hoje)} →{" "}
      {falta.depois <= 0 ? <span className="rounded-full bg-[var(--func-success-100)] px-1.5 py-0.5 font-bold text-[var(--neutral-dark-900)]">0h</span> : horas(falta.depois)}
    </>
  );
}

export default function TabelaPorCargo({ regra, linhas, horasAbertas, jornada }) {
  const total = equipeToda(regra, linhas);
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Equipe por cargo: hoje e com a sugestão</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={`${TH} text-left`}>Cargo</th>
              <th scope="col" className={`${TH} text-right`}>Pessoas</th>
              <th scope="col" className={`${TH} text-right`}>Horas por semana</th>
              <th scope="col" className={`${TH} text-right`}>Falta por semana</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[var(--surface-subtle)]">
              <th scope="row" className="px-2 py-2 text-left text-[13px] leading-4 font-normal text-[var(--text-secondary)]">Loja aberta na semana</th>
              <td className={NUM} />
              <td className={`${NUM} font-bold`}>{horasAbertas != null ? horas(horasAbertas) : "—"}</td>
              <td className={NUM} />
            </tr>
            {linhas.map((l) => (
              <tr key={l.funcao} className="border-b border-line">
                <th scope="row" className="px-1 sm:px-2 py-2 text-left font-normal">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {/* Tags: o board usa verde, azul e âmbar; aqui vale a cor do cargo que o sistema já usa (corDaFuncao). */}
                    <span className="rounded-full px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs leading-4 font-bold text-[var(--neutral-dark-900)]" style={{ background: corDaFuncao(l.funcao) }}>{l.funcao}</span>
                    <Status status={l.status} />
                  </div>
                  {l.turnosAcobrir > 0 && <div className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">{l.turnosAcobrir} {l.turnosAcobrir === 1 ? "turno" : "turnos"} a cobrir</div>}
                  {l.sobraH > 0 && <div className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">sobram {horas(l.sobraH)}</div>}
                </th>
                <td className={NUM}>{seta(l.pessoas.hoje, l.pessoas.depois)}</td>
                <td className={NUM}>{textoHoras(l.horas)}</td>
                <td className={NUM}><Falta falta={l.falta} /></td>
              </tr>
            ))}
            <tr className="border-t-2 border-[var(--neutral-dark-900)] font-bold">
              <th scope="row" className="px-2 py-2 text-left text-[13px] leading-4 font-bold text-[var(--text-strong)]">Equipe toda</th>
              <td className={NUM}>{seta(total.pessoas.hoje, total.pessoas.depois)}</td>
              <td className={NUM}>{textoHoras(total.horas)}</td>
              <td className={NUM}>
                {saldoTxt(total.folga.hoje)} → <span className={total.folga.depois > 0 ? "text-[var(--text-success-strong)]" : ""}>{saldoTxt(total.folga.depois)}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="m-0 text-[11px] leading-4 text-[var(--text-secondary)]">
        Obrigatório: a loja precisa de farmacêutico em todo o horário. Desejável: mantém o serviço de hoje. Cada pessoa nova dá {horas(jornada)} por semana.
      </p>
    </div>
  );
}
