import { useState } from "react";
import { Botao } from "../../../components/ui/index.jsx";
import LinhaDoTempo, { EixoDaLinhaDoTempo } from "./LinhaDoTempo.jsx";
import { abrirNoCadastro } from "./atalhos.js";

const LISTRA = "repeating-linear-gradient(135deg, var(--surface-muted) 0 4px, var(--surface-subtle) 4px 8px)";
const COLUNAS = "minmax(230px,1.4fr) 120px 90px 110px 300px 100px 56px 110px";
const LINK = "border-0 bg-transparent p-0 text-sm font-bold text-[var(--text-link)] cursor-pointer";
const POR_VEZ = 8;
const COL1 = "sticky left-0 z-10 bg-[var(--surface-card)]";

// Aba 3: a equipe da loja, só leitura, por função. A edição é no Cadastro de loja (os atalhos levam para lá).
export default function AbaEquipe({ dados, lojaId, irCadastros }) {
  const [todos, setTodos] = useState(false);
  const abrir = () => abrirNoCadastro({ lojaId, aba: "equipe", irCadastros });

  if (!dados || dados.total === 0)
    return (
      <div className="flex flex-col items-start gap-3 p-6 text-sm text-[var(--text-secondary)]">
        <p className="m-0">Nenhum funcionário no cálculo. Cadastre a equipe da loja.</p>
        <Botao onClick={abrir}>Cadastrar equipe</Botao>
      </div>
    );
  if (dados.noCalculo === 0)
    return (
      <div className="flex flex-col items-start gap-3 p-6 text-sm text-[var(--text-secondary)]">
        <p className="m-0">Nenhum funcionário no cálculo. Cadastre a equipe da loja.</p>
        <Botao onClick={abrir}>Cadastrar equipe</Botao>
      </div>
    );

  // "Mostrando N de M": as primeiras N pessoas, na ordem dos grupos.
  let restante = todos ? Infinity : POR_VEZ;
  const visiveis = dados.grupos.map((g) => {
    const linhas = g.linhas.slice(0, Math.max(0, restante));
    restante -= linhas.length;
    return { ...g, visiveis: linhas };
  }).filter((g) => g.visiveis.length > 0);
  const mostrando = visiveis.reduce((s, g) => s + g.visiveis.length, 0);
  const grade = { display: "grid", gridTemplateColumns: COLUNAS, columnGap: 12, alignItems: "center" };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
          <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold text-[var(--text-strong)]" style={{ background: "var(--func-success-100)" }}>{dados.noCalculo} no cálculo</span>
          {dados.foraDoCalculo > 0 && <span className="inline-flex h-7 items-center rounded-full px-3 text-xs font-bold text-[var(--text-strong)]" style={{ background: "var(--func-attention-100)" }}>{dados.foraDoCalculo} fora do cálculo</span>}
          <span>Só leitura. Dias, turnos e cargas vêm do cadastro da equipe.</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {dados.foraDoCalculo > 0 && <button type="button" className={LINK} onClick={abrir}>Definir função de quem está fora</button>}
          <Botao tipo="secundario" tamanho="pequeno" onClick={abrir}>Editar equipe no cadastro</Botao>
        </div>
      </div>

      <div className="overflow-x-auto" role="region" aria-label="Equipe no cálculo" tabIndex={0}>
        <div className="min-w-[1180px] overflow-hidden rounded-card border border-[var(--border-subtle)]">
          <div style={grade} role="row" className="bg-[var(--surface-subtle)] px-4 py-3 text-xs font-bold uppercase text-[var(--text-secondary)]">
            <span className={`${COL1} bg-[var(--surface-subtle)]`}>Colaborador</span><span>Função</span><span>Dias</span><span>Turno</span>
            <EixoDaLinhaDoTempo ini={dados.eixo.ini} fim={dados.eixo.fim} />
            <span>Intervalo</span><span>Carga</span><span>Situação</span>
          </div>
          {visiveis.map((g) => (
            <div key={g.titulo}>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-2 text-sm">
                <strong className="text-[var(--text-strong)]">{g.titulo}</strong>
                <span className="text-xs text-[var(--text-secondary)]">{g.pessoas} {g.pessoas === 1 ? "pessoa" : "pessoas"}{g.horas != null ? ` · ${g.horas}h por semana` : ""}</span>
              </div>
              {g.visiveis.map((l) => (
                <div key={l.matricula} style={grade} role="row" className="min-h-12 border-t border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-strong)]">
                  <div className={`${COL1} min-w-0`}>
                    <strong className="block truncate" title={l.nome}>{l.nome}</strong>
                    <span className="text-xs text-[var(--text-secondary)]">Código {l.matricula}</span>
                  </div>
                  <span>{g.funcao ?? "Sem função de escala"}</span>
                  <span>{l.dias}</span>
                  <span>{l.turnoTexto}</span>
                  <LinhaDoTempo linha={l} eixo={dados.eixo} janela={dados.janela} />
                  <span>{l.intervalo}</span>
                  <span>{l.cargaH != null ? `${l.cargaH}h` : "—"}</span>
                  <span className="inline-flex h-7 w-fit items-center rounded-full px-3 text-xs font-bold" style={{ background: l.noCalculo ? "var(--func-success-100)" : "var(--func-attention-100)" }}>{l.situacao}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--text-secondary)]">
            <span aria-live="polite">Mostrando {mostrando} de {dados.total} funcionários</span>
            {dados.total > POR_VEZ && <button type="button" className={LINK} onClick={() => setTodos(!todos)}>{todos ? "Ver menos" : "Ver todos"}</button>}
          </div>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-1 p-0 text-xs text-[var(--text-secondary)]">
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={{ background: "var(--system-500)" }} />Turno dentro do horário da loja{dados.janelaTexto ? ` (${dados.janelaTexto})` : ""}</li>
        <li className="flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 rounded-[2px]" style={{ background: LISTRA, border: "1px dashed var(--system-500)" }} />Turno fora do horário da loja: não conta para o mínimo</li>
      </ul>
    </div>
  );
}
