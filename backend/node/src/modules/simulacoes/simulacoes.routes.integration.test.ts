import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN' };
const cab = [
  'Cod_Loja',
  'ID_Colaborador',
  'Nome_Colaborador',
  'Funcao',
  'Dias_Trabalho',
  'Hora_Entrada',
  'Inicio_Intervalo',
  'Fim_Intervalo',
  'Hora_Saida',
  'Carga_Horaria',
];

const escala = async () => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('E').addRows([
    cab,
    ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '14:00', '40'],
    ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '14:00', '', '', '20:00', '40'],
  ]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

describe('simulações (rotas)', () => {
  let lojaId: string;

  beforeEach(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    const l = await request(app)
      .post('/api/v1/lojas')
      .set(admin)
      .send({
        codigo: '001',
        nome: 'Centro',
        horarios: { semana: { abre: '08:00', fecha: '20:00' } },
      });
    lojaId = l.body.id;
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach('arquivo', await escala(), 'e.xlsx');
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const criar = (body: object = { nome: 'Base 40h', regra: 'r40' }) =>
    request(app).post(`/api/v1/lojas/${lojaId}/simulacoes`).set(admin).send(body);

  it('cria a partir da escala atual e já avalia', async () => {
    const r = await criar();
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ status: 'rascunho', editavel: true, nome: 'Base 40h' });
    expect(r.body.quadro).toHaveLength(2);
    expect(r.body.turnos).toHaveLength(10);
    expect(r.body.avaliacao.erros).toEqual([]);
  });

  it('mover um turno recalcula e mostra o buraco sem farmacêutico; gravar fica bloqueado', async () => {
    const sim = (await criar()).body;
    const turnos = sim.turnos.map((t: { matricula: string; dia: number }) =>
      t.matricula === 'F2' && t.dia === 1 ? { ...t, entrada: 16 } : t,
    );
    const e = await request(app).put(`/api/v1/simulacoes/${sim.id}`).set(admin).send({ turnos });
    expect(e.status).toBe(200);
    expect(e.body.avaliacao.podeGravar).toBe(false);
    expect(e.body.avaliacao.erros[0].texto).toContain('Sem farmacêutico em Ter 14:00–16:00');

    const g = await request(app).post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
    expect(g.status).toBe(400);
    expect(g.body.error.message).toContain('Não dá para gravar');
  });

  it('grava sem erros, congela e não deixa editar; clonar abre um rascunho novo', async () => {
    const sim = (await criar()).body;
    const g = await request(app).post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
    expect(g.status).toBe(200);
    expect(g.body).toMatchObject({ status: 'gravada', editavel: false });

    // Mudar o cadastro depois não altera a gravada
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Caixa: 3 } });
    expect((await request(app).get(`/api/v1/simulacoes/${sim.id}`)).body.avaliacao.erros).toEqual(
      [],
    );

    const ed = await request(app)
      .put(`/api/v1/simulacoes/${sim.id}`)
      .set(admin)
      .send({ nome: 'Outro nome' });
    expect(ed.status).toBe(409);

    const c = await request(app).post(`/api/v1/simulacoes/${sim.id}/clonar`).set(admin);
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({
      status: 'rascunho',
      origemId: sim.id,
      nome: 'Base 40h (cópia)',
    });
    expect(c.body.avaliacao.erros.some((x: { regra: string }) => x.regra === 'cobertura')).toBe(
      true,
    );
  });

  it('descarta, esconde do histórico e mostra com o filtro', async () => {
    const sim = (await criar()).body;
    await request(app).post(`/api/v1/simulacoes/${sim.id}/descartar`).set(admin);
    expect((await request(app).get(`/api/v1/lojas/${lojaId}/simulacoes`)).body.data).toHaveLength(
      0,
    );
    expect(
      (await request(app).get(`/api/v1/lojas/${lojaId}/simulacoes?descartadas=1`)).body.data,
    ).toHaveLength(1);
  });

  it('só quem escreve cria e ajusta; consulta vê', async () => {
    expect(
      (
        await request(app)
          .post(`/api/v1/lojas/${lojaId}/simulacoes`)
          .send({ nome: 'X1', regra: 'r40' })
      ).status,
    ).toBe(403);
    const sim = (await criar()).body;
    expect((await request(app).get(`/api/v1/simulacoes/${sim.id}`)).status).toBe(200);
    expect(
      (await request(app).put(`/api/v1/simulacoes/${sim.id}`).send({ nome: 'Nome novo' })).status,
    ).toBe(403);
  });

  it('recusa turno de quem não está na simulação e horário fora de 15 em 15 minutos', async () => {
    const sim = (await criar()).body;
    const turno = { dia: 0, entrada: 8, saida: 12, iniIntervalo: null, fimIntervalo: null };
    expect(
      (
        await request(app)
          .put(`/api/v1/simulacoes/${sim.id}`)
          .set(admin)
          .send({ turnos: [{ matricula: 'ZZ', ...turno }] })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/v1/simulacoes/${sim.id}`)
          .set(admin)
          .send({ turnos: [{ matricula: 'F1', ...turno, entrada: 8.1 }] })
      ).status,
    ).toBe(400);
  });

  it('cria vazia a partir do cadastro e avisa quando falta escala atual', async () => {
    await prisma.carga.deleteMany();
    expect((await criar()).status).toBe(400);
    await request(app).post('/api/v1/funcionarios').set(admin).send({
      matricula: 'M1',
      nome: 'Carla',
      lojaId,
      funcaoEscala: 'Farmacêutico',
      cargaSemanalH: 40,
    });
    const v = await criar({ nome: 'Do zero', regra: 'r42', origem: 'vazia' });
    expect(v.status).toBe(201);
    expect(v.body.quadro).toHaveLength(1);
    expect(v.body.avaliacao.erros.some((x: { regra: string }) => x.regra === 'farmaceutico')).toBe(
      true,
    );
  });

  describe('aprovar, comparar e exportar', () => {
    const gravada = async (nome: string) => {
      const sim = (await criar({ nome, regra: 'r40' })).body;
      const g = await request(app).post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect(g.status).toBe(200);
      return g.body;
    };

    it('só o dono aprova, só gravada, e a anterior vira substituída (uma em uso por loja)', async () => {
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER' };
      expect(
        (await request(app).post(`/api/v1/simulacoes/${a.id}/aprovar`).set(gestor).send({})).status,
      ).toBe(403);

      const rascunho = (await criar({ nome: 'Rascunho', regra: 'r40' })).body;
      expect(
        (await request(app).post(`/api/v1/simulacoes/${rascunho.id}/aprovar`).set(admin).send({}))
          .status,
      ).toBe(409);

      const ok = await request(app)
        .post(`/api/v1/simulacoes/${a.id}/aprovar`)
        .set(admin)
        .send({ vigenciaInicio: '2026-12-15' });
      expect(ok.status).toBe(200);
      expect(ok.body).toMatchObject({
        status: 'em_uso',
        aprovadaPor: 'TENANT_ADMIN',
        desatualizada: false,
      });
      expect(ok.body.vigenciaInicio).toContain('2026-12-15');

      await request(app).post(`/api/v1/simulacoes/${b.id}/aprovar`).set(admin).send({});
      const lista = (await request(app).get(`/api/v1/lojas/${lojaId}/simulacoes`)).body.data;
      expect(lista.find((x: { id: string }) => x.id === a.id).status).toBe('substituida');
      expect(lista.find((x: { id: string }) => x.id === b.id).status).toBe('em_uso');
      expect(lista.find((x: { id: string }) => x.id === b.id).vigenciaInicio).toContain('20');
      expect(
        (await request(app).post(`/api/v1/simulacoes/${b.id}/descartar`).set(admin)).status,
      ).toBe(409);
      expect(await prisma.auditoria.count({ where: { acao: 'simulacao.aprovada' } })).toBe(2);
    });

    it('compara 2 a 3 simulações e inclui a em uso como referência', async () => {
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      const c = (await criar({ nome: 'Plano C', regra: 'r40' })).body;
      await request(app).post(`/api/v1/simulacoes/${a.id}/aprovar`).set(admin).send({});

      const r = await request(app).get(
        `/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${b.id},${c.id}`,
      );
      expect(r.status).toBe(200);
      expect(r.body.simulacoes).toHaveLength(3);
      expect(r.body.simulacoes[0]).toMatchObject({ id: a.id, referencia: true });
      expect(r.body.simulacoes[1].sintese).toContain('simulação em uso (Plano A)');
      expect(r.body.simulacoes[1].indicadores).toMatchObject({ erros: 0, coberturaPct: 100 });

      expect(
        (await request(app).get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${b.id}`)).status,
      ).toBe(400);
    });

    it('avisa que a em uso ficou desatualizada quando o quadro muda no cadastro', async () => {
      const a = await gravada('Plano A');
      await request(app).post(`/api/v1/simulacoes/${a.id}/aprovar`).set(admin).send({});
      await request(app)
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'N1', nome: 'Novo', lojaId, funcaoEscala: 'Caixa', cargaSemanalH: 40 });
      const d = (await request(app).get(`/api/v1/simulacoes/${a.id}`)).body;
      expect(d.desatualizada).toBe(true);
      expect(d.motivosDesatualizada[0]).toContain('Novo');
      expect(d.status).toBe('em_uso'); // nada muda sozinho
      const lista = (await request(app).get(`/api/v1/lojas/${lojaId}/simulacoes`)).body.data;
      expect(lista[0].desatualizada).toBe(true);
    });

    it('exporta o Excel da escala e registra na auditoria', async () => {
      const a = await gravada('Plano A');
      const r = await request(app)
        .get(`/api/v1/simulacoes/${a.id}/exportar.xlsx`)
        .buffer()
        .parse((res, cb) => {
          const ch: Buffer[] = [];
          res.on('data', (d: Buffer) => ch.push(d));
          res.on('end', () => cb(null, Buffer.concat(ch)));
        });
      expect(r.status).toBe(200);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(r.body as ArrayBuffer);
      const ws = wb.getWorksheet('Escala')!;
      expect(String(ws.getCell('A1').value)).toContain('Plano A');
      expect(ws.getRow(5).getCell(1).value).toBe('Ana');
      expect(ws.getRow(5).getCell(3).value).toContain('08:00–14:00');
      expect(await prisma.auditoria.count({ where: { acao: 'simulacao.exportada' } })).toBe(1);
    });
  });
});
