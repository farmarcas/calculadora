import { useEffect, useState } from "react";
import { Passo } from "../../components/ui/index.jsx";
import GraficoVendas from "./GraficoVendas.jsx";
import LinhaDoDia from "./horario/LinhaDoDia.jsx";
import { NOMES_DIA } from "./formato.js";

const CAIXA = "overflow-hidden rounded-card border border-[var(--border-subtle)]";
const COLUNAS = "grid grid-cols-[44px_104px_104px_1fr] items-center gap-3";

// Passo 1: lista de horários (400 px, + e − de 1 em 1 hora) ao lado do gráfico de venda por hora.
export default function PassoHorario({ sim, editavel, onSalvarHorarios }) {
  const r = sim.resultado;
  const [dia, setDia] = useState(() => Math.max(0, r.horario.cadastro.findIndex((c) => c.aberta)));
  // O horário da lista nasce do simulado e muda na hora (sem esperar o servidor); volta a ele quando a simulação muda de fora.
  const doServidor = r.horario.dias.map((d) => ({ aberta: d.aberta, abre: d.abre, fecha: d.fecha }));
  const [dias, setDias] = useState(doServidor);
  const assinatura = JSON.stringify(doServidor);
  useEffect(() => setDias(doServidor), [assinatura, sim.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mudar = (i, novo) => {
    const lista = dias.map((d, j) => (j === i ? novo : d));
    setDias(lista);
    onSalvarHorarios({ versao: 2, dias: lista.map((d) => (d.aberta ? { aberta: true, abre: d.abre, fecha: d.fecha } : { aberta: false })) });
  };
  const abertos = dias.filter((d) => d.aberta).length;

  return (
    <Passo numero={1} titulo="Horário e vendas" subtitulo="Parte do horário do cenário escolhido. Edite os dias e horários para testar outro funcionamento. O Cadastro não muda.">
      <div className="sim-passo1">
        <div className="flex flex-col">
          <div className={CAIXA}>
            <div className={`${COLUNAS} bg-[var(--surface-subtle)] px-4 py-3 text-xs font-bold text-[var(--neutral-mid-300)]`}>
              <span>DIA</span><span>ABRE</span><span>FECHA</span><span aria-hidden="true" />
            </div>
            <ul className="m-0 list-none p-0">
              {dias.map((d, i) => (
                <LinhaDoDia key={i} dia={i} nome={NOMES_DIA[i]} simulado={d} cadastro={r.horario.cadastro[i]} editavel={editavel} ultimoAberto={abertos <= 1} onMudar={(novo) => mudar(i, novo)} />
              ))}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <span><strong className="text-[var(--text-strong)]">{r.horasAbertas}h abertas por semana</strong> · antes {r.horasAbertasAntes}h</span>
              {editavel && <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-[var(--text-link)] hover:underline" onClick={() => onSalvarHorarios(null)}>Restaurar do Cadastro</button>}
            </div>
          </div>
        </div>
        <GraficoVendas resultado={r} dia={dia} onDia={setDia} />
      </div>
      {editavel && <p className="m-0 mt-4 text-xs text-[var(--text-secondary)]">+ e − mudam de 1 em 1 hora. Também dá para digitar a hora cheia, como 08:00.</p>}
    </Passo>
  );
}
