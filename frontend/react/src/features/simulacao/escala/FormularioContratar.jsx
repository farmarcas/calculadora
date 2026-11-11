import { useEffect, useMemo, useState } from "react";
import { api } from "../../../api/client.js";
import { Botao, entrada } from "../../../components/ui/index.jsx";
import { ehDesejavel, textoDaVariacao } from "../../diagnostico/cartao/linha-regras.js";
import { COR_DO_TOM } from "../../diagnostico/cartao/tom.js";
import {
  cargaDaContratacao, diasPorExtenso, efeitoDaContratacao, erroDoFormulario, jornadaBrutaDoDia, opcoesDeEntrada, opcoesDeHora, opcoesDeSaida, sugerirContratacao, textoDaSugestao, textoDoEfeito,
  turnosDoFormulario,
} from "./escala-regras.js";

const COR = { ...COR_DO_TOM, mudo: "var(--text-secondary)" };

// "Contratar <função>": um formulário sob a linha da função. A contratação entra só na simulação e o Cadastro não muda.
// Já vem preenchido com a sugestão que cobre as horas sem cobertura; o efeito na semana é recalculado a cada mudança.
export default function FormularioContratar({ simId, funcao, abas, coberturaPorDia, regra, dono, diaPreferido, valor, onMudar, onCancelar, onAdicionar }) {
  // Só se contrata integral (spec 044): a carga é a jornada cheia da regra.
  const sugerir = () => sugerirContratacao({ funcao, coberturaPorDia, abas, tipo: "integral", regra, diaPreferido });
  // O estado (tipo, dias, entra e sai) mora na seção: a barra de prévia da grade nasce dele e arrastá-la muda Entra e Sai.
  const { dias, entra, sai } = valor;
  const tipo = "integral";
  const jornadaCheia = Math.min(44, Math.floor(Math.min(regra.teto, regra.dias * regra.maxDia)));
  // Ao mudar a entrada, a saída acompanha quando a jornada estava cheia (a mesma duração), para continuar cheia.
  const bruta = jornadaBrutaDoDia(regra);
  const setEntra = (v) => onMudar({ entra: v, ...(Math.abs(sai - entra - bruta) < 1 / 60 ? { sai: Math.min(v + bruta, maxFecha) } : {}) });
  const setSai = (v) => onMudar({ sai: v });
  const [custo, setCusto] = useState(null);

  const minAbre = Math.min(...abas.map((a) => a.abre));
  const maxFecha = Math.max(...abas.map((a) => a.fecha));
  const opcoes = useMemo(() => opcoesDeHora(minAbre, maxFecha), [minAbre, maxFecha]);
  const opcoesEntra = useMemo(() => opcoesDeEntrada(opcoes, entra), [opcoes, entra]);
  const opcoesSai = useMemo(() => opcoesDeSaida(opcoes, { entra, sai, regra, maxFecha }), [opcoes, entra, sai, regra, maxFecha]);
  const sugestaoDoTipo = useMemo(() => sugerir(), [coberturaPorDia]); // eslint-disable-line react-hooks/exhaustive-deps

  const aplicarSugestao = () => {
    const sug = sugerir();
    if (!sug) return;
    onMudar({ tipo: "integral", dias: sug.dias, entra: sug.entra, sai: sug.sai });
  };

  const turnos = turnosDoFormulario({ dias, entra, sai });
  const cargaH = cargaDaContratacao({ tipo, turnos, regra });
  const erro = erroDoFormulario({ tipo, dias, entra, sai, regra });
  const efeito = efeitoDaContratacao({ coberturaPorDia, turnos: erro ? [] : turnos });

  // Só o dono vê o custo de pessoal: a prévia vem do servidor (depende de salário) e não grava nada.
  useEffect(() => {
    setCusto(null);
    if (!dono || erro || cargaH < 4 || cargaH > 44) return undefined;
    let vivo = true;
    const t = setTimeout(() => {
      api(`/simulacoes/${simId}/efeito-contratacao`, { method: "POST", body: { funcao, cargaH } })
        .then((r) => vivo && setCusto(r))
        .catch(() => vivo && setCusto(null));
    }, 300);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [dono, erro, cargaH, funcao, simId]);

  const custoTxt = custo ? textoDaVariacao(custo.custoPct, custo.custoEstado, "custo") : null;

  const adicionar = (e) => {
    e.preventDefault();
    if (erro) return;
    onAdicionar({ funcao, cargaH, turnos: turnos.map(({ dia, entrada: en, saida, iniIntervalo, fimIntervalo }) => ({ dia, entrada: en, saida, iniIntervalo, fimIntervalo })) });
  };

  return (
    <form aria-label={`Contratar ${funcao}`} onSubmit={adicionar} onKeyDown={(e) => e.key === "Escape" && onCancelar()} className="mx-2 my-2 rounded-card border border-[var(--system-500)] bg-[var(--surface-card)] p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-sm leading-5 font-bold text-[var(--text-strong)]">Contratar {funcao}</h3>
          <p className="m-0 text-xs leading-4 text-[var(--text-secondary)]">A contratação entra só na simulação. O Cadastro não muda.{ehDesejavel(funcao) ? " Contratação desejável: mantém o nível de atendimento de hoje; o que a lei exige é o farmacêutico." : ""}</p>
        </div>
        <button type="button" onClick={onCancelar} className="cursor-pointer border-0 bg-transparent p-0 text-xs text-[var(--text-secondary)] hover:underline">Fechar ✕</button>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 text-[11px] leading-4 text-[var(--text-secondary)]">
          Contratação
          <div className={`${entrada} flex min-w-[200px] items-center text-sm font-bold text-[var(--text-strong)]`} data-testid="contratacao-integral">Integral · {jornadaCheia}h por semana</div>
        </div>
        <label className="flex flex-col gap-1 text-[11px] leading-4 text-[var(--text-secondary)]">
          Entra
          <select value={entra} onChange={(e) => setEntra(Number(e.target.value))} className={`${entrada} w-[96px] text-sm text-[var(--text-strong)]`}>
            {opcoesEntra.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] leading-4 text-[var(--text-secondary)]">
          Sai
          <select value={sai} onChange={(e) => setSai(Number(e.target.value))} className={`${entrada} w-[176px] text-sm text-[var(--text-strong)]`} data-testid="campo-sai">
            {opcoesSai.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
          </select>
        </label>
      </div>

      <p className="m-0 mt-3 text-xs leading-5 text-[var(--text-secondary)]" data-testid="dias-da-contratacao">
        Contratação integral: a pessoa fica à disposição da loja a semana toda e trabalha {dias.length} {dias.length === 1 ? "dia" : "dias"} ({diasPorExtenso(dias)}), nos dias de maior necessidade. As folgas giram e entram depois, na escala.
      </p>

      {sugestaoDoTipo && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-btn bg-[var(--func-success-100)] px-3 py-2 text-xs leading-4 font-bold text-[var(--text-success-strong)]">
          <span>{textoDaSugestao({ sugestao: sugestaoDoTipo, funcao, coberturaPorDia })}</span>
          <button type="button" onClick={aplicarSugestao} className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-success-strong)] underline">Usar a sugestão</button>
        </div>
      )}

      <p role="status" className="m-0 mt-3 text-xs leading-5 text-[var(--text-secondary)]">
        Efeito na semana: <strong className="text-[var(--text-strong)]">{textoDoEfeito({ funcao, horasCobertas: efeito.horasCobertas })}</strong>
        {dono && custoTxt && (
          <>
            {" · custo de pessoal "}<strong style={{ color: COR[custoTxt.tom] }}>{custoTxt.texto}</strong>
            {" · venda "}<strong>● 0%</strong>
            {custoTxt.apoio ? <span> ({custoTxt.apoio})</span> : null}
          </>
        )}
        {erro ? <span className="ml-1 font-bold text-[var(--text-danger)]"> · {erro}</span> : null}
      </p>

      <div className="mt-3 flex justify-end gap-2">
        <Botao type="button" tipo="secundario" onClick={onCancelar}>Cancelar</Botao>
        <Botao type="submit" disabled={!!erro}>Adicionar à simulação</Botao>
      </div>
    </form>
  );
}
