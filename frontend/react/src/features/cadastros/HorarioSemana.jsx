import { Botao, entrada } from "../../components/ui/index.jsx";

export const NOMES_DIA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// Estado de edição de um dia: { aberta, h24, abre, fecha } (sempre com os campos, para os inputs).
export const diaVazio = { aberta: false, h24: false, abre: "08:00", fecha: "22:00" };

// Horário da API (formato novo) → estado de edição. Loja nova sem horário: segunda a sexta 08:00–22:00 como ponto de partida;
// loja já cadastrada sem horário: tudo fechado (nada é inventado por ela).
export const paraEdicao = (h, lojaNova = true) =>
  h?.dias?.length === 7
    ? h.dias.map((d) => ({ aberta: d.aberta, h24: !!d.h24, abre: d.abre && d.abre !== "24:00" ? d.abre : "08:00", fecha: d.fecha && d.fecha !== "00:00" && !d.h24 ? d.fecha : "22:00" }))
    : Array.from({ length: 7 }, (_, i) => ({ ...diaVazio, aberta: lojaNova && i < 5 }));

// Estado de edição → corpo da API.
export const paraApi = (dias) => ({
  versao: 2,
  dias: dias.map((d) => (!d.aberta ? { aberta: false } : d.h24 ? { aberta: true, h24: true } : { aberta: true, abre: d.abre, fecha: d.fecha })),
});

export const erroDeHorario = (dias) => {
  for (let i = 0; i < 7; i++) {
    const d = dias[i];
    if (d.aberta && !d.h24 && !(d.abre && d.fecha && d.fecha > d.abre)) return `${NOMES_DIA[i]}: o fechamento precisa ser depois da abertura.`;
  }
  return null;
};

// Os sete dias da semana: aberta ou fechada, abertura e fechamento ou 24 horas.
export default function HorarioSemana({ dias, onChange }) {
  const mudar = (i, parte) => onChange(dias.map((d, k) => (k === i ? { ...d, ...parte } : d)));
  const todos24h = dias.every((d) => d.aberta && d.h24);
  const copiarDe = (i) => onChange(dias.map((d) => ({ ...dias[i] })));

  return (
    <fieldset className="border border-line rounded-card p-4 m-0 flex flex-col gap-3">
      <legend className="px-2 text-xs font-medium text-ink-500">Funcionamento da semana</legend>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={todos24h} onChange={(e) => onChange(dias.map(() => (e.target.checked ? { aberta: true, h24: true, abre: "08:00", fecha: "22:00" } : { ...diaVazio, aberta: true })))} />
          Loja 24 horas
        </label>
        <span className="text-xs text-ink-500">marca os sete dias abertos o dia inteiro; depois dá para ajustar cada dia</span>
        <Botao tipo="texto" className="ml-auto" onClick={() => copiarDe(0)}>Copiar a segunda para todos os dias</Botao>
      </div>
      <table className="w-full text-sm border-collapse">
        <tbody>
          {dias.map((d, i) => (
            <tr key={i} className="border-t border-line">
              <td className="py-2 pr-3 w-28 font-medium">{NOMES_DIA[i]}</td>
              <td className="py-2 pr-3 w-28">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={d.aberta} onChange={(e) => mudar(i, { aberta: e.target.checked })} aria-label={`${NOMES_DIA[i]} aberta`} />
                  {d.aberta ? "Aberta" : "Fechada"}
                </label>
              </td>
              <td className="py-2 pr-3">
                {d.aberta && !d.h24 && (
                  <span className="flex items-center gap-2">
                    <input type="time" className={entrada} value={d.abre} onChange={(e) => mudar(i, { abre: e.target.value })} aria-label={`${NOMES_DIA[i]} abre`} />
                    <span className="text-ink-500">até</span>
                    <input type="time" className={entrada} value={d.fecha} onChange={(e) => mudar(i, { fecha: e.target.value })} aria-label={`${NOMES_DIA[i]} fecha`} />
                  </span>
                )}
                {d.aberta && d.h24 && <span className="text-ink-700">Aberta as 24 horas</span>}
              </td>
              <td className="py-2 w-24">
                {d.aberta && (
                  <label className="flex items-center gap-2 text-xs text-ink-700">
                    <input type="checkbox" checked={d.h24} onChange={(e) => mudar(i, { h24: e.target.checked })} aria-label={`${NOMES_DIA[i]} 24 horas`} />
                    24 horas
                  </label>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </fieldset>
  );
}
