import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { gerarAfd, type Marcacao } from '../ponto/afd.fake.js';
import {
  CNPJ_DIGITOS,
  CPF_ANA,
  CPF_BIA,
  admin,
  limparTudo,
  montarLojaComSimulacaoEmUso,
} from '../ponto/ponto.fixtures.js';

const semana1 = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'];
const semana2 = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];

// Ana 08–14 e Bia 14–20 conforme o plano; `saidaBia` permite a Bia sair depois (hora extra).
const marcar = (dias: string[], opcoes: { saidaBia?: string; semAna?: boolean } = {}): Marcacao[] =>
  dias.flatMap((data) => [
    ...(opcoes.semAna
      ? []
      : [
          { cpf: CPF_ANA, data, hora: '08:00' },
          { cpf: CPF_ANA, data, hora: '14:00' },
        ]),
    { cpf: CPF_BIA, data, hora: '14:00' },
    { cpf: CPF_BIA, data, hora: opcoes.saidaBia ?? '20:00' },
  ]);

describe('painel, limites e alertas do Gerenciar', () => {
  let lojaId: string;
  const painel = (h: Record<string, string> = admin) =>
    request(app).get(`/api/v1/lojas/${lojaId}/gerenciar/painel`).set(h);
  const enviar = async (marcacoes: Marcacao[], ini: string, fim: string, nome: string) => {
    const ord = [...marcacoes].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    const arq = Buffer.from(
      gerarAfd({ cnpj: CNPJ_DIGITOS, dataInicial: ini, dataFinal: fim, marcacoes: ord }),
      'latin1',
    );
    const r = await request(app)
      .post(`/api/v1/lojas/${lojaId}/ponto/importacoes`)
      .set(admin)
      .attach('arquivos', arq, nome);
    expect(r.body.arquivos[0].status).toBe('processado');
  };

  beforeEach(async () => {
    await limparTudo();
    lojaId = (await montarLojaComSimulacaoEmUso()).loja.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sem ponto importado o painel avisa que só há planejamento; sem simulação em uso também', async () => {
    const r = await painel();
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      pendenciasAbertas: 0,
      ultimaImportacao: null,
      tendencia: [],
      alertas: [],
    });
    expect(r.body.periodo.diasApurados).toBe(0);

    const outra = (
      await request(app).post('/api/v1/lojas').set(admin).send({ codigo: '009', nome: 'Sem uso' })
    ).body;
    const s = await request(app).get(`/api/v1/lojas/${outra.id}/gerenciar/painel`).set(admin);
    expect(s.body.semSimulacaoEmUso).toBe(true);
    expect(s.body.mensagem).toContain('só tem planejamento');
  });

  it('hora extra acima do limite por 2 semanas seguidas marca a simulação em uso como desatualizada, sem alterar nada', async () => {
    await enviar(marcar(semana1, { saidaBia: '21:00' }), '2026-10-05', '2026-10-09', 's1.txt');
    await enviar(marcar(semana2, { saidaBia: '21:00' }), '2026-10-12', '2026-10-16', 's2.txt');

    const r = (await painel()).body;
    expect(r.tendencia).toHaveLength(2);
    expect(r.tendencia[0]).toMatchObject({
      inicio: '2026-10-05',
      horaExtraH: 5,
      horasPlanejadas: 60,
      aderenciaPct: 100,
    });
    expect(r.alertas.map((a: { tipo: string }) => a.tipo)).toEqual(['hora_extra']);
    expect(r.alertas[0].texto).toContain('8.3%');
    expect(r.ultimaImportacao).toMatchObject({ arquivo: 's2.txt', status: 'processado' });
    expect(r.limites).toEqual({ horaExtraPct: 5, semanasSeguidas: 2, aderenciaMinPct: 90 });

    const sims = (await request(app).get(`/api/v1/lojas/${lojaId}/simulacoes`).set(admin)).body
      .data;
    const emUso = sims.find((s: { status: string }) => s.status === 'em_uso');
    expect(emUso.desatualizada).toBe(true);
    const detalhe = (await request(app).get(`/api/v1/simulacoes/${emUso.id}`).set(admin)).body;
    expect(detalhe.motivosDesatualizada.join(' ')).toContain('Hora extra acima de 5%');
    expect(detalhe.status).toBe('em_uso'); // nada muda sozinho
  });

  it('aderência abaixo do mínimo na última semana gera alerta', async () => {
    await enviar(marcar(semana1), '2026-10-05', '2026-10-09', 's1.txt');
    await enviar(marcar(semana2, { semAna: true }), '2026-10-12', '2026-10-16', 's2.txt');
    const r = (await painel()).body;
    expect(r.tendencia[1].aderenciaPct).toBe(50);
    expect(r.alertas.map((a: { tipo: string }) => a.tipo)).toContain('aderencia');
  });

  it('o dono edita os limites e o alerta some; gestor só lê; valores inválidos são recusados', async () => {
    await enviar(marcar(semana1, { saidaBia: '21:00' }), '2026-10-05', '2026-10-09', 's1.txt');
    await enviar(marcar(semana2, { saidaBia: '21:00' }), '2026-10-12', '2026-10-16', 's2.txt');
    const url = `/api/v1/lojas/${lojaId}/gerenciar/limites`;
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER' };

    expect(
      (
        await request(app)
          .put(url)
          .set(gestor)
          .send({ horaExtraPct: 20, semanasSeguidas: 2, aderenciaMinPct: 90 })
      ).status,
    ).toBe(403);
    expect((await request(app).get(url).set(gestor)).body.horaExtraPct).toBe(5);
    expect(
      (
        await request(app)
          .put(url)
          .set(admin)
          .send({ horaExtraPct: 150, semanasSeguidas: 2, aderenciaMinPct: 90 })
      ).status,
    ).toBe(400);

    expect(
      (
        await request(app)
          .put(url)
          .set(admin)
          .send({ horaExtraPct: 20, semanasSeguidas: 2, aderenciaMinPct: 90 })
      ).status,
    ).toBe(200);
    expect((await painel()).body.alertas).toEqual([]);
    expect(await prisma.auditoria.count({ where: { acao: 'gerenciar.limites' } })).toBe(1);
  });

  it('quem só consulta lê o painel agregado', async () => {
    await enviar(marcar(semana1), '2026-10-05', '2026-10-09', 's1.txt');
    const r = await painel({ 'X-Perfil': 'SCHEDULE_VIEWER' });
    expect(r.status).toBe(200);
    expect(r.body.aderenciaPct).toBe(100);
    expect(JSON.stringify(r.body)).not.toMatch(/Ana|Bia|F1|F2/);
  });
});
