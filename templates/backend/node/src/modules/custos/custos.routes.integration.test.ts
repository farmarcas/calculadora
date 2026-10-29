import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
const valores = {
  salarioMedio: { Farmacêutico: 8000, Atendimento: 2500 },
  encargosPct: 70,
};

describe('custos da loja (rotas)', () => {
  let lojaId: string;

  beforeEach(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    lojaId = (
      await reqGe().post('/api/v1/lojas').set(admin).send({ codigo: '001', nome: 'Centro' })
    ).body.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('começa sem custos informados', async () => {
    const r = await reqGe().get(`/api/v1/lojas/${lojaId}/custos`).set(admin);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ informado: false, custos: null, regimeTributario: null });
  });

  it('o dono salva e lê; a auditoria não guarda valores', async () => {
    expect(
      (await reqGe().put(`/api/v1/lojas/${lojaId}/custos`).set(admin).send(valores)).status,
    ).toBe(200);
    const r = await reqGe().get(`/api/v1/lojas/${lojaId}/custos`).set(admin);
    expect(r.body).toMatchObject({ informado: true, custos: valores });
    expect(r.body.regimeTributario).toBeNull();
    const a = await prisma.auditoria.findFirstOrThrow({ where: { acao: 'loja.custos' } });
    expect(JSON.stringify(a.detalhe)).not.toContain('8000');
  });

  it('gestor e consulta não veem nem editam (403)', async () => {
    for (const h of [
      gestor,
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
      { 'X-GE': GE_INICIAL_ID },
    ]) {
      expect((await reqGe().get(`/api/v1/lojas/${lojaId}/custos`).set(h)).status).toBe(403);
      expect(
        (await reqGe().put(`/api/v1/lojas/${lojaId}/custos`).set(h).send(valores)).status,
      ).toBe(403);
    }
  });

  it('recusa valores inválidos e loja inexistente', async () => {
    const url = `/api/v1/lojas/${lojaId}/custos`;
    expect(
      (
        await reqGe()
          .put(url)
          .set(admin)
          .send({ ...valores, encargosPct: -1 })
      ).status,
    ).toBe(400);
    expect(
      (
        await reqGe()
          .put(url)
          .set(admin)
          .send({ ...valores, salarioMedio: { Farmacêutico: 0 } })
      ).status,
    ).toBe(400);
    expect(
      (
        await reqGe()
          .put(url)
          .set(admin)
          .send({ ...valores, salarioMedio: { Gerente: 5000 } })
      ).status,
    ).toBe(400);
    expect(
      (await reqGe().get('/api/v1/lojas/01a17cfc-5204-76f2-9eff-93b2f713448a/custos').set(admin))
        .status,
    ).toBe(404);
  });

  it('mostra o regime tributário que está no cadastro da loja e não o aceita no corpo', async () => {
    await prisma.loja.update({ where: { id: lojaId }, data: { regimeTributario: 'real' } });
    expect(
      (await reqGe().get(`/api/v1/lojas/${lojaId}/custos`).set(admin)).body.regimeTributario,
    ).toBe('real');
    expect(
      (
        await reqGe()
          .put(`/api/v1/lojas/${lojaId}/custos`)
          .set(admin)
          .send({ ...valores, regimeTributario: 'simples' })
      ).status,
    ).toBe(400);
  });
});
