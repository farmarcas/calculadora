import { Aviso, Cartao, Ficha } from "../../components/ui/index.jsx";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (v) => `${String(v).replace(".", ",")}%`;
const NOMES_DIA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const TH = "text-left text-[11px] font-bold uppercase tracking-wide text-ink-500 px-4 py-2";
const TD = "px-4 py-2 border-t border-line";

// Quando o valor de venda não vem: sem nenhuma fonte, ou escondido de quem não é o dono (venda estimada pelo cadastro).
const semVenda = (c) =>
  c._origem === "cadastro" ? "valores de venda só para o dono" : "informe o faturamento da loja no Cadastro ou envie a base comercial";

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
const Impacto = ({ valor, detalhe = "custo adicional + margem perdida" }) =>
  valor == null ? null : (
    <p className="m-0 text-xs text-ink-500">
      Impacto financeiro estimado: <strong className="text-ink-700">{brl(valor)}</strong> por mês ({detalhe}).
    </p>
  );

const textoContratacao = (c) => {
  const parcial = c.parcial ? `1 parcial de ${c.parcial.turnos} turno${c.parcial.turnos === 1 ? "" : "s"} (${c.parcial.horas}h)` : "";
  if (c.inteiras === 0) return `${c.funcao}: ${parcial}`;
  return `${c.funcao}: ${c.inteiras} inteira${c.inteiras === 1 ? "" : "s"}${parcial ? ` e ${parcial}` : ""}`;
};
const textoAdicional = (a) =>
  `${a.funcao}: ${[a.inteiras > 0 && `+${a.inteiras} inteira${a.inteiras === 1 ? "" : "s"}`, a.horasParciais > 0 && `+${a.horasParciais}h de parcial`].filter(Boolean).join(" e ")}`;

// O que contratar já (fase de 42h) e o que se acrescenta depois (fase de 40h), por cargo.
function Etapas({ etapas }) {
  if (!etapas || (etapas.etapa1.length === 0 && etapas.etapa2.length === 0)) return null;
  const custo = etapas.custoEtapa1Mensal !== undefined;
  return (
    <div className="rounded-lg bg-surface-subtle p-4 text-sm flex flex-col gap-2" aria-label="Contratação em etapas">
      <div>
        <strong>Etapa 1 · já para a fase de 42h</strong> <span className="text-ink-500">(a partir de {etapas.vigencia1})</span>
        <div className="text-ink-700">{etapas.etapa1.length ? etapas.etapa1.map(textoContratacao).join(" · ") : "Nada a contratar nesta fase."}</div>
        {custo && etapas.custoEtapa1Mensal !== null && <div className="text-xs text-ink-500">{brl(etapas.custoEtapa1Mensal)} por mês</div>}
      </div>
      <div>
        <strong>Etapa 2 · adicional para a fase de 40h</strong> <span className="text-ink-500">(a partir de {etapas.vigencia2})</span>
        <div className="text-ink-700">{etapas.adicional.length ? etapas.adicional.map(textoAdicional).join(" · ") : "Nenhum adicional: a fase de 40h não pede mais gente que a de 42h."}</div>
        {custo && etapas.custoAdicionalMensal !== null && <div className="text-xs text-ink-500">+{brl(etapas.custoAdicionalMensal)} por mês sobre a etapa 1 ({brl(etapas.custoEtapa2Mensal)} no total)</div>}
      </div>
    </div>
  );
}

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
          {dono && (
            <Numero rotulo="Custo por ano" valor={m.custoAnual === null ? "—" : brl(m.custoAnual)} legenda={m.custoAnual === null ? "informe os salários médios em Custos" : "mensal × 12"} />
          )}
          {dono && (
            <Numero
              rotulo="Peso no faturamento"
              valor={m.impactoPctFaturamento === null ? "—" : pct(m.impactoPctFaturamento)}
              legenda={m.faturamentoMensalRef === null ? "informe o faturamento da loja no Cadastro" : `do faturamento mensal (${brl(m.faturamentoMensalRef)})`}
            />
          )}
        </div>
        <Etapas etapas={c._etapas} />
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
                      <span className="text-ink-500">
                        {x.inteiras > 0 && ` · ${x.inteiras} inteira${x.inteiras === 1 ? "" : "s"}`}
                        {x.parcial && ` · 1 parcial de ${x.parcial.turnos} turno${x.parcial.turnos === 1 ? "" : "s"} (${x.parcial.horas}h)`}
                        {x.ajustado && " · ajustado pelas horas"}
                      </span>
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

const origemTexto = {
  base: "venda da base comercial somada por dia da semana",
  cadastro: "faturamento por dia da semana do cadastro",
  estimativa: "estimativa: só o faturamento mensal, dividido igualmente entre os dias abertos",
};

function Economia({ c }) {
  const e = c.economia;
  // Valores em reais só chegam para o dono; para os outros o campo nem existe.
  const dono = e.margemCortadaMes !== undefined;
  const sem = dono && e.margemCortadaMes === null;
  return (
    <Cartao titulo="Cenário 2 · Foco em economia" subtitulo={e.foco} acoes={<Selo ativo={c.destaque === "economia"} />}>
      <div className="px-6 py-4 flex flex-col gap-4">
        {e.viavel && <p className="m-0 text-sm text-ink-700">{e.direcionamento}</p>}
        <Impacto valor={e.impactoMensal} />
        {e.naoRecomendado && <Aviso tom="erro">{e.naoRecomendado.texto}</Aviso>}
        {!e.viavel ? (
          <Aviso tom="atencao">{e.motivoInviavel}</Aviso>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Numero
                rotulo="Dias a fechar"
                valor={e.diasFechar.length}
                legenda={e.diasFechar.length === 0 ? "nenhum: a equipe já cobre" : e.diasFechar.map((d) => NOMES_DIA[d.dia]).join(", ")}
              />
              <Numero rotulo="Horário da loja" valor={`${e.horasSemana}h`} legenda={`por semana · hoje ${c.atual.horasSemana}h (${e.horasReduzir}h a menos)`} />
              {dono && (
                <Numero rotulo="Venda que deixa de entrar" valor={sem ? "—" : brl(e.vendaCortadaMes)} legenda={sem ? semVenda(c) : "por mês (estimativa)"} />
              )}
              {dono && (
                <Numero rotulo="Margem perdida" valor={sem ? "—" : brl(e.margemCortadaMes)} legenda={sem ? semVenda(c) : "por mês (estimativa)"} />
              )}
            </div>
            {e.diasFechar.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm min-w-[480px]">
                  <thead>
                    <tr>
                      <th className={TH}>Dia</th>
                      {dono && <th className={TH}>Venda por mês</th>}
                      {dono && <th className={TH}>Margem por mês</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {e.diasFechar.map((x) => (
                      <tr key={x.dia}>
                        <td className={TD}>{NOMES_DIA[x.dia]}{c.diasProtegidos?.includes(x.dia) && <span className="text-error-600"> · dia protegido</span>}</td>
                        {dono && <td className={TD}>{x.vendaMes == null ? "—" : brl(x.vendaMes)}</td>}
                        {dono && <td className={TD}>{x.margemMes == null ? "—" : brl(x.margemMes)}</td>}
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
            {c.origemVenda && <p className="m-0 text-xs text-ink-500">Origem da venda: {origemTexto[c.origemVenda]}. Dias protegidos (os 3 de maior faturamento): {c.diasProtegidos.length ? c.diasProtegidos.map((d) => NOMES_DIA[d]).join(", ") : "nenhum"}.</p>}
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
            {q.coincideComManter && <Aviso tom="neutro">O equilíbrio para esta loja é o mesmo do Cenário 1: contratar tudo e manter todos os dias abertos.</Aviso>}
            {q.coincideComEconomia && <Aviso tom="neutro">O equilíbrio para esta loja é o mesmo do Cenário 2: fechar os dias e não contratar ninguém.</Aviso>}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Numero
                rotulo="Dias a fechar"
                valor={q.diasFechar.length}
                legenda={q.diasFechar.length === 0 ? "nenhum dia" : q.diasFechar.map((d) => NOMES_DIA[d.dia]).join(", ")}
              />
              <Numero rotulo="Contratar" valor={q.pessoasContratar} legenda={q.pessoasContratar === 1 ? "pessoa" : q.pessoasContratar === 0 ? "nada a contratar" : "pessoas"} />
              {dono && <Numero rotulo="Margem perdida" valor={q.margemCortadaMes === null ? "—" : brl(q.margemCortadaMes)} legenda="por mês (estimativa)" />}
              {dono && q.resultadoMensal != null && (
                <Numero rotulo="Resultado" valor={brl(q.resultadoMensal)} legenda="margem dos dias abertos menos a folha adicional, por mês" />
              )}
              {dono && (
                <Numero
                  rotulo="Custo adicional"
                  valor={q.custoAdicionalMensal === null ? "—" : brl(q.custoAdicionalMensal)}
                  legenda={q.acrescimoPct == null ? "por mês" : `por mês · +${pct(q.acrescimoPct)} sobre a folha atual`}
                />
              )}
            </div>
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
                          <span className="text-ink-500">
                            {x.inteiras > 0 && ` · ${x.inteiras} inteira${x.inteiras === 1 ? "" : "s"}`}
                            {x.parcial && ` · 1 parcial de ${x.parcial.turnos} turno${x.parcial.turnos === 1 ? "" : "s"} (${x.parcial.horas}h)`}
                          </span>
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

function Estender({ c }) {
  const e = c.estender;
  if (!e) return null;
  const dono = e.custoAdicionalMensal !== undefined;
  const sem = e.margemRefMes === null;
  return (
    <Cartao titulo="Cenário 4 · Estender horário" subtitulo={e.foco}>
      <div className="px-6 py-4 flex flex-col gap-4">
        {!e.disponivel ? (
          <Aviso tom="atencao">{e.motivoIndisponivel}</Aviso>
        ) : (
          <>
            <p className="m-0 text-sm text-ink-700">{e.direcionamento}</p>
            <Impacto valor={e.impactoMensal} detalhe="custo adicional − margem de referência" />
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Numero rotulo="Estender" valor={`${e.horasEstender}h`} legenda="por semana, sem contratar a mais" />
              <Numero rotulo="Horário da loja" valor={`${e.horasSemana}h`} legenda={`por semana · hoje ${c.atual.horasSemana}h`} />
              <Numero
                rotulo="Margem de referência"
                valor={sem ? "—" : brl(e.margemRefMes)}
                legenda={sem ? semVenda(c) : "por mês (referência, não previsão)"}
              />
              {dono && (
                <Numero
                  rotulo="Custo adicional"
                  valor={e.custoAdicionalMensal === null ? "—" : brl(e.custoAdicionalMensal)}
                  legenda="por mês · o mesmo do Cenário 1"
                />
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm min-w-[480px]">
                <thead>
                  <tr><th className={TH}>Dia</th><th className={TH}>Passa a abrir</th><th className={TH}>Venda de referência por semana</th></tr>
                </thead>
                <tbody>
                  {e.extensoes.map((x) => (
                    <tr key={`${x.dia}${x.de}`}>
                      <td className={TD}>{NOMES_DIA[x.dia]}</td>
                      <td className={TD}>{x.de}–{x.ate}</td>
                      <td className={TD}>{x.vendaRef === null ? "—" : brl(x.vendaRef)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function Reduzir({ c }) {
  const q = c.reduzir;
  if (!q) return null;
  const dono = q.economiaMensal !== undefined;
  return (
    <Cartao titulo="Cenário 5 · Reduzir equipe" subtitulo={q.foco}>
      <div className="px-6 py-4 flex flex-col gap-4">
        <p className="m-0 text-sm text-ink-700">{q.direcionamento}</p>
        {q.temExcedente && <Impacto valor={q.impactoMensal} detalhe="economia de folha" />}
        {q.temExcedente && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Numero
              rotulo="Pessoas a mais"
              valor={q.pessoasExcedentes}
              legenda="além do que o horário atual exige"
            />
            {dono && (
              <Numero
                rotulo="Economia de folha"
                valor={q.economiaMensal === null ? "—" : brl(q.economiaMensal)}
                legenda={
                  q.economiaMensal === null
                    ? "informe os salários médios em Custos"
                    : q.economiaPct === null
                      ? "por mês"
                      : `por mês · ${pct(q.economiaPct)} da folha atual`
                }
              />
            )}
          </div>
        )}
        {q.cargos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[480px]">
              <thead>
                <tr>
                  <th className={TH}>Cargo</th>
                  <th className={TH}>Hoje</th>
                  <th className={TH}>Necessárias</th>
                  <th className={TH}>A mais</th>
                  {dono && <th className={TH}>Economia por mês</th>}
                </tr>
              </thead>
              <tbody>
                {q.cargos.map((x) => (
                  <tr key={x.funcao}>
                    <td className={TD}>{x.funcao}</td>
                    <td className={TD}>{x.pessoasHoje}</td>
                    <td className={TD}>{x.pessoasNecessarias}</td>
                    <td className={TD}>{x.excedente > 0 ? <strong>{x.excedente}</strong> : 0}</td>
                    {dono && <td className={TD}>{x.excedente === 0 ? "—" : x.economiaMensal === null ? "—" : brl(x.economiaMensal)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {q.aviso && <Aviso tom="atencao">{q.aviso}</Aviso>}
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
  if (!c.vendasBase) falta.push("informe o faturamento da loja no Cadastro ou importe a base comercial");
  return (
    <Aviso tom="atencao">
      Para indicar o caminho de menor impacto financeiro, {falta.length ? falta.join(" e ") : "faltam dados para comparar os três cenários"}.
    </Aviso>
  );
}

// Os cenários da regra escolhida no quadro central (42h ou 40h): a troca é só mudar `regraId` no pai.
export default function Cenarios({ cenarios: bruto, origemVendas, etapas }) {
  if (!bruto) return null;
  // A origem da venda segue junto, para cada cartão explicar de onde vem (ou por que falta) o valor.
  const cenarios = { ...bruto, _origem: origemVendas, _etapas: etapas };
  return (
    <section aria-label="Cenários de decisão" className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-base font-bold">Cenários para a regra de {cenarios.regra.nome}</h2>
        <p className="mt-1 mb-0 text-sm text-ink-500">Estimativas para decidir o caminho. Nada aqui altera o cadastro nem cria funcionário.</p>
        {origemVendas === "cadastro" && (
          <p className="mt-1 mb-0 text-xs text-ink-500">Venda estimada a partir do faturamento cadastrado, dividido igualmente entre as horas abertas. Enviar a base comercial deixa a estimativa mais precisa.</p>
        )}
      </div>
      <Recomendacao c={cenarios} />
      <Manter c={cenarios} atual={cenarios.atual} />
      <Economia c={cenarios} />
      <Equilibrio c={cenarios} />
      <Estender c={cenarios} />
      <Reduzir c={cenarios} />
    </section>
  );
}
