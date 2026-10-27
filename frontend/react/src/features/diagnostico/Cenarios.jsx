import { Cartao } from "../../components/ui/index.jsx";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (v) => `${String(v).replace(".", ",")}%`;
const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-4 py-2";
const TD = "px-4 py-2 border-t border-line";

function Numero({ rotulo, valor, legenda }) {
  return (
    <div className="border border-line rounded-card bg-white px-4 py-3 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{rotulo}</div>
      <div className="mt-1 text-2xl leading-8 font-bold text-ink-900">{valor}</div>
      <div className="mt-0.5 text-xs text-ink-500">{legenda}</div>
    </div>
  );
}

function HorarioSemana({ dias }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-700">
      {dias.map((d) => (
        <span key={d.dia} className={d.aberto ? "" : "text-ink-300"}>
          <strong className="font-medium">{NOMES_DIA[d.dia]}</strong> {d.aberto ? `${d.abre}–${d.fecha}` : "fechada"}
        </span>
      ))}
    </div>
  );
}

function Manter({ c, atual }) {
  const m = c.manter;
  const dono = m.custoAdicionalMensal !== undefined;
  return (
    <Cartao titulo="Cenário 1 · Manter horários" subtitulo={m.foco}>
      <div className="px-6 py-4 flex flex-col gap-4">
        <p className="m-0 text-sm text-ink-700">{m.direcionamento}</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <Numero
            rotulo="Contratar"
            valor={m.pessoasContratar}
            legenda={m.pessoasContratar === 1 ? "pessoa" : m.pessoasContratar === 0 ? "nada a contratar" : "pessoas"}
          />
          <Numero rotulo="Ociosidade" valor={pct(m.ociosidadePct)} legenda="das horas contratadas" />
          <Numero rotulo="Horário da loja" valor={`${m.horasSemana}h`} legenda={`por semana · igual ao atual (${atual.horasSemana}h)`} />
          {dono && (
            <Numero
              rotulo="Custo adicional"
              valor={m.custoAdicionalMensal === null ? "—" : brl(m.custoAdicionalMensal)}
              legenda={
                m.custoAdicionalMensal === null
                  ? "informe os salários médios em Custos"
                  : m.acrescimoPct === null
                    ? "por mês"
                    : `por mês · +${pct(m.acrescimoPct)} sobre a folha atual`
              }
            />
          )}
        </div>
        {m.contratacoes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[480px]">
              <thead>
                <tr><th className={TH}>Cargo</th><th className={TH}>Contratar</th><th className={TH}>Horas contratadas</th><th className={TH}>Ociosidade</th></tr>
              </thead>
              <tbody>
                {m.contratacoes.map((x) => (
                  <tr key={x.funcao}>
                    <td className={TD}>{x.funcao}</td>
                    <td className={TD}>
                      <strong>{x.pessoas}</strong> {x.pessoas === 1 ? "pessoa" : "pessoas"}
                      {x.parcialH && <span className="text-ink-500"> · parcial de {x.parcialH}h</span>}
                    </td>
                    <td className={TD}>{x.horasContratadas}h</td>
                    <td className={TD}>{pct(x.ociosidadePct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <HorarioSemana dias={m.horarioSemana} />
      </div>
    </Cartao>
  );
}

// Os cenários da regra escolhida no quadro central (42h ou 40h): a troca é só mudar `regraId` no pai.
export default function Cenarios({ cenarios }) {
  if (!cenarios) return null;
  return (
    <section aria-label="Cenários de decisão" className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-base font-bold">Cenários para a regra de {cenarios.regra.nome}</h2>
        <p className="mt-1 mb-0 text-sm text-ink-500">Estimativas para decidir o caminho. Nada aqui altera o cadastro nem cria funcionário.</p>
      </div>
      <Manter c={cenarios} atual={cenarios.atual} />
    </section>
  );
}
