import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Chave } from "../../components/ui/index.jsx";
import { AlertaRegime, ComposicaoEncargos, NOME_REGIME, pct } from "../diagnostico/Encargos.jsx";
import MinimoPessoas from "./MinimoPessoas.jsx";
import { FUNCOES, errosDosTurnos } from "./turnos.js";

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)]";

// Convenção, mínimos e turnos como a tela edita (modo "turnos" ou "unico"; o que não está em uso fica guardado).
export const baseDaConfiguracao = (config) => ({
  convencao8h24: !!config.convencao8h24,
  minimos: Object.fromEntries(FUNCOES.map((f) => [f, config.minimos?.[f] ?? (f === "Farmacêutico" ? 1 : 0)])),
  turnos: config.turnos ?? null,
  modoMinimo: config.modoMinimo === "unico" || !config.turnos?.length ? (config.modoMinimo === "turnos" && !config.turnos?.length ? "unico" : config.modoMinimo ?? "unico") : "turnos",
});
export const baseDosCustos = (r, padrao) => ({
  salarioMedio: Object.fromEntries(FUNCOES.map((f) => [f, r.custos?.salarioMedio?.[f] == null ? "" : String(r.custos.salarioMedio[f])])),
  ratPct: String(r.encargos.ratPct),
  fap: String(r.encargos.fap),
  rescisaoLigada: !!r.encargos.rescisaoLigada,
  _padrao: padrao,
});

// Blocos da tela → corpo da API (só as chaves que mudaram, exceto custos, que a rota grava inteiro).
export const configuracaoParaApi = (parte) => {
  const out = {};
  if ("convencao8h24" in parte) out.convencao8h24 = parte.convencao8h24;
  if ("minimos" in parte) out.minimos = Object.fromEntries(Object.entries(parte.minimos).map(([k, v]) => [k, k === "Farmacêutico" ? Math.max(1, v) : v]));
  if ("turnos" in parte) out.turnos = parte.turnos;
  if ("modoMinimo" in parte) out.modoMinimo = parte.modoMinimo;
  return out;
};
export const custosParaApi = (_parte, c) => {
  const ajustes = {};
  if (c.ratPct !== "" && Number(c.ratPct) !== c._padrao.ratPct) ajustes.ratPct = Number(c.ratPct);
  if (c.fap !== "" && Number(c.fap) !== c._padrao.fap) ajustes.fap = Number(c.fap);
  if (c.rescisaoLigada) ajustes.rescisaoLigada = true;
  return {
    salarioMedio: Object.fromEntries(Object.entries(c.salarioMedio).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)])),
    ...(Object.keys(ajustes).length ? { encargos: ajustes } : {}),
  };
};

// Erros da aba Regras e custos (texto + campo para focar).
export const errosDaRegras = (rascunho, { dono }) => {
  const e = [];
  const c = rascunho.configuracao;
  if (c?.modoMinimo === "turnos" && c.turnos) e.push(...errosDosTurnos(c.turnos));
  const k = rascunho.custos;
  if (dono && k) {
    for (const f of FUNCOES) {
      const v = k.salarioMedio[f];
      if (v !== "" && !(Number(v) > 0 && Number(v) <= 1_000_000)) e.push({ campo: `salario-${f}`, texto: `Salário médio de ${f}: informe um valor maior que zero.` });
    }
    if (k.ratPct !== "" && !(Number(k.ratPct) >= 0 && Number(k.ratPct) <= 3)) e.push({ campo: "rat", texto: "RAT: use um percentual de 1 a 3." });
    if (k.fap !== "" && !(Number(k.fap) >= 0.5 && Number(k.fap) <= 2)) e.push({ campo: "fap", texto: "FAP: use um valor de 0,5 a 2,0." });
  }
  return e;
};

export default function AbaRegras({ painel, rascunho, dono, podeEditar, mostrarErros }) {
  const { loja } = painel;
  const { registrar, alterar, rascunho: r } = rascunho;
  const [erroCarga, setErroCarga] = useState(null);
  const [dadosCustos, setDadosCustos] = useState(null);
  const [aberto, setAberto] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const diag = await api(`/lojas/${loja.id}/diagnostico`);
      registrar("configuracao", baseDaConfiguracao(diag.config));
      if (dono) {
        const [custos, par] = await Promise.all([api(`/lojas/${loja.id}/custos`), api("/parametros-encargos")]);
        const vigente = par.regimes.find((x) => x.regime === custos.encargos.regime).vigente;
        setDadosCustos(custos);
        registrar("custos", baseDosCustos(custos, { ratPct: vigente.ratPct, fap: vigente.fap }));
      }
    } catch (e) {
      setErroCarga(e.message);
    }
  }, [loja.id, dono, registrar]);
  useEffect(() => { carregar(); }, [carregar]);

  if (erroCarga) return <Aviso>{erroCarga}</Aviso>;
  const c = r.configuracao;
  if (!c || (dono && !r.custos)) return <p className="m-0 text-sm text-[var(--text-secondary)]">Carregando as regras…</p>;

  const erros = mostrarErros ? errosDaRegras(r, { dono }) : [];
  const erroDe = (campo) => erros.find((x) => x.campo === campo)?.texto;
  const k = r.custos;
  const mudarK = (parte) => alterar("custos", parte);
  const horarios = r.loja?.horarios ?? loja.horarios;
  const enc = dadosCustos?.encargos;

  return (
    <div className="flex flex-col gap-8">
      {dono && k && enc && (
        <section aria-labelledby="titulo-custos">
          <div className="flex items-center justify-between gap-3">
            <h3 id="titulo-custos" className="m-0 text-base font-bold text-[var(--text-strong)]">Custos</h3>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-secondary)]">Visível só para o dono</span>
          </div>
          <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Estimativa por média de função: não há salário individual.</p>
          <div className="cl-grid3 mt-3">
            {FUNCOES.map((f) => (
              <label key={f} className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">Salário médio · {f}
                <div className="relative"><span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">R$</span>
                  <input data-campo={`salario-${f}`} type="number" min={0} step="0.01" className={`${CAMPO} pl-9`} disabled={!podeEditar} value={k.salarioMedio[f]} aria-invalid={!!erroDe(`salario-${f}`)} aria-label={`Salário médio de ${f}`} onChange={(e) => mudarK({ salarioMedio: { ...k.salarioMedio, [f]: e.target.value } })} /></div>
                {erroDe(`salario-${f}`) && <span role="alert" className="text-xs text-[var(--text-danger)]">{erroDe(`salario-${f}`)}</span>}
              </label>
            ))}
          </div>
          <p className="m-0 mt-3 text-xs text-[var(--text-secondary)]">O salário médio vale para a jornada cheia de hoje (44h). Quem já é contratado mantém o salário. Uma vaga nova custa proporcional à carga dela.</p>

          <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
            {dadosCustos.alertaRegime && <div className="mb-3"><AlertaRegime lojaId={loja.id} texto={dadosCustos.alertaRegime} onSalvo={carregar} /></div>}
            <div className="flex items-center justify-between gap-3">
              <button type="button" aria-expanded={aberto} aria-controls="encargos-detalhe" onClick={() => setAberto(!aberto)} className="flex min-w-0 items-center gap-3 border-0 bg-transparent p-0 text-left cursor-pointer">
                <span aria-hidden="true" className={`text-xs text-[var(--text-secondary)] transition-transform ${aberto ? "rotate-90" : ""}`}>▸</span>
                <span className="min-w-0">
                  <strong className="block text-base text-[var(--text-strong)]">Encargos: {pct(enc.totalPct)} ({NOME_REGIME[enc.regime]})</strong>
                  <span className="text-xs text-[var(--text-secondary)]">RAT {String(k.ratPct).replace(".", ",")}% · FAP {String(k.fap).replace(".", ",")} · {k.rescisaoLigada ? "com" : "sem"} provisão de rescisão</span>
                </span>
              </button>
              <button type="button" className="shrink-0 border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={() => setAberto(!aberto)}>{aberto ? "Recolher" : "Editar encargos"}</button>
            </div>
            {aberto && (
              <div id="encargos-detalhe" className="mt-3 flex flex-col gap-4">
                <p className="m-0 text-xs text-[var(--text-secondary)]">O percentual vem do regime tributário em Dados da loja. Aqui você ajusta só RAT, FAP e a provisão de rescisão.</p>
                <div className="cl-grid3">
                  <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">RAT (%) <span className="text-xs text-[var(--text-secondary)]">padrão {pct(k._padrao.ratPct)} · faixa 1 a 3</span>
                    <input data-campo="rat" type="number" min={0} max={3} step="0.1" className={CAMPO} disabled={!podeEditar} value={k.ratPct} aria-invalid={!!erroDe("rat")} onChange={(e) => mudarK({ ratPct: e.target.value })} />
                    {erroDe("rat") && <span role="alert" className="text-xs text-[var(--text-danger)]">{erroDe("rat")}</span>}</label>
                  <label className="flex flex-col gap-1 text-sm text-[var(--text-strong)]">FAP <span className="text-xs text-[var(--text-secondary)]">padrão {String(k._padrao.fap).replace(".", ",")} · faixa 0,5 a 2,0</span>
                    <input data-campo="fap" type="number" min={0.5} max={2} step="0.1" className={CAMPO} disabled={!podeEditar} value={k.fap} aria-invalid={!!erroDe("fap")} onChange={(e) => mudarK({ fap: e.target.value })} />
                    {erroDe("fap") && <span role="alert" className="text-xs text-[var(--text-danger)]">{erroDe("fap")}</span>}</label>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-strong)] sm:mt-6"><input type="checkbox" className="h-4 w-4" disabled={!podeEditar} checked={k.rescisaoLigada} onChange={(e) => mudarK({ rescisaoLigada: e.target.checked })} />Incluir provisão de rescisão</label>
                </div>
                <ComposicaoEncargos encargos={enc} />
                {(k.ratPct !== String(k._padrao.ratPct) || k.fap !== String(k._padrao.fap) || k.rescisaoLigada) && podeEditar && (
                  <button type="button" className="self-start border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={() => mudarK({ ratPct: String(k._padrao.ratPct), fap: String(k._padrao.fap), rescisaoLigada: false })}>Restaurar padrão</button>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-convencao" className="border-t border-[var(--border-subtle)] pt-6">
        <h3 id="titulo-convencao" className="m-0 text-base font-bold text-[var(--text-strong)]">Convenção coletiva</h3>
        <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Define se a regra de 42h é atingível em 5 dias.</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-card border border-[var(--border-subtle)] px-4 py-3">
          <div className="min-w-0"><strong className="block text-sm text-[var(--text-strong)]">Permitir 8h24 por dia na transição</strong><span className="text-xs text-[var(--text-secondary)]">{c.convencao8h24 ? "Na regra de 42h, cada pessoa pode fazer até 42h em 5 dias (8h24 por dia)." : "Sem autorização, a regra de 42h vira 40h na prática (5 dias × 8h)."}</span></div>
          <div className="flex items-center gap-3 text-sm">
            <span className={c.convencao8h24 ? "text-[var(--text-secondary)]" : "font-bold text-[var(--text-strong)]"}>Não permite</span>
            <Chave marcado={c.convencao8h24} onChange={(v) => alterar("configuracao", { convencao8h24: v })} rotulo="Permitir 8h24 por dia na transição" desabilitado={!podeEditar} />
            <span className={c.convencao8h24 ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}>Permite</span>
          </div>
        </div>
      </section>

      <MinimoPessoas config={c} horarios={horarios} editavel={podeEditar} erros={erros} onMudar={(parte) => alterar("configuracao", parte)} />
    </div>
  );
}
