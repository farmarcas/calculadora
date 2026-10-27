import { Aviso, Cartao, Ficha } from "../../components/ui/index.jsx";

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

const Selo = ({ ativo }) => (ativo ? <Ficha tom="ok">Menor impacto financeiro</Ficha> : null);

// Só o dono recebe `impactoMensal`: custo adicional + margem perdida, por mês.
const Impacto = ({ valor }) =>
  valor == null ? null : (
    <p className="m-0 text-xs text-ink-500">
      Impacto financeiro estimado: <strong className="text-ink-700">{brl(valor)}</strong> por mês (custo adicional + margem perdida).
    </p>
  );

function Manter({ c, atual }) {
  const m = c.manter;
  const dono = m.custoAdicionalMensal !== undefined;
  return (
    <Cartao titulo="Cenário 1 · Manter horários" subtitulo={m.foco} acoes={<Selo ativo={c.destaque === "manter"} />}>
      <div className="px-6 py-4 flex flex-col gap-4">
        <p className="m-0 text-sm text-ink-700">{m.direcionamento}</p>
        <Impacto valor={m.impactoMensal} />
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

function Economia({ c }) {
  const e = c.economia;
  const sem = e.vendaCortadaMes === null;
  return (
    <Cartao titulo="Cenário 2 · Foco em economia" subtitulo={e.foco} acoes={<Selo ativo={c.destaque === "economia"} />}>
      <div className="px-6 py-4 flex flex-col gap-4">
        <p className="m-0 text-sm text-ink-700">{e.direcionamento}</p>
        <Impacto valor={e.impactoMensal} />
        {!e.viavel ? (
          <Aviso tom="atencao">{e.motivoInviavel}</Aviso>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Numero rotulo="Reduzir" valor={`${e.horasReduzir}h`} legenda="por semana, com a equipe atual" />
              <Numero rotulo="Horário da loja" valor={`${e.horasSemana}h`} legenda={`por semana · hoje ${c.atual.horasSemana}h`} />
              <Numero
                rotulo="Venda cortada"
                valor={sem ? "—" : brl(e.vendaCortadaMes)}
                legenda={sem ? "sem base comercial para estimar" : "por mês (estimativa)"}
              />
              <Numero
                rotulo="Margem cortada"
                valor={sem ? "—" : brl(e.margemCortadaMes)}
                legenda={sem ? "sem base comercial para estimar" : "por mês (estimativa)"}
              />
            </div>
            {e.cortes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[480px]">
                  <thead>
                    <tr><th className={TH}>Dia</th><th className={TH}>Deixa de abrir</th><th className={TH}>Venda por semana</th></tr>
                  </thead>
                  <tbody>
                    {e.cortes.map((x) => (
                      <tr key={`${x.dia}${x.de}`}>
                        <td className={TD}>{NOMES_DIA[x.dia]}</td>
                        <td className={TD}>{x.de}–{x.ate}</td>
                        <td className={TD}>{x.venda === null ? "—" : brl(x.venda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-500">Novo horário</div>
              <HorarioSemana dias={e.horarioSemana} />
            </div>
            {e.aviso && <Aviso tom="atencao">{e.aviso}</Aviso>}
          </>
        )}
      </div>
    </Cartao>
  );
}

function Equilibrio({ c }) {
  const q = c.equilibrio;
  const dono = q.custoAdicionalMensal !== undefined;
  return (
    <Cartao titulo="Cenário 3 · Equilíbrio" subtitulo={q.foco} acoes={<Selo ativo={c.destaque === "equilibrio"} />}>
      <div className="px-6 py-4 flex flex-col gap-4">
        {q.indisponivel ? (
          <Aviso tom="atencao">{q.indisponivel.texto}</Aviso>
        ) : (
          <>
            <p className="m-0 text-sm text-ink-700">{q.direcionamento}</p>
            <Impacto valor={q.impactoMensal} />
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Numero rotulo="Fechar" valor={`${q.horasReduzir}h`} legenda={q.coincideComManter ? "nenhuma hora a fechar" : "por semana, onde não se paga"} />
              <Numero rotulo="Contratar" valor={q.pessoasContratar} legenda={q.pessoasContratar === 1 ? "pessoa" : q.pessoasContratar === 0 ? "nada a contratar" : "pessoas"} />
              <Numero rotulo="Margem perdida" valor={brl(q.margemCortadaMes)} legenda="por mês (estimativa)" />
              {dono && (
                <Numero
                  rotulo="Custo adicional"
                  valor={q.custoAdicionalMensal === null ? "—" : brl(q.custoAdicionalMensal)}
                  legenda={q.acrescimoPct == null ? "por mês" : `por mês · +${pct(q.acrescimoPct)} sobre a folha atual`}
                />
              )}
            </div>
            {q.cortes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[480px]">
                  <thead><tr><th className={TH}>Dia</th><th className={TH}>Deixa de abrir</th><th className={TH}>Margem por semana</th></tr></thead>
                  <tbody>
                    {q.cortes.map((x) => (
                      <tr key={`${x.dia}${x.de}`}>
                        <td className={TD}>{NOMES_DIA[x.dia]}</td>
                        <td className={TD}>{x.de}–{x.ate}</td>
                        <td className={TD}>{brl(x.margem)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {q.contratacoes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[480px]">
                  <thead><tr><th className={TH}>Cargo</th><th className={TH}>Contratar</th><th className={TH}>Ociosidade</th></tr></thead>
                  <tbody>
                    {q.contratacoes.map((x) => (
                      <tr key={x.funcao}>
                        <td className={TD}>{x.funcao}</td>
                        <td className={TD}>
                          <strong>{x.pessoas}</strong> {x.pessoas === 1 ? "pessoa" : "pessoas"}
                          {x.parcialH && <span className="text-ink-500"> · parcial de {x.parcialH}h</span>}
                        </td>
                        <td className={TD}>{pct(x.ociosidadePct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink-500">Horário da loja · {q.horasSemana}h por semana</div>
              <HorarioSemana dias={q.horarioSemana} />
            </div>
          </>
        )}
      </div>
    </Cartao>
  );
}

const NOME_CENARIO = { manter: "Cenário 1 · Manter horários", economia: "Cenário 2 · Foco em economia", equilibrio: "Cenário 3 · Equilíbrio" };

// Só o dono vê: o caminho de menor impacto, ou o que falta para poder indicá-lo.
function Recomendacao({ c }) {
  if (c.destaque === undefined) return null;
  if (c.destaque) {
    const impacto = c[c.destaque].impactoMensal;
    return (
      <Aviso tom="ok">
        <strong>Menor impacto financeiro: {NOME_CENARIO[c.destaque]}</strong> ({brl(impacto)} por mês, somando custo adicional e margem perdida).
      </Aviso>
    );
  }
  const falta = [];
  if (c.manter.custoAdicionalMensal === null) falta.push("informe os salários médios nos custos da loja");
  if (!c.vendasBase) falta.push("importe a base comercial");
  return (
    <Aviso tom="atencao">
      Para indicar o caminho de menor impacto financeiro, {falta.length ? falta.join(" e ") : "faltam dados para comparar os três cenários"}.
    </Aviso>
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
      <Recomendacao c={cenarios} />
      <Manter c={cenarios} atual={cenarios.atual} />
      <Economia c={cenarios} />
      <Equilibrio c={cenarios} />
    </section>
  );
}
