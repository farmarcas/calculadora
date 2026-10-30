import ExcelJS from 'exceljs';

// Modelo no mesmo formato do relatório de lojas da plataforma.
const CABECALHOS = [
  'Bandeira',
  'CNPJ',
  'Apelido de Loja',
  'Status',
  'Regime Tributário',
  'Id',
  'Cidade - Endereço Receita',
  'Estado - Endereço Receita',
  'Grupo Econômico',
  'Anjo Responsavel',
  'Nome do responsável pelo GE',
  'SEGUNDA',
  'TERÇA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SABADO',
  'DOMINGO',
];
const EXEMPLO = [
  'Bandeira Exemplo',
  '11222333000181',
  'Loja Centro',
  'Ativado',
  'Simples',
  '1001',
  'SIDERÓPOLIS',
  'SC',
  '250',
  'Nome do anjo',
  'Nome do responsável',
  '07 - 20',
  '07 - 20',
  '07 - 20',
  '07 - 20',
  '07 - 20',
  '07 - 19',
  '',
];

export const gerarModeloLojas = async (): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('lojas');
  ws.addRow(CABECALHOS);
  ws.addRow(EXEMPLO);
  ws.getRow(1).font = { bold: true };
  ws.getRow(2).font = { italic: true, color: { argb: 'FF6B7A90' } };
  CABECALHOS.forEach((c, i) => {
    ws.getColumn(i + 1).width = Math.max(14, c.length + 4);
    ws.getColumn(i + 1).numFmt = '@';
  });
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  wb.addWorksheet('Como preencher').addRows([
    ['Uma linha por loja. A linha 2 da aba "lojas" é só um exemplo: apague ou substitua.'],
    ['Só entram lojas com Status "Ativado". Desativado, Montando e Transição são ignoradas.'],
    [
      'CNPJ: obrigatório, com ou sem pontuação. Ele identifica a loja: reenviar o arquivo atualiza, não duplica.',
    ],
    [
      'Grupo Econômico: número do grupo. Grupos novos são criados; o nome inicial é o do responsável pelo GE.',
    ],
    ['Id: vira o código da loja dentro do grupo.'],
    [
      'Horário: "07 - 20" (abre e fecha). "07 - 00" fecha à meia-noite. "00 - 00" ou vazio = fechado.',
    ],
    ['Regime Tributário: Simples, Presumido ou Real.'],
  ]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};
