import { it } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { prisma } from './shared/database/prisma.js';

it('debug', async () => {
  const l = await prisma.loja.findFirstOrThrow({ where: { codigo: '001' } });
  const p = (
    await request(app)
      .get(`/api/v1/lojas/${l.id}/gerenciar/painel`)
      .set({ 'X-Perfil': 'TENANT_ADMIN' })
  ).body;
  process.stdout.write(
    JSON.stringify({ t: p.tendencia, a: p.alertas, l: p.limites }, null, 1) + '\n',
  );
});
