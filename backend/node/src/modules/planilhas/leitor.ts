import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { ValidationError } from '../../shared/errors/validation-error.js';

export type Aba = { nome: string; cabecalhos: string[]; linhas: string[][] };

const pad = (n: number) => String(n).padStart(2, '0');

const celulaParaTexto = (v: ExcelJS.CellValue): string => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) {
    // Hora digitada numa célula vira data de 1899; devolve HH:MM.
    return v.getUTCFullYear() < 1950
      ? `${pad(v.getUTCHours())}:${pad(v.getUTCMinutes())}`
      : v.toISOString().slice(0, 10);
  }
  if (typeof v === 'object') {
    if ('richText' in v)
      return v.richText
        .map((t) => t.text)
        .join('')
        .trim();
    if ('text' in v) return String(v.text).trim();
    if ('result' in v) return celulaParaTexto(v.result as ExcelJS.CellValue);
    return '';
  }
  return String(v).trim();
};

const worksheetParaAba = (ws: ExcelJS.Worksheet): Aba | null => {
  const todas: string[][] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const valores = (row.values as ExcelJS.CellValue[]).slice(1).map(celulaParaTexto);
    if (valores.some((x) => x !== '')) todas.push(valores);
  });
  if (todas.length === 0) return null;
  const largura = Math.max(...todas.map((l) => l.length));
  const cheia = todas.map((l) => Array.from({ length: largura }, (_, i) => l[i] ?? ''));
  const [cabecalhos = [], ...linhas] = cheia;
  return { nome: ws.name, cabecalhos, linhas };
};

export const lerPlanilha = async (buffer: Buffer, nomeArquivo: string): Promise<Aba[]> => {
  const wb = new ExcelJS.Workbook();
  try {
    if (nomeArquivo.toLowerCase().endsWith('.csv')) {
      const ws = await wb.csv.read(Readable.from(buffer));
      ws.name = 'Planilha';
    } else {
      await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    }
  } catch {
    throw new ValidationError('Não consegui abrir o arquivo. Envie uma planilha .xlsx ou .csv.');
  }
  const abas = wb.worksheets.map(worksheetParaAba).filter((a): a is Aba => a !== null);
  if (abas.length === 0) throw new ValidationError('A planilha está vazia.');
  return abas;
};
