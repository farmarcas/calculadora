import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
const nova = {
  fase: 'r40',
  jornadaSemanalH: 36,
  horasDiaMax: 8,
  horasDiaMaxConvencao: null,
  diasTrabalho: 5,
  divisor: 180,
  vigenciaInicio: '2026-01-01',
};

describe('parâmetros legais (rotas)', () => {
  beforeEach(async () => {
    await prisma.parametroLegal.deleteMany({ where: { criadoPor: { not: 'sistema' } } });
  });
  afterAll(async () => {
    await prisma.parametroLegal.deleteMany({ where: { criadoPor: { not: 'sistema' } } });
    await prisma.$disconnect();
  });

  it('vem com os valores de hoje; todos os perfis veem', async () => {
    for (const perfil of [admin, gestor, consulta]) {
      const r = await reqGe().get('/api/v1/parametros-legais').set(perfil);
      expect(r.status).toBe(200);
      const por = Object.fromEntries(r.body.fases.map((f: { fase: string }) => [f.fase, f]));
      expect(por.atual.vigente).toMatchObject({
        jornadaSemanalH: 44,
        horasDiaMax: 8,
        diasTrabalho: 6,
        divisor: 220,
      });
      expect(por.r42.vigente).toMatchObject({
        jornadaSemanalH: 42,
        horasDiaMaxConvencao: 8.4,
        diasTrabalho: 5,
        divisor: 210,
        vigenciaInicio: '2026-12-16',
      });
      expect(por.r40.vigente).toMatchObject({
        jornadaSemanalH: 40,
        divisor: 200,
        vigenciaInicio: '2027-12-01',
      });
      expect(por.r40.historico).toHaveLength(1);
    }
  });

  it('só o dono cria versão; gestor e consulta recebem 403 e nada muda', async () => {
    for (const perfil of [gestor, consulta])
      expect((await reqGe().post('/api/v1/parametros-legais').set(perfil).send(nova)).status).toBe(
        403,
      );
    expect(await prisma.parametroLegal.count()).toBe(3);
    const r = await reqGe().post('/api/v1/parametros-legais').set(admin).send(nova);
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ fase: 'r40', jornadaSemanalH: 36, criadoPor: 'TENANT_ADMIN' });
  });

  it('alterar cria nova versão, preserva a antiga no histórico e registra auditoria', async () => {
    await reqGe().post('/api/v1/parametros-legais').set(admin).send(nova);
    const r = await reqGe().get('/api/v1/parametros-legais').set(consulta);
    const r40 = r.body.fases.find((f: { fase: string }) => f.fase === 'r40');
    expect(r40.vigente).toMatchObject({ jornadaSemanalH: 36, divisor: 180 });
    expect(r40.historico).toHaveLength(2);
    expect(r40.historico.some((h: { jornadaSemanalH: number }) => h.jornadaSemanalH === 40)).toBe(
      true,
    );
    const aud = await prisma.auditoria.findFirst({
      where: { acao: 'parametros.alterados' },
      orderBy: { criadoEm: 'desc' },
    });
    expect(aud).toMatchObject({ perfil: 'TENANT_ADMIN', alvoTipo: 'parametros' });
  });

  it('versão com início no futuro não vale ainda: a atual segue valendo', async () => {
    await reqGe()
      .post('/api/v1/parametros-legais')
      .set(admin)
      .send({ ...nova, vigenciaInicio: '2099-01-01' });
    const r = await reqGe().get('/api/v1/parametros-legais').set(admin);
    const r40 = r.body.fases.find((f: { fase: string }) => f.fase === 'r40');
    // as duas começam no futuro (2027 e 2099): vale a mais antiga, a de hoje
    expect(r40.vigente.jornadaSemanalH).toBe(40);
    await reqGe()
      .post('/api/v1/parametros-legais')
      .set(admin)
      .send({ ...nova, vigenciaInicio: '2020-01-01' });
    const depois = (await reqGe().get('/api/v1/parametros-legais').set(admin)).body.fases.find(
      (f: { fase: string }) => f.fase === 'r40',
    );
    expect(depois.vigente.jornadaSemanalH).toBe(36);
  });

  it('recusa valores impossíveis com aviso em português', async () => {
    const msg = async (corpo: object) => {
      const r = await reqGe()
        .post('/api/v1/parametros-legais')
        .set(admin)
        .send({ ...nova, ...corpo });
      expect(r.status).toBe(400);
      return JSON.stringify(r.body);
    };
    expect(await msg({ jornadaSemanalH: 0 })).toContain('jornada semanal');
    expect(await msg({ horasDiaMax: 30 })).toContain('horas por dia');
    expect(await msg({ diasTrabalho: 9 })).toContain('dias de trabalho');
    expect(await msg({ divisor: -1 })).toContain('divisor');
    expect(await msg({ vigenciaInicio: 'xx' })).toContain('data de início');
    expect(await msg({ fase: 'r99' })).toBeTruthy();
    expect(await prisma.parametroLegal.count()).toBe(3);
  });

  it('o Diagnóstico usa a versão vigente: alterar a 40h muda a regra, e voltar restaura', async () => {
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    const loja = await reqGe()
      .post('/api/v1/lojas')
      .set(admin)
      .send({
        codigo: '001',
        nome: 'Centro',
        horarios: { semana: { abre: '08:00', fecha: '20:00' } },
      });
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Dados').addRows([
      [
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
      ],
      ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '16:00', '40'],
    ]);
    await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach('arquivo', Buffer.from(await wb.xlsx.writeBuffer()), 'e.xlsx');
    const url = `/api/v1/lojas/${loja.body.id}/diagnostico`;
    const r40 = async () =>
      (await reqGe().get(url).set(admin)).body.regras.find((r: { id: string }) => r.id === 'r40');

    const antes = await r40();
    expect(antes.nome).toBe('40h');
    const cheia = (x: typeof antes) =>
      x.funcoes.find((f: { funcao: string }) => f.funcao === 'Farmacêutico').cargaCheiaH;
    expect(cheia(antes)).toBe(40);

    await reqGe().post('/api/v1/parametros-legais').set(admin).send(nova);
    const mudou = await r40();
    expect(mudou.nome).toBe('36h');
    expect(cheia(mudou)).toBe(36);

    await reqGe()
      .post('/api/v1/parametros-legais')
      .set(admin)
      .send({ ...nova, jornadaSemanalH: 40, divisor: 200, vigenciaInicio: '2026-06-01' });
    const voltou = await r40();
    expect(voltou.nome).toBe('40h');
    expect(cheia(voltou)).toBe(40);
  });
});
