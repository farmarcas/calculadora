import type { DiaHorario, HorariosSemana } from '../cadastros/horarios.js';

// Horário de um dia no relatório da plataforma: "07 - 20" (hora de abertura e de fechamento).
// "00 - 00" e célula vazia = fechado; "07 - 00" = fecha à meia-noite; minutos e segundos ("07:00:58") são descartados.
export type DiaLido = { dia: DiaHorario; aviso?: string };

const RE = /^(\d{1,2})(?::\d{2}(?::\d{2})?)?\s*-\s*(?:(\d{1,2})(?::\d{2}(?::\d{2})?)?)?$/;
const hh = (n: number) => `${String(n).padStart(2, '0')}:00`;

export const lerDia = (texto: string | null | undefined): DiaLido => {
  const t = (texto ?? '').trim();
  if (t === '') return { dia: { aberta: false } };
  const m = RE.exec(t);
  if (!m || m[2] === undefined)
    return { dia: { aberta: false }, aviso: `horário incompleto "${t}"` };
  const a = Number(m[1]);
  const f = Number(m[2]);
  if (a > 23 || f > 24) return { dia: { aberta: false }, aviso: `horário inválido "${t}"` };
  if (a === 0 && f === 0) return { dia: { aberta: false } };
  if (a === 0 && f === 24)
    return { dia: { aberta: true, h24: true, abre: '00:00', fecha: '24:00' } };
  if (f === 0) return { dia: { aberta: true, abre: hh(a), fecha: '24:00' } };
  if (f <= a)
    return {
      dia: { aberta: true, abre: hh(a), fecha: '24:00' },
      aviso: `"${t}" passa da meia-noite; considerado até 24:00`,
    };
  return { dia: { aberta: true, abre: hh(a), fecha: hh(f) } };
};

// Sete dias (segunda a domingo). Sem nenhum dia aberto não há horário (a loja fica "horário pendente").
export const lerSemana = (dias: (string | null | undefined)[]) => {
  const lidos = dias.map(lerDia);
  const avisos = lidos.flatMap((l) => (l.aviso ? [l.aviso] : []));
  const horarios: HorariosSemana | undefined = lidos.some((l) => l.dia.aberta)
    ? { versao: 2, dias: lidos.map((l) => l.dia) }
    : undefined;
  return { horarios, avisos };
};
