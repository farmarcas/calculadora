import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';

const perfil = (p: string) => ({ 'X-Perfil': p, 'X-GE': GE_INICIAL_ID });
const operador = perfil('PLATFORM_OPERATOR');
const admin = perfil('TENANT_ADMIN');
const gestor = perfil('SCHEDULE_MANAGER');

const CNPJ_A = '11222333000181';
const CNPJ_B = '45997418000153';

const xlsx = async (abas: Record<string, string[][]>) => {
  const wb = new ExcelJS.Workbook();
  for (const [nome, linhas] of Object.entries(abas)) wb.addWorksheet(nome).addRows(linhas);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

const enviar = async (h: Record<string, string>, buf: Buffer) =>
  reqGe().post('/api/v1/importacoes/cadastro').set(h).attach('arquivo', buf, 'f.xlsx');
const revisar = (h: Record<string, string>, id: string, mapeamento: unknown) =>
  reqGe().post(`/api/v1/importacoes/cadastro/${id}/revisar`).set(h).send({ mapeamento });
const confirmar = (h: Record<string, string>, id: string, mapeamento: unknown) =>
  reqGe().post(`/api/v1/importacoes/cadastro/${id}/confirmar`).set(h).send({ mapeamento });

const foto = async () => ({
  lojas: await prisma.loja.findMany({ orderBy: { codigo: 'asc' } }),
  funcionarios: await prisma.funcionario.count(),
  importacoes: await prisma.importacaoCadastro.findMany({ select: { id: true, status: true } }),
});

describe('revisão da importação do Cadastro (spec 029)', () => {
  beforeEach(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
    await postLoja({ codigo: '070', nome: 'Loja Setenta', cnpj: CNPJ_A });
    await postLoja({ codigo: '071', nome: 'Loja Setenta e Um', cnpj: CNPJ_B });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const planilha = () =>
    xlsx({
      Lojas: [
        ['CNPJ', 'Nome da loja / Apelido', 'Faturamento médio (segunda)'],
        ['11.222.333/0001-81', 'Centro', '1000'],
        [CNPJ_B, 'Norte', '2000'],
        ['98.765.432/0001-98', 'Sem loja', '1'], // CNPJ válido, sem loja no grupo
      ],
      Funcionários: [
        ['Matrícula', 'Nome', 'CNPJ da loja', 'Cargo'],
        ['F1', 'Ana', CNPJ_A, 'Farmacêutico'],
        ['F2', 'Bia', CNPJ_B, 'Caixa'],
        ['F3', 'Caio', '98.765.432/0001-98', 'Caixa'], // loja desconhecida
        ['', 'Sem matrícula', CNPJ_A, 'Caixa'],
      ],
    });

  it('a revisão não grava nada e não fecha a importação', async () => {
    const up = await enviar(admin, await planilha());
    const antes = await foto();
    const r = await revisar(admin, up.body.id, up.body.mapeamento);
    expect(r.status).toBe(200);
    expect(r.body.arquivo).toBe('f.xlsx');
    expect(await foto()).toEqual(antes);
    const imp = await prisma.importacaoCadastro.findUniqueOrThrow({ where: { id: up.body.id } });
    expect(imp.status).not.toBe('confirmada');
    expect(await prisma.auditoria.count({ where: { acao: 'cadastro.importado' } })).toBe(0);
  });

  it('os números da revisão são os mesmos da gravação', async () => {
    const up = await enviar(admin, await planilha());
    const r = await revisar(admin, up.body.id, up.body.mapeamento);
    expect(r.body.lojas).toEqual({ atualiza: 2, novas: 0, comErro: 1 });
    expect(r.body.funcionarios).toEqual({ atualiza: 0, novas: 2, comErro: 2 });
    const motivos = r.body.erros.map((e: { aba: string; linha: number; motivo: string }) => [
      e.aba,
      e.linha,
      e.motivo,
    ]);
    expect(motivos).toContainEqual(['Lojas', 4, 'CNPJ não encontrado entre as lojas do grupo']);
    expect(motivos).toContainEqual(['Funcionários', 5, 'Matrícula vazia']);

    const ok = await confirmar(admin, up.body.id, up.body.mapeamento);
    expect(ok.status).toBe(200);
    expect(ok.body.lojas).toEqual({ novos: r.body.lojas.novas, atualizados: r.body.lojas.atualiza });
    expect(ok.body.funcionarios).toEqual({
      novos: r.body.funcionarios.novas,
      atualizados: r.body.funcionarios.atualiza,
    });
    expect(ok.body.erros).toEqual(r.body.erros);
    expect(await prisma.funcionario.count()).toBe(2);
  });

  it('depois de gravar, uma nova revisão do mesmo conteúdo mostra os funcionários como atualização', async () => {
    const up = await enviar(admin, await planilha());
    await confirmar(admin, up.body.id, up.body.mapeamento);
    const up2 = await enviar(admin, await planilha());
    const r = await revisar(admin, up2.body.id, up2.body.mapeamento);
    expect(r.body.funcionarios).toMatchObject({ atualiza: 2, novas: 0 });
  });

  it('a planilha antiga, por código, também é revisada e criar loja não cria nada na revisão', async () => {
    const buf = await xlsx({
      Lojas: [
        ['Código da loja', 'Nome da loja'],
        ['070', 'Loja Setenta Antiga'],
        ['999', 'Loja Nova'], // só a operadora cria; precisa de CNPJ? (criação pelo formato antigo)
      ],
    });
    const up = await enviar(operador, buf);
    const antes = await prisma.loja.count();
    const r = await revisar(operador, up.body.id, up.body.mapeamento);
    expect(r.status).toBe(200);
    expect(r.body.lojas.atualiza).toBe(1);
    expect(await prisma.loja.count()).toBe(antes);
  });

  it('o gestor revisa só a equipe: a aba Lojas é ignorada e avisada', async () => {
    const up = await enviar(gestor, await planilha());
    const r = await revisar(gestor, up.body.id, up.body.mapeamento);
    expect(r.status).toBe(200);
    expect(r.body.lojas).toEqual({ atualiza: 0, novas: 0, comErro: 0 });
    expect(r.body.funcionarios.novas).toBe(2);
  });

  it('coluna essencial faltando e planilha vazia: mensagem de como corrigir', async () => {
    const semCnpj = await xlsx({ Funcionários: [['Matrícula', 'Nome', 'Cargo'], ['F1', 'Ana', 'Caixa']] });
    const up = await enviar(admin, semCnpj);
    const r = await revisar(admin, up.body.id, up.body.mapeamento);
    expect(r.status).toBe(400);
    expect(r.body.error.message).toBe(
      'Não encontramos a coluna CNPJ da loja. Baixe o modelo e confira os nomes das colunas.',
    );

    const vazia = await enviar(admin, await xlsx({ Lojas: [['CNPJ', 'Nome da loja']] }));
    expect(vazia.status).toBe(400);
    expect(vazia.body.error.message).toBe(
      'A planilha está vazia. Preencha a partir da linha 2 do modelo e envie de novo.',
    );
  });

  it('importação já confirmada não pode ser revisada de novo', async () => {
    const up = await enviar(admin, await planilha());
    await confirmar(admin, up.body.id, up.body.mapeamento);
    const r = await revisar(admin, up.body.id, up.body.mapeamento);
    expect(r.status).toBe(409);
  });
});
