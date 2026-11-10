import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client.js";
import { Aviso, Chave } from "../../components/ui/index.jsx";
import { AlertaRegime, ComposicaoEncargos, NOME_REGIME, pct } from "../diagnostico/Encargos.jsx";
import { DICAS_DE_ENCARGOS } from "./dicasDeEncargos.js";
import { MotivoCampo, SeloCampo, classeDoCampo, descricaoDoCampo, usarCampos } from "./campoPendente.jsx";
import MinimoPessoas from "./MinimoPessoas.jsx";
import { baseDaConfiguracao } from "./configuracao.js";
import { FUNCOES, errosDosTurnos } from "./turnos.js";

export { baseDaConfiguracao };

const CAMPO = "h-10 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-strong)] focus:border-2 focus:border-[var(--system-500)] focus:outline-none aria-[invalid=true]:border-[var(--border-danger)] disabled:bg-[var(--surface-muted)]";
// Campo bloqueado pelo regime (Simples Nacional): cinza e sem edição.

export const baseDosCustos = (r) => ({
  salarioMedio: Object.fromEntries(FUNCOES.map((f) => [f, r.custos?.salarioMedio?.[f] == null ? "" : String(r.custos.salarioMedio[f])])),
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
// Só o salário médio vai ao servidor: os encargos vêm do regime tributário da loja.
export const custosParaApi = (_parte, c) => ({
  salarioMedio: Object.fromEntries(Object.entries(c.salarioMedio).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)])),
});

// Erros da aba Custos e Turnos (texto + campo para focar).
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
  }
  return e;
};

export default function AbaRegras({ painel, rascunho, dono, podeEditar, mostrarErros }) {
  const { loja } = painel;
  const { registrar, alterar, rascunho: r } = rascunho;
  const [erroCarga, setErroCarga] = useState(null);
  const mapaCampos = usarCampos();
  const [dadosCustos, setDadosCustos] = useState(null);
  const [aberto, setAberto] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const diag = await api(`/lojas/${loja.id}/diagnostico`);
      registrar("configuracao", baseDaConfiguracao(diag.config, loja.horarios));
      if (dono) {
        const custos = await api(`/lojas/${loja.id}/custos`);
        setDadosCustos(custos);
        registrar("custos", baseDosCustos(custos));
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
            <h3 id="titulo-custos" className="m-0 text-base font-bold text-[var(--text-strong)]">Custos de Salário em Folha</h3>
            <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-secondary)]">Visível só para o dono</span>
          </div>
          <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Informe o salário médio pago em folha. Se a comissão é paga em folha, acrescente. Se for paga por fora, como Alelo, não acrescente. É uma estimativa por média de função: não há salário individual.</p>
          <div className="cl-grid3 mt-3">
            {FUNCOES.map((f) => (
              <label key={f} className="flex flex-col gap-1 text-sm text-[var(--text-strong)]"><span className="flex flex-wrap items-center">Salário médio sem premiação · {f}<SeloCampo campo={`salario-${f}`} /></span>
                <div className="relative"><span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]">R$</span>
                  <input data-campo={`salario-${f}`} type="number" min={0} step="0.01" className={`${CAMPO} pl-9 ${classeDoCampo(mapaCampos, `salario-${f}`)}`} disabled={!podeEditar} value={k.salarioMedio[f]} aria-invalid={!!erroDe(`salario-${f}`)} aria-describedby={descricaoDoCampo(mapaCampos, `salario-${f}`)} aria-label={`Salário médio sem premiação de ${f}`} onChange={(e) => mudarK({ salarioMedio: { ...k.salarioMedio, [f]: e.target.value } })} /></div>
                {erroDe(`salario-${f}`) && <span role="alert" className="text-xs text-[var(--text-danger)]">{erroDe(`salario-${f}`)}</span>}
                <MotivoCampo campo={`salario-${f}`} />
              </label>
            ))}
          </div>
          <p className="m-0 mt-3 text-xs text-[var(--text-secondary)]">O salário médio vale para a jornada cheia de hoje (44h). Quem já é contratado mantém o salário. Uma vaga nova custa proporcional à carga dela.</p>
        </section>
      )}

      <MinimoPessoas config={c} horarios={horarios} editavel={podeEditar} erros={erros} onMudar={(parte) => alterar("configuracao", parte)} />

      <section aria-labelledby="titulo-encargos-convencao" className="border-t border-[var(--border-subtle)] pt-6">
        <h3 id="titulo-encargos-convencao" className="m-0 text-base font-bold text-[var(--text-strong)]">Encargos e Convenção Coletiva</h3>
        {dono && k && enc && (
          <div className="mt-3">
            {dadosCustos.alertaRegime && <div className="mb-3"><AlertaRegime lojaId={loja.id} texto={dadosCustos.alertaRegime} onSalvo={carregar} /></div>}
            <div className="flex items-center justify-between gap-3">
              <button type="button" aria-expanded={aberto} aria-controls="encargos-detalhe" onClick={() => setAberto(!aberto)} className="flex min-w-0 items-center gap-3 border-0 bg-transparent p-0 text-left cursor-pointer">
                <span aria-hidden="true" className={`text-xs text-[var(--text-secondary)] transition-transform ${aberto ? "rotate-90" : ""}`}>▸</span>
                <span className="min-w-0">
                  <strong className="block text-base text-[var(--text-strong)]">Encargos: {pct(enc.totalPct)} ({NOME_REGIME[enc.regime]})</strong>
                  <span className="text-xs text-[var(--text-secondary)]">O percentual vem do regime tributário em Dados da loja.</span>
                </span>
              </button>
              <button type="button" className="shrink-0 border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer" onClick={() => setAberto(!aberto)}>{aberto ? "Recolher" : "Ver composição"}</button>
            </div>
            {aberto && (
              <div id="encargos-detalhe" className="mt-3 flex flex-col gap-4">
                <ComposicaoEncargos encargos={enc} apoio={DICAS_DE_ENCARGOS.composicao} />
              </div>
            )}
          </div>
        )}
      <div aria-labelledby="titulo-convencao" role="group" className={dono && k && enc ? "mt-6 border-t border-[var(--border-subtle)] pt-6" : "mt-3"}>
        <h4 id="titulo-convencao" className="m-0 text-sm font-bold text-[var(--text-strong)]">Convenção coletiva</h4>
        <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">Define se a regra de 42h é atingível em 5 dias.</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-card border border-[var(--border-subtle)] px-4 py-3">
          <div className="min-w-0"><strong className="block text-sm text-[var(--text-strong)]">Permitir 8h24 por dia na transição</strong><span className="text-xs text-[var(--text-secondary)]">{c.convencao8h24 ? "Na regra de 42h, cada pessoa pode fazer até 42h em 5 dias (8h24 por dia)." : "Sem autorização, a regra de 42h vira 40h na prática (5 dias × 8h)."}</span></div>
          <div className="flex items-center gap-3 text-sm">
            <span className={c.convencao8h24 ? "text-[var(--text-secondary)]" : "font-bold text-[var(--text-strong)]"}>Não permite</span>
            <Chave marcado={c.convencao8h24} onChange={(v) => alterar("configuracao", { convencao8h24: v })} rotulo="Permitir 8h24 por dia na transição" desabilitado={!podeEditar} />
            <span className={c.convencao8h24 ? "font-bold text-[var(--text-strong)]" : "text-[var(--text-secondary)]"}>Permite</span>
          </div>
        </div>
      </div>
      </section>
    </div>
  );
}
