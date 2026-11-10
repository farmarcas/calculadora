import { podePreencher, tituloDoPainel } from "./pendencias.js";

const ABAS = [["dados", "Dados e funcionamento"], ["equipe", "Equipe"], ["regras", "Custos e Turnos"]];
const BOTAO = "inline-flex min-h-11 w-full items-center justify-center rounded-btn border border-[var(--color-primary)] bg-[var(--surface-card)] px-3 text-sm font-bold text-[var(--color-primary)] cursor-pointer hover:bg-[var(--surface-subtle)] sm:min-h-9 sm:w-auto";


// O que o item mostra no lugar do botão quando a pessoa não pode preenchê-lo.
const semBotao = (item) => (item.soDono ? "Só o dono do grupo preenche" : "Sem permissão para editar");

function Item({ item, perfil, onPreencher }) {
  const pode = podePreencher(item, perfil);
  return (
    <li className="flex flex-col gap-2 border-t border-[var(--border-subtle)] py-3 first:border-t-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <div className={`text-sm font-bold text-[var(--text-strong)] ${item.feito ? "line-through opacity-70" : ""}`}>
          {item.titulo}
        </div>
        {item.feito && <p className="m-0 text-xs font-bold text-[var(--text-secondary)]">✓ Feito</p>}
        {!item.feito && <p className="m-0 text-xs leading-4 text-[var(--text-secondary)]">{item.texto}</p>}
      </div>
      {!item.feito && (pode
        ? <button type="button" className={BOTAO} onClick={() => onPreencher(item)} aria-label={`${item.alerta ? "Conferir" : "Preencher"}: ${item.titulo}`}>{item.alerta ? "Conferir" : "Preencher"}</button>
        : <span className="shrink-0 text-xs font-medium text-[var(--text-secondary)] sm:max-w-[9rem] sm:text-right">{semBotao(item)}</span>)}
    </li>
  );
}

// Faixa "O que falta preencher": compacta (título, progresso e "Ver o que falta") ou aberta, com os itens por aba. Quando o
// cadastro está completo vira só a confirmação. `completoNoServidor` diz se a loja já está Completo no que está salvo.
export default function PainelPendencias({ resultado, perfil, aberto, onAbrir, onPreencher, completoNoServidor, pendentesNaAbertura = [] }) {
  const { itens, total, feitos, abertos, voceResolve, soDono } = resultado;

  if (abertos === 0)
    return (
      <div role="status" className="mt-4 flex items-center gap-2 rounded-card px-4 py-3 text-sm font-medium text-[var(--text-strong)]" style={{ background: "var(--func-success-100)" }}>
        <span aria-hidden="true">✓</span>
        {completoNoServidor ? "Cadastro completo. Todas as informações foram preenchidas." : "Tudo preenchido. Salve as alterações para concluir o cadastro."}
      </div>
    );

  const ehDono = perfil === "TENANT_ADMIN";
  // Mostra o que falta e o que estava faltando e já foi feito; o que sempre esteve completo só entra na contagem de feitos.
  const visiveis = itens.filter((i) => !i.feito || pendentesNaAbertura.includes(i.id));
  const grupos = ABAS.map(([id, nome]) => [id, nome, visiveis.filter((i) => i.aba === id)]).filter(([, , lista]) => lista.length > 0 && lista.some((i) => !i.feito));
  const pct = total ? Math.round((feitos / total) * 100) : 0;

  return (
    <section role="region" aria-label="O que falta preencher" className="mt-4 rounded-card border border-[var(--func-warning-100)]" style={{ background: "var(--func-attention-100)" }}>
      <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:min-h-12">
        <h3 aria-live="polite" className="order-1 m-0 w-full text-sm font-bold text-[var(--text-strong)] sm:w-auto">{tituloDoPainel(abertos)}</h3>
        <div className="order-2 flex min-w-0 items-center gap-2 text-xs text-[var(--text-strong)]">
          <span>{feitos} de {total} feitos</span>
          <div role="progressbar" aria-label="Progresso do cadastro" aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitos} className="h-2 w-24 shrink-0 rounded-full bg-white/70">
            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {!ehDono && soDono > 0 && <span className="order-4 w-full text-xs text-[var(--text-strong)] sm:order-3 sm:w-auto">{voceResolve} você pode preencher · {soDono} só o dono do grupo</span>}
        <button type="button" aria-expanded={aberto} onClick={() => onAbrir(!aberto)} className="order-3 ml-auto min-h-11 shrink-0 border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-strong)] cursor-pointer sm:order-4 sm:min-h-0">
          {aberto ? "Esconder ▴" : "Ver o que falta ▾"}
        </button>
      </div>
      {aberto && (
        <div className="grid gap-x-6 gap-y-2 border-t border-[var(--func-warning-100)] bg-[var(--surface-card)] px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map(([id, nome, lista]) => (
            <div key={id} className="min-w-0">
              <div className="text-xs font-bold uppercase text-[var(--text-secondary)]">{nome} · {lista.filter((i) => !i.feito).length}</div>
              <ul className="m-0 list-none p-0">
                {lista.map((i) => <Item key={i.id} item={i} perfil={perfil} onPreencher={onPreencher} />)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
