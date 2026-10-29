import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../database/prisma.js';
import { GE_INICIAL_ID } from '../ge.js';
import { criarGe, limparGes, reqGe } from './ge.js';

// Dois GEs com dados parecidos. Quem está no GE B não pode ver nem mexer em nada do GE A:
// o servidor responde como se o registro não existisse.
const admin = { 'X-Perfil': 'TENANT_ADMIN' };
const custos = { salarioMedio: { Farmacêutico: 8000, Atendimento: 2500 }, encargosPct: 70 };
const horarios = {
  versao: 2,
  dias: Array.from({ length: 7 }, () => ({ aberta: true, abre: '08:00', fecha: '20:00' })),
};

describe('isolamento entre GEs', () => {
  let a: string;
  let b: string;
  let lojaA = '';
  let funcA = '';
  let simA = '';
  let impA = '';

  beforeAll(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
    await limparGes();
    a = (await criarGe('ISO-A', 'Empresário A')).id;
    b = (await criarGe('ISO-B', 'Empresário B')).id;
    const dados = async (ge: string, nome: string) => {
      const loja = await reqGe(ge)
        .post('/api/v1/lojas')
        .set(admin)
        .send({ codigo: '001', nome, horarios });
      expect(loja.status, loja.text).toBe(201);
      const func = await reqGe(ge)
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({
          matricula: 'M1',
          nome: `Func ${nome}`,
          lojaId: loja.body.id,
          funcaoEscala: 'Caixa',
        });
      expect(func.status, func.text).toBe(201);
      const sim = await reqGe(ge)
        .post(`/api/v1/lojas/${loja.body.id}/simulacoes`)
        .set(admin)
        .send({ nome: `Sim ${nome}`, origem: 'vazia' });
      expect(sim.status, sim.text).toBe(201);
      return {
        loja: loja.body.id as string,
        func: func.body.id as string,
        sim: sim.body.id as string,
      };
    };
    const da = await dados(a, 'Loja A');
    await dados(b, 'Loja B');
    lojaA = da.loja;
    funcA = da.func;
    simA = da.sim;
    expect(
      (await reqGe(a).put(`/api/v1/lojas/${lojaA}/custos`).set(admin).send(custos)).status,
    ).toBe(200);
    impA = (
      await prisma.importacaoCadastro.create({ data: { arquivo: 'a.xlsx', geId: a, abas: [] } })
    ).id;
  });
  afterAll(async () => {
    await prisma.auditoria.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    await prisma.importacaoCadastro.deleteMany();
    await limparGes();
    await prisma.$disconnect();
  });

  it('o mesmo código de loja e a mesma matrícula convivem nos dois GEs', async () => {
    for (const ge of [a, b]) {
      const lojas = (await reqGe(ge).get('/api/v1/lojas').set(admin)).body;
      expect(lojas.meta.total).toBe(1);
      expect(lojas.data[0].codigo).toBe('001');
      const funcs = (await reqGe(ge).get('/api/v1/funcionarios').set(admin)).body;
      expect(funcs.meta.total).toBe(1);
    }
  });

  it('listas e totais mostram só o GE de quem olha', async () => {
    const lojas = (await reqGe(b).get('/api/v1/lojas').set(admin)).body;
    expect(lojas.data.map((l: { id: string }) => l.id)).not.toContain(lojaA);
    expect(lojas.data[0].nome).toBe('Loja B');
    const funcs = (await reqGe(b).get('/api/v1/funcionarios').set(admin)).body;
    expect(funcs.data.map((f: { id: string }) => f.id)).not.toContain(funcA);
    expect(
      (await reqGe(b).get(`/api/v1/funcionarios?lojaId=${lojaA}`).set(admin)).body.meta.total,
    ).toBe(0);
    expect((await reqGe(b).get('/api/v1/lojas?busca=Loja%20A').set(admin)).body.data).toHaveLength(
      0,
    );
  });

  const casos: [
    string,
    'get' | 'post' | 'put' | 'patch' | 'delete',
    () => string,
    (() => object)?,
  ][] = [
    ['ver a loja do outro GE no diagnóstico', 'get', () => `/api/v1/lojas/${lojaA}/diagnostico`],
    ['ver o histórico de cargas', 'get', () => `/api/v1/lojas/${lojaA}/cargas`],
    [
      'mudar a configuração',
      'put',
      () => `/api/v1/lojas/${lojaA}/configuracao`,
      () => ({ convencao8h24: true }),
    ],
    ['editar a loja', 'patch', () => `/api/v1/lojas/${lojaA}`, () => ({ nome: 'Invadida' })],
    ['remover a loja', 'delete', () => `/api/v1/lojas/${lojaA}`],
    ['ler os custos', 'get', () => `/api/v1/lojas/${lojaA}/custos`],
    ['gravar os custos', 'put', () => `/api/v1/lojas/${lojaA}/custos`, () => custos],
    ['listar as simulações', 'get', () => `/api/v1/lojas/${lojaA}/simulacoes`],
    [
      'criar simulação na loja',
      'post',
      () => `/api/v1/lojas/${lojaA}/simulacoes`,
      () => ({ nome: 'Invasora', origem: 'vazia' }),
    ],
    ['abrir a simulação', 'get', () => `/api/v1/simulacoes/${simA}`],
    ['editar a simulação', 'put', () => `/api/v1/simulacoes/${simA}`, () => ({ nome: 'Invadida' })],
    ['gravar a simulação', 'post', () => `/api/v1/simulacoes/${simA}/gravar`],
    [
      'aprovar a simulação',
      'post',
      () => `/api/v1/simulacoes/${simA}/aprovar`,
      () => ({ vigenciaInicio: '2027-01-01' }),
    ],
    ['descartar a simulação', 'post', () => `/api/v1/simulacoes/${simA}/descartar`],
    ['clonar a simulação', 'post', () => `/api/v1/simulacoes/${simA}/clonar`],
    ['exportar a simulação', 'get', () => `/api/v1/simulacoes/${simA}/exportar.xlsx`],
    [
      'comparar simulações',
      'get',
      () => `/api/v1/lojas/${lojaA}/simulacoes/comparar?ids=${simA},${simA}`,
    ],
    [
      'editar o funcionário',
      'patch',
      () => `/api/v1/funcionarios/${funcA}`,
      () => ({ nome: 'Invadido' }),
    ],
    ['remover o funcionário', 'delete', () => `/api/v1/funcionarios/${funcA}`],
    [
      'criar funcionário na loja',
      'post',
      () => '/api/v1/funcionarios',
      () => ({ matricula: 'M9', nome: 'Intruso', lojaId: lojaA }),
    ],
    [
      'confirmar importação',
      'post',
      () => `/api/v1/importacoes/cadastro/${impA}/confirmar`,
      () => ({ mapeamento: { lojas: null, funcionarios: null } }),
    ],
  ];
  for (const [nome, metodo, url, corpo] of casos) {
    // Loja de outro GE é tratada como loja que não existe: no cadastro de funcionário isso já era 400 ("Loja de lotação não existe").
    const esperado = nome === 'criar funcionário na loja' ? 400 : 404;
    it(`no GE B não dá para ${nome}`, async () => {
      let r = reqGe(b)[metodo](url()).set(admin);
      if (corpo) r = r.send(corpo());
      const res = await r;
      expect(res.status, `${metodo} ${url()} → ${res.status} ${res.text.slice(0, 120)}`).toBe(
        esperado,
      );
    });
  }

  it('nada do GE A foi alterado pelas tentativas do GE B', async () => {
    const loja = (await reqGe(a).get('/api/v1/lojas').set(admin)).body.data[0];
    expect(loja.nome).toBe('Loja A');
    expect((await reqGe(a).get('/api/v1/funcionarios').set(admin)).body.data[0].nome).toBe(
      'Func Loja A',
    );
    const sims = (await reqGe(a).get(`/api/v1/lojas/${lojaA}/simulacoes`).set(admin)).body.data;
    expect(sims).toHaveLength(1);
    expect(sims[0].status).toBe('rascunho');
    expect(await prisma.loja.count({ where: { id: lojaA, deletedAt: null } })).toBe(1);
  });

  it('a auditoria carimba o GE de cada ação', async () => {
    const acoes = await prisma.auditoria.findMany({
      where: { alvoId: { in: [lojaA, funcA, simA] } },
    });
    expect(acoes.length).toBeGreaterThan(0);
    expect(acoes.every((x) => x.geId === a)).toBe(true);
  });

  it('exige o GE, recusa GE inexistente ou desativado e deixa as regras legais sem GE', async () => {
    expect((await reqGe().get('/api/v1/lojas').set(admin)).status).toBe(200); // GE inicial
    const sem = await (
      await import('supertest')
    )
      .default((await import('../../app.js')).app)
      .get('/api/v1/lojas')
      .set(admin);
    expect(sem.status).toBe(400);
    expect(sem.body.error.code).toBe('GE_OBRIGATORIO');
    const inexistente = await reqGe('00000000-0000-7000-8000-0000000000ff')
      .get('/api/v1/lojas')
      .set(admin);
    expect(inexistente.status).toBe(403);
    expect(inexistente.body.error.code).toBe('GE_INDISPONIVEL');
    expect((await reqGe('lixo').get('/api/v1/lojas').set(admin)).status).toBe(403);
    await prisma.grupoEconomico.update({ where: { id: b }, data: { ativo: false } });
    expect((await reqGe(b).get('/api/v1/lojas').set(admin)).status).toBe(403);
    await prisma.grupoEconomico.update({ where: { id: b }, data: { ativo: true } });
    const legais = await (
      await import('supertest')
    )
      .default((await import('../../app.js')).app)
      .get('/api/v1/parametros-legais')
      .set(admin);
    expect(legais.status).toBe(200);
  });

  it('o GE inicial não vê nada dos outros GEs', async () => {
    const lojas = (await reqGe(GE_INICIAL_ID).get('/api/v1/lojas').set(admin)).body;
    expect(lojas.meta.total).toBe(0);
  });
});
