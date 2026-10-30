import ExcelJS from 'exceljs';
import {
  CAMPOS_BASE,
  CAMPOS_ESCALA,
  CAMPOS_FUNCIONARIO,
  CAMPOS_LOJA,
  FUNCOES_ESCALA,
  type CampoDef,
} from './campos.js';

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
  montarAba(
    wb,
    'Lojas',
    CAMPOS_LOJA.filter((c) => !c.legado),
  );
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
    [''],
    ['Aba Lojas: configuração para o cálculo da Escala'],
    ['"Convenção permite 8h24": Sim ou Não. Define se a regra de 42h cabe em 5 dias.'],
    [
      '"Meta de <função>": quantas pessoas por hora a loja quer ter. Em branco vale o nível de hoje; Farmacêutico é sempre ao menos 1.',
    ],
    [
      '"Salário médio" e "Encargos (%)": só o dono do grupo grava; para os outros perfis essas colunas são ignoradas. O encargo é obrigatório para os custos serem gravados.',
    ],
    ['"Faturamento" e "Margem": também só o dono grava.'],
    [''],
    ['Aba Funcionários'],
    [
      '"Horário fixo": Sim ou Não. Quem tem horário fixo não é remanejado na redistribuição da escala.',
    ],
    [''],
    ['Quem importa o quê'],
    [
      'O operador cria e atualiza lojas. O dono atualiza as lojas que já existem (horário, faturamento, margem e configuração), mas não cria loja nem muda código ou CNPJ. O gestor importa só a equipe.',
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

export const gerarModeloEscala = () =>
  modeloSimples(
    'Escala atual',
    CAMPOS_ESCALA,
    'Uma linha por colaborador, com o turno que ele cumpre em cada dia trabalhado. Dias: "Seg a Sáb" ou "Seg,Ter,Qua". Várias lojas podem vir no mesmo arquivo.',
  );

export const gerarModeloBase = () =>
  modeloSimples(
    'Base comercial',
    CAMPOS_BASE,
    'Vendas por data e hora (pode haver uma linha por colaborador). Várias lojas podem vir no mesmo arquivo.',
  );
