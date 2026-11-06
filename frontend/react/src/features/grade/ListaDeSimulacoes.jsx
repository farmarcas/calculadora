import { useId } from "react";
import { Botao, Ficha } from "../../components/ui/index.jsx";
import { dataBR } from "../../components/importacao/formato.js";
import { DICA_DESATUALIZADA, SITUACOES, VAZIO, horasPorSemana, reais, reaisComSinal, tipoTexto } from "./formato.js";
import { podeMarcar } from "./selecao.js";

const CABECALHO = "bg-[var(--surface-subtle)] px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]";

function SeloDesatualizada() {
  const id = useId();
  return (
    <span title={DICA_DESATUALIZADA} aria-describedby={id} className="inline-flex">
      <Ficha tom="atencao">Desatualizada</Ficha>
      <span id={id} className="sr-only">{DICA_DESATUALIZADA}</span>
    </span>
  );
}

// O saldo por mês: verde se positivo, vermelho se negativo, sempre com o sinal; sem valor mostra "—" e o porquê.
function Saldo({ valor }) {
  if (valor == null) return <span title="Falta o salário médio ou a venda hora a hora para calcular o saldo." className="text-[var(--text-secondary)]">{VAZIO}</span>;
  const cor = valor > 0 ? "text-[var(--text-success-strong)]" : valor < 0 ? "text-[var(--text-danger)]" : "text-[var(--text-strong)]";
  return <span className={`text-base font-bold ${cor}`}>{reaisComSinal(valor)}</span>;
}

// Tabela "Simulações da loja": uma linha por simulação, com o resultado de cada uma. Os valores em reais só vêm da API para o dono.
export default function ListaDeSimulacoes({ lista, marcadas, onAlternar, onAbrir, podeEscrever, onNova, descartadas, onDescartadas }) {
  const comReais = lista.some((s) => "saldoMensal" in s);
  return (
    <section aria-labelledby="titulo-lista" className="overflow-hidden rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-card)]">
      <header className="flex flex-wrap items-start justify-between gap-3 px-6 py-5">
        <div>
          <h2 id="titulo-lista" className="m-0 text-xl font-bold text-[var(--text-strong)]">Simulações da loja</h2>
          <p className="m-0 mt-1 text-sm text-[var(--text-secondary)]">Cenários que você salvou. Rascunho pode ser ajustado. Simulação gravada só pode ser copiada.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><input type="checkbox" checked={descartadas} onChange={(e) => onDescartadas(e.target.checked)} /> Mostrar descartadas</label>
          {podeEscrever && <Botao onClick={onNova}>Nova simulação</Botao>}
        </div>
      </header>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border-t border-[var(--border-subtle)] px-6 py-10 text-center">
          <p className="m-0 text-sm text-[var(--text-secondary)]">Nenhuma simulação salva ainda. Crie uma nova para ver o resultado por mês.</p>
          {podeEscrever && <Botao onClick={onNova}>Nova simulação</Botao>}
        </div>
      ) : (
        <>
        <ul className="m-0 list-none p-0 md:hidden">
          {lista.map((s) => {
            const [tom, rotulo] = SITUACOES[s.status] ?? ["neutro", s.status];
            const marcada = marcadas.includes(s.id);
            return (
              <li key={s.id} className={`flex items-start gap-3 border-t border-[var(--border-subtle)] px-4 py-4 ${marcada ? "bg-[var(--color-primary-soft)]" : ""}`}>
                {podeMarcar(s) ? (
                  <label className="-m-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                    <input type="checkbox" className="h-6 w-6" aria-label={`Selecionar ${s.nome}`} checked={marcada} onChange={() => onAlternar(s.id)} />
                  </label>
                ) : <span className="w-7 shrink-0" />}
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div>
                    <div className="font-bold text-[var(--text-strong)]">{s.nome}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{tipoTexto(s.tipo)}</div>
                  </div>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Ficha tom={tom}>{rotulo}</Ficha>
                    {s.desatualizada && <SeloDesatualizada />}
                  </span>
                  {comReais && (
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs text-[var(--text-secondary)]">Saldo por mês</span>
                      <Saldo valor={s.saldoMensal} />
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-xs text-[var(--text-secondary)]">Horas abertas</span>
                    <span className="text-[var(--text-strong)]">{horasPorSemana(s.horasAbertas)}</span>
                  </div>
                  {comReais && (
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-xs text-[var(--text-secondary)]">Folha extra</span>
                      <span className="text-[var(--text-strong)]">{s.folhaExtra == null ? VAZIO : reais(s.folhaExtra)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[var(--text-secondary)]">{dataBR(String(s.criadaEm).slice(0, 10))} · por {s.criadaPor}</span>
                    <button type="button" onClick={() => onAbrir(s.id)} aria-label={`Abrir ${s.nome}`} className="min-h-11 cursor-pointer rounded-[4px] border-0 bg-transparent px-3 text-sm font-bold text-[var(--text-link)] hover:underline">Abrir</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={`${CABECALHO} w-12 pl-6`}><span className="sr-only">Selecionar</span></th>
                <th scope="col" className={`${CABECALHO} text-left`}>Nome</th>
                <th scope="col" className={`${CABECALHO} text-left`}>Situação</th>
                {comReais && <th scope="col" className={`${CABECALHO} text-right`}>Saldo por mês</th>}
                <th scope="col" className={`${CABECALHO} text-right`}>Horas abertas</th>
                {comReais && <th scope="col" className={`${CABECALHO} text-right`}>Folha extra</th>}
                <th scope="col" className={`${CABECALHO} text-left`}>Criada</th>
                <th scope="col" className={CABECALHO}><span className="sr-only">Abrir</span></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => {
                const [tom, rotulo] = SITUACOES[s.status] ?? ["neutro", s.status];
                const marcada = marcadas.includes(s.id);
                return (
                  <tr key={s.id} className={`min-h-16 border-t border-[var(--border-subtle)] ${marcada ? "bg-[var(--color-primary-soft)]" : ""}`}>
                    <td className="h-16 pl-6">
                      {podeMarcar(s) && <input type="checkbox" aria-label={`Selecionar ${s.nome}`} checked={marcada} onChange={() => onAlternar(s.id)} />}
                    </td>
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <div className="font-bold text-[var(--text-strong)]">{s.nome}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{tipoTexto(s.tipo)}</div>
                    </th>
                    <td className="px-4 py-3">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <Ficha tom={tom}>{rotulo}</Ficha>
                        {s.desatualizada && <SeloDesatualizada />}
                      </span>
                    </td>
                    {comReais && <td className="px-4 py-3 text-right"><Saldo valor={s.saldoMensal} /></td>}
                    <td className="px-4 py-3 text-right text-[var(--text-strong)]">{horasPorSemana(s.horasAbertas)}</td>
                    {comReais && <td className="px-4 py-3 text-right text-[var(--text-strong)]">{s.folhaExtra == null ? VAZIO : reais(s.folhaExtra)}</td>}
                    <td className="px-4 py-3">
                      <div className="text-[var(--text-strong)]">{dataBR(String(s.criadaEm).slice(0, 10))}</div>
                      <div className="text-xs text-[var(--text-secondary)]">por {s.criadaPor}</div>
                    </td>
                    <td className="px-4 py-3 pr-6 text-right"><Botao tipo="texto" onClick={() => onAbrir(s.id)}>Abrir</Botao></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
