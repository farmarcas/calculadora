import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN' };

const planilha = async (
  lojas: string[][],
  funcs: string[][],
  cabL = ['Cód_Loja', 'Nome_Loja'],
  cabF = ['ID_Colaborador', 'Nome_Colaborador', 'Cod_Loja', 'Funcao'],
) => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Filiais').addRows([cabL, ...lojas]);
  wb.addWorksheet('Quadro').addRows([cabF, ...funcs]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

describe('cadastros (rotas)', () => {
  beforeEach(async () => {
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('baixa a planilha modelo', async () => {
    const res = await request(app)
      .get('/api/v1/planilha-modelo')
      .buffer()
      .parse((r, cb) => {
        const c: Buffer[] = [];
        r.on('data', (d: Buffer) => c.push(d));
        r.on('end', () => cb(null, Buffer.concat(c)));
      });
    expect(res.status).toBe(200);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.body as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Lojas', 'Funcionários', 'Como preencher']);
  });

  it('importa planilha fora do modelo: sugere, confirma e não duplica ao reenviar', async () => {
    const arq = await planilha(
      [['001', 'Centro']],
      [
        ['F1', 'Ana', '001', 'Balconista'],
        ['F2', 'Bia', '999', 'Caixa'],
      ],
    );

    const prev = await request(app)
      .post('/api/v1/importacoes/cadastro')
      .set(admin)
      .attach('arquivo', arq, 'x.xlsx');
    expect(prev.status).toBe(201);
    expect(prev.body.mapeamento.lojas.aba).toBe('Filiais');
    expect(prev.body.mapeamento.funcionarios.colunas.loja).toBe(2);

    const ok = await request(app)
      .post(`/api/v1/importacoes/cadastro/${prev.body.id}/confirmar`)
      .set(admin)
      .send({ mapeamento: prev.body.mapeamento });
    expect(ok.status).toBe(200);
    expect(ok.body.lojas.novos).toBe(1);
    expect(ok.body.funcionarios.novos).toBe(1);
    expect(ok.body.erros[0].motivo).toContain('loja 999 não existe');

    const prev2 = await request(app)
      .post('/api/v1/importacoes/cadastro')
      .set(admin)
      .attach('arquivo', arq, 'x.xlsx');
    const again = await request(app)
      .post(`/api/v1/importacoes/cadastro/${prev2.body.id}/confirmar`)
      .set(admin)
      .send({ mapeamento: prev2.body.mapeamento });
    expect(again.body.lojas).toEqual({ novos: 0, atualizados: 1 });
    expect(await prisma.loja.count()).toBe(1);
    expect(await prisma.funcionario.count()).toBe(1);
    expect((await prisma.funcionario.findFirstOrThrow()).funcaoEscala).toBe('Atendimento');
  });

  it('bloqueia escrita para quem só consulta', async () => {
    const res = await request(app).post('/api/v1/lojas').send({ codigo: '1', nome: 'Loja' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SEM_PERMISSAO');
  });

  it('cria, lista, edita e remove loja; recusa código repetido e loja com funcionários', async () => {
    const c = await request(app)
      .post('/api/v1/lojas')
      .set(admin)
      .send({ codigo: '010', nome: 'Loja Dez' });
    expect(c.status).toBe(201);
    expect(
      (await request(app).post('/api/v1/lojas').set(admin).send({ codigo: '010', nome: 'Outra' }))
        .status,
    ).toBe(409);
    const f = await request(app)
      .post('/api/v1/funcionarios')
      .set(admin)
      .send({ matricula: 'M1', nome: 'Carla', lojaId: c.body.id, funcaoEscala: 'Caixa' });
    expect(f.status).toBe(201);
    expect((await request(app).delete(`/api/v1/lojas/${c.body.id}`).set(admin)).status).toBe(409);
    expect(
      (await request(app).patch(`/api/v1/lojas/${c.body.id}`).set(admin).send({ nome: 'Dez Novo' }))
        .body.nome,
    ).toBe('Dez Novo');
    expect(
      (await request(app).get('/api/v1/funcionarios?lojaId=' + c.body.id)).body.meta.total,
    ).toBe(1);
    expect((await request(app).delete(`/api/v1/funcionarios/${f.body.id}`).set(admin)).status).toBe(
      204,
    );
    expect((await request(app).delete(`/api/v1/lojas/${c.body.id}`).set(admin)).status).toBe(204);
  });
});
