import { execSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { gerarAfdsDeExemplo } from './exemplo.js';
import { admin, limparTudo } from './ponto.fixtures.js';

// Roteiro completo com os dados de exemplo: seed → importar os dois AFD → pendência → apuração → painel.
describe('dados de exemplo do ponto (seed + afd:exemplo)', () => {
  let lojaId: string;

  beforeAll(async () => {
    await limparTudo();
    execSync('npx tsx prisma/seed.ts', { env: { ...process.env }, stdio: 'pipe' });
    lojaId = (await prisma.loja.findFirstOrThrow({ where: { codigo: '001' } })).id;
  }, 60_000);
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('percorre o roteiro e confere os números', async () => {
    const [s1, s2] = gerarAfdsDeExemplo();
    const enviar = (a: { nome: string; conteudo: string }) =>
      request(app)
        .post(`/api/v1/lojas/${lojaId}/ponto/importacoes`)
        .set(admin)
        .attach('arquivos', Buffer.from(a.conteudo, 'latin1'), a.nome);

    const r1 = (await enviar(s1!)).body.arquivos[0];
    expect(r1).toMatchObject({ status: 'com_pendencias', pendentes: 1, repetidas: 0 });
    // reenviar: nada novo
    expect((await enviar(s1!)).body.arquivos[0]).toMatchObject({
      aceitas: 0,
      pendentes: 0,
      semNovidades: true,
    });
    expect((await enviar(s2!)).body.arquivos[0]).toMatchObject({
      status: 'processado',
      pendentes: 0,
    });

    const pend = (await request(app).get(`/api/v1/lojas/${lojaId}/ponto/pendencias`).set(admin))
      .body;
    expect(pend.meta.total).toBe(1);
    expect(pend.data[0].motivo).toBe('cpf_desconhecido');

    const semana1 = (
      await request(app)
        .get(`/api/v1/lojas/${lojaId}/apuracao/loja?de=2026-10-05&ate=2026-10-09`)
        .set(admin)
    ).body.loja;
    // 1 falta (Carla), 1 atraso (Bruno), hora extra: Caio 1h + Rita e Davi 1h por dia × 5 dias = 11h
    expect(semana1).toMatchObject({ faltas: 1, atrasos: 1, horaExtraH: 11 });

    const painel = (await request(app).get(`/api/v1/lojas/${lojaId}/gerenciar/painel`).set(admin))
      .body;
    expect(painel.tendencia).toHaveLength(2);
    expect(painel.alertas.map((a: { tipo: string }) => a.tipo)).toContain('hora_extra');
    expect(painel.pendenciasAbertas).toBe(1);
  });
});
