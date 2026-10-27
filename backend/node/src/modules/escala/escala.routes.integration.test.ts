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

    for (const h of [{ 'X-Perfil': 'SCHEDULE_MANAGER' }, { 'X-Perfil': 'SCHEDULE_VIEWER' }]) {
      const r = await eq(h);
      expect(r.indisponivel).toBeNull();
      expect(r.cortes).toEqual(dono.cortes);
      expect('custoAdicionalMensal' in r).toBe(false);
      expect('acrescimoPct' in r).toBe(false);
    }
  });
});
