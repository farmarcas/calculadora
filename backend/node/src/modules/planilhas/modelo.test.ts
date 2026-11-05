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
      'CNPJ',
      'Nome da loja / Apelido',
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
      // configuração
      'Convenção permite 8h24 (Sim/Não)',
      ...['Farmacêutico', 'Atendimento', 'Caixa'].flatMap((f) => [
        `Meta de ${f} (pessoas por hora)`,
        `Salário médio de ${f}`,
      ]),
    ];
    for (const col of esperadas) expect(lojas, col).toContain(col);
    // RAT, FAP e rescisão por loja não existem mais: os encargos vêm só do regime tributário.
    for (const col of ['RAT (%)', 'FAP', 'Provisão de rescisão (Sim/Não)']) expect(lojas, col).not.toContain(col);
  });

  it('cada campo da equipe existe como coluna da aba Funcionários, inclusive o horário fixo', async () => {
    const { funcionarios } = await cabecalhos();
    for (const col of [
      'Matrícula',
      'Nome',
      'CNPJ da loja',
      'CPF (fictício)',
      'Cargo',
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
      'regime tributário',
      'Horário fixo',
      'vazio nunca apaga',
    ])
      expect(texto, trecho).toContain(trecho);
    // RAT, FAP e rescisão por loja saíram: a ajuda não os cita.
    for (const fora of ['RAT', 'FAP', 'rescisão']) expect(texto, fora).not.toContain(fora);
  });

  it('o modelo novo não traz o código da loja, o código de lotação nem o antigo cargo, e marca o CNPJ como obrigatório', async () => {
    const { wb, lojas, funcionarios } = await cabecalhos();
    for (const col of ['Código da loja', 'Nome da loja']) expect(lojas, col).not.toContain(col);
    expect(lojas[0]).toBe('CNPJ');
    for (const col of ['Código da loja de lotação', 'Cargo (texto livre)', 'Função de escala'])
      expect(funcionarios, col).not.toContain(col);
    expect(funcionarios.filter((c) => c === 'Cargo')).toHaveLength(1);
    const bruto = (nome: string) =>
      (wb.getWorksheet(nome)!.getRow(1).values as string[]).slice(1);
    expect(bruto('Lojas')[0]).toBe('CNPJ *');
    expect(bruto('Funcionários')).toContain('CNPJ da loja *');
  });

  it('a coluna Cargo oferece a lista Farmacêutico, Atendimento e Caixa, que impede outro valor', async () => {
    const { wb, funcionarios } = await cabecalhos();
    const col = funcionarios.indexOf('Cargo') + 1;
    const ws = wb.getWorksheet('Funcionários')!;
    for (const linha of [2, 3, 500, 2000]) {
      const v = ws.getCell(linha, col).dataValidation;
      expect(v.type).toBe('list');
      expect(v.formulae).toEqual(['"Farmacêutico,Atendimento,Caixa"']);
      expect(v.allowBlank).toBe(true);
      expect(v.showErrorMessage).toBe(true);
      expect(v.errorStyle).toBe('stop');
    }
    // as outras colunas não têm lista
    expect(ws.getCell(2, 1).dataValidation).toBeFalsy();
  });

  it('a ajuda explica o CNPJ, o Cargo em lista e a base comercial, sem citar o código da loja', async () => {
    const { wb } = await cabecalhos();
    const texto = wb
      .getWorksheet('Como preencher')!
      .getSheetValues()
      .flat()
      .filter((v): v is string => typeof v === 'string')
      .join('\n');
    for (const trecho of ['identificada pelo CNPJ', 'escolha na lista', 'base comercial'])
      expect(texto.toLowerCase(), trecho).toContain(trecho.toLowerCase());
    expect(texto).not.toContain('Código da loja de lotação');
  });
});
