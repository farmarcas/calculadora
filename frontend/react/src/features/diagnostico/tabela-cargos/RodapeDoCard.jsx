import { DicaComposicao, NOME_REGIME, pct } from "../Encargos.jsx";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const ROTULO = "text-xs leading-4 font-bold uppercase text-[var(--neutral-mid-300)]";
const LINK = "font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] bg-transparent border-0 p-0 cursor-pointer text-[13px] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]";
const ORIGEM = { mensal: "Cadastro da loja", dias: "Venda por dia do Cadastro × 52 ÷ 12", base: "Base comercial × 52 ÷ 12" };

// Rodapé do card: folha e faturamento (só vêm do servidor para o dono) e as pendências. Sem esses campos, os blocos não aparecem.
export default function RodapeDoCard({ diag, podeEscrever, onEnviar, onDefinirFuncao }) {
  const n = diag.numeros;
  const folha = diag.folhaMensal;
  const fat = diag.faturamentoMensal;
  const baseEnviada = !!diag.fontes?.base;

  const pendencias = [];
  if (n.foraDoCalculo > 0)
    pendencias.push({
      chave: "fora",
      texto: `${plural(n.foraDoCalculo, "colaborador", "colaboradores")} sem função de escala, fora do cálculo.`,
      acao: onDefinirFuncao && <button type="button" className={LINK} onClick={onDefinirFuncao}>Definir função</button>,
    });
  if (n.faixasSemFarmaceutico > 0) pendencias.push({ chave: "semfarm", texto: `${plural(n.faixasSemFarmaceutico, "hora", "horas")} do pior dia ficam sem farmacêutico.` });
  if (n.faixasAbaixoDoMinimo > 0) pendencias.push({ chave: "meta", texto: `${plural(n.faixasAbaixoDoMinimo, "hora", "horas")} do pior dia ficam abaixo da meta.` });
  const emDia = [n.faixasSemFarmaceutico === 0 && "cobertura", n.faixasAbaixoDoMinimo === 0 && "metas"].filter(Boolean);
  const frase = emDia.length ? `Sem pendências em ${emDia.join(" e ")}.` : null;
  const linkBase = podeEscrever ? (
    <button type="button" className={LINK} onClick={onEnviar}>{baseEnviada ? "Atualizar base comercial" : "Enviar base comercial"}</button>
  ) : (
    <span className="text-[13px]">{baseEnviada ? "Base comercial enviada" : "Base comercial não enviada"}</span>
  );

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-t border-line pt-3">
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        {folha && (
          <div className="flex flex-col gap-0.5" data-testid="rodape-folha">
            <div className={`${ROTULO} flex items-center gap-1.5`}>
              Folha mensal atual
              {folha.informado && folha.encargos && folha.mensal !== null && <DicaComposicao encargos={folha.encargos} rotulo="Como a folha é calculada" />}
            </div>
            {folha.informado ? (
              folha.mensal === null ? (
                <div className="text-[13px] leading-4 text-[var(--text-secondary)]">Falta o salário médio de {folha.faltamInformar.join(", ")}</div>
              ) : (
                <>
                  <div className="text-base leading-5 font-bold text-[var(--text-strong)]" data-testid="folha-pct-faturamento">
                    {brl(folha.mensal)}
                    <span className="text-[13px] font-normal text-[var(--text-secondary)]"> · {folha.pctDoFaturamento != null ? `${pct(folha.pctDoFaturamento)} do faturamento` : "sem faturamento para comparar"}</span>
                  </div>
                  <div className="text-[11px] leading-4 text-[var(--text-secondary)]">
                    Salários + encargos de {pct(folha.encargosPct)}{folha.encargos ? ` (${NOME_REGIME[folha.encargos.regime]})` : ""} · {plural(n.colaboradoresNoCalculo, "funcionário", "funcionários")}
                  </div>
                </>
              )
            ) : (
              <div className="text-[13px] leading-4 text-[var(--text-secondary)]">Dados do custo ainda não informados.</div>
            )}
          </div>
        )}
        {fat !== undefined && (
          <div className="flex flex-col gap-0.5" data-testid="rodape-faturamento">
            <div className={ROTULO}>Faturamento mensal da loja</div>
            <div className="text-base leading-5 font-bold text-[var(--text-strong)]">
              {fat ? brl(fat.valor) : "—"}
              <span className="text-[13px] font-normal text-[var(--text-secondary)]"> · {fat ? ORIGEM[fat.origem] : "Informe no Cadastro da loja"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-1 text-[13px] leading-5 text-[var(--text-secondary)]">
        {pendencias.map((p, i) => (
          <div key={p.chave} className="flex flex-wrap items-center gap-2">
            {i === 0 && <span className="rounded-full bg-[var(--func-attention-100)] px-2.5 py-0.5 text-xs leading-4 font-bold text-[var(--neutral-dark-900)]">{plural(pendencias.length, "pendência", "pendências")}</span>}
            <span>{p.texto}</span>
            {p.acao}
          </div>
        ))}
        <div>{frase && <>{frase} </>}{linkBase}{!baseEnviada && " (opcional)"}</div>
      </div>
    </div>
  );
}
