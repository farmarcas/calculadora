import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };

const CAB = ['Data', 'Hora', 'Código da loja', 'Venda líquida (R$)'];

const xlsx = async (linhas: string[][], cab: string[] = CAB) => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Base').addRows([cab, ...linhas]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};
const revisar = (buf: Buffer, nome = 'base.xlsx', h = admin) =>
  reqGe().post('/api/v1/cargas/base/revisar').set(h).attach('arquivo', buf, nome);
const enviar = (buf: Buffer, nome = 'base.xlsx') =>
  reqGe().post('/api/v1/cargas/base').set(admin).attach('arquivo', buf, nome);

const foto = async () => ({
  cargas: await prisma.carga.count(),
  vendas: await prisma.vendaHora.count(),
  ativas: await prisma.carga.count({ where: { ativa: true } }),
});

describe('revisão da base comercial (spec 029)', () => {
  beforeEach(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await postLoja({ codigo: '001', nome: 'Centro' });
    await postLoja({ codigo: '002', nome: 'Norte' });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const linhas = () => [
    ['01/10/2026', '9', '001', '100,00'],
    ['15/10/2026', '10', '001', '200,00'],
    ['31/10/2026', '11', '002', '300,00'],
    ['20/10/2026', '12', '099', '50,00'], // loja não cadastrada
    ['xx', '12', '001', '1,00'], // data inválida
  ];

  it('resume o arquivo (lojas, período, linhas, não cadastradas, erros) sem gravar nada', async () => {
    const antes = await foto();
    const r = await revisar(await xlsx(linhas()));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      arquivo: 'base.xlsx',
      linhas: 4,
      lojas: 2,
      lojasNaoCadastradas: ['099'],
      periodo: { inicio: '2026-10-01', fim: '2026-10-31' },
      substitui: [],
      totalErros: 1,
    });
    expect(r.body.erros[0]).toMatchObject({ linha: 6, motivo: expect.stringContaining('Data') });
    expect(await foto()).toEqual(antes);
  });

  it('depois de um envio, a revisão avisa quais lojas serão substituídas e desde quando', async () => {
    expect((await enviar(await xlsx(linhas()))).status).toBe(201);
    const antes = await foto();
    const r = await revisar(await xlsx([['05/11/2026', '9', '001', '10,00']]));
    expect(r.status).toBe(200);
    const hoje = new Date().toISOString().slice(0, 10);
    expect(r.body.substitui).toEqual([{ codigo: '001', desde: hoje }]);
    expect(r.body.lojas).toBe(1);
    expect(await foto()).toEqual(antes);
  });

  it('coluna faltando, planilha vazia, formato errado e arquivo acima do limite: mensagem de como corrigir', async () => {
    const semHora = await revisar(
      await xlsx([['01/10/2026', '001', '1']], ['Data', 'Código da loja', 'Venda líquida (R$)']),
    );
    expect(semHora.status).toBe(400);
    expect(semHora.body.error.message).toBe(
      'Não encontramos a coluna Hora. Baixe o modelo e confira os nomes das colunas.',
    );

    const vazia = await revisar(await xlsx([]));
    expect(vazia.status).toBe(400);
    expect(vazia.body.error.message).toBe(
      'A planilha está vazia. Preencha a partir da linha 2 do modelo e envie de novo.',
    );

    const pdf = await revisar(Buffer.from('%PDF-1.4'), 'base.pdf');
    expect(pdf.status).toBe(400);
    expect(pdf.body.error.message).toBe('Envie uma planilha .xlsx ou .csv');

    const grande = await revisar(Buffer.alloc(11 * 1024 * 1024, 'a'), 'grande.csv');
    expect(grande.status).toBe(400);
    expect(grande.body.error.message).toBe(
      'O arquivo tem mais de 10 MB. Divida a planilha em arquivos menores.',
    );
  });

  it('quem só consulta não revisa nem envia', async () => {
    expect((await revisar(await xlsx(linhas()), 'base.xlsx', consulta)).status).toBe(403);
  });
});
