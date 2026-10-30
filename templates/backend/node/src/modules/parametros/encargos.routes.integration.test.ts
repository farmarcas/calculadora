import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
const presumido = {
  regime: 'presumido',
  inssPatronalPct: 20,
  ratPct: 2,
  fap: 1,
  terceirosPct: 5.8,
  fgtsPct: 8,
  decimoTerceiroPct: 8.33,
  feriasPct: 11.11,
  rescisaoPct: 5,
};

describe('parâmetros de encargos (rotas)', () => {
  beforeEach(async () => {
    await prisma.parametroEncargo.deleteMany();
  });
  afterAll(async () => {
    await prisma.parametroEncargo.deleteMany();
    await prisma.$disconnect();
  });

  it('vem com os valores padrão e os totais de cada regime; todos os perfis veem', async () => {
    for (const perfil of [admin, gestor, consulta]) {
      const r = await reqGe().get('/api/v1/parametros-encargos').set(perfil);
      expect(r.status).toBe(200);
      const por = Object.fromEntries(r.body.regimes.map((x: { regime: string }) => [x.regime, x]));
      expect(por.simples).toMatchObject({ totalPct: 29, totalComRescisaoPct: 33 });
      expect(por.presumido).toMatchObject({ totalPct: 62.2, totalComRescisaoPct: 67.2 });
      expect(por.real.totalPct).toBe(por.presumido.totalPct);
      expect(por.presumido.vigente).toMatchObject({
        inssPatronalPct: 20,
        ratPct: 2,
        fap: 1,
        fgtsPct: 8,
      });
    }
  });

  it('só o dono cria versão; a vigência nova passa a valer e o histórico guarda a anterior', async () => {
    const corpo = { ...presumido, fgtsPct: 9, vigenciaInicio: '2020-01-01' };
    expect((await reqGe().post('/api/v1/parametros-encargos').set(gestor).send(corpo)).status).toBe(
      403,
    );
    expect(
      (await reqGe().post('/api/v1/parametros-encargos').set(consulta).send(corpo)).status,
    ).toBe(403);
    const ok = await reqGe().post('/api/v1/parametros-encargos').set(admin).send(corpo);
    expect(ok.status).toBe(201);
    const r = await reqGe().get('/api/v1/parametros-encargos').set(admin);
    const p = r.body.regimes.find((x: { regime: string }) => x.regime === 'presumido');
    // FGTS 9%: diretos 36,8 → 36,8 + 19,44 + 7,15392 = 63,39
    expect(p.vigente.fgtsPct).toBe(9);
    expect(p.totalPct).toBe(63.39);
    expect(p.historico).toHaveLength(1);
    // o Real não muda: é outro regime
    expect(r.body.regimes.find((x: { regime: string }) => x.regime === 'real').totalPct).toBe(62.2);
  });

  it('versão com data no futuro não vale ainda', async () => {
    await reqGe()
      .post('/api/v1/parametros-encargos')
      .set(admin)
      .send({ ...presumido, fgtsPct: 10, vigenciaInicio: '2999-01-01' });
    const r = await reqGe().get('/api/v1/parametros-encargos').set(admin);
    expect(r.body.regimes.find((x: { regime: string }) => x.regime === 'presumido').totalPct).toBe(
      62.2,
    );
  });

  it('recusa valores fora da faixa em português: RAT, FAP, percentual e data', async () => {
    const tenta = (extra: object) =>
      reqGe()
        .post('/api/v1/parametros-encargos')
        .set(admin)
        .send({ ...presumido, vigenciaInicio: '2026-12-01', ...extra });
    expect((await tenta({ ratPct: 5 })).body.error.message).toContain('RAT');
    expect((await tenta({ fap: 3 })).body.error.message).toContain('FAP');
    expect((await tenta({ fgtsPct: 150 })).body.error.message).toContain('FGTS');
    expect((await tenta({ vigenciaInicio: 'amanhã' })).body.error.message).toContain('vigência');
    expect((await tenta({ regime: 'mei' })).status).toBe(400);
    expect(await prisma.parametroEncargo.count()).toBe(0);
  });
});
