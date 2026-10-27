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
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
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

  describe('vagas e desligamentos simulados', () => {
    const put = (id: string, body: object) =>
      request(app).put(`/api/v1/simulacoes/${id}`).set(admin).send(body);

    it('adiciona vaga, avisa quando não tem turnos e não mexe no cadastro', async () => {
      const sim = (await criar()).body;
      const antes = await prisma.funcionario.count();
      const r = await put(sim.id, { vagas: [{ funcao: 'Atendimento', cargaH: 24 }] });
      expect(r.status).toBe(200);
      const vaga = r.body.quadro.find((p: { vaga?: boolean }) => p.vaga);
      expect(vaga).toMatchObject({
        matricula: 'VAGA-1',
        nome: 'Vaga 1',
        funcao: 'Atendimento',
        cargaH: 24,
      });
      expect(
        r.body.avaliacao.avisos.some((a: { regra: string }) => a.regra === 'vaga-sem-turnos'),
      ).toBe(true);
      expect(await prisma.funcionario.count()).toBe(antes);

      const turnos = [
        ...r.body.turnos,
        {
          matricula: 'VAGA-1',
          dia: 0,
          entrada: 8,
          saida: 14,
          iniIntervalo: null,
          fimIntervalo: null,
        },
      ];
      const c = await put(sim.id, { turnos });
      expect(
        c.body.avaliacao.avisos.some((a: { regra: string }) => a.regra === 'vaga-sem-turnos'),
      ).toBe(false);

      const rem = await put(sim.id, { vagas: [] });
      expect(rem.body.quadro.some((p: { vaga?: boolean }) => p.vaga)).toBe(false);
      expect(rem.body.turnos.some((t: { matricula: string }) => t.matricula === 'VAGA-1')).toBe(
        false,
      );
    });

    it('desligamento simulado tira a pessoa da cobertura e pode ser desfeito', async () => {
      const sim = (await criar()).body;
      const d = await put(sim.id, { desligados: ['F1'] });
      expect(d.body.quadro.find((p: { matricula: string }) => p.matricula === 'F1').desligado).toBe(
        true,
      );
      expect(
        d.body.avaliacao.erros.some((e: { regra: string }) => e.regra === 'farmaceutico'),
      ).toBe(true);
      const u = await put(sim.id, { desligados: [] });
      expect(u.body.avaliacao.erros).toEqual([]);
    });

    it('recusa vaga com carga inválida, vaga inexistente e desligar uma vaga', async () => {
      const sim = (await criar()).body;
      expect((await put(sim.id, { vagas: [{ funcao: 'Caixa', cargaH: 2 }] })).status).toBe(400);
      expect(
        (await put(sim.id, { vagas: [{ matricula: 'VAGA-7', funcao: 'Caixa', cargaH: 20 }] }))
          .status,
      ).toBe(400);
      await put(sim.id, { vagas: [{ funcao: 'Caixa', cargaH: 20 }] });
      expect((await put(sim.id, { desligados: ['VAGA-1'] })).status).toBe(400);
    });

    it('vagas ficam congeladas na gravada e vêm junto no clone', async () => {
      const sim = (await criar()).body;
      await put(sim.id, { vagas: [{ funcao: 'Apoio', cargaH: 16 }] });
      await request(app).post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect((await put(sim.id, { vagas: [] })).status).toBe(409);
      const c = (await request(app).post(`/api/v1/simulacoes/${sim.id}/clonar`).set(admin)).body;
      expect(c.quadro.some((p: { vaga?: boolean }) => p.vaga)).toBe(true);
    });

    it('cria já com as contratações que o diagnóstico sugere', async () => {
      await request(app)
        .put(`/api/v1/lojas/${lojaId}/configuracao`)
        .set(admin)
        .send({ minimos: { Caixa: 1 } });
      const r = await criar({ nome: 'Com vagas', regra: 'r40', comVagasSugeridas: true });
      expect(r.status).toBe(201);
      const vagas = r.body.quadro.filter((p: { vaga?: boolean }) => p.vaga);
      expect(vagas).toHaveLength(2);
      expect(vagas.every((v: { funcao: string }) => v.funcao === 'Caixa')).toBe(true);
    });
  });

  describe('custo na comparação', () => {
    const custos = { salarioMedio: { Farmacêutico: 8000, Atendimento: 2000 }, encargosPct: 50 };
    const salvarCustos = (c: object = custos) =>
      request(app).put(`/api/v1/lojas/${lojaId}/custos`).set(admin).send(c);
    const gravada = async (nome: string, corpo: object = {}) => {
      const sim = (await criar({ nome, regra: 'r40' })).body;
      if (Object.keys(corpo).length)
        await request(app).put(`/api/v1/simulacoes/${sim.id}`).set(admin).send(corpo);
      const g = await request(app).post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect(g.status).toBe(200);
      return g.body;
    };
    const comparar = (ids: string[], h: Record<string, string> = admin) =>
      request(app)
        .get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${ids.join(',')}`)
        .set(h);

    it('o dono vê custo mensal, anual e a diferença frente à em uso; a síntese cita custo e vaga', async () => {
      await salvarCustos();
      const a = await gravada('Plano A');
      const b = await gravada('Plano B com vaga', {
        vagas: [{ funcao: 'Farmacêutico', cargaH: 24 }],
      });
      await request(app).post(`/api/v1/simulacoes/${a.id}/aprovar`).set(admin).send({});

      const r = await comparar([a.id, b.id]);
      expect(r.status).toBe(200);
      const [ra, rb] = r.body.simulacoes;
      // A: 2 farmacêuticos × 8.000 × 1,5 = 24.000
      expect(ra.custo).toMatchObject({
        informado: true,
        mensal: 24000,
        anual: 288000,
        diferencaMensalFrenteEmUso: null,
      });
      // B: + vaga de 24h = 8.000 × 24 × 5 ÷ 200 × 1,5 = 7.200
      expect(rb.custo).toMatchObject({
        mensal: 31200,
        anual: 374400,
        diferencaMensalFrenteEmUso: 7200,
      });
      expect(rb.sintese).toContain('a mais por mês');
      expect(rb.sintese).toContain('exige contratar 1 vaga(s)');
      expect(rb.custo.memoria.some((m: string) => m.includes('Vaga 1'))).toBe(true);
    });

    it('quem não é dono não recebe nenhum valor de custo, nem na comparação nem na simulação', async () => {
      await salvarCustos();
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      for (const h of [{ 'X-Perfil': 'SCHEDULE_MANAGER' }, { 'X-Perfil': 'SCHEDULE_VIEWER' }]) {
        const r = await comparar([a.id, b.id], h);
        expect(r.status).toBe(200);
        expect(JSON.stringify(r.body)).not.toMatch(/custo|24000|mensal/);
        expect(
          (await request(app).get(`/api/v1/simulacoes/${a.id}`).set(h)).body.custo,
        ).toBeUndefined();
      }
    });

    it('simulação gravada antes de informar os custos passa a mostrar o valor quando a loja informa', async () => {
      const a = await gravada('Plano A');
      await salvarCustos();
      expect(
        (await request(app).get(`/api/v1/simulacoes/${a.id}`).set(admin)).body.custo.mensal,
      ).toBe(24000);
    });

    it('sem custos informados mostra só o aviso, sem total', async () => {
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      const r = await comparar([a.id, b.id]);
      expect(r.body.simulacoes[0].custo).toEqual({
        informado: false,
        diferencaMensalFrenteEmUso: null,
      });
    });

    it('função sem salário informado: avisa qual falta e não soma parcial', async () => {
      await salvarCustos({ salarioMedio: { Atendimento: 2000 }, encargosPct: 50 });
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      const c = (await comparar([a.id, b.id])).body.simulacoes[0].custo;
      expect(c).toMatchObject({
        informado: true,
        faltamInformar: ['Farmacêutico'],
        mensal: null,
        anual: null,
      });
    });

    it('a simulação gravada usa o retrato dos custos de quando foi gravada', async () => {
      await salvarCustos();
      const a = await gravada('Plano A');
      await salvarCustos({
        salarioMedio: { Farmacêutico: 20000, Atendimento: 2000 },
        encargosPct: 50,
      });
      const d = (await request(app).get(`/api/v1/simulacoes/${a.id}`).set(admin)).body;
      expect(d.custo.mensal).toBe(24000);
      const novo = (await criar({ nome: 'Rascunho novo', regra: 'r40' })).body;
      expect(novo.custo.mensal).toBe(60000); // rascunho usa os custos de hoje
    });
  });

  describe('horário por dia da semana nas simulações', () => {
    const dias = (domingo: object) => ({
      versao: 2,
      dias: [0, 1, 2, 3, 4]
        .map(() => ({ aberta: true, abre: '08:00', fecha: '20:00' }))
        .concat([{ aberta: false } as never, domingo as never]),
    });
    const patchHorarios = (horarios: object) =>
      request(app).patch(`/api/v1/lojas/${lojaId}`).set(admin).send({ horarios });

    it('domingo aberto entra nos dias da simulação e na avaliação; fechado não exige nada', async () => {
      const fechada = (await criar()).body;
      expect(fechada.diasAbertos.map((d: { dia: number }) => d.dia)).toEqual([0, 1, 2, 3, 4]);
      expect(fechada.avaliacao.erros).toEqual([]);

      await patchHorarios(dias({ aberta: true, abre: '09:00', fecha: '13:00' }));
      const aberta = (await criar({ nome: 'Com domingo', regra: 'r40' })).body;
      expect(aberta.diasAbertos.map((d: { dia: number }) => d.dia)).toEqual([0, 1, 2, 3, 4, 6]);
      expect(aberta.diasAbertos[5]).toEqual({ dia: 6, abre: 9, fecha: 13 });
      // ninguém foi escalado no domingo: farmacêutico exigido das 09h às 13h
      expect(aberta.avaliacao.erros.map((e: { texto: string }) => e.texto)).toContain(
        'Sem farmacêutico em Dom 09:00–13:00: a lei exige farmacêutico em todo o horário de funcionamento.',
      );
    });

    it('loja 24 horas: a grade e a cobertura vão de 00h a 24h', async () => {
      await patchHorarios({
        versao: 2,
        dias: Array.from({ length: 7 }, () => ({ aberta: true, h24: true })),
      });
      const sim = (await criar()).body;
      expect(sim.diasAbertos).toHaveLength(7);
      expect(
        sim.diasAbertos.every(
          (d: { abre: number; fecha: number }) => d.abre === 0 && d.fecha === 24,
        ),
      ).toBe(true);
      expect(sim.avaliacao.cobertura['6'][0].porHora).toHaveLength(24);
    });

    it('simulação gravada mantém o horário de quando foi gravada, mesmo que a loja mude depois', async () => {
      const g = (await criar()).body;
      await request(app).post(`/api/v1/simulacoes/${g.id}/gravar`).set(admin);
      await patchHorarios(dias({ aberta: true, abre: '09:00', fecha: '18:00' }));
      const depois = (await request(app).get(`/api/v1/simulacoes/${g.id}`).set(admin)).body;
      expect(depois.diasAbertos.map((d: { dia: number }) => d.dia)).toEqual([0, 1, 2, 3, 4]);
      expect(depois.avaliacao.erros).toEqual([]);
    });

    it('"desatualizada": só mudar o formato não dispara; mudar o horário da loja dispara', async () => {
      const g = (await criar()).body;
      await request(app).post(`/api/v1/simulacoes/${g.id}/gravar`).set(admin);
      await request(app).post(`/api/v1/simulacoes/${g.id}/aprovar`).set(admin).send({});
      // simulação aprovada antes da mudança: horário congelado no formato antigo
      const sim = await prisma.simulacao.findUniqueOrThrow({ where: { id: g.id } });
      const premissas = sim.premissas as { horarios: unknown };
      await prisma.simulacao.update({
        where: { id: g.id },
        data: {
          premissas: { ...premissas, horarios: { semana: { abre: '08:00', fecha: '20:00' } } },
        },
      });
      const mesmaCoisa = (await request(app).get(`/api/v1/simulacoes/${g.id}`).set(admin)).body;
      expect(mesmaCoisa.motivosDesatualizada.join(' ')).not.toContain('horário');

      await patchHorarios(dias({ aberta: true, abre: '09:00', fecha: '13:00' }));
      const mudou = (await request(app).get(`/api/v1/simulacoes/${g.id}`).set(admin)).body;
      expect(mudou.desatualizada).toBe(true);
      expect(mudou.motivosDesatualizada.join(' ')).toContain(
        'O horário de funcionamento da loja mudou.',
      );
      expect(mudou.status).toBe('em_uso'); // nada muda sozinho
    });
  });
});
