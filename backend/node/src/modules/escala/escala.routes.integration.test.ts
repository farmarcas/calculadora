import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { GE_INICIAL_ID } from '../../shared/ge.js';
import { postLoja, reqGe } from '../../shared/testing/ge.js';
import { prisma } from '../../shared/database/prisma.js';

const admin = { 'X-Perfil': 'TENANT_ADMIN', 'X-GE': GE_INICIAL_ID };
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
    const r = await postLoja({
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
    const r = await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`);
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('pendente');
  });

  it('a equipe vem dos funcionários do Cadastro (função, horário, intervalo) e o diagnóstico é calculado', async () => {
    const arq = await xlsx(escalaCab, [
      ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '12:00', '13:00', '17:00', '44'],
      ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '12:00', '', '', '20:00', '44'],
      ['001', 'F3', 'Caio', 'Gerente', 'Seg a Sex', '08:00', '', '', '17:00', '44'],
      ['001', 'F4', 'Duda', 'Caixa', 'Seg a Sex', '18:00', '', '', '08:00', ''],
      ['999', 'X1', 'Zé', 'Caixa', 'Seg a Sex', '08:00', '', '', '17:00', ''],
    ]);
    await reqGe().post('/api/v1/cargas/escala').set(admin).attach('arquivo', arq, 'escala.xlsx');
    const d = (await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`)).body;
    expect(d.status).not.toBe('pendente');
    expect(d.colaboradores).toHaveLength(3);
    expect(d.colaboradores.find((c: { nome: string }) => c.nome === 'Caio').funcao).toBeNull();
    expect(d.regras.map((r: { id: string }) => r.id)).toEqual(['atual', 'r42', 'r40']);
    expect(
      d.pontosAtencao.some((p: { texto: string }) => p.texto.includes('sem função de escala')),
    ).toBe(true);
  });

  it('importa a base comercial com colunas fora do padrão e mostra os horários de maior venda', async () => {
    await reqGe()
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
    const imp = await reqGe()
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach('arquivo', base, 'base.xlsx');
    expect(imp.status).toBe(201);
    // o valor médio em reais é do dono
    const d = (await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`).set(admin)).body;
    expect(d.vendas.top[0]).toMatchObject({ hora: 18, vendaMedia: 1000 });
    expect(d.vendas.periodo.dias).toBe(2);
  });

  it('configuração muda o resultado e só quem escreve pode mudar', async () => {
    await reqGe()
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
      (await reqGe().put(`/api/v1/lojas/${lojaId}/configuracao`).send({ convencao8h24: true }))
        .status,
    ).toBe(403);
    const r = await reqGe()
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

  it('só o modelo da base comercial existe; o da escala foi aposentado (a equipe vai na planilha de funcionários)', async () => {
    expect((await reqGe().get('/api/v1/planilha-modelo-escala')).status).toBe(404);
    expect((await reqGe().get('/api/v1/planilha-modelo-base')).status).toBe(200);
  });

  it('a folha mensal atual só vai para o dono do grupo', async () => {
    await reqGe()
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
    expect((await reqGe().get(url).set(admin)).body.folhaMensal).toEqual({ informado: false });

    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const dono = (await reqGe().get(url).set(admin)).body;
    expect(dono.folhaMensal).toMatchObject({ informado: true, mensal: 12976, encargosPct: 62.2 });
    // sem regime cadastrado: Presumido (62,2%) e o alerta; 8000 × 1,622 = 12976
    expect(dono.folhaMensal.regimeAusente).toBe(true);
    expect(dono.folhaMensal.alertaRegime).toContain('Calculamos com Lucro Presumido');

    // O regime da loja manda no encargo: escolher o regime na hora (como o seletor da tela) muda a folha sem mais nada.
    const regime = async (r: string) => {
      await reqGe().patch(`/api/v1/lojas/${lojaId}`).set(admin).send({ regimeTributario: r });
      return (await reqGe().get(url).set(admin)).body.folhaMensal;
    };
    // Simples: 8000 × 1,29 = 10320 · Presumido e Real: 8000 × 1,622 = 12976
    expect(await regime('simples')).toMatchObject({
      mensal: 10320,
      encargosPct: 29,
      regimeAusente: false,
    });
    expect(await regime('presumido')).toMatchObject({
      mensal: 12976,
      encargosPct: 62.2,
      regimeAusente: false,
    });
    const real = await regime('real');
    expect(real).toMatchObject({ mensal: 12976, regimeTributario: 'real' });
    expect(real.alertaRegime).toBeUndefined();
    // a composição vem junto, para o "Ver composição" da tela
    expect(real.encargos.componentes.map((c: { chave: string }) => c.chave)).toContain(
      'sobre_provisoes',
    );
    // ajuste de RAT/FAP por loja não vale mais: o encargo continua o do regime (62,2%)
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargos: { ratPct: 3, fap: 1.5 } });
    expect((await reqGe().get(url).set(admin)).body.folhaMensal).toMatchObject({
      mensal: 12976,
      encargosPct: 62.2,
    });

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = (await reqGe().get(url).set(h)).body;
      expect(r.folhaMensal).toBeUndefined();
      expect(JSON.stringify(r)).not.toContain('12976');
    }
    expect(dono.numeros).toMatchObject({ colaboradoresNoCalculo: 1 });
  });

  it('cenário 1: contratação por cargo, custo só para o dono e quadro que já cobre tudo', async () => {
    await reqGe()
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
    await reqGe()
      .put(config)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });

    // 66h abertas por semana; 1 farmacêutica de 40h: faltam 26h → 1 parcial de 26h (até 30h): 1 pessoa, sem sobra
    const dono = (await reqGe().get(url).set(admin)).body.cenarios;
    expect(Object.keys(dono)).toEqual(['r42', 'r40']);
    expect(dono.r40.manter.contratacoes).toEqual([
      {
        funcao: 'Farmacêutico',
        pessoas: 1,
        inteiras: 0,
        parcial: { turnos: 4, horas: 26 },
        parcialH: 26,
        horasContratadas: 26,
        horasUsadas: 26,
        horasOciosas: 0,
        motivo: 'obrigatoria',
        ociosidadePct: 0,
        ajustado: false,
      },
    ]);
    expect(dono.r40.manter.horasSemana).toBe(66);
    expect(dono.r40.manter.horarioSemana[6].aberto).toBe(false);
    // parcial de 26h: 8000 × 26 × 5 ÷ 200 × 1,622 = 8434,4; folha atual 8000 × 1,622 = 12976 → acréscimo de 65%
    expect(dono.r40.manter.custoAdicionalMensal).toBe(8434.4);
    expect(dono.r40.manter.acrescimoPct).toBe(65);
    expect(dono.r40.atual).toMatchObject({ horasSemana: 66, pessoas: 1, folhaMensal: 12976 });
    expect(dono.r40.vendasBase).toBeNull();

    // Dias e horários do parcial: a farmacêutica é redistribuída em 5 dias de 8 h (segunda a sexta, 08h–16h); descoberto de
    // segunda a sexta das 16h às 20h (4 h por dia) e o sábado inteiro (08h–14h, 6 h) = 26 h. O parcial cabe em até 5 dias:
    // sábado (6 h) e quatro dias de 4 h = 22 h; 4 h não têm lugar.
    const regras = (await reqGe().get(url).set(admin)).body.regras;
    const r40 = regras.find((r: { id: string }) => r.id === 'r40');
    expect(r40.funcoes[0].sugestao.distribuicao).toEqual({
      blocos: [
        ...[0, 1, 2, 3].map((dia) => ({ dia, de: '16:00', ate: '20:00', horas: 4 })),
        { dia: 5, de: '08:00', ate: '14:00', horas: 6 },
      ],
      estimativa: false,
      semLugarH: 4,
    });
    expect(r40.redistribuicao.remanejados).toBe(1);
    // Loja sem atendente nem caixa: o Cenário 2 não fica inviável por falta desses cargos (só o farmacêutico conta)
    const c2 = dono.r40.economia;
    expect(c2.motivoInviavel ?? '').not.toContain('Não há');
    expect(dono.r40.comparativo.cenarios.map((c: { id: string }) => c.id)).toEqual([
      'manter',
      'economia',
      'equilibrio',
    ]);
    expect(r40.redistribuicao.descoberto[0].horas).toBe(26);

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = (await reqGe().get(url).set(h)).body;
      expect(r.cenarios.r40.manter.contratacoes[0].pessoas).toBe(1);
      expect('custoAdicionalMensal' in r.cenarios.r40.manter).toBe(false);
      expect('folhaMensal' in r.cenarios.r40.atual).toBe(false);
      expect(JSON.stringify(r)).not.toContain('8434');
    }

    // com três farmacêuticas (120h, 15 turnos) o quadro já cobre as 66h da loja
    await reqGe()
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
    const cobre = (await reqGe().get(url).set(admin)).body.cenarios.r40.manter;
    expect(cobre.contratacoes).toEqual([]);
    expect(cobre.custoAdicionalMensal).toBe(0);
  });

  it('cenário 2: só mexe no fim de semana, dentro das travas; não resolve sozinho; valores só ao dono', async () => {
    await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const eco = async (perfil = admin) =>
      (await reqGe().get(url).set(perfil)).body.cenarios.r40.economia;

    // sem venda por dia (nem base nem faturamento): não dá para saber quanto cada corte custa
    const sem = await eco();
    expect(sem.viavel).toBe(false);
    expect(sem.motivoInviavel).toContain('faturamento por dia da semana');
    expect(sem.passos).toEqual([]);

    // loja de segunda a sexta (12h) e sábado (6h): 66h e 11 turnos; 1 farmacêutica de 40h tem 40h e 5 turnos.
    // Faturamento por dia: sábado vende 800 × 52 ÷ 12 = 3466,67 por mês (577,78 por hora); a venda
    // dos seis dias é 6500 × 52 ÷ 12 = 28166,67.
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
        },
      });
    const dono = await eco();
    // Só o sábado pode mudar (não há domingo): reduz até o piso de 4 h (corta 2 h: 8h–14h → 8h–12h). Não cobre
    // (11 turnos exigidos, 5 de capacidade) e fechar o sábado perderia 3466,67 (12,3% > 10%): para na trava de perda.
    // Só o faturamento por dia do Cadastro (sem base comercial): o corte é montado, mas a venda perdida não é estimada.
    expect(dono.viavel).toBe(false);
    expect(dono.naoResolveSozinho).toBe(true);
    expect(dono.travou).toBe('perda');
    expect(dono.diasFechar).toEqual([]);
    expect(dono.horarioSemana[5]).toEqual({ dia: 5, aberto: true, abre: '08:00', fecha: '12:00' });
    for (const d of [0, 1, 2, 3, 4])
      expect(dono.horarioSemana[d]).toMatchObject({ aberto: true, abre: '08:00', fecha: '20:00' });
    expect(dono.horasSemana).toBe(64);
    expect(dono.horasReduzir).toBe(2);
    expect(dono.semVendaHoraria).toBe(true);
    expect(dono.vendaCortadaMes).toBeNull();
    expect(dono.vendaCortadaPorDia).toEqual([]);
    expect(dono.aviso).toContain('Sem venda hora a hora');
    expect(dono.perdaFaturamentoPct).toBe(4.1);
    expect(dono.faltaH).toBeGreaterThan(0);
    expect(dono.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 5,
        horas: 2,
        de: { abre: '08:00', fecha: '14:00' },
        para: { abre: '08:00', fecha: '12:00' },
      },
    ]);
    expect(dono.impactoMensal).toBeNull(); // não resolve sozinho: fora da escolha do selo

    // sem base comercial a venda do Cadastro não dá o corte por hora: nada muda ao salvar de novo
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
        },
      });
    const semMargem = await eco();
    expect(semMargem.vendaCortadaMes).toBeNull();
    expect(semMargem.semVendaHoraria).toBe(true);
    expect('margemCortadaMes' in semMargem).toBe(false);
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
        },
      });

    // gestor e consulta: os passos, o horário e o status, sem valores em reais
    for (const perfil of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = await eco(perfil);
      expect(r.naoResolveSozinho).toBe(true);
      expect(r.diasFechar).toEqual([]);
      expect(r.passos).toHaveLength(1);
      expect(r.horariosAjustados).toEqual([
        {
          dia: 5,
          antes: { abre: '08:00', fecha: '14:00' },
          depois: { abre: '08:00', fecha: '12:00' },
        },
      ]);
      expect('vendaCortadaMes' in r).toBe(false);
      for (const d of r.vendaCortadaPorDia) expect('vendaMes' in d).toBe(false);
      expect('perdaFaturamentoPct' in r).toBe(false);
      const texto = JSON.stringify(r);
      for (const valor of ['1155', '288', '4.1', 'R$']) expect(texto).not.toContain(valor);
    }
  });

  it('cenário 3: avisa o que falta e, completo, escolhe a melhor combinação de dias; só o dono vê os valores', async () => {
    await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const cen = async (h: Record<string, string> = admin) =>
      (await reqGe().get(url).set(h)).body.cenarios.r40;

    // sem venda por dia: falta o faturamento
    expect((await cen()).equilibrio.indisponivel.motivo).toBe('vendas');

    // só o faturamento por dia do Cadastro: sem venda hora a hora não dá para comparar contratar com mexer no horário
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
        },
      });
    const semHoraria = (await cen()).equilibrio;
    expect(semHoraria.indisponivel.motivo).toBe('vendas');
    expect(semHoraria.indisponivel.texto).toContain('hora a hora');
    expect(semHoraria.semVendaHoraria).toBe(true);

    // com a base comercial (venda de cada hora, segunda a sexta 8h–20h e sábado 8h–14h): faltam os salários
    const dias = [
      ['07/09/2026', 12, 1000],
      ['08/09/2026', 12, 1100],
      ['09/09/2026', 12, 900],
      ['10/09/2026', 12, 1200],
      ['11/09/2026', 12, 1500],
      ['12/09/2026', 6, 800],
    ] as const;
    const linhas = dias.flatMap(([data, horas, total]) =>
      Array.from({ length: horas }, (_, i) => [
        data,
        String(8 + i),
        '001',
        (total / horas).toFixed(2).replace('.', ','),
        '10',
      ]),
    );
    await reqGe()
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Clientes_Atendidos'], linhas),
        'base.xlsx',
      );
    expect((await cen()).equilibrio.indisponivel.motivo).toBe('custos');

    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const dono = await cen();
    const e = dono.equilibrio;
    expect(e.indisponivel).toBeNull();
    expect(e.semVendaHoraria).toBe(false);
    expect(e.diasFechar).toEqual([]);
    // O Cenário 1 é a base (folha de 8000 × 1,622 por 26 h de parcial = 8434,4); os outros cenários valem pelo saldo
    // = economia de folha − venda perdida + venda adicional das horas novas.
    expect(dono.manter.impactoMensal).toBe(8434.4);
    expect(dono.comparativo.cenarios.map((c: { id: string }) => c.id)).toEqual(['manter', 'economia', 'equilibrio']);
    const por = Object.fromEntries(dono.comparativo.cenarios.map((c: { id: string }) => [c.id, c]));
    expect(por.manter).toMatchObject({
      status: 'viavel',
      custoFolhaMensal: 21410.4,
      folhaAdicionalMensal: 8434.4,
      economiaFolhaMensal: 0,
      saldoMensal: 0,
      saldoAnual: 0,
      pesoNoFaturamentoPct: 0,
    });
    // Cenário 2 (só o sábado, até 4 h): perde as 2 últimas horas do sábado (133,33 por hora × 52 ÷ 12 = 577,78 cada)
    expect(por.economia).toMatchObject({ status: 'nao_resolve', diasFechar: [], custoFolhaMensal: 12976, economiaFolhaMensal: 8434.4 });
    expect(por.economia.faturamentoPerdidoMensal).toBeCloseTo(1155.56, 0);
    expect(por.economia.saldoMensal).toBeCloseTo(8434.4 - 1155.56, 0);
    expect(por.economia.vendaPerdidaPorDia).toMatchObject([{ dia: 5, horasFechadas: 2, ate: 12 }]);
    // Cenário 3: o saldo fecha com a conta aberta
    const eq3 = por.equilibrio;
    expect(eq3.status).toBe('viavel');
    expect(eq3.saldoMensal).toBeCloseTo(
      eq3.economiaFolhaMensal - eq3.faturamentoPerdidoMensal + eq3.vendaAdicionalMensal,
      1,
    );
    expect(eq3.saldoAnual).toBeCloseTo(eq3.saldoMensal * 12, 0);
    expect(['manter', 'equilibrio']).toContain(dono.comparativo.destaque);
    expect(por.economia.alertas.join(' ')).toContain('Cenário 3');
    const textoDono = JSON.stringify(dono);
    for (const chave of ['margemCortadaMes', 'margemGanhaMes', 'resultadoLiquidoMensal', 'ganhoFrenteManterMensal', 'margemInformada'])
      expect(textoDono).not.toContain(chave);

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = await cen(h);
      expect(r.equilibrio.indisponivel).toBeNull();
      expect(r.equilibrio.diasFechar).toEqual([]);
      for (const campo of [
        'custoAdicionalMensal',
        'acrescimoPct',
        'vendaCortadaMes',
        'vendaGanhaMes',
        'impactoRobusto',
        'impactoMensal',
      ])
        expect(campo in r.equilibrio).toBe(false);
      expect('destaque' in r).toBe(false);
      expect('impactoMensal' in r.manter).toBe(false);
      // comparativo: contratações, dias, horas, status e alertas; nenhuma linha em reais e nenhum destaque
      expect('destaque' in r.comparativo).toBe(false);
      for (const c of r.comparativo.cenarios) {
        for (const campo of [
          'custoFolhaMensal',
          'saldoMensal',
          'saldoAnual',
          'economiaFolhaMensal',
          'faturamentoPerdidoMensal',
          'pesoNoFaturamentoPct',
        ])
          expect(campo in c).toBe(false);
        for (const d of c.vendaPerdidaPorDia ?? []) expect('vendaMes' in d).toBe(false);
      }
      const texto = JSON.stringify(r);
      for (const valor of ['8434', '21410', '12976', 'R$']) expect(texto).not.toContain(valor);
    }
  });

  it('cenário 4: abre um dia hoje fechado com a sobra da equipe; valores só para o dono', async () => {
    await reqGe()
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
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const est = async (h: Record<string, string> = admin) =>
      (await reqGe().get(url).set(h)).body.cenarios.r40.estender;

    // Loja de segunda a sexta (12h) e sábado (6h): 66h e 11 turnos; 3 farmacêuticas de 40h dão 120h e 15 turnos.
    // O domingo, hoje fechado, abre com o horário do dia mais curto (sábado, 08h às 14h): 72h e 12 turnos cabem.
    // Sem venda informada: dia escolhido só pela capacidade, sem valor.
    const sem = await est();
    expect(sem.disponivel).toBe(true);
    expect(sem.diasAbrir).toEqual([
      { dia: 6, abre: '08:00', fecha: '14:00', vendaMes: null },
    ]);
    expect(sem.horasEstender).toBe(6);
    expect(sem.horasSemana).toBe(72);
    expect(sem.vendaRefMes).toBeNull();
    expect(sem.aviso).toContain('Sem venda informada');
    expect(sem.custoAdicionalMensal).toBe(0); // a equipe já cobre o horário
    expect(sem.saldoMensal).toBeNull();

    // Com faturamento (segunda a sexta 1000, sábado 800): a venda média dos dias abertos é 4188,89 por mês; o domingo
    // vale 50% disso: 2094,44 de venda por mês (a equipe já cobre o dia: custo 0, saldo 2094,44).

    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1000, 1000, 1000, 1000, 800, null],
          mensal: null,
        },
      });
    const com = await est();
    expect(com.diasAbrir.map((d: { dia: number }) => d.dia)).toEqual([6]);
    expect(com.vendaRefMes).toBe(2094.44);
    expect(com.saldoMensal).toBe(2094.44);
    expect(JSON.stringify(com)).not.toContain('margem');
    expect(com.aviso).toContain('50%');

    // O fator de dia novo é uma premissa: com 100% o domingo vale a média inteira (2 × 2094,44 = 4188,89)
    const cheio = (await reqGe().get(`${url}?fatorDiaNovo=100`).set(admin)).body.cenarios.r40
      .estender;
    expect(cheio.vendaRefMes).toBe(4188.89);
    expect(cheio.aviso).toContain('100%');

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = await est(h);
      expect(r.diasAbrir).toEqual([{ dia: 6, abre: '08:00', fecha: '14:00' }]);
      for (const campo of ['custoAdicionalMensal', 'saldoMensal']) expect(campo in r).toBe(false);
      expect(r.vendaRefMes).toBeUndefined();
      const texto = JSON.stringify(r);
      for (const valor of ['523.61', '2094.44', 'R$']) expect(texto).not.toContain(valor);
    }
  });

  it('sem base comercial, o faturamento do cadastro vira a venda do diagnóstico; a base vence quando enviada', async () => {
    await reqGe()
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
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };

    // nada informado: sem origem, e o texto manda cadastrar o faturamento
    const nada = (await reqGe().get(url).set(admin)).body;
    expect(nada.origemVendas).toBeNull();
    expect(JSON.stringify(nada.pontosAtencao)).toContain('cadastre o faturamento da loja');

    // faturamento no cadastro (loja 08–20 seg a sex, 08–14 sáb)
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [12000, 12000, 12000, 12000, 12000, 6000, null],
          mensal: null,
        },
      });
    const dono = (await reqGe().get(url).set(admin)).body;
    expect(dono.origemVendas).toBe('cadastro');
    expect(dono.vendas).toBeNull();
    expect(dono.numeros.maiorVendaDescoberta).toBeNull();
    expect(JSON.stringify(dono.pontosAtencao)).toContain('Venda estimada pelo faturamento');
    const est = dono.cenarios.r40.estender;
    expect(est.disponivel).toBe(true);
    expect(typeof est.vendaRefMes).toBe('number');
    expect(est.saldoMensal).toBeNull(); // sem salário médio da loja não há custo para comparar
    expect(est.aviso).toContain('referência');
    expect(dono.cenarios.r40.economia.semVendaHoraria).toBe(true);
    expect(est.aviso).not.toContain('dias de venda');
    expect(dono.cenarios.r40.economia.aviso ?? '').not.toContain('dias de venda');

    // gestor e consulta: mesmos cenários, sem nenhum valor de venda ou margem
    for (const perfil of [gestor, consulta]) {
      const r = (await reqGe().get(url).set(perfil)).body;
      expect(r.origemVendas).toBe('cadastro');
      expect(r.cenarios.r40.estender.diasAbrir.length).toBe(est.diasAbrir.length);
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
    await reqGe()
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
    const base = (await reqGe().get(url).set(admin)).body;
    expect(base.origemVendas).toBe('base');
    expect(base.vendas).not.toBeNull();
  });

  it('o horário digitado no cadastro é a escala atual (a que vira o dia fica só informativa)', async () => {
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const cadastrar = (matricula: string, nome: string, extra: object) =>
      reqGe()
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
    const sem = (await reqGe().get(url).set(admin)).body;
    expect(sem.status).not.toBe('pendente');
    expect(sem.colaboradores.map((c: { nome: string }) => c.nome)).toEqual(['Ana']);
    expect(sem.fontes.escala).toBeUndefined();
    expect(sem.numeros.linhasRejeitadas).toBe(0);
  });

  it('todo Diagnóstico traz o aviso de estimativa, para qualquer perfil, com ou sem escala', async () => {
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    for (const perfil of [
      admin,
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const pendente = (await reqGe().get(url).set(perfil)).body;
      expect(pendente.status).toBe('pendente');
      expect(pendente.avisoEstimativa).toContain('estimativa');
      expect(pendente.avisoEstimativa).toContain('contador');
      expect(pendente.avisoEstimativa).toContain('sindicato');
    }
    await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sex', '08:00', '', '', '16:00', '40'],
        ]),
        'e.xlsx',
      );
    const completo = (
      await reqGe().get(url).set({ 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID })
    ).body;
    expect(completo.status).not.toBe('pendente');
    expect(completo.avisoEstimativa).toContain('contador');
  });

  it('venda por dia da semana: origem, dias protegidos e valores só para o dono', async () => {
    await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '16:00', '40'],
        ]),
        'e.xlsx',
      );
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const regra40 = async (perfil = admin) =>
      (await reqGe().get(url).set(perfil)).body.cenarios.r40;

    // faturamento por dia (loja aberta de segunda a sábado)
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1010, 1120, 910, 1230, 1530, 830, null],
          mensal: null,
        },
      });
    const dono = await regra40();
    expect(dono.origemVenda).toBe('cadastro');
    expect(dono.vendasPorDia.map((d: { venda: number }) => d.venda)).toEqual([
      1010, 1120, 910, 1230, 1530, 830, 0,
    ]);
    // sexta: venda 1530 por dia × 52 ÷ 12 = 6630 por mês
    expect(dono.vendasPorDia[4]).toMatchObject({ aberto: true, protegido: true, vendaMes: 6630 });
    expect(dono.vendasPorDia[4]).not.toHaveProperty('margem');
    // os três dias de maior faturamento (sexta 1530, quinta 1230, terça 1120) são protegidos
    expect(dono.diasProtegidos).toEqual([1, 3, 4]);
    expect(dono.vendasPorDia[6]).toMatchObject({ aberto: false, protegido: false, venda: 0 });

    // gestor e consulta: os dias e a proteção, sem nenhum valor em reais
    for (const perfil of [gestor, { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID }]) {
      const r = await regra40(perfil);
      expect(r.diasProtegidos).toEqual([1, 3, 4]);
      expect(r.vendasPorDia[4]).toEqual({ dia: 4, aberto: true, protegido: true });
      const texto = JSON.stringify(r);
      for (const valor of ['1530', '1657.5', '382.5']) expect(texto).not.toContain(valor);
    }

    // só o faturamento mensal: estimativa, igual em todos os dias abertos (52000 × 12 ÷ 52 ÷ 6 = 2000)
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [null, null, null, null, null, null, null],
          mensal: 52000,
        },
      });
    const est = await regra40();
    expect(est.origemVenda).toBe('estimativa');
    expect(est.vendasPorDia.slice(0, 6).every((d: { venda: number }) => d.venda === 2000)).toBe(
      true,
    );

    // base comercial enviada: vale a base
    await reqGe()
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(
          ['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Margem_Bruta_RS', 'Clientes_Atendidos'],
          [
            ['07/09/2026', '9', '001', '100,00', '20,00', '5'],
            ['07/09/2026', '10', '001', '100,00', '20,00', '5'],
            ['14/09/2026', '9', '001', '300,00', '60,00', '9'],
          ],
        ),
        'b.xlsx',
      );
    const base = await regra40();
    expect(base.origemVenda).toBe('base');
    // duas segundas (07/09 e 14/09/2026): (200 + 300) ÷ 2 = 250 por segunda
    expect(base.vendasPorDia[0]).toMatchObject({ venda: 250 });

    // O painel de vendas por hora traz o valor em reais só para o dono; os demais veem a participação de cada hora
    const donoVendas = (await reqGe().get(url).set(admin)).body.vendas;
    expect(donoVendas.horas[0].vendaMedia).toBeGreaterThan(0);
    for (const perfil of [gestor, { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID }]) {
      const v = (await reqGe().get(url).set(perfil)).body.vendas;
      expect(v.horas.length).toBe(donoVendas.horas.length);
      expect(
        v.horas.every(
          (h: Record<string, unknown>) =>
            !('vendaMedia' in h) && typeof h.participacao === 'number',
        ),
      ).toBe(true);
      expect(v.top.every((t: Record<string, unknown>) => !('vendaMedia' in t))).toBe(true);
    }
  });

  it('premissas para simular: recaptura, hora nova, dias protegidos e limite do parcial; faixas, permissões e nada é gravado', async () => {
    await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach(
        'arquivo',
        await xlsx(escalaCab, [
          ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
        ]),
        'e.xlsx',
      );
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
        },
      });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const pedir = (consulta = '', perfil: Record<string, string> = admin) =>
      reqGe().get(`${url}${consulta}`).set(perfil);
    const r40 = async (consulta = '', perfil = admin) => (await pedir(consulta, perfil)).body;

    // Sem premissas (padrões): a conta do corte é de venda hora a hora; sem a base comercial a venda perdida não é estimada
    const padrao = await r40();
    expect(padrao.cenarios.r40.economia.semVendaHoraria).toBe(true);
    expect(padrao.cenarios.r40.economia.vendaCortadaMes).toBeNull();
    expect(padrao.premissas).toEqual({
      recaptura: 0,
      fatorDiaNovo: 50,
      fatorHoraNova: 50,
      diasProtegidos: 3,
      limiteParcial: 3,
    });

    // A margem bruta saiu das premissas e do pedido (nada mais depende dela); o percentual da hora nova entrou
    expect((await pedir('?margemPct=50')).status).toBe(400);
    expect((await r40('?fatorHoraNova=80')).premissas.fatorHoraNova).toBe(80);

    // Com a base comercial (venda de cada hora), a recaptura de 20% reduz a venda perdida em 20%
    const dias = [
      ['07/09/2026', 12, 1000],
      ['08/09/2026', 12, 1100],
      ['09/09/2026', 12, 900],
      ['10/09/2026', 12, 1200],
      ['11/09/2026', 12, 1500],
      ['12/09/2026', 6, 800],
    ] as const;
    const linhas = dias.flatMap(([data, horas, total]) =>
      Array.from({ length: horas }, (_, i) => [data, String(8 + i), '001', (total / horas).toFixed(2).replace('.', ','), '10']),
    );
    await reqGe()
      .post('/api/v1/cargas/base')
      .set(admin)
      .attach('arquivo', await xlsx(['Data', 'Hora', 'Cod_Loja', 'Venda_Liquida_RS', 'Clientes_Atendidos'], linhas), 'base.xlsx');
    const comBase = await r40();
    const cheia = comBase.cenarios.r40.economia.vendaCortadaMes;
    expect(cheia).toBeGreaterThan(0);
    const rec = await r40('?recaptura=20');
    expect(rec.cenarios.r40.economia.vendaCortadaMes).toBeCloseTo(cheia * 0.8, 1);
    expect(rec.premissas.recaptura).toBe(20);

    // Limite do parcial: desde a spec 013 o limite é legal (30 h) e esta premissa não muda mais a conta
    const semParcial = await r40('?limiteParcial=0');
    expect(semParcial.cenarios.r40.manter.contratacoes[0]).toMatchObject({
      inteiras: 0,
      parcialH: 26,
    });
    expect(semParcial.cenarios.r40.manter.custoAdicionalMensal).toBe(8434.4);
    expect(semParcial.regras.find((r: { id: string }) => r.id === 'r40').resumo.contratar).toBe(1);

    // Dias protegidos 0: nenhum dia é protegido; o Cenário 2 não fecha dia útil de qualquer jeito e segue sem resolver
    const livre = await r40('?diasProtegidos=0');
    expect(livre.cenarios.r40.diasProtegidos).toEqual([]);
    expect(livre.cenarios.r40.economia.naoRecomendado).toBeNull();
    expect(livre.cenarios.r40.economia.diasFechar.every((d: { dia: number }) => d.dia >= 5)).toBe(
      true,
    );

    // Fora das faixas: 400 em português; parâmetro desconhecido também
    for (const [consulta, trecho] of [
      ['?recaptura=31', 'entre 0% e 30%'],
      ['?fatorHoraNova=101', 'entre 0% e 100%'],
      ['?fatorDiaNovo=101', 'entre 0% e 100%'],
      ['?diasProtegidos=7', 'entre 0 e 6'],
      ['?limiteParcial=4', 'entre 0 e 3'],
    ] as const) {
      const r = await pedir(consulta);
      expect(r.status).toBe(400);
      expect(JSON.stringify(r.body)).toContain(trecho);
    }
    expect((await pedir('?foo=1')).status).toBe(400);

    // Gestor: as premissas valem e a resposta não traz a margem
    const g = await r40('?recaptura=20&limiteParcial=0', gestor);
    expect(g.premissas).toEqual({
      recaptura: 20,
      fatorDiaNovo: 50,
      fatorHoraNova: 50,
      diasProtegidos: 3,
      limiteParcial: 0,
    });
    expect(JSON.stringify(g)).not.toContain('"margemPct"');

    // Nada foi gravado: sem premissas voltam os padrões, e o faturamento da loja segue o mesmo
    const depois = await r40();
    expect(depois.premissas.recaptura).toBe(0);
    expect((await prisma.loja.findFirst({ where: { codigo: '001' } }))?.faturamento).toHaveProperty(
      'dias',
    );
  });

  it('cenário 5: mostra a sobra de gente por cargo; economia só para o dono', async () => {
    await reqGe()
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
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/configuracao`)
      .set(admin)
      .send({ minimos: { Atendimento: 0, Caixa: 0 } });
    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const red = async (h: Record<string, string> = admin) =>
      (await reqGe().get(url).set(h)).body.cenarios.r40.reduzir;

    // 66h e 11 turnos na semana: três farmacêuticas de 40h (120h, 15 turnos) bastam, duas não (10 turnos)
    const dono = await red();
    expect(dono.temExcedente).toBe(true);
    expect(dono.cargos).toEqual([
      {
        funcao: 'Farmacêutico',
        pessoasHoje: 4,
        pessoasNecessarias: 3,
        excedente: 1,
        economiaMensal: 12976,
      },
    ]);
    expect(dono.pessoasExcedentes).toBe(1);
    expect(dono.economiaMensal).toBe(12976);
    expect(dono.economiaPct).toBe(25); // folha atual: 4 × 8000 × 1,622 = 51904
    expect(dono.aviso).toContain('validação trabalhista');

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
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
    const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
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
      reqGe().put(`/api/v1/lojas/${lojaId}/configuracao`).set(perfil).send(corpo);

    it('grava e devolve os turnos; null volta ao mínimo único', async () => {
      const r = await configurar({ turnos: tres });
      expect(r.status).toBe(200);
      expect(r.body.config.turnos).toHaveLength(3);
      expect(r.body.config.turnosAvisos).toEqual([]);
      expect(r.body.config.turnos[1]).toMatchObject({ nome: 'Tarde', minimos: { Atendimento: 3 } });
      const volta = await configurar({ turnos: null });
      expect(volta.body.config.turnos).toBeNull();
    });

    it('aceita turnos que se sobrepõem, que passam do horário e que deixam buraco; recusa mais de 6 turnos e farmacêutico 0', async () => {
      const msg = async (turnos: object[]) => {
        const r = await configurar({ turnos });
        expect(r.status).toBe(400);
        return JSON.stringify(r.body);
      };
      const aceita = async (turnos: object[]) => {
        const r = await configurar({ turnos });
        expect(r.status).toBe(200);
        return r.body.config;
      };
      await aceita([turno('A', '08:00', '15:00', {}), turno('B', '14:00', '20:00', {})]);
      await aceita([turno('A', '07:00', '21:00', {})]);
      // Buraco não é erro: vira aviso informativo.
      const c = await aceita([turno('A', '08:00', '13:00', {}), turno('B', '14:00', '20:00', {})]);
      expect(c.turnosAvisos.join(' ')).toContain('Sem turno entre 13:00 e 14:00');
      expect(
        await msg(Array.from({ length: 7 }, (_, i) => turno(`T${i}`, '08:00', '09:00', {}))),
      ).toBeTruthy();
      expect(await msg([turno('A', '08:00', '20:00', { Farmacêutico: 0 })])).toContain(
        'farmacêutico é 1',
      );
    });

    it('modo do mínimo: "unico" guarda os turnos sem usá-los e volta sem apagar nada', async () => {
      await configurar({ turnos: tres });
      const u = await configurar({ modoMinimo: 'unico' });
      expect(u.status).toBe(200);
      expect(u.body.config.modoMinimo).toBe('unico');
      expect(u.body.config.turnos).toHaveLength(3);
      expect(u.body.config.turnosAvisos).toEqual([]);
      const t = await configurar({ modoMinimo: 'turnos' });
      expect(t.body.config.modoMinimo).toBe('turnos');
      expect(t.body.config.turnos).toHaveLength(3);
      // Trocar os turnos mantém o modo escolhido.
      await configurar({ modoMinimo: 'unico' });
      const novos = await configurar({ turnos: [turno('X', '08:00', '20:00', {})] });
      expect(novos.body.config.modoMinimo).toBe('unico');
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
      await reqGe()
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
      const antes = (await reqGe().get(url).set(admin)).body;
      const comTurnos = (await configurar({ turnos: tres })).body;
      const atend = (b: typeof antes) =>
        b.regras
          .find((r: { id: string }) => r.id === 'r40')
          .funcoes.find((f: { funcao: string }) => f.funcao === 'Atendimento');
      expect(atend(comTurnos).minimo).toBe(3);
      expect(atend(comTurnos).necessidadeH).toBeGreaterThan(atend(antes).necessidadeH);
      const texto = JSON.stringify(comTurnos.pontosAtencao);
      expect(texto).toContain('Atendimento abaixo da meta (3)');
      const semTurnos = (await configurar({ turnos: null })).body;
      expect(atend(semTurnos)).toEqual(atend(antes));
      expect(JSON.stringify(semTurnos.pontosAtencao)).toBe(JSON.stringify(antes.pontosAtencao));
    });

    it('quadro por turno: presentes × exigido, falta só à tarde, fora da conta com motivo e explicação por turno', async () => {
      await reqGe()
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
      await reqGe()
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'S1', nome: 'Sem Horário', lojaId, funcaoEscala: 'Caixa' });
      await reqGe()
        .post('/api/v1/funcionarios')
        .set(admin)
        .send({ matricula: 'S2', nome: 'Sem Função', lojaId });
      const url = `/api/v1/lojas/${lojaId}/diagnostico`;

      // sem turnos: um turno "Dia todo"
      const antes = (await reqGe().get(url).set(admin)).body;
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
      await reqGe()
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
      await reqGe()
        .put(`/api/v1/lojas/${lojaId}/custos`)
        .set(admin)
        .send({
          salarioMedio: { Farmacêutico: 8000, Atendimento: 2000, Caixa: 1500 },
          encargosPct: 50,
        });
      await reqGe()
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
      const sem = (await reqGe().get(url).set(admin)).body.cenarios.r40;
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
      await reqGe()
        .patch(`/api/v1/lojas/${lojaId}`)
        .set(admin)
        .send({ horarios: { semana: { abre: '08:00', fecha: '22:00' } } });
      const r = (await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`)).body;
      expect(r.config.turnos).toHaveLength(3);
      expect(r.config.turnosAvisos.join(' ')).toContain('Sem turno entre 20:00 e 22:00');
    });
  });
  describe('estimativa de 8h24 na regra de 42h (spec 018)', () => {
    // 8 atendentes de 44h e 1 farmacêutica; meta do dono: manter o nível de hoje (8 × 44h = 352h).
    const enviar = async () => {
      const linhas = Array.from({ length: 8 }, (_, i) => [
        '001', `A${i}`, `Atendente ${i}`, 'Atendente', 'Seg a Sáb', '08:00', '', '', '17:00', '44',
      ]);
      await reqGe()
        .post('/api/v1/cargas/escala')
        .set(admin)
        .attach(
          'arquivo',
          await xlsx(escalaCab, [
            ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '', '', '17:00', '44'],
            ...linhas,
          ]),
          'e.xlsx',
        );
    };
    const diag = async (h: Record<string, string> = admin) =>
      (await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`).set(h)).body;
    // O padrão agora é a convenção permitida; estes testes são da loja que desligou a convenção.
    const semConvencao = () =>
      reqGe().put(`/api/v1/lojas/${lojaId}/configuracao`).set(admin).send({ convencao8h24: false });

    it('convenção desligada: a regra de 42h traz com8h24; as outras regras não', async () => {
      await enviar();
      await semConvencao();
      const d = await diag();
      const r42 = d.regras.find((r: { id: string }) => r.id === 'r42');
      const r40 = d.regras.find((r: { id: string }) => r.id === 'r40');
      const atual = d.regras.find((r: { id: string }) => r.id === 'atual');
      expect(r42.com8h24.funcoes.length).toBeGreaterThan(0);
      expect(r40).not.toHaveProperty('com8h24');
      expect(atual).not.toHaveProperty('com8h24');
      const sem = r42.funcoes.find((f: { funcao: string }) => f.funcao === 'Atendimento');
      const com = r42.com8h24.funcoes.find((f: { funcao: string }) => f.funcao === 'Atendimento');
      // Sem 8h24 a regra vira 40h na prática; com 8h24 cada pessoa faz 42h: sobra capacidade.
      expect(com.capacidadeH).toBeGreaterThan(sem.capacidadeH);
      expect(com.capacidadeH).toBe(8 * 42);
      expect(com.necessidadeH).toBe(sem.necessidadeH);
      expect(com.gapH).toBeLessThan(sem.gapH);
      expect(com.saldoH).toBe(com.capacidadeH - com.necessidadeH);
    });

    it('convenção já permitida: o campo não vem', async () => {
      await enviar();
      await reqGe().put(`/api/v1/lojas/${lojaId}/configuracao`).set(admin).send({ convencao8h24: true });
      const r42 = (await diag()).regras.find((r: { id: string }) => r.id === 'r42');
      expect(r42).not.toHaveProperty('com8h24');
    });

    it('é só horas (sem R$): gestor e consulta recebem igual; nenhum outro campo da regra muda', async () => {
      await enviar();
      await semConvencao();
      const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
      const consulta = { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID };
      const dono = (await diag()).regras.find((r: { id: string }) => r.id === 'r42');
      for (const h of [gestor, consulta]) {
        const r = (await diag(h)).regras.find((x: { id: string }) => x.id === 'r42');
        expect(r.com8h24).toEqual(dono.com8h24);
        expect(JSON.stringify(r.com8h24)).not.toMatch(/custo|R\$|salario/i);
      }
      // As chaves de sempre continuam lá, com os mesmos valores de antes.
      const { com8h24: _novo, ...resto } = dono;
      expect(Object.keys(resto)).toEqual(['id', 'nome', 'vigencia', 'descricao', 'passa', 'funcoes', 'redistribuicao', 'resumo']);
      expect(resto.funcoes.find((f: { funcao: string }) => f.funcao === 'Atendimento').capacidadeH).toBe(8 * 40);
    });

    it('sem escala importada o diagnóstico fica pendente e não traz regras', async () => {
      const d = await diag();
      expect(d.status).toBe('pendente');
      expect(d).not.toHaveProperty('regras');
    });
  });
});
