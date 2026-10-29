import ExcelJS from 'exceljs';
import type { PessoaApurada } from './periodo.js';
import { ROTULO_GERENCIAL } from './periodo.js';

const NOMES_DIA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const gerarExcelApuracao = async (a: {
  lojaNome: string;
  periodo: { de: string; ate: string };
  pessoas: PessoaApurada[];
  resumo: Record<string, unknown>;
}): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Apuração por pessoa');
  ws.addRow([`${a.lojaNome} · ${a.periodo.de} a ${a.periodo.ate}`]).font = { bold: true, size: 14 };
  ws.addRow([ROTULO_GERENCIAL.toUpperCase()]).font = { bold: true, color: { argb: 'FF8A5A00' } };
  ws.addRow([]);
  const cab = ws.addRow([
    'Data',
    'Dia',
    'Pessoa',
    'Função',
    'Planejado (h)',
    'Realizado (h)',
    'Batidas',
    'Hora extra (h)',
    'Ocorrências',
  ]);
  cab.font = { bold: true };
  for (const p of a.pessoas)
    for (const d of p.dias)
      ws.addRow([
        d.data,
        NOMES_DIA[d.diaSemana],
        p.nome,
        p.funcao ?? '',
        d.planejadoH,
        d.realizadoH ?? '',
        d.batidas.map(hhmm).join(' '),
        d.horaExtraH,
        d.ocorrencias.map((o) => o.texto).join(' | '),
      ]);
  ws.columns = [
    { width: 12 },
    { width: 6 },
    { width: 24 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 24 },
    { width: 14 },
    { width: 70 },
  ];
  ws.addRow([]);
  ws.addRow([
    `Apuração gerencial para uso interno: não substitui o registro oficial de ponto, não é espelho de ponto e não alimenta folha.`,
  ]);

  const r = wb.addWorksheet('Resumo da loja');
  r.addRow([ROTULO_GERENCIAL.toUpperCase()]).font = { bold: true, color: { argb: 'FF8A5A00' } };
  r.addRow([]);
  for (const [k, v] of Object.entries(a.resumo))
    r.addRow([k, typeof v === 'object' ? JSON.stringify(v) : v]);
  r.columns = [{ width: 32 }, { width: 80 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
};
