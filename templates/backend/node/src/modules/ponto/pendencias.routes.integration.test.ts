import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { gerarAfd } from './afd.fake.js';
import {
  CNPJ_DIGITOS,
  CPF_ANA,
  CPF_DESCONHECIDO,
  admin,
  limparTudo,
  montarLojaComSimulacaoEmUso,
} from './ponto.fixtures.js';

const marcacoes = [
  { cpf: CPF_ANA, data: '2026-10-05', hora: '08:02' },
  { cpf: CPF_DESCONHECIDO, data: '2026-10-05', hora: '09:00' },
  { cpf: CPF_DESCONHECIDO, data: '2026-10-05', hora: '13:00' },
  { cpf: CPF_DESCONHECIDO, data: '2026-10-11', hora: '10:00' }, // domingo: sem escala
  { cpf: CPF_ANA, data: '2026-10-11', hora: '10:00' }, // domingo: Ana também
];

describe('ponto — pendências', () => {
  let lojaId: string;
  const url = (p = '') => `/api/v1/lojas/${lojaId}/ponto/pendencias${p}`;

  beforeEach(async () => {
    await limparTudo();
    lojaId = (await montarLojaComSimulacaoEmUso()).loja.id;
    const arq = Buffer.from(
      gerarAfd({
        cnpj: CNPJ_DIGITOS,
        dataInicial: '2026-10-01',
        dataFinal: '2026-10-31',
        marcacoes,
      }),
      'latin1',
    );
    await request(app)
      .post(`/api/v1/lojas/${lojaId}/ponto/importacoes`)
      .set(admin)
      .attach('arquivos', arq, 'a.txt');
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lista a fila com o CPF mascarado e o motivo', async () => {
    const r = await request(app).get(url()).set(admin);
    expect(r.status).toBe(200);
    expect(r.body.meta.total).toBe(4);
    const primeira = r.body.data[0];
    expect(primeira).toMatchObject({
      data: '2026-10-05',
      hora: '09:00',
      motivo: 'cpf_desconhecido',
    });
    expect(primeira.cpfMascarado).toMatch(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/);
    expect(JSON.stringify(r.body)).not.toContain(CPF_DESCONHECIDO);
    const filtrado = await request(app).get(url('?motivo=dia_sem_escala')).set(admin);
    expect(filtrado.body.meta.total).toBe(1);
    expect(filtrado.body.data.find((p: { pessoa: unknown }) => p.pessoa)?.pessoa).toMatchObject({
      matricula: 'F1',
    });
  });

  it('vincula uma pendência a uma pessoa e ela sai da fila', async () => {
    const [p] = (await request(app).get(url()).set(admin)).body.data;
    expect(
      (
        await request(app)
          .post(url(`/${p.id}/vincular`))
          .set(admin)
          .send({ matricula: 'F2' })
      ).status,
    ).toBe(204);
    const b = await prisma.batida.findUniqueOrThrow({ where: { id: p.id } });
    expect(b).toMatchObject({
      situacao: 'VINCULADA',
      matricula: 'F2',
      resolvidaPor: 'TENANT_ADMIN',
    });
    expect((await request(app).get(url()).set(admin)).body.meta.total).toBe(3);
    // já resolvida: não dá para resolver de novo
    expect(
      (
        await request(app)
          .post(url(`/${p.id}/vincular`))
          .set(admin)
          .send({ matricula: 'F2' })
      ).status,
    ).toBe(404);
  });

  it('ignorar exige motivo e fica registrado', async () => {
    const [p] = (await request(app).get(url()).set(admin)).body.data;
    expect(
      (
        await request(app)
          .post(url(`/${p.id}/ignorar`))
          .set(admin)
          .send({})
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post(url(`/${p.id}/ignorar`))
          .set(admin)
          .send({ motivo: 'visitante' })
      ).status,
    ).toBe(204);
    expect(await prisma.batida.findUniqueOrThrow({ where: { id: p.id } })).toMatchObject({
      situacao: 'IGNORADA',
      motivoIgnorar: 'visitante',
    });
    expect(await prisma.auditoria.count({ where: { acao: 'ponto.pendencia-ignorada' } })).toBe(1);
  });

  it('vincular a pessoa que não é da loja é recusado', async () => {
    const outra = (
      await request(app).post('/api/v1/lojas').set(admin).send({ codigo: '002', nome: 'Norte' })
    ).body;
    await request(app)
      .post('/api/v1/funcionarios')
      .set(admin)
      .send({ matricula: 'X1', nome: 'Xuxa', lojaId: outra.id, funcaoEscala: 'Caixa' });
    const [p] = (await request(app).get(url()).set(admin)).body.data;
    expect(
      (
        await request(app)
          .post(url(`/${p.id}/vincular`))
          .set(admin)
          .send({ matricula: 'X1' })
      ).status,
    ).toBe(400);
  });

  it('confirma trabalho em folga: só vale para dia sem escala', async () => {
    const lista = (await request(app).get(url()).set(admin)).body.data;
    const cpfDesconhecido = lista.find((p: { motivo: string }) => p.motivo === 'cpf_desconhecido');
    expect(
      (
        await request(app)
          .post(url(`/${cpfDesconhecido.id}/confirmar-folga`))
          .set(admin)
      ).status,
    ).toBe(409);
    const folga = lista.find(
      (p: { motivo: string; pessoa: unknown }) => p.motivo === 'dia_sem_escala' && p.pessoa,
    );
    expect(
      (
        await request(app)
          .post(url(`/${folga.id}/confirmar-folga`))
          .set(admin)
      ).status,
    ).toBe(204);
    expect(await prisma.batida.findUniqueOrThrow({ where: { id: folga.id } })).toMatchObject({
      situacao: 'VINCULADA',
      matricula: 'F1',
    });
  });

  it('cadastrar o CPF resolve de uma vez as pendências daquele CPF (e deixa para decidir as de dia sem escala)', async () => {
    const r = await request(app)
      .post(url('/cpf'))
      .set(admin)
      .send({ cpf: CPF_DESCONHECIDO, matricula: 'F2' });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ resolvidas: 2, aindaPendentes: 1 });
    const f = await prisma.funcionario.findFirstOrThrow({ where: { matricula: 'F2' } });
    expect(f.cpf).toBe(CPF_DESCONHECIDO);
    const restantes = (await request(app).get(url()).set(admin)).body.data;
    expect(restantes.map((p: { motivo: string }) => p.motivo).sort()).toEqual([
      'dia_sem_escala',
      'dia_sem_escala',
    ]);
    expect(
      JSON.stringify(await prisma.auditoria.findMany({ where: { acao: 'ponto.cpf-cadastrado' } })),
    ).not.toContain(CPF_DESCONHECIDO);
  });

  it('CPF duplicado de outra pessoa e CPF inválido são recusados', async () => {
    expect(
      (await request(app).post(url('/cpf')).set(admin).send({ cpf: CPF_ANA, matricula: 'F2' }))
        .status,
    ).toBe(409);
    expect(
      (await request(app).post(url('/cpf')).set(admin).send({ cpf: '123', matricula: 'F2' }))
        .status,
    ).toBe(400);
  });

  it('quem só consulta não vê a fila', async () => {
    expect((await request(app).get(url()).set({ 'X-Perfil': 'SCHEDULE_VIEWER' })).status).toBe(403);
  });
});
