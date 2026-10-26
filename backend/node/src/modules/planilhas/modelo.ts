import ExcelJS from 'exceljs';
import { CAMPOS_FUNCIONARIO, CAMPOS_LOJA, FUNCOES_ESCALA, type CampoDef } from './campos.js';

const montarAba = (wb: ExcelJS.Workbook, nome: string, campos: CampoDef[]) => {
  const ws = wb.addWorksheet(nome);
  ws.addRow(campos.map((c) => c.rotulo + (c.obrigatorio ? ' *' : '')));
  ws.addRow(campos.map((c) => c.exemplo));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E8EB' } };
  ws.getRow(2).font = { italic: true, color: { argb: 'FF6B7A90' } };
  campos.forEach((c, i) => {
    ws.getColumn(i + 1).width = Math.max(18, c.rotulo.length + 6);
    ws.getColumn(i + 1).numFmt = '@';
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  return ws;
};

export const gerarModelo = async (): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook();
  montarAba(wb, 'Lojas', CAMPOS_LOJA);
  montarAba(wb, 'Funcionários', CAMPOS_FUNCIONARIO);
  const ajuda = wb.addWorksheet('Como preencher');
  ajuda.addRows([
    ['Preencha as abas "Lojas" e "Funcionários". A linha 2 é só um exemplo: apague ou substitua.'],
    ['Campos com * são obrigatórios.'],
    [
      'Na aba Funcionários, "Código da loja de lotação" deve existir na aba Lojas (ou já estar cadastrado).',
    ],
    [
      `Função de escala aceita: ${FUNCOES_ESCALA.join(', ')}. Deixando em branco, o sistema tenta deduzir pelo cargo.`,
    ],
    [
      'Horários no formato HH:MM. Use apenas dados fictícios enquanto o parecer de proteção de dados não existir.',
    ],
  ]);
  ajuda.getColumn(1).width = 110;
  return Buffer.from(await wb.xlsx.writeBuffer());
};
