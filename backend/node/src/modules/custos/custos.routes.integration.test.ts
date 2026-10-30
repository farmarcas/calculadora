import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
const valores = {
  salarioMedio: { Farmacêutico: 8000, Atendimento: 2500 },
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
    lojaId = (await postLoja({ codigo: '001', nome: 'Centro' })).body.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('começa sem custos informados', async () => {
    const r = await reqGe().get(`/api/v1/lojas/${lojaId}/custos`).set(admin);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ informado: false, custos: null, regimeTributario: null });
    // sem regime: o cálculo usa o Lucro Presumido (62,2%) e avisa
    expect(r.body.encargos).toMatchObject({
      regime: 'presumido',
      regimeAusente: true,
      totalPct: 62.2,
    });
    expect(r.body.alertaRegime).toContain('Calculamos com Lucro Presumido');
  });

  it('o dono salva e lê; a auditoria não guarda valores', async () => {
    expect(
      (await reqGe().put(`/api/v1/lojas/${lojaId}/custos`).set(admin).send(valores)).status,
    ).toBe(200);
    const r = await reqGe().get(`/api/v1/lojas/${lojaId}/custos`).set(admin);
    expect(r.body).toMatchObject({ informado: true, custos: valores });
    expect(r.body.custos).not.toHaveProperty('encargosPct');
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
    // RAT e FAP fora da faixa
    expect(
      (
        await reqGe()
          .put(url)
          .set(admin)
          .send({ ...valores, encargos: { ratPct: 5 } })
      ).status,
    ).toBe(400);
    expect(
      (
        await reqGe()
          .put(url)
          .set(admin)
          .send({ ...valores, encargos: { fap: 2.5 } })
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

  it('o percentual digitado do formato antigo é aceito e ignorado: o encargo vem do regime', async () => {
    await reqGe().patch(`/api/v1/lojas/${lojaId}`).set(admin).send({ regimeTributario: 'simples' });
    const r = await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ ...valores, encargosPct: 70 });
    expect(r.status).toBe(200);
    expect(r.body.encargos).toMatchObject({
      regime: 'simples',
      regimeAusente: false,
      totalPct: 29,
    });
    const guardado = await prisma.loja.findUniqueOrThrow({ where: { id: lojaId } });
    expect(guardado.custos).toEqual(valores);
  });

  it('ajustes da loja (RAT, FAP, rescisão) mudam só aquela loja; "restaurar padrão" volta ao regime', async () => {
    const outra = (await postLoja({ codigo: '002', nome: 'Norte' })).body.id;
    for (const id of [lojaId, outra])
      await reqGe().patch(`/api/v1/lojas/${id}`).set(admin).send({ regimeTributario: 'presumido' });
    await reqGe().put(`/api/v1/lojas/${outra}/custos`).set(admin).send(valores);
    // RAT 3% × FAP 1,5 = 4,5%: diretos 38,3 → 38,3 + 19,44 + 7,44552 = 65,18552
    const ajustada = await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ ...valores, encargos: { ratPct: 3, fap: 1.5 } });
    expect(ajustada.body.encargos.totalPct).toBe(65.19);
    const lida = await reqGe().get(`/api/v1/lojas/${outra}/custos`).set(admin);
    expect(lida.body.encargos.totalPct).toBe(62.2);
    // com a rescisão ligada (5% no Presumido): 62,19952 + 5 = 67,19952
    const rescisao = await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ ...valores, encargos: { rescisaoLigada: true } });
    expect(rescisao.body.encargos.totalPct).toBe(67.2);
    // restaurar padrão = salvar sem ajustes
    const padrao = await reqGe().put(`/api/v1/lojas/${lojaId}/custos`).set(admin).send(valores);
    expect(padrao.body.encargos).toMatchObject({ totalPct: 62.2, rescisaoLigada: false });
  });
});
