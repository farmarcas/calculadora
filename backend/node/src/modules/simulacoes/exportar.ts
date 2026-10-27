import ExcelJS from 'exceljs';
import { type PessoaSim, type TurnoSim } from './avaliar.js';

const NOMES_DIA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const hh = (h: number) =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export const gerarExcelEscala = async (a: {
  lojaNome: string;
  simulacao: { nome: string; status: string; regraNome: string; vigenciaInicio?: Date | null };
  quadro: PessoaSim[];
  turnos: TurnoSim[];
}): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Escala');
  ws.addRow([`${a.lojaNome} · ${a.simulacao.nome}`]).font = { bold: true, size: 14 };
  ws.addRow([
    `Regra ${a.simulacao.regraNome} · situação: ${a.simulacao.status}${a.simulacao.vigenciaInicio ? ` · vigência desde ${a.simulacao.vigenciaInicio.toISOString().slice(0, 10)}` : ''}`,
  ]);
  ws.addRow([]);
  const cab = ws.addRow(['Pessoa', 'Função', ...NOMES_DIA]);
  cab.font = { bold: true };
  cab.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E8EB' } };
  for (const p of a.quadro) {
    const dias = NOMES_DIA.map((_, d) => {
      const t = a.turnos.find((x) => x.matricula === p.matricula && x.dia === d);
      if (!t) return 'Folga';
      const int =
        t.iniIntervalo != null && t.fimIntervalo != null
          ? ` (intervalo ${hh(t.iniIntervalo)}–${hh(t.fimIntervalo)})`
          : '';
      return `${hh(t.entrada)}–${hh(t.saida)}${int}`;
    });
    ws.addRow([p.nome, p.funcao ?? '', ...dias]);
  }
  ws.columns = [{ width: 26 }, { width: 16 }, ...NOMES_DIA.map(() => ({ width: 30 }))];
  ws.addRow([]);
  ws.addRow([
    'Escala simulada para gestão interna: não substitui o registro oficial de ponto nem garante conformidade trabalhista.',
  ]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};
