import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import ExcelJS from 'exceljs';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN' };

const xlsx = async (cab: string[], linhas: string[][]) => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Dados').addRows([cab, ...linhas]);
  return Buffer.from(await wb.xlsx.writeBuffer());
};

describe('escala (rotas)', () => {
  let lojaId: string;

  beforeEach(async () => {
    await prisma.batida.deleteMany();
    await prisma.importacaoPonto.deleteMany();
    await prisma.simulacao.deleteMany();
    await prisma.carga.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.loja.deleteMany();
    const r = await request(app)
      .post('/api/v1/lojas')
      .set(admin)
      .send({
        codigo: '001',
        nome: 'Centro',
        horarios: {
          semana: { abre: '08:00', fecha: '20:00' },
          sabado: { abre: '08:00', fecha: '14:00' },
        },
      });
    lojaId = r.body.id;
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const escalaCab = [
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

  it('sem escala, o diagnóstico fica pendente', async () => {
    const r = await request(app).get(`/api/v1/lojas/${lojaId}/diagnostico`);
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('pendente');
  });

  it('importa a escala (várias lojas), rejeita linhas ruins e calcula o diagnóstico', async () => {
    const arq = await xlsx(escalaCab, [
      ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '12:00', '13:00', '17:00', '44'],
      ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '12:00', '', '', '20:00', '44'],
      ['001', 'F3', 'Caio', 'Gerente', 'Seg a Sex', '08:00', '', '', '17:00', '44'],
      ['001', 'F4', 'Duda', 'Caixa', 'Seg a Sex', '18:00', '', '', '08:00', ''],
      ['999', 'X1', 'Zé', 'Caixa', 'Seg a Sex', '08:00', '', '', '17:00', ''],
    ]);
    const imp = await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach('arquivo', arq, 'escala.xlsx');
    expect(imp.status).toBe(201);
    const l001 = imp.body.lojas.find((l: { codigo: string }) => l.codigo === '001');
    expect(l001).toMatchObject({ aceitas: 3, rejeitadas: 1, situacao: 'Importada' });
    expect(imp.body.lojas.find((l: { codigo: string }) => l.codigo === '999').situacao).toContain(
      'não cadastrada',
    );

    const d = (await request(app).get(`/api/v1/lojas/${lojaId}/diagnostico`)).body;
    expect(d.status).not.toBe('pendente');
    expect(d.colaboradores).toHaveLength(3);
    expect(d.colaboradores.find((c: { nome: string }) => c.nome === 'Caio').funcao).toBeNull();
    expect(d.regras.map((r: { id: string }) => r.id)).toEqual(['atual', 'r42', 'r40']);
    expect(
      d.pontosAtencao.some((p: { texto: string }) => p.texto.includes('sem função de escala')),
    ).toBe(true);
  });

  it('reenviar a escala substitui a anterior e guarda o histórico', async () => {
    const arq = await xlsx(escalaCab, [
      ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
    ]);
    await request(app).post('/api/v1/cargas/escala').set(admin).attach('arquivo', arq, 'a.xlsx');
    await request(app).post('/api/v1/cargas/escala').set(admin).attach('arquivo', arq, 'b.xlsx');
    const h = (await request(app).get(`/api/v1/lojas/${lojaId}/cargas`)).body.data;
    expect(h).toHaveLength(2);
    expect(h.filter((c: { ativa: boolean }) => c.ativa)).toHaveLength(1);
    expect(h.find((c: { ativa: boolean }) => c.ativa).arquivo).toBe('b.xlsx');
  });

  it('importa a base comercial com colunas fora do padrão e mostra os horários de maior venda', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    const base = await xlsx(
      ['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Clientes_Atendidos'],
      [
        ['01/09/2026', '18', '001', '1.200,00', '40'],
        ['01/09/2026', '9', '001', '300,00', '12'],
        ['02/09/2026', '18', '001', '800,00', '30'],
      ],
    );
    const imp = await request(app)
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach('arquivo', base, 'base.xlsx');
    expect(imp.status).toBe(201);
    const d = (await request(app).get(`/api/v1/lojas/${lojaId}/diagnostico`)).body;
    expect(d.vendas.top[0]).toMatchObject({ hora: 18, vendaMedia: 1000 });
    expect(d.vendas.periodo.dias).toBe(2);
  });

  it('recusa planilha sem as colunas obrigatórias', async () => {
    const r = await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach('arquivo', await xlsx(['A', 'B'], [['1', '2']]), 'x.xlsx');
    expect(r.status).toBe(400);
    expect(r.body.error.message).toContain('colunas obrigatórias');
  });

  it('configuração muda o resultado e só quem escreve pode mudar', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    expect(
      (await request(app).put(`/api/v1/lojas/${lojaId}/configuracao`).send({ convencao8h24: true }))
        .status,
    ).toBe(403);
    const r = await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ convencao8h24: true, minimos: { Caixa: 2 } });
    expect(r.status).toBe(200);
    expect(r.body.config).toMatchObject({
      convencao8h24: true,
      minimos: expect.objectContaining({ Caixa: 2 }),
    });
    expect(r.body.regras[1].descricao).toContain('8h24');
  });

  it('baixa os modelos de escala e de base', async () => {
    expect((await request(app).get('/api/v1/planilha-modelo-escala')).status).toBe(200);
    expect((await request(app).get('/api/v1/planilha-modelo-base')).status).toBe(200);
  });

  it('a folha mensal atual só vai para o dono do grupo', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    // dono sem custos informados: avisa, sem valor
    expect((await request(app).get(url).set(admin)).body.folhaMensal).toEqual({ informado: false });

    await request(app)
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const dono = (await request(app).get(url).set(admin)).body;
    expect(dono.folhaMensal).toMatchObject({ informado: true, mensal: 11200, encargosPct: 40 });

    for (const h of [{ 'X-Perfil': 'SCHEDULE_MANAGER' }, { 'X-Perfil': 'SCHEDULE_VIEWER' }]) {
      const r = (await request(app).get(url).set(h)).body;
      expect(r.folhaMensal).toBeUndefined();
      expect(JSON.stringify(r)).not.toContain('11200');
    }
    expect(dono.numeros).toMatchObject({ colaboradoresNoCalculo: 1 });
  });

  it('cenário 1: contratação por cargo, custo só para o dono e quadro que já cobre tudo', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const config = `/api/v1/lojas/${lojaId}/configuracao`;
    await request(app)
      .put(config)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });

    // 66h abertas na semana, 1 farmacêutica de 40h: faltam 48h → 2 pessoas (80h), 40% de sobra
    const dono = (await request(app).get(url).set(admin)).body.cenarios;
    expect(Object.keys(dono)).toEqual(['r42', 'r40']);
    expect(dono.r40.manter.contratacoes).toEqual([
      {
        funcao: 'Farmacêutico',
        pessoas: 2,
        parcialH: null,
        horasContratadas: 80,
        ociosidadePct: 40,
      },
    ]);
    expect(dono.r40.manter.horasSemana).toBe(66);
    expect(dono.r40.manter.horarioSemana[6].aberto).toBe(false);
    // 2 vagas × 8000 × 40 × 5 ÷ 200 × 1,4 = 22400; folha atual 8000 × 1,4 = 11200
    expect(dono.r40.manter.custoAdicionalMensal).toBe(22400);
    expect(dono.r40.manter.acrescimoPct).toBe(200);
    expect(dono.r40.atual).toMatchObject({ horasSemana: 66, pessoas: 1, folhaMensal: 11200 });
    expect(dono.r40.vendasBase).toBeNull();

    for (const h of [{ 'X-Perfil': 'SCHEDULE_MANAGER' }, { 'X-Perfil': 'SCHEDULE_VIEWER' }]) {
      const r = (await request(app).get(url).set(h)).body;
      expect(r.cenarios.r40.manter.contratacoes[0].pessoas).toBe(2);
      expect('custoAdicionalMensal' in r.cenarios.r40.manter).toBe(false);
      expect('folhaMensal' in r.cenarios.r40.atual).toBe(false);
      expect(JSON.stringify(r)).not.toContain('22400');
    }

    // com três farmacêuticas (120h, 15 turnos) o quadro já cobre as 66h da loja
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
          ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '12:00', '', '', '20:00', '40'],
          ['001', 'F3', 'Cris', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '16:00', '40'],
        ]),
        'e2.xlsx',
      );
    const cobre = (await request(app).get(url).set(admin)).body.cenarios.r40.manter;
    expect(cobre.contratacoes).toEqual([]);
    expect(cobre.custoAdicionalMensal).toBe(0);
  });

  it('cenário 2: reduz o horário até a equipe cobrir, com e sem base comercial', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;

    // sem base: corta o fim do dia e não estima venda
    const sem = (await request(app).get(url).set(admin)).body.cenarios.r40.economia;
    expect(sem.viavel).toBe(true);
    expect(sem.horasReduzir).toBeGreaterThan(0);
    expect(sem.horasSemana + sem.horasReduzir).toBe(66);
    expect(sem.horasSemana).toBeLessThanOrEqual(40); // 1 farmacêutica de 40h
    expect(sem.vendaCortadaMes).toBeNull();
    expect(sem.cortes[0].venda).toBeNull();

    // com base: estima a venda cortada
    const base = await xlsx(
      ['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Clientes_Atendidos'],
      [
        ['01/09/2026', '18', '001', '1.200,00', '40'],
        ['01/09/2026', '19', '001', '600,00', '20'],
      ],
    );
    await request(app).post('/api/v1/cargas/base').set(admin).attach('arquivo', base, 'b.xlsx');
    const com = (await request(app).get(url).set(admin)).body.cenarios.r40.economia;
    expect(typeof com.vendaCortadaSemana).toBe('number');
    expect(com.vendaCortadaMes).toBeCloseTo((com.vendaCortadaSemana * 52) / 12, 1);
    expect(com.aviso).toContain('1 dias');
    // o cenário de economia não traz custo para ninguém
    expect(JSON.stringify(com)).not.toContain('custoAdicional');
  });

  it('cenário 3: avisa o que falta e, completo, só o dono vê o custo', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const eq = async (h: Record<string, string> = admin) =>
      (await request(app).get(url).set(h)).body.cenarios.r40.equilibrio;

    expect((await eq()).indisponivel.motivo).toBe('vendas');

    await request(app)
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(
          ['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Clientes_Atendidos'],
          [
            ['01/09/2026', '10', '001', '1.200,00', '40'],
            ['01/09/2026', '19', '001', '100,00', '5'],
          ],
        ),
        'b.xlsx',
      );
    expect((await eq()).indisponivel.motivo).toBe('custos');

    await request(app)
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const dono = await eq();
    expect(dono.indisponivel).toBeNull();
    expect(dono.horasSemana + dono.horasReduzir).toBe(66);
    expect(typeof dono.custoAdicionalMensal).toBe('number');
    expect(typeof dono.acrescimoPct).toBe('number');
    const cenDono = (await request(app).get(url).set(admin)).body.cenarios.r40;
    expect(['manter', 'economia', 'equilibrio']).toContain(cenDono.destaque);

    for (const h of [{ 'X-Perfil': 'SCHEDULE_MANAGER' }, { 'X-Perfil': 'SCHEDULE_VIEWER' }]) {
      const r = await eq(h);
      expect(r.indisponivel).toBeNull();
      expect(r.cortes).toEqual(dono.cortes);
      expect('custoAdicionalMensal' in r).toBe(false);
      expect('acrescimoPct' in r).toBe(false);
      const todos = (await request(app).get(url).set(h)).body.cenarios.r40;
      expect('destaque' in todos).toBe(false);
      expect('impactoMensal' in todos.manter).toBe(false);
    }
  });

  it('cenário 4: estende o horário com a sobra da equipe; custo só para o dono', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
          ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '12:00', '', '', '20:00', '40'],
          ['001', 'F3', 'Cris', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '16:00', '40'],
        ]),
        'e.xlsx',
      );
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const est = async (h: Record<string, string> = admin) =>
      (await request(app).get(url).set(h)).body.cenarios.r40.estender;

    // sem base comercial: horas possíveis pela capacidade, sem valor
    const sem = await est();
    expect(sem.disponivel).toBe(true);
    expect(sem.horasEstender).toBeGreaterThan(0);
    expect(sem.horasSemana).toBe(66 + sem.horasEstender);
    expect(sem.margemRefMes).toBeNull();
    expect(sem.custoAdicionalMensal).toBe(0); // equipe já cobre o horário
    expect(sem.impactoMensal).toBeNull();

    // com base comercial: margem de referência e impacto líquido para o dono
    await request(app)
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(
          ['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Margem_Bruta_RS', 'Clientes_Atendidos'],
          [
            ['01/09/2026', '8', '001', '400,00', '100,00', '10'],
            ['01/09/2026', '19', '001', '800,00', '200,00', '20'],
          ],
        ),
        'b.xlsx',
      );
    const com = await est();
    expect(com.disponivel).toBe(true);
    expect(typeof com.margemRefMes).toBe('number');
    expect(com.impactoMensal).toBe(-com.margemRefMes);
    expect(com.aviso).toContain('referência');

    for (const h of [{ 'X-Perfil': 'SCHEDULE_MANAGER' }, { 'X-Perfil': 'SCHEDULE_VIEWER' }]) {
      const r = await est(h);
      expect(r.extensoes).toEqual(com.extensoes);
      expect('custoAdicionalMensal' in r).toBe(false);
      expect('impactoMensal' in r).toBe(false);
    }
  });

  it('sem base comercial, o faturamento do cadastro vira a venda do diagnóstico; a base vence quando enviada', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
          ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '12:00', '', '', '20:00', '40'],
          ['001', 'F3', 'Cris', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '16:00', '40'],
        ]),
        'e.xlsx',
      );
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER' };
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER' };

    // nada informado: sem origem, e o texto manda cadastrar o faturamento
    const nada = (await request(app).get(url).set(admin)).body;
    expect(nada.origemVendas).toBeNull();
    expect(JSON.stringify(nada.pontosAtencao)).toContain('cadastre o faturamento da loja');

    // faturamento no cadastro (loja 08–20 seg a sex, 08–14 sáb), margem de 25%
    await request(app)
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [12000, 12000, 12000, 12000, 12000, 6000, null],
          mensal: null,
          margemPct: 25,
        },
      });
    const dono = (await request(app).get(url).set(admin)).body;
    expect(dono.origemVendas).toBe('cadastro');
    expect(dono.vendas).toBeNull();
    expect(dono.numeros.maiorVendaDescoberta).toBeNull();
    expect(JSON.stringify(dono.pontosAtencao)).toContain('Venda estimada pelo faturamento');
    const est = dono.cenarios.r40.estender;
    expect(est.disponivel).toBe(true);
    expect(typeof est.margemRefMes).toBe('number');
    expect(est.aviso).toContain('referência');
    expect(dono.cenarios.r40.economia.margemCortadaMes).not.toBeUndefined();
    expect(est.aviso).not.toContain('dias de venda');
    expect(dono.cenarios.r40.economia.aviso ?? '').not.toContain('dias de venda');

    // gestor e consulta: mesmos cenários, sem nenhum valor de venda ou margem
    for (const perfil of [gestor, consulta]) {
      const r = (await request(app).get(url).set(perfil)).body;
      expect(r.origemVendas).toBe('cadastro');
      expect(r.cenarios.r40.estender.extensoes.length).toBe(est.extensoes.length);
      const texto = JSON.stringify(r.cenarios);
      for (const chave of [
        'vendaRefMes',
        'margemRefMes',
        'vendaCortadaMes',
        'margemCortadaMes',
        '"venda"',
        '"margem"',
      ]) {
        expect(texto).not.toContain(chave);
      }
      expect(JSON.stringify(r)).not.toContain('faturamento":');
    }

    // a base comercial enviada passa a valer
    await request(app)
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(
          ['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Margem_Bruta_RS', 'Clientes_Atendidos'],
          [['01/09/2026', '8', '001', '400,00', '100,00', '10']],
        ),
        'b.xlsx',
      );
    const base = (await request(app).get(url).set(admin)).body;
    expect(base.origemVendas).toBe('base');
    expect(base.vendas).not.toBeNull();
  });

  it('o horário digitado no cadastro vira a escala atual quando nada foi importado, e a importada vence', async () => {
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const cadastrar = (matricula: string, nome: string, extra: object) =>
      request(app)
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({
          matricula,
          nome,
          lojaId,
          funcaoEscala: 'Farmacêutico',
          cargaMensalH: 220,
          ...extra,
        });
    await cadastrar('C1', 'Ana', { entrada: '08:00', saida: '17:00', dias: [0, 1, 2, 3, 4, 5] });
    // saída antes da entrada (vira o dia) fica só informativa: não entra na escala
    await cadastrar('C2', 'Bia', { entrada: '22:00', saida: '06:00', dias: [0, 1] });
    const sem = (await request(app).get(url).set(admin)).body;
    expect(sem.status).not.toBe('pendente');
    expect(sem.colaboradores.map((c: { nome: string }) => c.nome)).toEqual(['Ana']);
    expect(sem.fontes.escala.arquivo).toBe('Cadastro de funcionários');

    // escala importada para outra pessoa: a do cadastro completa o quadro
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F2', 'Cris', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '16:00', '40'],
          ['001', 'C1', 'Ana', 'Farmacêutica', 'Seg a Sex', '09:00', '', '', '18:00', '44'],
        ]),
        'e.xlsx',
      );
    const com = (await request(app).get(url).set(admin)).body;
    expect(com.fontes.escala.arquivo).toBe('e.xlsx');
    const ana = com.colaboradores.filter((c: { nome: string }) => c.nome === 'Ana');
    expect(ana).toHaveLength(1);
    expect(ana[0].turno).toContain('09');
    expect(JSON.stringify(com.pontosAtencao)).toContain('difere da escala importada');
  });

  it('cenário 5: mostra a sobra de gente por cargo; economia só para o dono', async () => {
    await request(app)
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
          ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '12:00', '', '', '20:00', '40'],
          ['001', 'F3', 'Cris', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '16:00', '40'],
          ['001', 'F4', 'Dani', 'Farmacêutica', 'Seg a Sex', '10:00', '', '', '18:00', '40'],
        ]),
        'e.xlsx',
      );
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await request(app)
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const red = async (h: Record<string, string> = admin) =>
      (await request(app).get(url).set(h)).body.cenarios.r40.reduzir;

    // 66h e 11 turnos na semana: três farmacêuticas de 40h (120h, 15 turnos) bastam, duas não (10 turnos)
    const dono = await red();
    expect(dono.temExcedente).toBe(true);
    expect(dono.cargos).toEqual([
      {
        funcao: 'Farmacêutico',
        pessoasHoje: 4,
        pessoasNecessarias: 3,
        excedente: 1,
        economiaMensal: 11200,
      },
    ]);
    expect(dono.pessoasExcedentes).toBe(1);
    expect(dono.economiaMensal).toBe(11200);
    expect(dono.economiaPct).toBe(25); // folha atual: 4 × 8000 × 1,4 = 44800
    expect(dono.aviso).toContain('validação trabalhista');

    for (const h of [{ 'X-Perfil': 'SCHEDULE_MANAGER' }, { 'X-Perfil': 'SCHEDULE_VIEWER' }]) {
      const r = await red(h);
      expect(r.cargos).toEqual([
        { funcao: 'Farmacêutico', pessoasHoje: 4, pessoasNecessarias: 3, excedente: 1 },
      ]);
      expect('economiaMensal' in r).toBe(false);
      expect('economiaPct' in r).toBe(false);
      expect('impactoMensal' in r).toBe(false);
    }
  });
  describe('turnos da loja e mínimo por turno', () => {
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER' };
    const turno = (nome: string, inicio: string, fim: string, minimos: Record<string, number>) => ({
      nome,
      inicio,
      fim,
      minimos: { Farmacêutico: 1, ...minimos },
    });
    const tres = [
      turno('Manhã', '08:00', '14:00', { Atendimento: 1 }),
      turno('Tarde', '14:00', '18:00', { Atendimento: 3 }),
      turno('Noite', '18:00', '20:00', { Atendimento: 1 }),
    ];
    const configurar = (corpo: object, perfil = admin) =>
      request(app).put(`/api/v1/lojas/${lojaId}/configuracao`).set(perfil).send(corpo);

    it('grava e devolve os turnos; null volta ao mínimo único', async () => {
      const r = await configurar({ turnos: tres });
      expect(r.status).toBe(200);
      expect(r.body.config.turnos).toHaveLength(3);
      expect(r.body.config.turnosAvisos).toEqual([]);
      expect(r.body.config.turnos[1]).toMatchObject({ nome: 'Tarde', minimos: { Atendimento: 3 } });
      const volta = await configurar({ turnos: null });
      expect(volta.body.config.turnos).toBeNull();
    });

    it('recusa sobreposição, buraco, fora do horário, mais de 6 turnos e farmacêutico 0', async () => {
      const msg = async (turnos: object[]) => {
        const r = await configurar({ turnos });
        expect(r.status).toBe(400);
        return JSON.stringify(r.body);
      };
      expect(
        await msg([turno('A', '08:00', '15:00', {}), turno('B', '14:00', '20:00', {})]),
      ).toContain('se sobrepõem');
      expect(
        await msg([turno('A', '08:00', '13:00', {}), turno('B', '14:00', '20:00', {})]),
      ).toContain('Falta um turno entre 13:00 e 14:00');
      expect(await msg([turno('A', '07:00', '20:00', {})])).toContain('antes da abertura');
      expect(await msg([turno('A', '08:00', '21:00', {})])).toContain('depois do fechamento');
      expect(
        await msg(Array.from({ length: 7 }, (_, i) => turno(`T${i}`, '08:00', '09:00', {}))),
      ).toBeTruthy();
      expect(await msg([turno('A', '08:00', '20:00', { Farmacêutico: 0 })])).toContain(
        'farmacêutico é 1',
      );
      const nada = await request(app).get(`/api/v1/lojas/${lojaId}/diagnostico`);
      expect(nada.body.config.turnos).toBeNull();
    });

    it('consulta não configura turnos', async () => {
      expect((await configurar({ turnos: tres }, consulta)).status).toBe(403);
    });

    it('farmacêutico ausente num turno vale 1 (lei)', async () => {
      const r = await configurar({
        turnos: [{ nome: 'Dia', inicio: '08:00', fim: '20:00', minimos: { Atendimento: 2 } }],
      });
      expect(r.body.config.turnos[0].minimos).toEqual({ Atendimento: 2, Farmacêutico: 1 });
    });

    it('o Diagnóstico exige o mínimo de cada turno: falta só à tarde; sem turnos volta ao de antes', async () => {
      await request(app)
        .post('/api/v1/cargas/escala')
        .set(admin)
        .attach(
          'arquivo',
          await xlsx(escalaCab, [
            ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '20:00', '44'],
            ['001', 'F2', 'Bia', 'Balconista', 'Seg a Sex', '08:00', '', '', '20:00', '44'],
          ]),
          'e.xlsx',
        );
      const url = `/api/v1/lojas/${lojaId}/diagnostico`;
      const antes = (await request(app).get(url).set(admin)).body;
      const comTurnos = (await configurar({ turnos: tres })).body;
      const atend = (b: typeof antes) =>
        b.regras
          .find((r: { id: string }) => r.id === 'r40')
          .funcoes.find((f: { funcao: string }) => f.funcao === 'Atendimento');
      expect(atend(comTurnos).minimo).toBe(3);
      expect(atend(comTurnos).necessidadeH).toBeGreaterThan(atend(antes).necessidadeH);
      const texto = JSON.stringify(comTurnos.pontosAtencao);
      expect(texto).toContain('Atendimento abaixo do mínimo (3)');
      const semTurnos = (await configurar({ turnos: null })).body;
      expect(atend(semTurnos)).toEqual(atend(antes));
      expect(JSON.stringify(semTurnos.pontosAtencao)).toBe(JSON.stringify(antes.pontosAtencao));
    });

    it('quadro por turno: presentes × exigido, falta só à tarde, fora da conta com motivo e explicação por turno', async () => {
      await request(app)
        .post('/api/v1/cargas/escala')
        .set(admin)
        .attach(
          'arquivo',
          await xlsx(escalaCab, [
            ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '20:00', '44'],
            ['001', 'F2', 'Bia', 'Balconista', 'Seg a Sáb', '08:00', '', '', '20:00', '44'],
          ]),
          'e.xlsx',
        );
      await request(app)
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'S1', nome: 'Sem Horário', lojaId, funcaoEscala: 'Caixa' });
      await request(app)
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'S2', nome: 'Sem Função', lojaId });
      const url = `/api/v1/lojas/${lojaId}/diagnostico`;

      // sem turnos: um turno "Dia todo"
      const antes = (await request(app).get(url).set(admin)).body;
      expect(antes.quadroTurnos.turnos).toEqual([
        { nome: 'Dia todo', inicio: '08:00', fim: '20:00' },
      ]);

      const d = (await configurar({ turnos: tres })).body;
      const q = d.quadroTurnos;
      expect(q.turnos.map((t: { nome: string }) => t.nome)).toEqual(['Manhã', 'Tarde', 'Noite']);
      const atend = q.cargos.find((c: { cargo: string }) => c.cargo === 'Atendimento').turnos;
      expect(atend).toEqual([
        { turno: 'Manhã', presentes: 1, exigido: 1, falta: false },
        { turno: 'Tarde', presentes: 1, exigido: 3, falta: true },
        { turno: 'Noite', presentes: 1, exigido: 1, falta: false },
      ]);
      const fora = Object.fromEntries(
        q.foraDaConta.map((f: { nome: string; motivo: string }) => [f.nome, f.motivo]),
      );
      expect(fora['Sem Horário']).toContain('sem horário');
      expect(fora['Sem Função']).toContain('sem função');

      // a explicação do cálculo cita o turno de origem
      const linha = d.regras
        .find((r: { id: string }) => r.id === 'r40')
        .funcoes.find((f: { funcao: string }) => f.funcao === 'Atendimento');
      expect(linha.memoria).toContain('Manhã 1 · Tarde 3 · Noite 1');
    });

    it('os cenários usam o mínimo do turno: com custos e base, calculam sem erro e o custo de cortar acompanha o turno', async () => {
      await request(app)
        .post('/api/v1/cargas/escala')
        .set(admin)
        .attach(
          'arquivo',
          await xlsx(escalaCab, [
            ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '20:00', '44'],
            ['001', 'F2', 'Bia', 'Balconista', 'Seg a Sáb', '08:00', '', '', '20:00', '44'],
          ]),
          'e.xlsx',
        );
      await request(app)
        .put(`/api/v1/lojas/${lojaId}/custos`)
        .set(admin)
        .send({
          salarioMedio: { Farmacêutico: 8000, Atendimento: 2000, Caixa: 1500 },
          encargosPct: 50,
        });
      await request(app)
        .post('/api/v1/cargas/base')
        .set(admin)
        .attach(
          'arquivo',
          await xlsx(
            [
              'Data',
              'Hora',
              'Cod_Loja',
              'Venda_Liquida_RS',
              'Margem_Bruta_RS',
              'Clientes_Atendidos',
            ],
            [
              ['01/09/2026', '8', '001', '100,00', '30,00', '5'],
              ['01/09/2026', '15', '001', '900,00', '300,00', '30'],
            ],
          ),
          'b.xlsx',
        );
      const url = `/api/v1/lojas/${lojaId}/diagnostico`;
      await configurar({ minimos: { Caixa: 0 } }); // mesma base de comparação nos dois casos
      const sem = (await request(app).get(url).set(admin)).body.cenarios.r40;
      const com = (await configurar({ turnos: tres })).body.cenarios.r40;
      for (const c of [sem, com]) {
        expect(c.equilibrio.indisponivel).toBeNull();
        expect(c.economia).toBeTruthy();
        expect(c.estender).toBeTruthy();
      }
      // a exigência de 3 atendentes à tarde aumenta a contratação para manter os horários
      expect(com.manter.custoAdicionalMensal).toBeGreaterThan(sem.manter.custoAdicionalMensal);
    });

    it('mudar o horário da loja avisa que os turnos deixaram de caber, sem apagar nada', async () => {
      await configurar({ turnos: tres });
      await request(app)
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: { semana: { abre: '08:00', fecha: '22:00' } } });
      const r = (await request(app).get(`/api/v1/lojas/${lojaId}/diagnostico`)).body;
      expect(r.config.turnos).toHaveLength(3);
      expect(r.config.turnosAvisos.join(' ')).toContain('Falta um turno entre 20:00 e 22:00');
    });
  });
});
