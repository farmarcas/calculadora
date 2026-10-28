import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { gerarAfd } from './afd.fake.js';
import {
  CNPJ_DIGITOS,
  CPF_ANA,
  CPF_BIA,
  CPF_DESCONHECIDO,
  admin,
  limparTudo,
  montarLojaComSimulacaoEmUso,
} from './ponto.fixtures.js';

// Segunda 05/10/2026 (dia planejado) e domingo 11/10/2026 (a loja não escala ninguém no domingo).
const marcacoes = [
  { cpf: CPF_ANA, data: '2026-10-05', hora: '08:02' },
  { cpf: CPF_ANA, data: '2026-10-05', hora: '14:00' },
  { cpf: CPF_BIA, data: '2026-10-05', hora: '14:00' },
  { cpf: CPF_BIA, data: '2026-10-05', hora: '20:05' },
  { cpf: CPF_DESCONHECIDO, data: '2026-10-05', hora: '09:00' },
  { cpf: CPF_ANA, data: '2026-10-11', hora: '10:00' },
];
const afd = (extra: Partial<Parameters<typeof gerarAfd>[0]> = {}) =>
  Buffer.from(
    gerarAfd({
      cnpj: CNPJ_DIGITOS,
      dataInicial: '2026-10-01',
      dataFinal: '2026-10-31',
      marcacoes,
      ...extra,
    }),
    'latin1',
  );

describe('ponto — importação do AFD', () => {
  let lojaId: string;

  beforeEach(async () => {
    await limparTudo();
    lojaId = (await montarLojaComSimulacaoEmUso()).loja.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const enviar = (
    arquivos: { nome: string; conteudo: Buffer }[],
    h: Record<string, string> = admin,
    id = lojaId,
  ) => {
    let r = request(app).post(`/api/v1/lojas/${id}/ponto/importacoes`).set(h);
    for (const a of arquivos) r = r.attach('arquivos', a.conteudo, a.nome);
    return r;
  };

  it('importa, separa aceitas e pendentes e registra no log', async () => {
    const r = await enviar([{ nome: 'AFD_out2026.txt', conteudo: afd() }]);
    expect(r.status).toBe(201);
    expect(r.body.arquivos[0]).toMatchObject({
      status: 'com_pendencias',
      periodo: { inicio: '2026-10-01', fim: '2026-10-31' },
      aceitas: 4,
      pendentes: 2, // CPF desconhecido + domingo sem escala
      repetidas: 0,
      semNovidades: false,
    });
    const motivos = (await prisma.batida.findMany({ where: { situacao: 'PENDENTE' } }))
      .map((b) => b.motivoPendencia)
      .sort();
    expect(motivos).toEqual(['cpf_desconhecido', 'dia_sem_escala']);
    const log = (await request(app).get(`/api/v1/lojas/${lojaId}/ponto/importacoes`).set(admin))
      .body;
    expect(log.data[0]).toMatchObject({
      arquivo: 'AFD_out2026.txt',
      aceitas: 4,
      pendentes: 2,
      autor: 'TENANT_ADMIN',
    });
  });

  it('reenviar o mesmo arquivo não duplica nenhuma batida', async () => {
    await enviar([{ nome: 'a.txt', conteudo: afd() }]);
    const total = await prisma.batida.count();
    const r = await enviar([{ nome: 'a.txt', conteudo: afd() }]);
    expect(r.body.arquivos[0]).toMatchObject({
      aceitas: 0,
      pendentes: 0,
      repetidas: 6,
      semNovidades: true,
    });
    expect(r.body.arquivos[0].avisos.join(' ')).toContain('já tinha sido enviado');
    expect(await prisma.batida.count()).toBe(total);
  });

  it('um período que se sobrepõe grava só as batidas novas', async () => {
    await enviar([{ nome: 'a.txt', conteudo: afd() }]);
    const r = await enviar([
      {
        nome: 'b.txt',
        conteudo: afd({
          marcacoes: [...marcacoes, { cpf: CPF_ANA, data: '2026-10-06', hora: '08:00' }],
        }),
      },
    ]);
    expect(r.body.arquivos[0]).toMatchObject({ aceitas: 1, repetidas: 6, pendentes: 0 });
  });

  it('recusa CNPJ de fora do grupo e CNPJ de outra loja, sem gravar batida', async () => {
    const fora = await enviar([{ nome: 'fora.txt', conteudo: afd({ cnpj: '99888777000166' }) }]);
    expect(fora.body.arquivos[0]).toMatchObject({ status: 'rejeitado' });
    expect(fora.body.arquivos[0].motivoRejeicao).toContain('não pertence a nenhuma loja do grupo');

    await request(app)
      .post('/api/v1/lojas')
      .set(admin)
      .send({ codigo: '002', nome: 'Norte', cnpj: '55.666.777/0001-81' });
    const outra = await enviar([{ nome: 'norte.txt', conteudo: afd({ cnpj: '55666777000181' }) }]);
    expect(outra.body.arquivos[0].motivoRejeicao).toContain('loja 002');
    expect(await prisma.batida.count()).toBe(0);
  });

  it('rejeita o arquivo inteiro se for inválido ou estiver cortado', async () => {
    const linhas = gerarAfd({
      cnpj: CNPJ_DIGITOS,
      dataInicial: '2026-10-01',
      dataFinal: '2026-10-31',
      marcacoes,
    }).split('\r\n');
    const cortado = Buffer.from(linhas.slice(0, 4).join('\r\n'), 'latin1');
    const r = await enviar([
      { nome: 'cortado.txt', conteudo: cortado },
      { nome: 'lixo.txt', conteudo: Buffer.from('isto não é um AFD') },
    ]);
    expect(r.body.arquivos.map((a: { status: string }) => a.status)).toEqual([
      'rejeitado',
      'rejeitado',
    ]);
    expect(r.body.arquivos[0].motivoRejeicao).toContain('trailer');
    expect(await prisma.batida.count()).toBe(0);
    expect(await prisma.importacaoPonto.count({ where: { status: 'REJEITADO' } })).toBe(2);
  });

  it('processa vários arquivos de uma vez, cada um com seu resultado', async () => {
    const outro = afd({
      marcacoes: [{ cpf: CPF_ANA, data: '2026-10-07', hora: '08:00' }],
      dataInicial: '2026-10-07',
      dataFinal: '2026-10-07',
    });
    const r = await enviar([
      { nome: 'a.txt', conteudo: afd() },
      { nome: 'b.txt', conteudo: outro },
    ]);
    expect(r.body.arquivos).toHaveLength(2);
    expect(r.body.arquivos[1]).toMatchObject({ aceitas: 1, status: 'processado' });
  });

  it('só dono e gestor importam; sem simulação em uso ou sem CNPJ na loja, explica', async () => {
    expect(
      (await enviar([{ nome: 'a.txt', conteudo: afd() }], { 'X-Perfil': 'SCHEDULE_VIEWER' }))
        .status,
    ).toBe(403);
    expect(
      (await enviar([{ nome: 'a.txt', conteudo: afd() }], { 'X-Perfil': 'SCHEDULE_MANAGER' }))
        .status,
    ).toBe(201);

    const semUso = (
      await request(app)
        .post('/api/v1/lojas')
        .set(admin)
        .send({ codigo: '009', nome: 'Sem uso', cnpj: '12.345.678/0001-95' })
    ).body;
    const r = await enviar(
      [{ nome: 'a.txt', conteudo: afd({ cnpj: '12345678000195' }) }],
      admin,
      semUso.id,
    );
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('SEM_SIMULACAO_EM_USO');

    await limparTudo();
    const semCnpj = (await montarLojaComSimulacaoEmUso({ cnpj: null })).loja.id;
    const s = await enviar([{ nome: 'a.txt', conteudo: afd() }], admin, semCnpj);
    expect(s.body.arquivos[0].motivoRejeicao).toContain('não tem CNPJ cadastrado');
  });
});
