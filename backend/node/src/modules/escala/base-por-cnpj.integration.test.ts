import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { cnpjValido, postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };

const CAB = 'cnpj,dia_semana,dia_semana_nome,hora,faturamento,valor_bruto,cmv_valor,unidades_vendidas,tickets_vendidos,ticket_medio';
const csv = (linhas: string[]) => Buffer.from([CAB, ...linhas].join('\n') + '\n');
// cnpj, dia, hora, faturamento, cmv, unidades, tickets
const linha = (cnpj: string, dia: number, hora: number, fat: number, cmv: number, un = 0, tk = 0) =>
  `"${cnpj}","${dia}","x","${hora}","${fat}","0","${cmv}","${un}","${tk}","0"`;

const form = (buf: Buffer, h: Record<string, string>, campos: Record<string, string> = {}, rota = '/api/v1/cargas/base/revisar') => {
  let r = reqGe().post(rota).set(h).attach('arquivo', buf, 'base.csv');
  for (const [k, v] of Object.entries(campos)) r = r.field(k, v);
  return r;
};
const PERIODO = { periodoInicio: '2026-07-01', periodoFim: '2026-10-31' };

describe('base comercial por CNPJ (spec 036)', () => {
  let cnpjA = '';
  let cnpjB = '';
  const cnpjSemLoja = '99999999000191';
  let idA = '';
  let idB = '';

  beforeEach(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    cnpjA = cnpjValido();
    cnpjB = cnpjValido();
    idA = (await postLoja({ codigo: '001', nome: 'Centro', cnpj: cnpjA })).body.id;
    idB = (await postLoja({ codigo: '002', nome: 'Norte', cnpj: cnpjB })).body.id;
    // Só o dono informa o faturamento pela tela; aqui vai direto, como se alguém já o tivesse digitado.
    await prisma.loja.update({
      where: { id: idB },
      data: { faturamento: { dias: [777, null, null, null, null, null, null], mensal: null, cmvPct: 65 } },
    });
    await postLoja({ codigo: '003', nome: 'Fora do arquivo', cnpj: cnpjValido() });
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const arquivo = () =>
    csv([
      linha(cnpjA, 1, 8, 1700, 1000, 170, 85), // segunda: 17 vezes no período
      linha(cnpjA, 3, 9, 1800, 900, 90, 36), // quarta: 18 vezes
      linha(cnpjA, 3, 10, 0, 0, 0, 1), // linha zerada
      linha(cnpjB, 1, 8, 340, 200, 34, 17),
      linha(cnpjSemLoja, 1, 8, 100, 50),
      linha('123', 1, 8, 100, 50), // CNPJ inválido
    ]);

  it('a conferência sem período pede o período e não grava nada', async () => {
    const antes = await prisma.carga.count();
    const r = await form(arquivo(), admin);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ formato: 'por_cnpj', precisaPeriodo: true, periodo: null, lojas: 2, mantidas: 1, totalCnpjsSemLoja: 1, totalErros: 1 });
    expect(await prisma.carga.count()).toBe(antes);
  });

  it('a conferência com período conta lojas, CNPJs sem loja, o que preenche no Cadastro e os avisos', async () => {
    const r = await form(arquivo(), admin, PERIODO);
    expect(r.body).toMatchObject({
      precisaPeriodo: false,
      periodo: { inicio: '2026-07-01', fim: '2026-10-31', diasDaSemana: [17, 17, 18, 18, 18, 18, 17] },
      lojas: 2,
      substitui: 0,
      mantidas: 1,
      cnpjsSemLoja: [cnpjSemLoja],
      // A loja A está sem faturamento (preenche); a B já tem o dia e o CMV digitados (só preenche o que falta)
      preencheCadastro: { cmvPct: 1, jaTinhamValor: 1 },
    });
    expect(r.body.avisos).toEqual(expect.arrayContaining([{ tipo: 'linha_zerada', quantidade: 1 }]));
    expect(JSON.stringify(r.body)).not.toMatch(/"venda"|"cmv"/);
  });

  it('período invertido ou menor que uma semana: a conferência pede de novo e a importação recusa (422)', async () => {
    const rev = await form(arquivo(), admin, { periodoInicio: '2026-10-31', periodoFim: '2026-07-01' });
    expect(rev.body).toMatchObject({ precisaPeriodo: true, erroPeriodo: expect.stringContaining('Informe o período') });
    const imp = await form(arquivo(), admin, { periodoInicio: '2026-07-01', periodoFim: '2026-07-03' }, '/api/v1/cargas/base');
    expect(imp.status).toBe(422);
    expect(imp.body.error.code).toBe('PERIODO_INVALIDO');
    expect(await prisma.carga.count()).toBe(0);
  });

  it('importa: média de um dia, CMV, clientes e unidades; CNPJ sem loja não cria loja', async () => {
    const r = await form(arquivo(), admin, PERIODO, '/api/v1/cargas/base');
    expect(r.status).toBe(201);
    expect(r.body.lojas.map((l: { codigo: string; situacao: string }) => [l.codigo, l.situacao])).toEqual(
      expect.arrayContaining([['001', 'Importada'], ['002', 'Importada']]),
    );
    expect(r.body.cnpjsSemLoja).toEqual([cnpjSemLoja]);
    expect(await prisma.loja.count({ where: { cnpj: cnpjSemLoja } })).toBe(0);

    const horas = await prisma.vendaHora.findMany({ where: { carga: { lojaId: idA, ativa: true } }, orderBy: { hora: 'asc' } });
    expect(horas).toHaveLength(3);
    // segunda 08h: 1700 ÷ 17 = 100; CMV 1000 ÷ 17; tickets 85 ÷ 17 = 5; unidades 170 ÷ 17 = 10
    expect(horas[0]).toMatchObject({ hora: 8, venda: 100, clientes: 5, unidades: 10 });
    expect(horas[0]!.cmv).toBeCloseTo(1000 / 17, 6);
    expect(horas[0]!.data.toISOString().slice(0, 10)).toBe('2026-07-06');
    // quarta 09h: 1800 ÷ 18 = 100; tickets 36 ÷ 18 = 2
    expect(horas[1]).toMatchObject({ hora: 9, venda: 100, clientes: 2, unidades: 5 });
    expect(horas[1]!.data.toISOString().slice(0, 10)).toBe('2026-07-01');
    const carga = await prisma.carga.findFirstOrThrow({ where: { lojaId: idA, ativa: true } });
    expect(carga.periodoInicio?.toISOString().slice(0, 10)).toBe('2026-07-01');
    expect(carga.periodoFim?.toISOString().slice(0, 10)).toBe('2026-10-31');
  });

  it('substitui a base ativa da loja e guarda a anterior como inativa; a loja fora do arquivo fica como estava', async () => {
    await form(arquivo(), admin, PERIODO, '/api/v1/cargas/base');
    await form(arquivo(), admin, PERIODO, '/api/v1/cargas/base');
    const cargas = await prisma.carga.findMany({ where: { lojaId: idA, tipo: 'BASE' } });
    expect(cargas).toHaveLength(2);
    expect(cargas.filter((c) => c.ativa)).toHaveLength(1);
    expect(await prisma.vendaHora.count({ where: { carga: { lojaId: idA, ativa: true } } })).toBe(3);
    const fora = await prisma.loja.findFirstOrThrow({ where: { codigo: '003' } });
    expect(await prisma.carga.count({ where: { lojaId: fora.id } })).toBe(0);
    const rev = await form(arquivo(), admin, PERIODO);
    expect(rev.body.substitui).toBe(2);
  });

  it('Cadastro: preenche só o que está vazio e mantém o que foi digitado', async () => {
    const r = await form(arquivo(), admin, PERIODO, '/api/v1/cargas/base');
    // A loja A recebe; a B já tinha o dia que o arquivo traz e o CMV médio, então nada nela muda.
    expect(r.body.cadastro).toEqual({ preenchidas: 1, jaTinhamValor: 1 });
    const a = await prisma.loja.findUniqueOrThrow({ where: { id: idA } });
    // segunda: 100; quarta: 100; CMV médio = (1000/17 + 900/18) ÷ (100 + 100) = 54,4%
    expect(a.faturamento).toMatchObject({ dias: [100, null, 100, null, null, null, null], cmvPct: 54.4 });
    const b = await prisma.loja.findUniqueOrThrow({ where: { id: idB } });
    // o dia e o CMV que a pessoa digitou ficam; só o que estava vazio é preenchido (não há outro dia no arquivo)
    expect(b.faturamento).toMatchObject({ dias: [777, null, null, null, null, null, null], cmvPct: 65 });
  });

  it('nenhum valor em reais na resposta e consulta não importa', async () => {
    const r = await form(arquivo(), gestor, PERIODO, '/api/v1/cargas/base');
    expect(r.status).toBe(201);
    expect(JSON.stringify(r.body)).not.toMatch(/"venda"|"cmv"|"faturamento"/);
    expect((await form(arquivo(), consulta, PERIODO)).status).toBe(403);
    expect((await form(arquivo(), consulta, PERIODO, '/api/v1/cargas/base')).status).toBe(403);
  });

  it('o formato atual (código da loja e data) continua importando', async () => {
    const legado = Buffer.from('Data,Hora,Código da loja,Venda líquida (R$)\n2026-10-01,9,001,"100,00"\n');
    const r = await form(legado, admin, {}, '/api/v1/cargas/base');
    expect(r.status).toBe(201);
    expect(r.body.lojas[0]).toMatchObject({ codigo: '001', situacao: 'Importada' });
    expect(r.body.formato).toBeUndefined();
  });
});
