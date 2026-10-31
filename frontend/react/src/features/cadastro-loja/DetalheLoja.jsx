import { useEffect, useState } from "react";
import { Abas, Aviso, Botao } from "../../components/ui/index.jsx";
import { cuidaDoGrupo, editaLoja, ehOperador, formatarCnpj } from "../../api/perfis.js";
import AbaDados from "./AbaDados.jsx";
import { errosDaLoja } from "./calculos.js";
import { ABAS } from "./config.js";
import AbaEquipe from "./AbaEquipe.jsx";
import AbaRegras, { errosDaRegras } from "./AbaRegras.jsx";

const IconeAtencao = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01" /></svg>
);

// Detalhe da loja escolhida: cabeçalho com a situação e o motivo, 3 abas e o rodapé com o contador e "Salvar alterações".
export default function DetalheLoja({ lojaId, aba, onAba, perfil, painel, carregando, erro, rascunho, onVoltar, aoMudarEquipe }) {
  const [tentou, setTentou] = useState(false);
  useEffect(() => setTentou(false), [lojaId]);
  const dono = perfil === "TENANT_ADMIN";
  const operador = ehOperador(perfil);
  const podeEditar = editaLoja(perfil);
  const podeEquipe = cuidaDoGrupo(perfil);
  if (!lojaId)
    return <div className="flex h-full items-center justify-center p-10 text-sm text-[var(--text-secondary)]">Escolha uma loja na lista para ver e corrigir o cadastro.</div>;
  if (erro) return <div className="p-6"><Aviso>{erro}</Aviso></div>;
  if (carregando || !painel)
    return (
      <div aria-busy="true" className="p-6">
        <div className="h-6 w-56 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="mt-3 h-4 w-80 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="mt-8 h-40 animate-pulse rounded bg-[var(--surface-muted)]" />
      </div>
    );

  const { loja, situacao } = painel;
  const completo = situacao.status === "completo";
  const n = rascunho.mudancas.length;
  // Antes de gravar, confere os campos; se algo estiver errado, rola até o primeiro e foca nele.
  const salvar = async () => {
    const errosLoja = rascunho.rascunho.loja ? errosDaLoja(rascunho.rascunho.loja, { dono }) : [];
    const errosRegras = errosDaRegras(rascunho.rascunho, { dono });
    const erros = errosLoja.length ? errosLoja : errosRegras;
    if (erros.length) {
      setTentou(true);
      rascunho.setErro(`Corrija ${erros.length === 1 ? "o campo indicado" : `os ${erros.length} campos indicados`} antes de salvar.`);
      onAba(errosLoja.length ? "dados" : "regras");
      setTimeout(() => {
        const alvo = document.querySelector(`[data-campo="${erros[0].campo}"]`);
        alvo?.scrollIntoView({ block: "center", behavior: "smooth" });
        alvo?.focus();
      }, 50);
      return;
    }
    setTentou(false);
    await rascunho.salvar();
  };
  const cancelar = () => { setTentou(false); rascunho.cancelar(); };
  const abas = ABAS.map(([id, t]) => [id, id === "equipe" ? `${t} (${loja.funcionarios ?? 0})` : t]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-6 pt-5">
        <button type="button" onClick={onVoltar} className="cl-voltar mb-2 border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer">← Voltar para a lista</button>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0 text-lg font-bold text-[var(--text-strong)]">{loja.nome}</h2>
          <span className="inline-flex h-6 items-center rounded-full px-3 text-xs font-bold text-[var(--text-strong)]" style={{ background: completo ? "var(--func-success-100)" : "var(--func-attention-100)" }}>{completo ? "Completo" : "Revisar"}</span>
        </div>
        <p className="m-0 mt-1 text-xs text-[var(--text-secondary)]">
          Código {loja.codigo}{loja.cnpj ? ` · CNPJ ${formatarCnpj(loja.cnpj)}` : ""}{loja.uf ? ` · ${loja.uf}` : ""}
        </p>
        {!completo && situacao.motivo && (
          <p className="m-0 mt-2 flex items-center gap-1.5 text-sm font-medium text-[var(--text-strong)]"><span className="text-[var(--text-danger)]"><IconeAtencao /></span>{situacao.motivo}</p>
        )}
        <Abas opcoes={abas} valor={aba} onChange={onAba} rotulo="Seções da loja" className="mt-4" />
      </div>

      {rascunho.erro && <div className="px-6 pt-4"><Aviso>{rascunho.erro}</Aviso></div>}

      <div className="flex-1 px-6 py-6">
        {aba === "dados" && <AbaDados painel={painel} rascunho={rascunho} dono={dono} operador={operador} podeEditar={podeEditar} mostrarErros={tentou} />}
        {aba === "equipe" && <AbaEquipe lojaId={lojaId} podeEscrever={podeEquipe} aoMudar={aoMudarEquipe} />}
        {aba === "regras" && <AbaRegras painel={painel} rascunho={rascunho} dono={dono} podeEditar={podeEquipe} mostrarErros={tentou} />}
      </div>

      <div className="cl-rodape sticky bottom-0 flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-card)] px-6 py-3">
        {aba === "equipe" ? (
          <span className="text-sm text-[var(--text-secondary)]">As alterações de dados, funcionamento e regras aparecem aqui para salvar. Nada pendente nesta aba.</span>
        ) : (
          <>
            <span aria-live="polite" className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              {n > 0 && <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
              {n === 0 ? "Nenhuma alteração" : `${n} ${n === 1 ? "alteração não salva" : "alterações não salvas"}`}
            </span>
            <div className="flex items-center gap-3">
              <button type="button" disabled={n === 0 || rascunho.salvando} onClick={cancelar} className="border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
              <Botao disabled={n === 0 || rascunho.salvando || !podeEditar} onClick={salvar}>{rascunho.salvando ? "Salvando…" : "Salvar alterações"}</Botao>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
