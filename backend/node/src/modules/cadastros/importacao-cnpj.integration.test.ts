import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { gerarModelo } from '../planilhas/modelo.js';

const perfil = (p: string) => ({ 'X-Perfil': p, 'X-GE': GE_INICIAL_ID });
const operador = perfil('PLATFORM_OPERATOR');
const admin = perfil('TENANT_ADMIN');
const gestor = perfil('SCHEDULE_MANAGER');

// CNPJs válidos (dígitos verificadores corretos).
const CNPJ_A = '11222333000181';
const CNPJ_B = '45997418000153';
const CNPJ_ZERO = '04252011000110'; // começa com zero: o Excel guarda 4252011000110

const xlsx = async (abas: Record<string, string[][]>) => {
  const wb = new ExcelJS.Workbook();
  for (const [nome, linhas] of Object.entries(abas)) wb.addWorksheet(nome).addRows(linhas);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

const importar = async (h: Record<string, string>, buf: Buffer) => {
  const up = await reqGe()
    .post('/api/v1/importacoes/cadastro')
    .set(h)
    .attach('arquivo', buf, 'f.xlsx');
  const ok = await reqGe()
    .post(`/api/v1/importacoes/cadastro/${up.body.id}/confirmar`)
    .set(h)
    .send({ mapeamento: up.body.mapeamento });
  return { up, ok };
};

const lojaPorCodigo = (codigo: string) => prisma.loja.findFirst({ where: { codigo } });

describe('importação do Cadastro pelo CNPJ (spec 028)', () => {
  beforeEach(async () => {
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
    await postLoja({ codigo: '070', nome: 'Loja Setenta', cnpj: CNPJ_A });
    await postLoja({ codigo: '071', nome: 'Loja Setenta e Um', cnpj: CNPJ_B });
    await postLoja({ codigo: '072', nome: 'Loja Zero', cnpj: CNPJ_ZERO });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const cabLoja = ['CNPJ', 'Nome da loja / Apelido', 'Faturamento médio (segunda)'];
  const cabFunc = ['Matrícula', 'Nome', 'CNPJ da loja', 'Cargo', 'Carga semanal (horas)'];

  it('atualiza a loja pelo CNPJ (com ou sem pontuação, com o zero perdido) sem código algum; o código cadastrado não muda', async () => {
    const buf = await xlsx({
      Lojas: [
        cabLoja,
        ['11.222.333/0001-81', 'Apelido do Centro', '1000'],
        [CNPJ_B, '', '2000'], // nome em branco mantém o cadastrado
        ['4252011000110', 'Zero', '3000'], // o Excel perdeu o zero da frente
      ],
      Funcionários: [cabFunc],
    });
    const { ok } = await importar(admin, buf);
    expect(ok.status).toBe(200);
    expect(ok.body.erros).toEqual([]);
    expect(ok.body.lojas).toEqual({ novos: 0, atualizados: 3 });
    const a = await lojaPorCodigo('070');
    expect(a).toMatchObject({ nome: 'Apelido do Centro', cnpj: CNPJ_A });
    expect(a?.faturamento).toMatchObject({ dias: [1000, null, null, null, null, null, null] });
    expect((await lojaPorCodigo('071'))?.nome).toBe('Loja Setenta e Um');
    expect((await lojaPorCodigo('072'))?.faturamento).toMatchObject({ dias: [3000, null, null, null, null, null, null] });
    // nenhuma loja foi criada nem teve o código trocado
    expect(await prisma.loja.count()).toBe(3);
  });

  it('CNPJ desconhecido, inválido, vazio e repetido: só essas linhas são recusadas, com a mensagem', async () => {
    const buf = await xlsx({
      Lojas: [
        cabLoja,
        [CNPJ_A, 'Boa', '1000'],
        ['11.222.333/0001-80', 'Dígito errado', '1'],
        ['98.765.432/0001-98', 'Sem loja', '1'], // CNPJ válido sem loja no grupo
        ['', 'Sem CNPJ', '1'],
        ['11.222.333/0001-81', 'Repetida', '1'],
      ],
      Funcionários: [cabFunc],
    });
    const { ok } = await importar(admin, buf);
    expect(ok.body.lojas).toEqual({ novos: 0, atualizados: 1 });
    const motivos = ok.body.erros.map((e: { linha: number; motivo: string }) => [e.linha, e.motivo]);
    expect(motivos).toContainEqual([5, 'CNPJ da loja vazio']);
    expect(motivos).toContainEqual([6, 'CNPJ 11.222.333/0001-81 repetido na planilha']);
    expect(motivos).toContainEqual([3, 'CNPJ inválido']);
    expect(motivos).toContainEqual([4, 'CNPJ não encontrado entre as lojas do grupo']);
    expect((await lojaPorCodigo('070'))?.nome).toBe('Boa');
  });

  it('CNPJ válido que não é de nenhuma loja do grupo não cria loja e diz que não foi encontrado', async () => {
    const buf = await xlsx({
      Lojas: [cabLoja, ['45.723.174/0001-10', 'Nova', '1']],
      Funcionários: [cabFunc],
    });
    const { ok } = await importar(operador, buf);
    expect(ok.body.lojas).toEqual({ novos: 0, atualizados: 0 });
    expect(ok.body.erros).toEqual([
      { aba: 'Lojas', linha: 2, motivo: 'CNPJ não encontrado entre as lojas do grupo' },
    ]);
    expect(await prisma.loja.count()).toBe(3);
  });

  it('funcionários ligados à loja pelo CNPJ; o cargo é deduzido quando digitado fora da lista', async () => {
    const buf = await xlsx({
      Funcionários: [
        cabFunc,
        ['F1', 'Ana', '11.222.333/0001-81', 'Farmacêutico', '44'],
        ['F2', 'Bia', CNPJ_B, 'Balconista', '44'],
        ['F3', 'Caio', '4252011000110', 'Vendedor', '44'],
        ['F4', 'Dani', CNPJ_A, 'Gerente', '44'],
        ['F5', 'Edu', '98.765.432/0001-98', 'Caixa', '44'],
        ['F6', 'Fabi', '', 'Caixa', '44'],
      ],
    });
    const { ok } = await importar(gestor, buf);
    expect(ok.status).toBe(200);
    expect(ok.body.funcionarios).toEqual({ novos: 4, atualizados: 0 });
    const por = async (m: string) =>
      prisma.funcionario.findFirst({ where: { matricula: m }, include: { loja: true } });
    expect((await por('F1'))?.loja.codigo).toBe('070');
    expect((await por('F2'))?.loja.codigo).toBe('071');
    expect((await por('F3'))?.loja.codigo).toBe('072');
    expect((await por('F1'))?.funcaoEscala).toBe('Farmacêutico');
    expect((await por('F2'))?.funcaoEscala).toBe('Atendimento'); // balconista
    expect((await por('F3'))?.funcaoEscala).toBe('Atendimento'); // vendedor
    expect((await por('F4'))?.funcaoEscala).toBeNull(); // gerente: fora do cálculo
    const motivos = ok.body.erros.map((e: { motivo: string }) => e.motivo);
    expect(motivos).toContain('Funcionário F5: CNPJ 98.765.432/0001-98 não encontrado entre as lojas do grupo');
    expect(motivos).toContain('CNPJ da loja vazio');
  });

  it('planilha no formato antigo (código da loja, função de escala, cargo livre, RAT/FAP/rescisão) continua importando e o código cadastrado não muda', async () => {
    const buf = await xlsx({
      Lojas: [
        ['Código da loja', 'Nome da loja', 'RAT (%)', 'FAP', 'Provisão de rescisão (Sim/Não)'],
        ['070', 'Loja Setenta Antiga', '9', '9', 'talvez'],
      ],
      Quadro: [
        ['Matrícula', 'Nome', 'Código da loja de lotação', 'Cargo', 'Função de escala', 'Carga semanal (horas)'],
        ['A1', 'Ana', '070', 'Balconista', 'Caixa', '44'],
      ],
    });
    const { ok } = await importar(admin, buf);
    expect(ok.status).toBe(200);
    expect(ok.body.erros).toEqual([]);
    expect(ok.body.lojas).toEqual({ novos: 0, atualizados: 1 });
    const l = await lojaPorCodigo('070');
    expect(l).toMatchObject({ nome: 'Loja Setenta Antiga', cnpj: CNPJ_A });
    const f = await prisma.funcionario.findFirst({ where: { matricula: 'A1' }, include: { loja: true } });
    expect(f?.loja.codigo).toBe('070');
    expect(f?.funcaoEscala).toBe('Caixa'); // a coluna "Função de escala" vale; o cargo livre fica só como cargo
    expect(f?.cargo).toBe('Balconista');
  });

  it('CNPJ e código na mesma linha: vale o CNPJ; se o código divergir, o código cadastrado não muda', async () => {
    const buf = await xlsx({
      Lojas: [
        ['Código da loja', 'CNPJ', 'Nome da loja'],
        ['999', CNPJ_B, 'Pelo CNPJ'],
      ],
    });
    const { ok } = await importar(admin, buf);
    expect(ok.body.erros).toEqual([]);
    expect(ok.body.lojas).toEqual({ novos: 0, atualizados: 1 });
    expect(await lojaPorCodigo('999')).toBeNull();
    expect(await lojaPorCodigo('071')).toMatchObject({ nome: 'Pelo CNPJ', cnpj: CNPJ_B });
  });

  it('o próprio modelo preenchido (CNPJ nas duas abas e Cargo da lista) importa por inteiro', async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await gerarModelo()) as unknown as ArrayBuffer);
    const lojas = wb.getWorksheet('Lojas')!;
    const func = wb.getWorksheet('Funcionários')!;
    const col = (ws: ExcelJS.Worksheet, titulo: string) =>
      (ws.getRow(1).values as string[]).findIndex((v) => String(v).replace(/ \*$/, '') === titulo);
    lojas.getCell(2, col(lojas, 'CNPJ')).value = '11.222.333/0001-81';
    lojas.getCell(2, col(lojas, 'Nome da loja / Apelido')).value = 'Centro (modelo)';
    func.getCell(2, col(func, 'Matrícula')).value = 'M1';
    func.getCell(2, col(func, 'Nome')).value = 'Maria Modelo';
    func.getCell(2, col(func, 'CNPJ da loja')).value = '11.222.333/0001-81';
    func.getCell(2, col(func, 'Cargo')).value = 'Atendimento';
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const { up, ok } = await importar(admin, buf);
    expect(up.body.mapeamento.lojas.colunas.cnpj).toBe(0);
    expect(ok.body.erros).toEqual([]);
    expect(ok.body.lojas).toEqual({ novos: 0, atualizados: 1 });
    expect(ok.body.funcionarios).toEqual({ novos: 1, atualizados: 0 });
    const f = await prisma.funcionario.findFirst({ where: { matricula: 'M1' }, include: { loja: true } });
    expect(f).toMatchObject({ funcaoEscala: 'Atendimento' });
    expect(f?.loja.codigo).toBe('070');
  });

  it('o gestor só enxerga as lojas do próprio grupo pelo CNPJ', async () => {
    const buf = await xlsx({ Funcionários: [cabFunc, ['G1', 'Gil', CNPJ_A, 'Caixa', '44']] });
    const { ok } = await importar(gestor, buf);
    expect(ok.body.funcionarios.novos).toBe(1);
  });
});
