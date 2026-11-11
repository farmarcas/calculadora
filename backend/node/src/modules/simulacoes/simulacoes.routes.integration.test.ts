import { readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
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
    const l = await postLoja({
      codigo: '001',
      nome: 'Centro',
      horarios: { semana: { abre: '08:00', fecha: '20:00' } },
    });
    lojaId = l.body.id;
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach('arquivo', await escala(), 'e.xlsx');
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const criar = (body: object = { nome: 'Base 40h', regra: 'r40' }) =>
    reqGe().post(`/api/v1/lojas/${lojaId}/simulacoes`).set(admin).send(body);

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
    const e = await reqGe().put(`/api/v1/simulacoes/${sim.id}`).set(admin).send({ turnos });
    expect(e.status).toBe(200);
    expect(e.body.avaliacao.podeGravar).toBe(false);
    expect(e.body.avaliacao.erros[0].texto).toContain('Sem farmacêutico em Ter 14:00–16:00');

    // A escala por turno saiu da Simulação: erro de turno é só informação e não trava mais o gravar.
    const g = await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
    expect(g.status).toBe(200);
  });

  it('grava sem erros, congela e não deixa editar; clonar abre um rascunho novo', async () => {
    const sim = (await criar()).body;
    const g = await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
    expect(g.status).toBe(200);
    expect(g.body).toMatchObject({ status: 'gravada', editavel: false });

    // Mudar o cadastro depois não altera a gravada
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Caixa: 3 } });
    expect((await reqGe().get(`/api/v1/simulacoes/${sim.id}`)).body.avaliacao.erros).toEqual([]);

    const ed = await reqGe()
      .put(`/api/v1/simulacoes/${sim.id}`)
      .set(admin)
      .send({ nome: 'Outro nome' });
    expect(ed.status).toBe(409);

    const c = await reqGe().post(`/api/v1/simulacoes/${sim.id}/clonar`).set(admin);
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
    await reqGe().post(`/api/v1/simulacoes/${sim.id}/descartar`).set(admin);
    expect((await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes`)).body.data).toHaveLength(0);
    expect(
      (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes?descartadas=1`)).body.data,
    ).toHaveLength(1);
  });

  it('só quem escreve cria e ajusta; consulta vê', async () => {
    expect(
      (await reqGe().post(`/api/v1/lojas/${lojaId}/simulacoes`).send({ nome: 'X1', regra: 'r40' }))
        .status,
    ).toBe(403);
    const sim = (await criar()).body;
    expect((await reqGe().get(`/api/v1/simulacoes/${sim.id}`)).status).toBe(200);
    expect(
      (await reqGe().put(`/api/v1/simulacoes/${sim.id}`).send({ nome: 'Nome novo' })).status,
    ).toBe(403);
  });

  it('recusa turno de quem não está na simulação e horário fora de 15 em 15 minutos', async () => {
    const sim = (await criar()).body;
    const turno = { dia: 0, entrada: 8, saida: 12, iniIntervalo: null, fimIntervalo: null };
    expect(
      (
        await reqGe()
          .put(`/api/v1/simulacoes/${sim.id}`)
          .set(admin)
          .send({ turnos: [{ matricula: 'ZZ', ...turno }] })
      ).status,
    ).toBe(400);
    expect(
      (
        await reqGe()
          .put(`/api/v1/simulacoes/${sim.id}`)
          .set(admin)
          .send({ turnos: [{ matricula: 'F1', ...turno, entrada: 8.1 }] })
      ).status,
    ).toBe(400);
  });

  it('cria vazia a partir do cadastro e avisa quando nenhum funcionário tem horário no Cadastro', async () => {
    await prisma.funcionario.deleteMany();
    const sem = await criar();
    expect(sem.status).toBe(400);
    expect(sem.body.error.code).toBe('SEM_HORARIO_NO_CADASTRO');
    expect(sem.body.error.message).toContain('Cadastre o horário dos funcionários');
    await reqGe().post('/api/v1/funcionarios').set(admin).send({
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

  describe('comparar, descartar e exportar', () => {
    const gravada = async (nome: string) => {
      const sim = (await criar({ nome, regra: 'r40' })).body;
      const g = await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect(g.status).toBe(200);
      return g.body;
    };

    it('a rota de aprovar não existe mais e qualquer simulação gravada pode ser descartada', async () => {
      const a = await gravada('Plano A');
      expect(
        (await reqGe().post(`/api/v1/simulacoes/${a.id}/aprovar`).set(admin).send({})).status,
      ).toBe(404);
      const lista = (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes`)).body.data;
      expect(lista.find((x: { id: string }) => x.id === a.id).status).toBe('gravada');
      const d = await reqGe().post(`/api/v1/simulacoes/${a.id}/descartar`).set(admin);
      expect(d.status).toBe(200);
      expect(d.body.status).toBe('descartada');
    });

    it('a migration troca em uso e substituída por gravada sem apagar nem mudar o resto', async () => {
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      const c = await gravada('Plano C');
      await prisma.simulacao.update({
        where: { id: a.id },
        data: {
          status: 'EM_USO',
          aprovadaPor: 'TENANT_ADMIN',
          vigenciaInicio: new Date('2026-12-15'),
        },
      });
      await prisma.simulacao.update({
        where: { id: b.id },
        data: { status: 'SUBSTITUIDA', substituidaEm: new Date() },
      });
      const antes = await prisma.simulacao.findMany({ orderBy: { nome: 'asc' } });
      const sql = readFileSync(
        new URL(
          '../../../prisma/migrations/20261105180000_simulacoes_sem_em_uso/migration.sql',
          import.meta.url,
        ),
        'utf8',
      );
      await prisma.$executeRawUnsafe(sql);
      const depois = await prisma.simulacao.findMany({ orderBy: { nome: 'asc' } });
      expect(depois).toHaveLength(antes.length);
      expect(depois.map((x) => x.status)).toEqual(['GRAVADA', 'GRAVADA', 'GRAVADA']);
      // nada mais mudou: nome, quadro, premissas, resultado e os registros de aprovação continuam
      expect(depois.map(({ status: _s, atualizadaEm: _a, ...resto }) => resto)).toEqual(
        antes.map(({ status: _s, atualizadaEm: _a, ...resto }) => resto),
      );
      expect(depois.find((x) => x.id === a.id)?.aprovadaPor).toBe('TENANT_ADMIN');
      expect(depois.find((x) => x.id === c.id)?.status).toBe('GRAVADA');
    });

    it('simulações que estavam em uso ou substituídas aparecem como gravadas e podem ser descartadas', async () => {
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      // como ficou o banco antes da migration que converteu os estados antigos
      await prisma.simulacao.update({
        where: { id: a.id },
        data: { status: 'EM_USO', aprovadaPor: 'TENANT_ADMIN' },
      });
      await prisma.simulacao.update({ where: { id: b.id }, data: { status: 'SUBSTITUIDA' } });
      const lista = (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes`)).body.data;
      expect(lista.map((x: { status: string }) => x.status)).toEqual(['gravada', 'gravada']);
      expect(JSON.stringify(lista)).not.toMatch(/vigencia|aprovad/);
      expect((await reqGe().post(`/api/v1/simulacoes/${a.id}/descartar`).set(admin)).status).toBe(
        200,
      );
    });

    it('compara 2 a 3 simulações, cada uma pelos próprios números, sem referência', async () => {
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      const c = (await criar({ nome: 'Plano C', regra: 'r40' })).body;

      const r = await reqGe().get(
        `/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${a.id},${b.id}`,
      );
      expect(r.status).toBe(200);
      expect(r.body.simulacoes.map((x: { id: string }) => x.id)).toEqual([a.id, b.id]);
      expect(r.body).not.toHaveProperty('referenciaId');
      expect(r.body.simulacoes[0]).not.toHaveProperty('referencia');
      expect(r.body.simulacoes[0]).not.toHaveProperty('podeAprovar');
      expect(r.body.simulacoes[1].sintese).toContain('Plano B cobre');
      expect(r.body.simulacoes[1].sintese).not.toMatch(/em uso|aprovad/);
      expect(r.body.simulacoes[1].indicadores).toMatchObject({ erros: 0, coberturaPct: 100 });
      // rascunho também entra, e a comparação continua exigindo ao menos duas
      expect(
        (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${b.id},${c.id}`)).body
          .simulacoes,
      ).toHaveLength(2);
      expect(
        (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${b.id}`)).status,
      ).toBe(400);
    });

    it('mudar o quadro no cadastro não marca nada como desatualizado (não há mais simulação em uso)', async () => {
      const a = await gravada('Plano A');
      await reqGe()
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'N1', nome: 'Novo', lojaId, funcaoEscala: 'Caixa', cargaSemanalH: 40 });
      const d = (await reqGe().get(`/api/v1/simulacoes/${a.id}`)).body;
      expect(d).not.toHaveProperty('desatualizada');
      expect(d).not.toHaveProperty('motivosDesatualizada');
      expect(d.status).toBe('gravada');
    });

    it('exporta o Excel da escala e registra na auditoria', async () => {
      const a = await gravada('Plano A');
      const r = await reqGe()
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
      reqGe().put(`/api/v1/simulacoes/${id}`).set(admin).send(body);

    it('adiciona vaga, avisa quando não tem turnos e não mexe no cadastro', async () => {
      const sim = (await criar()).body;
      const antes = await prisma.funcionario.count();
      const r = await put(sim.id, { vagas: [{ funcao: 'Atendimento', cargaH: 40 }] });
      expect(r.status).toBe(200);
      const vaga = r.body.quadro.find((p: { vaga?: boolean }) => p.vaga);
      expect(vaga).toMatchObject({
        matricula: 'VAGA-1',
        nome: 'Vaga 1',
        funcao: 'Atendimento',
        cargaH: 40,
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
      await put(sim.id, { vagas: [{ funcao: 'Caixa', cargaH: 40 }] });
      expect((await put(sim.id, { desligados: ['VAGA-1'] })).status).toBe(400);
    });

    it('vagas ficam congeladas na gravada e vêm junto no clone', async () => {
      const sim = (await criar()).body;
      await put(sim.id, { vagas: [{ funcao: 'Caixa', cargaH: 40 }] });
      await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect((await put(sim.id, { vagas: [] })).status).toBe(409);
      const c = (await reqGe().post(`/api/v1/simulacoes/${sim.id}/clonar`).set(admin)).body;
      expect(c.quadro.some((p: { vaga?: boolean }) => p.vaga)).toBe(true);
    });

    it('cria já com as contratações que o diagnóstico sugere', async () => {
      await reqGe()
        .put(`/api/v1/lojas/${lojaId}/configuracao`)
        .set(admin)
        .send({ minimos: { Caixa: 1 } });
      const r = await criar({ nome: 'Com vagas', regra: 'r40', comVagasSugeridas: true });
      expect(r.status).toBe(201);
      const vagas = r.body.quadro.filter((p: { vaga?: boolean }) => p.vaga);
      expect(vagas).toHaveLength(2);
      expect(vagas.every((v: { funcao: string }) => v.funcao === 'Caixa')).toBe(true);
    });

    it('Personalizar abre com as folgas aplicadas e as contratações cobrindo, sem erro de regra (spec 043)', async () => {
      // Equipe do Cadastro com 7 dias por semana (como nas lojas reais) e a loja aberta todos os dias.
      await prisma.funcionario.updateMany({ where: { lojaId }, data: { dias: [0, 1, 2, 3, 4, 5, 6] } });
      await prisma.loja.update({
        where: { id: lojaId },
        data: {
          horarios: {
            versao: 2,
            dias: Array.from({ length: 7 }, () => ({ aberta: true, abre: '08:00', fecha: '20:00' })),
          },
        },
      });
      for (const [regra, limite] of [['r42', 5], ['r40', 5]] as const) {
        const sim = (await criar({ nome: `Folgas ${regra}`, regra, comVagasSugeridas: true })).body;
        const turnos = sim.turnos as { matricula: string; dia: number }[];
        for (const p of sim.quadro as { matricula: string }[]) {
          const dias = new Set(turnos.filter((t) => t.matricula === p.matricula).map((t) => t.dia));
          expect(dias.size).toBeLessThanOrEqual(limite);
        }
        // As vagas já vêm com turnos.
        const vagas = (sim.quadro as { matricula: string; vaga?: boolean }[]).filter((p) => p.vaga);
        for (const v of vagas) expect(turnos.some((t) => t.matricula === v.matricula)).toBe(true);
        // Nada de aviso de dias a mais, jornada, intervalo ou descanso entre turnos.
        const regrasDeTurno = ['folgas', 'jornada-diaria', 'jornada-semanal', 'intervalo', 'interjornada'];
        const achados = [...sim.avaliacao.erros, ...sim.avaliacao.avisos] as { regra: string; texto: string }[];
        expect(achados.filter((a) => regrasDeTurno.includes(a.regra))).toEqual([]);
      }
    });

    it('só se contrata integral (spec 044): vaga nova parcial é recusada; vaga parcial de simulação antiga continua abrindo', async () => {
      const sim = (await criar()).body;
      // Parcial novo: recusado com a frase em português
      const r = await put(sim.id, { vagas: [{ funcao: 'Caixa', cargaH: 20 }] });
      expect(r.status).toBe(400);
      expect(JSON.stringify(r.body)).toContain('A contratação é integral: 40 horas por semana nesta regra.');
      // Integral: aceito
      expect((await put(sim.id, { vagas: [{ funcao: 'Caixa', cargaH: 40 }] })).status).toBe(200);
      // Uma simulação salva antes tinha uma vaga de 20h: segue abrindo e aceitando a vaga como estava
      const velha = (await reqGe().get(`/api/v1/simulacoes/${sim.id}`).set(admin)).body.quadro.map(
        (p: { vaga?: boolean }) => (p.vaga ? { ...p, cargaH: 20 } : p),
      );
      await prisma.simulacao.update({ where: { id: sim.id }, data: { quadro: velha } });
      const aberta = await reqGe().get(`/api/v1/simulacoes/${sim.id}`).set(admin);
      expect(aberta.status).toBe(200);
      expect(aberta.body.quadro.find((p: { vaga?: boolean }) => p.vaga).cargaH).toBe(20);
      const mantida = await put(sim.id, { vagas: [{ matricula: 'VAGA-1', funcao: 'Caixa', cargaH: 20 }] });
      expect(mantida.status).toBe(200);
    });

    it('o mesmo número de contratações no quadro central, no Cenário 1 e nas vagas sugeridas', async () => {
      await reqGe()
        .put(`/api/v1/lojas/${lojaId}/configuracao`)
        .set(admin)
        .send({ minimos: { Caixa: 1, Atendimento: 1 } });
      const diag = (await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`).set(admin)).body;
      for (const regra of ['r42', 'r40'] as const) {
        const central = diag.regras.find((r: { id: string }) => r.id === regra).resumo.contratar;
        const cenario1 = diag.cenarios[regra].manter.pessoasContratar;
        const sim = await criar({ nome: `Vagas ${regra}`, regra, comVagasSugeridas: true });
        const vagas = sim.body.quadro.filter((p: { vaga?: boolean }) => p.vaga).length;
        expect(central).toBeGreaterThan(0);
        expect(cenario1).toBe(central);
        expect(vagas).toBe(central);
      }
    });
  });

  describe('custo na comparação', () => {
    // Sem regime cadastrado a loja usa o Lucro Presumido: encargos de 62,2% (fator 1,622).
    const custos = { salarioMedio: { Farmacêutico: 8000, Atendimento: 2000 } };
    const salvarCustos = (c: object = custos) =>
      reqGe().put(`/api/v1/lojas/${lojaId}/custos`).set(admin).send(c);
    const gravada = async (nome: string, corpo: object = {}) => {
      const sim = (await criar({ nome, regra: 'r40' })).body;
      if (Object.keys(corpo).length)
        await reqGe().put(`/api/v1/simulacoes/${sim.id}`).set(admin).send(corpo);
      const g = await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect(g.status).toBe(200);
      return g.body;
    };
    const comparar = (ids: string[], h: Record<string, string> = admin) =>
      reqGe()
        .get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${ids.join(',')}`)
        .set(h);

    it('o dono vê custo mensal e anual de cada simulação; a síntese cita a vaga', async () => {
      await salvarCustos();
      const a = await gravada('Plano A');
      const b = await gravada('Plano B com vaga', {
        vagas: [{ funcao: 'Farmacêutico', cargaH: 40 }],
      });

      const r = await comparar([a.id, b.id]);
      expect(r.status).toBe(200);
      const [ra, rb] = r.body.simulacoes;
      // A: 2 farmacêuticos × 8.000 × 1,622 = 25.952
      expect(ra.custo).toMatchObject({
        informado: true,
        mensal: 25952,
        anual: 311424,
      });
      expect(ra.custo).not.toHaveProperty('diferencaMensalFrenteEmUso');
      // B: + vaga integral de 40h (spec 044) = 8.000 × 40 × 5 ÷ 200 × 1,622 = 12.976
      expect(rb.custo).toMatchObject({
        mensal: 38928,
        anual: 467136,
      });
      expect(rb.sintese).not.toContain('por mês');
      expect(rb.sintese).toContain('exige contratar 1 vaga(s)');
      expect(rb.custo.memoria.some((m: string) => m.includes('Vaga 1'))).toBe(true);
    });

    it('quem não é dono não recebe nenhum valor de custo, nem na comparação nem na simulação', async () => {
      await salvarCustos();
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      for (const h of [
        { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
        { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
      ]) {
        const r = await comparar([a.id, b.id], h);
        expect(r.status).toBe(200);
        expect(JSON.stringify(r.body)).not.toMatch(/custo|25952|mensal/);
        expect((await reqGe().get(`/api/v1/simulacoes/${a.id}`).set(h)).body.custo).toBeUndefined();
      }
    });

    it('simulação gravada antes de informar os custos passa a mostrar o valor quando a loja informa', async () => {
      const a = await gravada('Plano A');
      await salvarCustos();
      expect((await reqGe().get(`/api/v1/simulacoes/${a.id}`).set(admin)).body.custo.mensal).toBe(
        25952,
      );
    });

    it('sem custos informados mostra só o aviso, sem total', async () => {
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      const r = await comparar([a.id, b.id]);
      expect(r.body.simulacoes[0].custo).toEqual({ informado: false });
    });

    it('função sem salário informado: avisa qual falta e não soma parcial', async () => {
      await salvarCustos({ salarioMedio: { Atendimento: 2000 } });
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
      await salvarCustos({ salarioMedio: { Farmacêutico: 20000, Atendimento: 2000 } });
      const d = (await reqGe().get(`/api/v1/simulacoes/${a.id}`).set(admin)).body;
      expect(d.custo.mensal).toBe(25952); // o retrato do momento de gravar: 2 × 8.000 × 1,622
      const novo = (await criar({ nome: 'Rascunho novo', regra: 'r40' })).body;
      expect(novo.custo.mensal).toBe(64880); // rascunho usa os custos de hoje: 2 × 20.000 × 1,622
    });
  });

  describe('lista e comparação com resultado (spec 031)', () => {
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
    const semana = (fecha: string) => ({
      versao: 2,
      dias: [0, 1, 2, 3, 4]
        .map(() => ({ aberta: true, abre: '08:00', fecha }))
        .concat([{ aberta: false } as never, { aberta: false } as never]),
    });
    const gravada = async (nome: string, corpo: object = {}) => {
      const sim = (await criar({ nome, regra: 'r40' })).body;
      if (Object.keys(corpo).length)
        await reqGe().put(`/api/v1/simulacoes/${sim.id}`).set(admin).send(corpo);
      const g = await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect(g.status).toBe(200);
      return g.body;
    };
    const lista = async (h: Record<string, string> = admin, q = '') =>
      (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes${q}`).set(h)).body.data as (Record<
        string,
        unknown
      > & { horasAbertas: number })[];
    const comparar = (ids: string[], h: Record<string, string> = admin) =>
      reqGe()
        .get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${ids.join(',')}`)
        .set(h);

    // Custos e venda por hora: sem eles o saldo não existe (nunca zero por engano).
    const comCustosEVendas = async () => {
      await reqGe()
        .put(`/api/v1/lojas/${lojaId}/custos`)
        .set(admin)
        .send({ salarioMedio: { Farmacêutico: 8000, Atendimento: 2000 } });
      const wb = new ExcelJS.Workbook();
      const linhas = [['Data', 'Hora', 'Código da loja', 'Venda líquida (R$)']];
      for (const d of ['07/09/2026', '08/09/2026', '09/09/2026', '10/09/2026', '11/09/2026'])
        for (let h = 8; h < 20; h++) linhas.push([d, String(h), '001', '500,00']);
      wb.addWorksheet('Base').addRows(linhas);
      const up = await reqGe()
        .post('/api/v1/cargas/base')
        .set(admin)
        .attach('arquivo', Buffer.from(await wb.xlsx.writeBuffer()), 'b.xlsx');
      expect(up.status).toBe(201);
    };

    it('a lista traz o resumo de cada simulação e não traz o resultado bruto', async () => {
      await gravada('Plano A');
      await criar({ nome: 'Rascunho B', regra: 'r40' });
      const l = await lista();
      expect(l).toHaveLength(2);
      for (const x of l) {
        expect(x).toMatchObject({
          tipo: 'mantem',
          criadaPor: 'Administrador da conta',
          desatualizada: false,
        });
        expect(typeof x.horasAbertas).toBe('number');
        expect(x).not.toHaveProperty('resultado');
        expect(x.criadaPor).not.toMatch(/_/);
      }
      expect(l.map((x) => x.status).sort()).toEqual(['gravada', 'rascunho']);
      expect(l[0]!.nome).toBe('Rascunho B'); // mais recente primeiro
    });

    it('o saldo da lista é o do painel e o da comparação; sem salário ou sem venda por hora vem nulo', async () => {
      const a = await gravada('Plano A');
      expect((await lista())[0]!.saldoMensal).toBeNull(); // sem custos nem venda por hora
      await comCustosEVendas();
      const b = await gravada('Plano B com vaga', {
        vagas: [{ funcao: 'Farmacêutico', cargaH: 40 }],
      });
      const l = await lista();
      const painelA = (await reqGe().get(`/api/v1/simulacoes/${a.id}`).set(admin)).body.resultado;
      const painelB = (await reqGe().get(`/api/v1/simulacoes/${b.id}`).set(admin)).body.resultado;
      const da = l.find((x) => x.id === a.id)!;
      const db = l.find((x) => x.id === b.id)!;
      expect(typeof da.saldoMensal).toBe('number');
      expect(da.saldoMensal).toBe(painelA.saldoMensal);
      expect(db.saldoMensal).toBe(painelB.saldoMensal);
      expect(db.folhaExtra).toBe(painelB.folhaExtra);
      expect(db.folhaExtra).toBeGreaterThan(0);
      const c = (await comparar([a.id, b.id])).body.simulacoes;
      expect(c.map((x: { id: string }) => x.id)).toEqual([a.id, b.id]);
      expect(c[0].saldoMensal).toBe(painelA.saldoMensal);
      expect(c[1]).toMatchObject({
        saldoMensal: painelB.saldoMensal,
        folhaExtra: painelB.folhaExtra,
        vendaEstimada: painelB.vendaEstimada,
        vendaQueSai: painelB.vendaQueSai,
      });
    });

    it('valores em reais só para o dono: nos outros perfis os campos nem existem', async () => {
      await comCustosEVendas();
      const a = await gravada('Plano A');
      const b = await gravada('Plano B');
      for (const h of [gestor, consulta]) {
        const l = await lista(h);
        for (const x of l)
          for (const k of ['saldoMensal', 'folhaExtra', 'vendaEstimada', 'vendaQueSai'])
            expect(x).not.toHaveProperty(k);
        expect(l[0]).toHaveProperty('horasAbertas');
        const c = (await comparar([a.id, b.id], h)).body.simulacoes;
        for (const x of c)
          for (const k of ['saldoMensal', 'folhaExtra', 'vendaEstimada', 'vendaQueSai'])
            expect(x).not.toHaveProperty(k);
        expect(c[0]).toHaveProperty('horasAbertas');
        expect(c[0]).toHaveProperty('tipo');
      }
    });

    it('o tipo do cenário: reduz, amplia ou mantém as horas abertas da loja', async () => {
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: semana('20:00') });
      const mantem = await gravada('Mantém');
      const reduz = await gravada('Reduz', { horarios: semana('18:00') });
      const amplia = await gravada('Amplia', { horarios: semana('22:00') });
      const l = await lista();
      const tipo = (id: string) => l.find((x) => x.id === id)!.tipo;
      expect(tipo(mantem.id)).toBe('mantem');
      expect(tipo(reduz.id)).toBe('reduz');
      expect(tipo(amplia.id)).toBe('amplia');
      const reduzida = l.find((x) => x.id === reduz.id)!.horasAbertas;
      expect(reduzida).toBeLessThan(l.find((x) => x.id === mantem.id)!.horasAbertas);
    });

    it('gravada fica desatualizada quando a loja muda depois; rascunho e descartada nunca', async () => {
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: semana('20:00') });
      const g = await gravada('Gravada');
      const r = (await criar({ nome: 'Rascunho', regra: 'r40' })).body;
      const d = await gravada('Vai descartar');
      await reqGe().post(`/api/v1/simulacoes/${d.id}/descartar`).set(admin);
      expect((await lista()).every((x) => x.desatualizada === false)).toBe(true);
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: semana('21:00') });
      const l = await lista(admin, '?descartadas=1');
      expect(l.find((x) => x.id === g.id)!.desatualizada).toBe(true);
      expect(l.find((x) => x.id === r.id)!.desatualizada).toBe(false);
      expect(l.find((x) => x.id === d.id)!.desatualizada).toBe(false);
      const c = (await comparar([g.id, (await gravada('Outra')).id])).body.simulacoes;
      expect(c[0].desatualizada).toBe(true);
    });

    it('simulação que amplia horários não fica desatualizada sozinha; mudar o horário da loja depois sim', async () => {
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: semana('20:00') });
      const amplia = await gravada('Amplia', { horarios: semana('22:00') });
      const mantem = await gravada('Mantém');
      let l = await lista();
      expect(l.find((x) => x.id === amplia.id)).toMatchObject({
        tipo: 'amplia',
        desatualizada: false,
      });
      expect(l.find((x) => x.id === mantem.id)!.desatualizada).toBe(false);
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: semana('21:00') });
      l = await lista();
      expect(l.find((x) => x.id === amplia.id)!.desatualizada).toBe(true);
      expect(l.find((x) => x.id === mantem.id)!.desatualizada).toBe(true);
    });

    it('a cópia leva o horário simulado junto (clonar e "Clonar" ao criar)', async () => {
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: semana('20:00') });
      const amplia = await gravada('Amplia', { horarios: semana('22:00') });
      const horasOriginal = (await lista()).find((x) => x.id === amplia.id)!.horasAbertas;
      const copia = await reqGe().post(`/api/v1/simulacoes/${amplia.id}/clonar`).set(admin);
      expect(copia.status).toBe(201);
      const nova = await criar({ nome: 'Clonada pela origem', regra: 'r40', origem: amplia.id });
      expect(nova.status).toBe(201);
      const l = await lista();
      for (const id of [copia.body.id, nova.body.id]) {
        expect(l.find((x) => x.id === id)).toMatchObject({
          tipo: 'amplia',
          horasAbertas: horasOriginal,
        });
      }
      // uma cópia de simulação sem horário simulado continua com o da loja
      const mantem = await gravada('Mantém');
      const copiaMantem = await reqGe().post(`/api/v1/simulacoes/${mantem.id}/clonar`).set(admin);
      expect((await lista()).find((x) => x.id === copiaMantem.body.id)).toMatchObject({
        tipo: 'mantem',
      });
    });

    it('compara de 2 a 4 simulações na ordem recebida; 1 ou 5 são recusadas', async () => {
      const ids = [];
      for (const n of ['A', 'B', 'C', 'D', 'E']) ids.push((await gravada(`Plano ${n}`)).id);
      const quatro = (await comparar([ids[3]!, ids[0]!, ids[2]!, ids[1]!])).body.simulacoes;
      expect(quatro.map((x: { id: string }) => x.id)).toEqual([ids[3], ids[0], ids[2], ids[1]]);
      expect((await comparar(ids)).status).toBe(400);
      expect((await comparar([ids[0]!])).status).toBe(400);
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
      reqGe().patch(`/api/v1/lojas/${lojaId}`).set(admin).send({ horarios });

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
      await reqGe().post(`/api/v1/simulacoes/${g.id}/gravar`).set(admin);
      await patchHorarios(dias({ aberta: true, abre: '09:00', fecha: '18:00' }));
      const depois = (await reqGe().get(`/api/v1/simulacoes/${g.id}`).set(admin)).body;
      expect(depois.diasAbertos.map((d: { dia: number }) => d.dia)).toEqual([0, 1, 2, 3, 4]);
      expect(depois.avaliacao.erros).toEqual([]);
    });
  });
  describe('horário simulado (spec 016)', () => {
    const semana = (fecha: string) => ({
      versao: 2,
      dias: [0, 1, 2, 3, 4]
        .map(() => ({ aberta: true, abre: '08:00', fecha }))
        .concat([{ aberta: false } as never, { aberta: false } as never]),
    });
    const editar = (id: string, body: object, h: Record<string, string> = admin) =>
      reqGe().put(`/api/v1/simulacoes/${id}`).set(h).send(body);

    it('trazer o resultado: horas abertas iguais ao Cadastro enquanto o horário não muda', async () => {
      const sim = (await criar()).body;
      expect(sim.resultado.horario.mudou).toBe(false);
      expect(sim.resultado.horasAbertas).toBe(60);
      expect(sim.resultado.horasAbertasAntes).toBe(60);
    });

    it('editar o horário recalcula e não mexe no Cadastro; null volta ao Cadastro', async () => {
      const sim = (await criar()).body;
      const e = await editar(sim.id, { horarios: semana('18:00') });
      expect(e.status).toBe(200);
      expect(e.body.resultado.horasAbertas).toBe(50);
      expect(e.body.resultado.horasAbertasAntes).toBe(60);
      expect(e.body.resultado.horario.dias[0]).toMatchObject({ fecha: '18:00', alterado: true });
      expect(e.body.diasAbertos[0]).toEqual({ dia: 0, abre: 8, fecha: 18 });
      const lista = (await reqGe().get('/api/v1/lojas').set(admin)).body.data;
      const loja = lista.find((x: { id: string }) => x.id === lojaId);
      expect(loja.horarios.dias[0].fecha).toBe('20:00');
      const volta = await editar(sim.id, { horarios: null });
      expect(volta.body.resultado.horasAbertas).toBe(60);
      expect(volta.body.resultado.horario.mudou).toBe(false);
    });

    it('recusa fechamento antes da abertura e semana toda fechada', async () => {
      const sim = (await criar()).body;
      const ruim = await editar(sim.id, { horarios: semana('07:00') });
      expect(ruim.status).toBe(400);
      const fechada = await editar(sim.id, {
        horarios: { versao: 2, dias: Array.from({ length: 7 }, () => ({ aberta: false })) },
      });
      expect(fechada.status).toBe(400);
    });

    it('não edita o horário de simulação gravada (409)', async () => {
      const sim = (await criar()).body;
      await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      const e = await editar(sim.id, { horarios: semana('18:00') });
      expect(e.status).toBe(409);
    });

    it('o horário simulado fica congelado ao gravar', async () => {
      const sim = (await criar()).body;
      await editar(sim.id, { horarios: semana('19:00') });
      // 19h: farmacêuticas cobrem 08–14 e 14–20; sem erro de cobertura.
      const g = await reqGe().post(`/api/v1/simulacoes/${sim.id}/gravar`).set(admin);
      expect(g.status).toBe(200);
      expect(g.body.diasAbertos[0]).toEqual({ dia: 0, abre: 8, fecha: 19 });
    });

    it('gestor edita; quem só consulta não; valores em reais só para o dono', async () => {
      const sim = (await criar()).body;
      const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
      const viewer = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
      const g = await editar(sim.id, { horarios: semana('18:00') }, gestor);
      expect(g.status).toBe(200);
      expect(g.body.resultado).not.toHaveProperty('saldoMensal');
      expect(g.body.resultado).not.toHaveProperty('vendaQueSai');
      expect((await editar(sim.id, { horarios: semana('17:00') }, viewer)).status).toBe(403);
      const dono = await reqGe().get(`/api/v1/simulacoes/${sim.id}`).set(admin);
      expect(dono.body.resultado).toHaveProperty('saldoMensal');
    });
  });
  describe('resultado em horas e porcentagem (spec 038)', () => {
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
    const detalhe = async (id: string, h: Record<string, string>) =>
      (await reqGe().get(`/api/v1/simulacoes/${id}`).set(h)).body.resultado;

    it('igual para dono, gestor e consulta, sem valor em reais nem salário', async () => {
      const sim = (await criar()).body;
      const [dono, ges, con] = await Promise.all([detalhe(sim.id, admin), detalhe(sim.id, gestor), detalhe(sim.id, consulta)]);
      expect(dono.emHoras).toBeDefined();
      expect(ges.emHoras).toEqual(dono.emHoras);
      expect(con.emHoras).toEqual(dono.emHoras);
      expect(Object.keys(dono.emHoras).sort()).toEqual(
        ['causa', 'contratar', 'custoEstado', 'custoPct', 'horaExtraH', 'horasAbertas', 'horasContratadas', 'pessoas', 'status', 'vendaEstado', 'vendaPct'].sort(),
      );
      // nenhuma chave de valor em reais (o estado "sem_salarios" é só um texto de estado)
      expect(JSON.stringify(ges.emHoras)).not.toMatch(/"(saldo|folha|salario|margem|cmv|[a-zA-Z]*Mensal)[a-zA-Z]*":/);
      // os campos em reais continuam só para o dono
      expect(dono).toHaveProperty('saldoMensal');
      expect(ges).not.toHaveProperty('saldoMensal');
    });

    it('uma vaga simulada aparece em pessoas, horas contratadas e contratar', async () => {
      const sim = (await criar()).body;
      const antes = await detalhe(sim.id, gestor);
      expect(antes.emHoras.pessoas).toEqual({ hoje: 2, simulacao: 2 });
      await reqGe()
        .put(`/api/v1/simulacoes/${sim.id}`)
        .set(admin)
        .send({ vagas: [{ funcao: 'Atendimento', cargaH: 40 }] });
      const depois = await detalhe(sim.id, gestor);
      expect(depois.emHoras.pessoas).toEqual({ hoje: 2, simulacao: 3 });
      expect(depois.emHoras.horasContratadas.simulacao - depois.emHoras.horasContratadas.hoje).toBe(40);
      expect(depois.emHoras.contratar).toEqual([{ funcao: 'Atendimento', inteiras: 1, parciaisHoras: [] }]);
      expect(depois.emHoras.horasAbertas.hoje).toBe(antes.emHoras.horasAbertas.hoje);
    });
  });
  describe('escala por hora (spec 039)', () => {
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
    const obter = async (id: string, h: Record<string, string> = admin) =>
      (await reqGe().get(`/api/v1/simulacoes/${id}`).set(h)).body;
    type Cobertura = Record<number, { funcao: string; porHora: { hora: number; pessoas: number }[] }[]>;
    const pessoasFarmaceuticoNaHora = (sim: { avaliacao: { cobertura: Cobertura } }, dia: number, hora: number) =>
      sim.avaliacao.cobertura[dia]!
        .find((f) => f.funcao === 'Farmacêutico')!
        .porHora.find((c) => c.hora === hora)!;

    it('a cobertura de cada hora traz o mínimo exigido, para todos os perfis', async () => {
      const sim = (await criar()).body;
      for (const h of [admin, gestor, consulta]) {
        const d = await obter(sim.id, h);
        const cel = pessoasFarmaceuticoNaHora(d, d.diasAbertos[0].dia, d.diasAbertos[0].abre);
        expect(cel).toMatchObject({ exigido: 1 });
        expect(typeof cel.pessoas).toBe('number');
      }
    });

    it('vaga nova com turnos soma uma pessoa na hora e os turnos ficam na vaga', async () => {
      const sim = (await criar()).body;
      const d0 = (sim.diasAbertos as { dia: number; abre: number }[])[0]!;
      const antes = pessoasFarmaceuticoNaHora(sim, d0.dia, d0.abre).pessoas;
      const vaga = { funcao: 'Farmacêutico', cargaH: 40, turnos: [{ dia: d0.dia, entrada: d0.abre, saida: d0.abre + 6 }] };
      const r = await reqGe().put(`/api/v1/simulacoes/${sim.id}`).set(admin).send({ vagas: [vaga] });
      expect(r.status).toBe(200);
      expect(r.body.quadro.filter((p: { vaga?: boolean }) => p.vaga)).toHaveLength(1);
      expect(r.body.turnos.filter((t: { matricula: string }) => t.matricula === 'VAGA-1')).toHaveLength(1);
      expect(pessoasFarmaceuticoNaHora(r.body, d0.dia, d0.abre).pessoas).toBe(antes + 1);
      // quem só consulta não contrata
      expect((await reqGe().put(`/api/v1/simulacoes/${sim.id}`).set(consulta).send({ vagas: [vaga] })).status).toBe(403);
    });

    it('a prévia do custo só devolve o número ao dono e não grava nada', async () => {
      const sim = (await criar()).body;
      const corpo = { funcao: 'Atendimento', cargaH: 40 };
      const dono = await reqGe().post(`/api/v1/simulacoes/${sim.id}/efeito-contratacao`).set(admin).send(corpo);
      expect(dono.status).toBe(200);
      expect(dono.body).toHaveProperty('custoEstado');
      const ges = await reqGe().post(`/api/v1/simulacoes/${sim.id}/efeito-contratacao`).set(gestor).send(corpo);
      expect(ges.body).toEqual({});
      expect(JSON.stringify(ges.body)).not.toMatch(/custo/);
      const depois = await obter(sim.id);
      expect(depois.quadro).toHaveLength(2);
      expect(depois.turnos).toHaveLength(10);
    });

    it('a prévia recusa vaga inválida', async () => {
      const sim = (await criar()).body;
      const r = await reqGe().post(`/api/v1/simulacoes/${sim.id}/efeito-contratacao`).set(admin).send({ funcao: 'Atendimento', cargaH: 2 });
      expect(r.status).toBe(400);
    });
  });
  describe('número do cenário (spec 016)', () => {
    const gravarComo = (id: string, h: Record<string, string> = admin) =>
      reqGe().post(`/api/v1/simulacoes/${id}/gravar`).set(h).send({ comoCenario: true });

    it('o rascunho já sabe o próximo número; salvar como cenário dá o nome e o número, em sequência', async () => {
      const a = (await criar({ nome: 'Base A', regra: 'r40' })).body;
      expect(a.proximoNumeroCenario).toBe(1);
      const g1 = await gravarComo(a.id);
      expect(g1.status).toBe(200);
      expect(g1.body).toMatchObject({ status: 'gravada', numeroCenario: 1, nome: 'Cenário 1' });
      expect(g1.body).not.toHaveProperty('proximoNumeroCenario');
      const b = (await criar({ nome: 'Base B', regra: 'r40' })).body;
      expect(b.proximoNumeroCenario).toBe(2);
      const g2 = await gravarComo(b.id);
      expect(g2.body).toMatchObject({ numeroCenario: 2, nome: 'Cenário 2' });
    });

    it('gravar sem "comoCenario" mantém o nome mas também numera', async () => {
      const a = (await criar({ nome: 'Meu nome', regra: 'r40' })).body;
      const g = await reqGe().post(`/api/v1/simulacoes/${a.id}/gravar`).set(admin);
      expect(g.body).toMatchObject({ nome: 'Meu nome', numeroCenario: 1 });
    });

    it('a numeração é por loja', async () => {
      const a = (await criar({ nome: 'Base A', regra: 'r40' })).body;
      await gravarComo(a.id);
      const outra = await postLoja({
        codigo: '002',
        nome: 'Outra',
        horarios: { semana: { abre: '08:00', fecha: '20:00' } },
      });
      expect(outra.status).toBe(201);
      const r = await reqGe().get(`/api/v1/lojas/${outra.body.id}/simulacoes`).set(admin);
      expect(r.body.data).toEqual([]);
    });

    it('o gestor salva o cenário (grava e recebe o número)', async () => {
      const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
      const a = (await criar({ nome: 'Base A', regra: 'r40' })).body;
      const g = await gravarComo(a.id, gestor);
      expect(g.status).toBe(200);
      expect(g.body).toMatchObject({ status: 'gravada', numeroCenario: 1 });
    });

    it('a lista traz o número do cenário', async () => {
      const a = (await criar({ nome: 'Base A', regra: 'r40' })).body;
      await gravarComo(a.id);
      const l = await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes`).set(admin);
      expect(l.body.data[0]).toMatchObject({ numeroCenario: 1 });
    });
  });
  describe('cobertura na simulação (spec 032)', () => {
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const semana = (fecha: string) => ({
      versao: 2,
      dias: [0, 1, 2, 3, 4]
        .map(() => ({ aberta: true, abre: '08:00', fecha }))
        .concat([{ aberta: false } as never, { aberta: false } as never]),
    });
    const put = (id: string, body: object) =>
      reqGe().put(`/api/v1/simulacoes/${id}`).set(admin).send(body);
    const farma = (c: {
      funcoes: {
        funcao: string;
        porHora: { hora: number; pessoas: number | null; ok: boolean | null }[];
      }[];
    }) => c.funcoes.find((f) => f.funcao === 'Farmacêutico')!.porHora;
    const baseDeVendas = async () => {
      const wb = new ExcelJS.Workbook();
      const linhas = [['Data', 'Hora', 'Código da loja', 'Venda líquida (R$)']];
      for (const d of ['07/09/2026', '08/09/2026', '09/09/2026', '10/09/2026', '11/09/2026'])
        for (let h = 8; h < 20; h++) linhas.push([d, String(h), '001', '500,00']);
      wb.addWorksheet('Base').addRows(linhas);
      const up = await reqGe()
        .post('/api/v1/cargas/base')
        .set(admin)
        .attach('arquivo', Buffer.from(await wb.xlsx.writeBuffer()), 'b.xlsx');
      expect(up.status).toBe(201);
    };

    it('o detalhe traz a cobertura hora a hora com o quadro e o horário da simulação', async () => {
      const sim = (await criar()).body;
      expect(sim.cobertura.horas).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
      expect(farma(sim.cobertura).every((c) => c.pessoas === 1 && c.ok === true)).toBe(true);
      expect(sim.cobertura.vagasSemTurnos).toBe(0);
      expect(sim.cobertura.vendas).toBeNull();
    });

    it('reduzir o horário tira as horas do fim da grade sem mexer no Cadastro nem nos números do resultado', async () => {
      const sim = (await criar()).body;
      const antes = sim.resultado;
      const e = await put(sim.id, { horarios: semana('18:00') });
      expect(e.body.cobertura.horas).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
      expect(e.body.resultado.horasAbertas).toBe(50);
      expect(antes.horasAbertas).toBe(60);
      expect(e.body.resultado).not.toHaveProperty('cobertura');
    });

    it('desligar a farmacêutica da manhã derruba a cobertura nessas horas', async () => {
      const sim = (await criar()).body;
      const d = await put(sim.id, { desligados: ['F1'] });
      const horas = farma(d.body.cobertura);
      expect(horas.filter((c) => c.hora < 14).every((c) => c.pessoas === 0 && c.ok === false)).toBe(
        true,
      );
      expect(horas.filter((c) => c.hora >= 14).every((c) => c.pessoas === 1 && c.ok === true)).toBe(
        true,
      );
    });

    it('vaga sem turnos não cobre e é contada à parte; com turnos passa a cobrir', async () => {
      const sim = (await criar()).body;
      const v = await put(sim.id, { vagas: [{ funcao: 'Atendimento', cargaH: 40 }] });
      expect(v.body.cobertura.vagasSemTurnos).toBe(1);
      const turnos = [
        ...v.body.turnos,
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
      expect(c.body.cobertura.vagasSemTurnos).toBe(0);
    });

    it('valores em reais só para o dono: o gestor recebe a participação e nenhum valor', async () => {
      await baseDeVendas();
      const sim = (await criar()).body;
      const dono = await reqGe().get(`/api/v1/simulacoes/${sim.id}`).set(admin);
      expect(dono.body.cobertura.vendas.horas[0]).toHaveProperty('vendaMedia');
      const g = await reqGe().get(`/api/v1/simulacoes/${sim.id}`).set(gestor);
      expect(g.body.cobertura.vendas.horas[0]).toHaveProperty('participacao');
      expect(JSON.stringify(g.body.cobertura)).not.toMatch(/vendaMedia/);
    });

    it('a lista e a comparação não trazem a cobertura', async () => {
      const a = (await criar()).body;
      const b = (await criar({ nome: 'Outra', regra: 'r40' })).body;
      const lista = (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes`).set(admin)).body
        .data as object[];
      expect(lista.every((x) => !('cobertura' in x))).toBe(true);
      await reqGe().post(`/api/v1/simulacoes/${a.id}/gravar`).set(admin);
      await reqGe().post(`/api/v1/simulacoes/${b.id}/gravar`).set(admin);
      const cmp = await reqGe()
        .get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${a.id},${b.id}`)
        .set(admin);
      expect(JSON.stringify(cmp.body)).not.toContain('"cobertura":{"horas"');
    });
  });
  describe('régua da simulação: margem ou venda (spec 033)', () => {
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const semana = (fecha: string) => ({
      versao: 2,
      dias: [0, 1, 2, 3, 4]
        .map(() => ({ aberta: true, abre: '08:00', fecha }))
        .concat([{ aberta: false } as never, { aberta: false } as never]),
    });
    // `cmv`: CMV por hora em reais (a venda de cada hora é 500); null = base sem a coluna de CMV.
    const baseComMargem = async (cmv: string | null) => {
      await reqGe()
        .put(`/api/v1/lojas/${lojaId}/custos`)
        .set(admin)
        .send({ salarioMedio: { Farmacêutico: 8000, Atendimento: 2000 } });
      const wb = new ExcelJS.Workbook();
      const linhas = [
        ['Data', 'Hora', 'Código da loja', 'Venda líquida (R$)', ...(cmv ? ['CMV (R$)'] : [])],
      ];
      for (const d of ['07/09/2026', '08/09/2026', '09/09/2026', '10/09/2026', '11/09/2026'])
        for (let h = 8; h < 20; h++)
          linhas.push([d, String(h), '001', '500,00', ...(cmv ? [cmv] : [])]);
      wb.addWorksheet('Base').addRows(linhas);
      const up = await reqGe()
        .post('/api/v1/cargas/base')
        .set(admin)
        .attach('arquivo', Buffer.from(await wb.xlsx.writeBuffer()), 'b.xlsx');
      expect(up.status).toBe(201);
    };
    const comHorarioReduzido = async () => {
      const sim = (
        await reqGe()
          .post(`/api/v1/lojas/${lojaId}/simulacoes`)
          .set(admin)
          .send({ nome: 'Reduz', regra: 'r40' })
      ).body;
      await reqGe()
        .put(`/api/v1/simulacoes/${sim.id}`)
        .set(admin)
        .send({ horarios: semana('18:00') });
      return sim.id as string;
    };

    it('base com CMV: o painel mede a venda que sai em lucro bruto (venda − CMV); a lista e a comparação mostram o mesmo saldo', async () => {
      await baseComMargem('350,00');
      const id = await comHorarioReduzido();
      const painel = (await reqGe().get(`/api/v1/simulacoes/${id}`).set(admin)).body.resultado;
      expect(painel.regua).toEqual({ tipo: 'margem' });
      // Fechar 2 horas por dia, de segunda a sexta: 10 horas × 150 de margem por semana × 52 ÷ 12.
      expect(painel.vendaQueSai).toBeCloseTo((10 * 150 * 52) / 12, 1);
      const lista = (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes`).set(admin)).body
        .data as Record<string, unknown>[];
      const item = lista.find((x) => x.id === id)!;
      expect(item.regua).toEqual({ tipo: 'margem' });
      expect(item.saldoMensal).toBe(painel.saldoMensal);
      const outro = (
        await reqGe()
          .post(`/api/v1/lojas/${lojaId}/simulacoes`)
          .set(admin)
          .send({ nome: 'Outra', regra: 'r40' })
      ).body.id;
      await reqGe().post(`/api/v1/simulacoes/${id}/gravar`).set(admin);
      await reqGe().post(`/api/v1/simulacoes/${outro}/gravar`).set(admin);
      const cmp = (
        await reqGe()
          .get(`/api/v1/lojas/${lojaId}/simulacoes/comparar?ids=${id},${outro}`)
          .set(admin)
      ).body;
      const doComparado = cmp.simulacoes.find((x: { id: string }) => x.id === id);
      expect(doComparado.regua).toEqual({ tipo: 'margem' });
      expect(doComparado.saldoMensal).toBe(painel.saldoMensal);
    });

    it('base sem CMV: venda, com a venda que sai de sempre', async () => {
      await baseComMargem(null);
      const id = await comHorarioReduzido();
      const painel = (await reqGe().get(`/api/v1/simulacoes/${id}`).set(admin)).body.resultado;
      expect(painel.regua).toEqual({ tipo: 'venda', motivo: 'sem_margem' });
      expect(painel.vendaQueSai).toBeCloseTo((10 * 500 * 52) / 12, 1);
    });

    it('base sem CMV mas com o CMV médio da loja: a venda que sai é o lucro bruto (venda × (1 − CMV médio))', async () => {
      await baseComMargem(null);
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ faturamento: { dias: [1, 1, 1, 1, 1, 1, null], mensal: null, cmvPct: 70 } });
      const id = await comHorarioReduzido();
      const painel = (await reqGe().get(`/api/v1/simulacoes/${id}`).set(admin)).body.resultado;
      expect(painel.regua).toEqual({ tipo: 'margem' });
      // 10 horas fechadas por semana × 500 de venda × 30% de lucro bruto × 52 ÷ 12
      expect(painel.vendaQueSai).toBeCloseTo((10 * 150 * 52) / 12, 1);
    });

    it('o gestor recebe a régua e nenhum valor em reais, nem no painel nem na lista', async () => {
      await baseComMargem('350,00');
      const id = await comHorarioReduzido();
      const painel = (await reqGe().get(`/api/v1/simulacoes/${id}`).set(gestor)).body.resultado;
      expect(painel.regua).toEqual({ tipo: 'margem' });
      expect(painel).not.toHaveProperty('vendaQueSai');
      expect(painel).not.toHaveProperty('saldoMensal');
      const lista = (await reqGe().get(`/api/v1/lojas/${lojaId}/simulacoes`).set(gestor)).body
        .data as Record<string, unknown>[];
      expect(lista[0]).toHaveProperty('regua');
      expect(lista[0]).not.toHaveProperty('saldoMensal');
    });

    it('simulação gravada antes é recalculada na régua atual da loja', async () => {
      await baseComMargem(null);
      const id = await comHorarioReduzido();
      await reqGe().post(`/api/v1/simulacoes/${id}/gravar`).set(admin);
      const antes = (await reqGe().get(`/api/v1/simulacoes/${id}`).set(admin)).body.resultado;
      expect(antes.regua?.tipo).toBe('venda');
      await baseComMargem('350,00');
      const depois = (await reqGe().get(`/api/v1/simulacoes/${id}`).set(admin)).body.resultado;
      expect(depois.regua).toEqual({ tipo: 'margem' });
      expect(depois.vendaQueSai).toBeLessThan(antes.vendaQueSai);
    });
  });
});
