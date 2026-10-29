import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { cnpjValido, criarGe, limparGes, reqGe } from '../../shared/testing/ge.js';

const operador = { 'X-Perfil': 'PLATFORM_OPERATOR' };
const dono = { 'X-Perfil': 'TENANT_ADMIN' };
const CAB = [
  'Bandeira',
  'CNPJ',
  'Apelido de Loja',
  'Status',
  'Regime Tributário',
  'Id',
  'Cidade - Endereço Receita',
  'Estado - Endereço Receita',
  'Grupo Econômico',
  'Anjo Responsavel',
  'Nome do responsável pelo GE',
  'SEGUNDA',
  'TERÇA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SABADO',
  'DOMINGO',
];
type Linha = Partial<Record<(typeof CAB)[number], string>>;
const completa = (o: Linha): string[] => {
  const base: Linha = {
    Bandeira: 'Ultra Popular',
    Status: 'Ativado',
    'Regime Tributário': 'Simples',
    'Cidade - Endereço Receita': 'ORLEANS',
    'Estado - Endereço Receita': 'SC',
    'Grupo Econômico': '250',
    'Anjo Responsavel': 'Anjo',
    'Nome do responsável pelo GE': 'Beltrano Silva',
    SEGUNDA: '07 - 20',
    TERÇA: '07 - 20',
    QUARTA: '07 - 20',
    QUINTA: '07 - 20',
    SEXTA: '07 - 20',
    SABADO: '07 - 19',
    DOMINGO: '',
  };
  return CAB.map((c) => ({ ...base, ...o })[c] ?? '');
};
const xlsx = async (linhas: Linha[], cab = CAB) => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('lojas').addRows([cab, ...linhas.map(completa)]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};
const enviar = (buf: Buffer, perfil = operador) =>
  request(app).post('/api/v1/cargas-lojas').set(perfil).attach('arquivo', buf, 'relatorio.xlsx');
const confirmar = (id: string, corpo: object = {}, perfil = operador) =>
  request(app).post(`/api/v1/cargas-lojas/${id}/confirmar`).set(perfil).send(corpo);

const limpar = async () => {
  await prisma.auditoria.deleteMany();
  await prisma.simulacao.deleteMany();
  await prisma.carga.deleteMany();
  await prisma.funcionario.deleteMany();
  await prisma.loja.deleteMany();
  await prisma.importacaoCadastro.deleteMany();
  await limparGes();
};

describe('carga de lojas por Excel (operador)', () => {
  let c1: string;
  let c2: string;
  let c3: string;
  beforeEach(async () => {
    await limpar();
    [c1, c2, c3] = [cnpjValido(), cnpjValido(), cnpjValido()];
  });
  afterAll(async () => {
    await limpar();
    await prisma.$disconnect();
  });

  const tres = (): Linha[] => [
    { CNPJ: c1, Id: '1', 'Grupo Econômico': '250' },
    { CNPJ: c2, Id: '2', 'Grupo Econômico': '250' },
    {
      CNPJ: c3,
      Id: '1',
      'Grupo Econômico': '300',
      'Nome do responsável pelo GE': 'Cicrano Souza',
      'Regime Tributário': 'Real',
    },
  ];

  it('só o operador baixa o modelo e envia o arquivo', async () => {
    expect((await request(app).get('/api/v1/cargas-lojas/modelo').set(operador)).status).toBe(200);
    expect((await request(app).get('/api/v1/cargas-lojas/modelo').set(dono)).status).toBe(403);
    expect((await enviar(await xlsx(tres()), dono)).status).toBe(403);
  });

  it('confere sem gravar; confirmar cria os GEs e as lojas pré-preenchidas; só Ativado entra', async () => {
    const buf = await xlsx([
      ...tres(),
      { CNPJ: cnpjValido(), Id: '9', Status: 'Desativado' },
      { CNPJ: '', Id: '8', Status: 'Montando' },
    ]);
    const c = await enviar(buf);
    expect(c.status).toBe(201);
    expect(c.body.totais).toMatchObject({ gesNovos: 2, criar: 3, atualizar: 0, rejeitadas: 0 });
    expect(c.body.ignoradasPorStatus).toEqual({ Desativado: 1, Montando: 1 });
    expect(c.body.porGe.map((g: { identificacao: string }) => g.identificacao).sort()).toEqual([
      '250',
      '300',
    ]);
    // Conferir não grava nada.
    expect(await prisma.loja.count()).toBe(0);
    expect(await prisma.grupoEconomico.count({ where: { id: { not: GE_INICIAL_ID } } })).toBe(0);

    const ok = await confirmar(c.body.id);
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ gesCriados: 2, lojasCriadas: 3, lojasAtualizadas: 0 });
    const ges = await prisma.grupoEconomico.findMany({
      where: { id: { not: GE_INICIAL_ID } },
      orderBy: { identificacao: 'asc' },
    });
    expect(ges.map((g) => [g.identificacao, g.nome, g.responsavel])).toEqual([
      ['250', 'Beltrano Silva', 'Beltrano Silva'],
      ['300', 'Cicrano Souza', 'Cicrano Souza'],
    ]);
    const lojas = await prisma.loja.findMany({ orderBy: { cnpj: 'asc' } });
    expect(lojas).toHaveLength(3);
    const l = lojas.find((x) => x.cnpj === c3)!;
    expect(l).toMatchObject({
      codigo: '1',
      cidade: 'ORLEANS',
      uf: 'SC',
      marca: 'Ultra Popular',
      regimeTributario: 'real',
      nome: 'Ultra Popular ORLEANS/SC',
    });
    expect(l.geId).toBe(ges.find((g) => g.identificacao === '300')!.id);
    expect(l.ultimaCarga).toMatchObject({ cidade: 'ORLEANS' });
    // Mesmo código "1" nos dois GEs convive.
    expect(lojas.filter((x) => x.codigo === '1')).toHaveLength(2);
    // O empresário já enxerga as lojas no seu GE e só nele.
    const doGe = (await reqGe(ges[0]!.id).get('/api/v1/lojas').set(dono)).body;
    expect(doGe.meta.total).toBe(2);
    // Confirmar de novo a mesma carga é recusado.
    expect((await confirmar(c.body.id)).status).toBe(409);
  });

  it('reenviar o mesmo arquivo não cria nem altera nada', async () => {
    const buf = await xlsx(tres());
    await confirmar((await enviar(buf)).body.id);
    const antes = await prisma.loja.findMany({ orderBy: { cnpj: 'asc' } });
    const c = await enviar(buf);
    expect(c.body.totais).toMatchObject({
      gesNovos: 0,
      criar: 0,
      atualizar: 0,
      semMudanca: 3,
      conflitos: 0,
    });
    const ok = await confirmar(c.body.id);
    expect(ok.body).toMatchObject({ gesCriados: 0, lojasCriadas: 0, lojasAtualizadas: 0 });
    const depois = await prisma.loja.findMany({ orderBy: { cnpj: 'asc' } });
    expect(depois.map((x) => x.updatedAt.getTime())).toEqual(
      antes.map((x) => x.updatedAt.getTime()),
    );
  });

  it('mudança na plataforma atualiza a loja pelo CNPJ, sem duplicar', async () => {
    await confirmar((await enviar(await xlsx(tres()))).body.id);
    const mudou = tres();
    mudou[0] = { ...mudou[0]!, 'Cidade - Endereço Receita': 'URUSSANGA', SEGUNDA: '08 - 21' };
    const c = await enviar(await xlsx(mudou));
    expect(c.body.totais).toMatchObject({ criar: 0, atualizar: 1, conflitos: 0 });
    await confirmar(c.body.id);
    expect(await prisma.loja.count()).toBe(3);
    const l = await prisma.loja.findFirstOrThrow({ where: { cnpj: c1 } });
    expect(l.cidade).toBe('URUSSANGA');
    expect((l.horarios as { dias: { abre: string }[] }).dias[0]!.abre).toBe('08:00');
  });

  it('o empresário corrigiu e a plataforma também mudou: conflito, mantém por padrão e substitui quando pedido', async () => {
    await confirmar((await enviar(await xlsx(tres()))).body.id);
    const loja = await prisma.loja.findFirstOrThrow({ where: { cnpj: c1 } });
    // O empresário (dono do GE 250) corrige a cidade.
    expect(
      (
        await reqGe(loja.geId)
          .patch(`/api/v1/lojas/${loja.id}`)
          .set(dono)
          .send({ cidade: 'LAGUNA' })
      ).status,
    ).toBe(200);
    const mudou = tres();
    mudou[0] = { ...mudou[0]!, 'Cidade - Endereço Receita': 'URUSSANGA' };
    const buf = await xlsx(mudou);

    const c = await enviar(buf);
    expect(c.body.totais.conflitos).toBe(1);
    expect(c.body.conflitos[0]).toMatchObject({
      ge: '250',
      cnpj: c1,
      campo: 'cidade',
      atual: 'LAGUNA',
      planilha: 'URUSSANGA',
    });
    // Padrão: mantém a correção.
    const ok = await confirmar(c.body.id);
    expect(ok.body).toMatchObject({ conflitosMantidos: 1, conflitosSubstituidos: 0 });
    expect((await prisma.loja.findFirstOrThrow({ where: { cnpj: c1 } })).cidade).toBe('LAGUNA');
    // Reenviar o mesmo arquivo: a plataforma não mudou de novo, então não volta a ser conflito.
    expect((await enviar(buf)).body.totais.conflitos).toBe(0);

    // Outro ciclo em que o operador escolhe substituir.
    mudou[0] = { ...mudou[0]!, 'Cidade - Endereço Receita': 'TUBARÃO' };
    const c2x = await enviar(await xlsx(mudou));
    expect(c2x.body.totais.conflitos).toBe(1);
    const sub = await confirmar(c2x.body.id, { substituirConflitos: [c1] });
    expect(sub.body.conflitosSubstituidos).toBe(1);
    expect((await prisma.loja.findFirstOrThrow({ where: { cnpj: c1 } })).cidade).toBe('TUBARÃO');
  });

  it('loja que já existe com outro código passa a usar o Id do relatório; o empresário não muda o código', async () => {
    await confirmar((await enviar(await xlsx(tres()))).body.id);
    const loja = await prisma.loja.findFirstOrThrow({ where: { cnpj: c1 } });
    await prisma.loja.update({ where: { id: loja.id }, data: { codigo: 'antigo' } });
    // O empresário não troca o código (ele vem da plataforma).
    const r = await reqGe(loja.geId)
      .patch(`/api/v1/lojas/${loja.id}`)
      .set(dono)
      .send({ codigo: 'meu' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('CODIGO_NAO_EDITAVEL');
    // A carga devolve o código para o Id do arquivo.
    const c = await enviar(await xlsx(tres()));
    expect(c.body.totais.codigosAjustados).toBe(1);
    await confirmar(c.body.id);
    expect((await prisma.loja.findUniqueOrThrow({ where: { id: loja.id } })).codigo).toBe('1');
  });

  it('rejeita CNPJ inválido, repetido e de outro GE, com linha e motivo; o resto entra', async () => {
    const outro = await criarGe('999', 'Dono do CNPJ');
    const emUso = cnpjValido();
    await prisma.loja.create({
      data: { geId: outro.id, codigo: 'x', nome: 'Já existe', cnpj: emUso },
    });
    const buf = await xlsx([
      { CNPJ: c1, Id: '1' },
      { CNPJ: '12345678000100', Id: '2' },
      { CNPJ: c1, Id: '3' },
      { CNPJ: emUso, Id: '4' },
    ]);
    const c = await enviar(buf);
    expect(c.body.totais).toMatchObject({ criar: 1, rejeitadas: 3 });
    const motivos = c.body.rejeitadas.map((r: { linha: number; motivo: string }) => [
      r.linha,
      r.motivo,
    ]);
    expect(motivos[0]).toEqual([3, 'CNPJ inválido']);
    expect(motivos[1][1]).toContain('repetido no arquivo');
    expect(motivos[2][1]).toContain('Dono do CNPJ');
    const ok = await confirmar(c.body.id);
    expect(ok.body.lojasCriadas).toBe(1);
    expect(await prisma.loja.count({ where: { cnpj: c1 } })).toBe(1);
  });

  it('GE desativado: as linhas dele são rejeitadas', async () => {
    const ge = await criarGe('250', 'Parado');
    await prisma.grupoEconomico.update({ where: { id: ge.id }, data: { ativo: false } });
    const c = await enviar(await xlsx([{ CNPJ: c1, Id: '1' }]));
    expect(c.body.totais).toMatchObject({ criar: 0, rejeitadas: 1 });
    expect(c.body.rejeitadas[0].motivo).toContain('desativado');
  });

  it('avisa lojas fora do arquivo e as que saíram do ativo, sem apagar nada', async () => {
    await confirmar((await enviar(await xlsx(tres()))).body.id);
    const c = await enviar(
      await xlsx([
        { CNPJ: c1, Id: '1', 'Grupo Econômico': '250' },
        { CNPJ: c2, Id: '2', 'Grupo Econômico': '250', Status: 'Desativado' },
      ]),
    );
    // O GE 300 não está no arquivo: não entra na conferência.
    expect(c.body.porGe.map((g: { identificacao: string }) => g.identificacao)).toEqual(['250']);
    expect(c.body.totais.saiuDoAtivo).toBe(1);
    expect(c.body.saiuDoAtivo[0]).toMatchObject({ ge: '250', cnpj: c2, status: 'Desativado' });
    const c4 = await enviar(await xlsx([{ CNPJ: c1, Id: '1', 'Grupo Econômico': '250' }]));
    expect(c4.body.totais.foraDoArquivo).toBe(1);
    await confirmar(c4.body.id);
    expect(await prisma.loja.count({ where: { deletedAt: null } })).toBe(3);
  });

  it('recusa arquivo fora do formato e diz as colunas que faltam', async () => {
    const r = await enviar(await xlsx([], ['Nome', 'Código']));
    expect(r.status).toBe(400);
    expect(r.body.error.message).toContain('CNPJ');
    expect(r.body.error.message).toContain('Grupo Econômico');
  });

  it('a carga fica na auditoria e a loja nova já tem horário e regime', async () => {
    const c = await enviar(await xlsx([{ CNPJ: c1, Id: '1' }]));
    await confirmar(c.body.id);
    const a = await prisma.auditoria.findFirstOrThrow({ where: { acao: 'cargaLojas.confirmada' } });
    expect(a.perfil).toBe('PLATFORM_OPERATOR');
    expect(a.detalhe).toMatchObject({ lojasCriadas: 1, gesCriados: 1 });
    const l = await prisma.loja.findFirstOrThrow();
    expect(l.regimeTributario).toBe('simples');
    expect(l.horarios).toMatchObject({ versao: 2 });
  });
});

describe('grupos econômicos (operador)', () => {
  beforeEach(limpar);
  afterAll(async () => {
    await limpar();
    await prisma.$disconnect();
  });

  it('cria, recusa identificação repetida, renomeia e desativa; só o operador escreve', async () => {
    const ge = await request(app)
      .post('/api/v1/ge')
      .set(operador)
      .send({ nome: 'Empresário A', identificacao: '501', responsavel: 'Ana' });
    expect(ge.status).toBe(201);
    expect(
      (
        await request(app)
          .post('/api/v1/ge')
          .set(operador)
          .send({ nome: 'Outro', identificacao: '501' })
      ).status,
    ).toBe(409);
    expect(
      (await request(app).post('/api/v1/ge').set(dono).send({ nome: 'X Y', identificacao: '502' }))
        .status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/api/v1/ge/${ge.body.id}`)
          .set(operador)
          .send({ nome: 'Empresário A Novo' })
      ).body.nome,
    ).toBe('Empresário A Novo');
    // GE desativado some da lista de escolha e não entra mais.
    expect(
      (await request(app).get('/api/v1/ge')).body.data.map((g: { id: string }) => g.id),
    ).toContain(ge.body.id);
    expect(
      (await request(app).patch(`/api/v1/ge/${ge.body.id}`).set(operador).send({ ativo: false }))
        .body.ativo,
    ).toBe(false);
    expect(
      (await request(app).get('/api/v1/ge')).body.data.map((g: { id: string }) => g.id),
    ).not.toContain(ge.body.id);
    expect((await reqGe(ge.body.id).get('/api/v1/lojas').set(dono)).status).toBe(403);
    expect(
      (await request(app).patch(`/api/v1/ge/${ge.body.id}`).set(operador).send({ ativo: true }))
        .body.ativo,
    ).toBe(true);
    expect((await reqGe(ge.body.id).get('/api/v1/lojas').set(dono)).status).toBe(200);
  });

  it('o resumo mostra lojas e lojas com equipe por GE, só para o operador', async () => {
    const ge = await criarGe('601', 'Resumo');
    const a = await prisma.loja.create({
      data: { geId: ge.id, codigo: '1', nome: 'Loja A', cnpj: cnpjValido() },
    });
    await prisma.loja.create({
      data: { geId: ge.id, codigo: '2', nome: 'Loja B', cnpj: cnpjValido() },
    });
    await prisma.funcionario.createMany({
      data: [
        { geId: ge.id, lojaId: a.id, matricula: 'M1', nome: 'Ana Souza' },
        { geId: ge.id, lojaId: a.id, matricula: 'M2', nome: 'Bia Lima' },
      ],
    });
    expect((await request(app).get('/api/v1/ge/resumo').set(dono)).status).toBe(403);
    const r = (await request(app).get('/api/v1/ge/resumo').set(operador)).body.data;
    expect(r.find((g: { identificacao: string }) => g.identificacao === '601')).toMatchObject({
      lojas: 2,
      lojasComEquipe: 1,
      ativo: true,
    });
  });
});

describe('volume: relatório do tamanho do real', () => {
  beforeEach(limpar);
  afterAll(async () => {
    await limpar();
    await prisma.$disconnect();
  });

  it('2.800 linhas (1.800 ativas em 490 GEs) conferem em até 60 s e gravam em até 2 min', async () => {
    const linhas: Linha[] = [];
    for (let i = 0; i < 1800; i++)
      linhas.push({
        CNPJ: cnpjValido(),
        Id: String(i),
        'Grupo Econômico': String(1000 + (i % 490)),
        'Nome do responsável pelo GE': `Resp ${i % 490}`,
      });
    for (let i = 0; i < 1000; i++)
      linhas.push({
        CNPJ: cnpjValido(),
        Id: `d${i}`,
        Status: i % 9 === 0 ? 'Montando' : 'Desativado',
        'Grupo Econômico': String(1000 + (i % 490)),
      });
    const buf = await xlsx(linhas);

    const t0 = Date.now();
    const c = await enviar(buf);
    const tConferir = Date.now() - t0;
    expect(c.status).toBe(201);
    expect(c.body.totais).toMatchObject({ gesNovos: 490, criar: 1800, rejeitadas: 0 });
    expect(c.body.totalLinhas).toBe(2800);
    expect(tConferir).toBeLessThan(60_000);

    const t1 = Date.now();
    const ok = await confirmar(c.body.id);
    const tGravar = Date.now() - t1;
    expect(ok.body).toMatchObject({ gesCriados: 490, lojasCriadas: 1800 });
    expect(tGravar).toBeLessThan(120_000);
    expect(await prisma.loja.count()).toBe(1800);

    // Reenviar o mesmo arquivo continua sem criar nem alterar nada.
    const de = await enviar(buf);
    expect(de.body.totais).toMatchObject({ criar: 0, atualizar: 0, semMudanca: 1800 });
  }, 240_000);
});
