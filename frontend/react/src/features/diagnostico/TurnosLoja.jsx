import { Aviso, Botao, Cartao, entrada } from "../../components/ui/index.jsx";

const FUNCOES = ["Farmacêutico", "Atendimento", "Caixa", "Apoio", "Perfumaria"];
const MAX_TURNOS = 6;

const horas = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
};
const texto = (h) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

// Do primeiro horário aberto da semana ao último (24 horas = 00:00 a 24:00). Nulo sem horário cadastrado.
export const janelaDaLoja = (horarios) => {
  const abertos = (horarios?.dias ?? []).filter((d) => d.aberta);
  if (abertos.length === 0) return null;
  const abre = Math.min(...abertos.map((d) => (d.h24 ? 0 : horas(d.abre))));
  const fecha = Math.max(...abertos.map((d) => (d.h24 ? 24 : horas(d.fecha === "00:00" ? "24:00" : d.fecha))));
  return { abre, fecha };
};

// Ponto de partida ao ativar os turnos: o mínimo único atual em cada turno (nada a redigitar).
// Meia-noite no fim é "00:00". Loja 24 horas começa em dois turnos (um turno de 00:00 a 00:00 seria ambíguo).
export const turnosIniciais = (janela, minimos) => {
  const copia = () => ({ ...minimos });
  if (janela.abre === 0 && janela.fecha === 24)
    return [
      { nome: "Primeiro turno", inicio: "00:00", fim: "12:00", minimos: copia() },
      { nome: "Segundo turno", inicio: "12:00", fim: "00:00", minimos: copia() },
    ];
  return [{ nome: "Dia todo", inicio: texto(janela.abre), fim: janela.fecha === 24 ? "00:00" : texto(janela.fecha), minimos: copia() }];
};

export default function TurnosLoja({ horarios, minimosUnicos, turnos, onChange, avisos, podeEscrever }) {
  const janela = janelaDaLoja(horarios);
  const ativo = turnos !== null;

  const ativar = () => janela && onChange(turnosIniciais(janela, minimosUnicos));
  const alterar = (i, parte) => onChange(turnos.map((t, j) => (j === i ? { ...t, ...parte } : t)));
  const minimoDe = (i, f, v) => alterar(i, { minimos: { ...turnos[i].minimos, [f]: Number(v) } });
  const adicionar = () => {
    const ultimo = turnos[turnos.length - 1];
    const fimJanela = janela.fecha === 24 ? "00:00" : texto(janela.fecha);
    onChange([...turnos, { nome: `Turno ${turnos.length + 1}`, inicio: ultimo.fim, fim: fimJanela, minimos: { ...ultimo.minimos } }]);
  };

  return (
    <Cartao
      titulo="Turnos e mínimo por turno"
      subtitulo="Defina os turnos da loja e quantas pessoas de cada cargo são exigidas em cada um. Sem turnos, vale o mínimo único do dia inteiro."
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        {!janela && <Aviso tom="atencao">Cadastre o horário de funcionamento da loja (em Cadastros) antes de definir os turnos.</Aviso>}
        {avisos?.length > 0 && ativo && <Aviso tom="atencao">Os turnos precisam de ajuste: {avisos.join(" ")}</Aviso>}
        {!ativo && janela && (
          <div className="flex items-center justify-between gap-4">
            <p className="m-0 text-sm text-ink-500">Hoje a loja usa o mesmo mínimo em todas as horas. Ao ativar, o mínimo atual vira ponto de partida em cada turno.</p>
            {podeEscrever && <Botao onClick={ativar}>Definir turnos</Botao>}
          </div>
        )}
        {ativo && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-ink-500">
                  <tr>
                    <th className="py-1 pr-2">Turno</th>
                    <th className="pr-2">Início</th>
                    <th className="pr-2">Fim</th>
                    {FUNCOES.map((f) => <th key={f} className="pr-2">{f}</th>)}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((t, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="py-2 pr-2"><input className={`${entrada} w-32`} aria-label={`Nome do turno ${i + 1}`} disabled={!podeEscrever} value={t.nome} onChange={(e) => alterar(i, { nome: e.target.value })} /></td>
                      <td className="pr-2"><input type="time" className={entrada} aria-label={`Início de ${t.nome}`} disabled={!podeEscrever} value={t.inicio} onChange={(e) => alterar(i, { inicio: e.target.value })} /></td>
                      <td className="pr-2"><input type="time" className={entrada} aria-label={`Fim de ${t.nome}`} disabled={!podeEscrever} value={t.fim} onChange={(e) => alterar(i, { fim: e.target.value })} /></td>
                      {FUNCOES.map((f) => (
                        <td key={f} className="pr-2">
                          <input type="number" min={f === "Farmacêutico" ? 1 : 0} max={10} className={`${entrada} w-16`} aria-label={`Mínimo de ${f} em ${t.nome}`} disabled={!podeEscrever}
                            value={t.minimos[f] ?? 0} onChange={(e) => minimoDe(i, f, e.target.value)} />
                        </td>
                      ))}
                      <td className="text-right">
                        {podeEscrever && turnos.length > 1 && <Botao tipo="texto" onClick={() => onChange(turnos.filter((_, j) => j !== i))}>Remover</Botao>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="m-0 text-xs text-ink-500">
              Os turnos precisam cobrir o horário de funcionamento ({texto(janela.abre)} a {janela.fecha === 24 ? "24:00" : texto(janela.fecha)}) sem sobrepor e sem deixar buraco. O fim "00:00" é meia-noite. Farmacêutico: mínimo 1 em todo turno (Lei 13.021/2014).
            </p>
            {podeEscrever && (
              <div className="flex gap-2">
                {turnos.length < MAX_TURNOS && <Botao tipo="secundario" onClick={adicionar}>Adicionar turno</Botao>}
                <Botao tipo="texto" onClick={() => { if (window.confirm("Voltar ao mínimo único do dia inteiro? Os mínimos por turno serão descartados ao salvar.")) onChange(null); }}>Usar só o mínimo único</Botao>
              </div>
            )}
          </>
        )}
      </div>
    </Cartao>
  );
}
