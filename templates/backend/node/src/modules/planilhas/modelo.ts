import ExcelJS from 'exceljs';
import {
  CAMPOS_BASE,
  CAMPOS_FUNCIONARIO,
  CAMPOS_LOJA,
  FUNCOES_ESCALA,
  type CampoDef,
} from './campos.js';

// Quantas linhas da coluna Cargo oferecem a lista de opções.
const LINHAS_COM_LISTA = 2000;

const montarAba = (wb: ExcelJS.Workbook, nome: string, campos: CampoDef[]) => {
  const ws = wb.addWorksheet(nome);
  ws.addRow(campos.map((c) => c.rotulo + (c.obrigatorio || c.obrigatorioNoModelo ? ' *' : '')));
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
  montarAba(
    wb,
    'Lojas',
    CAMPOS_LOJA.filter((c) => !c.legado),
  );
  const camposFuncionario = CAMPOS_FUNCIONARIO.filter((c) => !c.legado);
  const wsFuncionarios = montarAba(wb, 'Funcionários', camposFuncionario);
  // "Cargo": lista fechada, para ninguém digitar vendedor, balconista ou outro nome de cargo. A importação não depende dela.
  const colunaCargo = camposFuncionario.findIndex((c) => c.chave === 'funcao_escala') + 1;
  for (let linha = 2; linha <= LINHAS_COM_LISTA; linha++)
    wsFuncionarios.getCell(linha, colunaCargo).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${FUNCOES_ESCALA.join(',')}"`],
      showErrorMessage: true,
      errorStyle: 'stop',
      errorTitle: 'Cargo',
      error: `Escolha na lista: ${FUNCOES_ESCALA.join(', ')}.`,
      showInputMessage: true,
      promptTitle: 'Cargo',
      prompt: 'Escolha na lista.',
    };
  const ajuda = wb.addWorksheet('Como preencher');
  ajuda.addRows([
    ['Preencha as abas "Lojas" e "Funcionários". A linha 2 é só um exemplo: apague ou substitua.'],
    ['Campos com * são obrigatórios.'],
    [
      'A loja é identificada pelo CNPJ (com ou sem pontos e traço). Na aba Lojas, o CNPJ precisa ser de uma loja já cadastrada no grupo; na aba Funcionários, "CNPJ da loja" liga a pessoa à loja.',
    ],
    [
      `Cargo: escolha na lista (${FUNCOES_ESCALA.join(', ')}). Não digite outros nomes de cargo: só esses três entram no cálculo da escala.`,
    ],
    [
      'Para ver os horários de maior venda, envie também a base comercial (venda por hora) em "Importar".',
    ],
    ['Horários no formato HH:MM.'],
    [
      'Intervalo (opcional): informe o início e o fim juntos, dentro do horário de trabalho (por exemplo, 12:00 e 13:00). A cobertura por hora desconta quem está no intervalo.',
    ],
    [''],
    ['Aba Lojas: configuração para o cálculo da Escala'],
    ['"Convenção permite 8h24": Sim ou Não. Define se a regra de 42h cabe em 5 dias.'],
    [
      '"Meta de <função>": quantas pessoas por hora a loja quer ter. Em branco vale o nível de hoje; Farmacêutico é sempre ao menos 1.',
    ],
    ['"Salário médio": só o dono do grupo grava; para os outros perfis a coluna é ignorada.'],
    [
      'Encargos: o percentual vem do regime tributário da loja (Simples Nacional, Lucro Presumido ou Lucro Real); não é digitado na planilha.',
    ],
    ['"Faturamento": também só o dono grava.'],
    [''],
    ['Aba Funcionários'],
    [
      '"Horário fixo": Sim ou Não. Quem tem horário fixo não é remanejado na redistribuição da escala.',
    ],
    [''],
    ['Quem importa o quê'],
    [
      'O operador atualiza lojas pelo CNPJ (e cria lojas novas pelo cadastro). O dono atualiza as lojas que já existem (horário, faturamento e configuração), mas não cria loja nem muda o CNPJ. O gestor importa só a equipe.',
    ],
    ['Coluna em branco mantém o que já está cadastrado: vazio nunca apaga.'],
  ]);
  ajuda.getColumn(1).width = 110;
  return Buffer.from(await wb.xlsx.writeBuffer());
};

const modeloSimples = async (nome: string, campos: CampoDef[], dica: string): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook();
  montarAba(wb, nome, campos);
  wb.addWorksheet('Como preencher').addRows([
    [dica],
    ['Campos com * são obrigatórios. A linha 2 é só um exemplo: apague ou substitua.'],
  ]);
  wb.getWorksheet('Como preencher')!.getColumn(1).width = 110;
  return Buffer.from(await wb.xlsx.writeBuffer());
};

export const gerarModeloBase = () =>
  modeloSimples(
    'Base comercial',
    CAMPOS_BASE,
    'Vendas por data e hora (pode haver uma linha por colaborador). Várias lojas podem vir no mesmo arquivo.',
  );
