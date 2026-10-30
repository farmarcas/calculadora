import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { gerarModelo } from './modelo.js';

const cabecalhos = async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load((await gerarModelo()) as unknown as ArrayBuffer);
  const linha1 = (nome: string) =>
    (wb.getWorksheet(nome)!.getRow(1).values as (string | undefined)[])
      .slice(1)
      .map((v) => String(v).replace(/ \*$/, ''));
  return { wb, lojas: linha1('Lojas'), funcionarios: linha1('Funcionários') };
};

describe('planilha modelo', () => {
  it('tem as abas Lojas, Funcionários e Como preencher', async () => {
    const { wb } = await cabecalhos();
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Lojas', 'Funcionários', 'Como preencher']);
  });

  it('cada campo da edição de loja existe como coluna da aba Lojas', async () => {
    const { lojas } = await cabecalhos();
    const esperadas = [
      'Código da loja',
      'Nome da loja',
      'CNPJ',
      'Cidade',
      'UF',
      'Marca',
      'Regime tributário',
      'Loja 24 horas (Sim/Não)',
      // horário por dia
      ...['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'].flatMap((d) => [
        `Abre ${d}`,
        `Fecha ${d}`,
      ]),
      // faturamento e margem
      ...['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'].map(
        (d) => `Faturamento médio (${d})`,
      ),
      'Faturamento médio mensal',
      'Margem bruta média (%)',
      // configuração
      'Convenção permite 8h24 (Sim/Não)',
      ...['Farmacêutico', 'Atendimento', 'Caixa', 'Apoio', 'Perfumaria'].flatMap((f) => [
        `Meta de ${f} (pessoas por hora)`,
        `Salário médio de ${f}`,
      ]),
      'RAT (%)',
      'FAP',
      'Provisão de rescisão (Sim/Não)',
    ];
    for (const col of esperadas) expect(lojas, col).toContain(col);
  });

  it('cada campo da equipe existe como coluna da aba Funcionários, inclusive o horário fixo', async () => {
    const { funcionarios } = await cabecalhos();
    for (const col of [
      'Matrícula',
      'Nome',
      'Código da loja de lotação',
      'CPF (fictício)',
      'Cargo',
      'Função de escala',
      'Carga semanal (horas)',
      'Carga mensal (horas)',
      'Horário de entrada atual',
      'Horário de saída atual',
      'Dias trabalhados',
      'Horário fixo (Sim/Não)',
    ])
      expect(funcionarios, col).toContain(col);
  });

  it('a aba de ajuda explica as colunas novas e quem importa o quê', async () => {
    const { wb } = await cabecalhos();
    const texto = wb
      .getWorksheet('Como preencher')!
      .getSheetValues()
      .flat()
      .filter((v): v is string => typeof v === 'string')
      .join('\n');
    for (const trecho of [
      'Convenção permite 8h24',
      'Meta de <função>',
      'Encargos (%)',
      'Horário fixo',
      'vazio nunca apaga',
    ])
      expect(texto, trecho).toContain(trecho);
  });
});
