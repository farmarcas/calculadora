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

  it('importa a escala (várias lojas), rejeita linhas ruins e calcula o diagnóstico', async () => {
    const arq = await xlsx(escalaCab, [
      ['001', 'F1', 'Ana', 'Farmacêutica', 'Seg a Sáb', '08:00', '12:00', '13:00', '17:00', '44'],
      ['001', 'F2', 'Bia', 'Farmacêutica', 'Seg a Sex', '12:00', '', '', '20:00', '44'],
      ['001', 'F3', 'Caio', 'Gerente', 'Seg a Sex', '08:00', '', '', '17:00', '44'],
      ['001', 'F4', 'Duda', 'Caixa', 'Seg a Sex', '18:00', '', '', '08:00', ''],
      ['999', 'X1', 'Zé', 'Caixa', 'Seg a Sex', '08:00', '', '', '17:00', ''],
    ]);
    const imp = await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach('arquivo', arq, 'escala.xlsx');
    expect(imp.status).toBe(201);
    const l001 = imp.body.lojas.find((l: { codigo: string }) => l.codigo === '001');
    expect(l001).toMatchObject({ aceitas: 3, rejeitadas: 1, situacao: 'Importada' });
    expect(imp.body.lojas.find((l: { codigo: string }) => l.codigo === '999').situacao).toContain(
      'não cadastrada',
    );

    const d = (await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`)).body;
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
    await reqGe().post('/api/v1/cargas/escala').set(admin).attach('arquivo', arq, 'a.xlsx');
    await reqGe().post('/api/v1/cargas/escala').set(admin).attach('arquivo', arq, 'b.xlsx');
    const h = (await reqGe().get(`/api/v1/lojas/${lojaId}/cargas`)).body.data;
    expect(h).toHaveLength(2);
    expect(h.filter((c: { ativa: boolean }) => c.ativa)).toHaveLength(1);
    expect(h.find((c: { ativa: boolean }) => c.ativa).arquivo).toBe('b.xlsx');
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

  it('recusa planilha sem as colunas obrigatórias', async () => {
    const r = await reqGe()
      .post('/api/v1/cargas/escala')
      .set(admin)
      .attach('arquivo', await xlsx(['A', 'B'], [['1', '2']]), 'x.xlsx');
    expect(r.status).toBe(400);
    expect(r.body.error.message).toContain('colunas obrigatórias');
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

  it('baixa os modelos de escala e de base', async () => {
    expect((await reqGe().get('/api/v1/planilha-modelo-escala')).status).toBe(200);
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
    expect(dono.folhaMensal).toMatchObject({ informado: true, mensal: 11200, encargosPct: 40 });

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = (await reqGe().get(url).set(h)).body;
      expect(r.folhaMensal).toBeUndefined();
      expect(JSON.stringify(r)).not.toContain('11200');
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
    // parcial de 26h: 8000 × 26 × 5 ÷ 200 × 1,4 = 7280; folha atual 8000 × 1,4 = 11200 → acréscimo de 65%
    expect(dono.r40.manter.custoAdicionalMensal).toBe(7280);
    expect(dono.r40.manter.acrescimoPct).toBe(65);
    expect(dono.r40.atual).toMatchObject({ horasSemana: 66, pessoas: 1, folhaMensal: 11200 });
    expect(dono.r40.vendasBase).toBeNull();

    // Dias e horários do parcial: a farmacêutica cobre 08h–17h; descoberto de segunda a sexta das 17h às 20h (3 h por dia,
    // 15 h no total); o sábado (8h–14h) já está coberto. Das 26 h do parcial cabem 15 h; o resto não tem lugar.
    const regras = (await reqGe().get(url).set(admin)).body.regras;
    const farm = regras.find((r: { id: string }) => r.id === 'r40').funcoes[0];
    expect(farm.sugestao.distribuicao).toEqual({
      blocos: [0, 1, 2, 3, 4].map((dia) => ({ dia, de: '17:00', ate: '20:00', horas: 3 })),
      estimativa: false,
      semLugarH: 11,
    });

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = (await reqGe().get(url).set(h)).body;
      expect(r.cenarios.r40.manter.contratacoes[0].pessoas).toBe(1);
      expect('custoAdicionalMensal' in r.cenarios.r40.manter).toBe(false);
      expect('folhaMensal' in r.cenarios.r40.atual).toBe(false);
      expect(JSON.stringify(r)).not.toContain('7280');
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
    // Faturamento por dia e margem de 25%: sábado vende 800 × 52 ÷ 12 = 3466,67 por mês (577,78 por hora); a venda
    // dos seis dias é 6500 × 52 ÷ 12 = 28166,67.
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
          margemPct: 25,
        },
      });
    const dono = await eco();
    // Só o sábado pode mudar (não há domingo): reduz até o piso de 4 h (corta 2 h: 8h–14h → 8h–12h). Não cobre
    // (11 turnos exigidos, 5 de capacidade) e fechar o sábado perderia 3466,67 (12,3% > 10%): para na trava de perda.
    // Perda do corte: 3466,67 × 2 ÷ 6 = 1155,56 (4,1%); margem de 25% = 288,89.
    expect(dono.viavel).toBe(false);
    expect(dono.naoResolveSozinho).toBe(true);
    expect(dono.travou).toBe('perda');
    expect(dono.diasFechar).toEqual([]);
    expect(dono.horarioSemana[5]).toEqual({ dia: 5, aberto: true, abre: '08:00', fecha: '12:00' });
    for (const d of [0, 1, 2, 3, 4])
      expect(dono.horarioSemana[d]).toMatchObject({ aberto: true, abre: '08:00', fecha: '20:00' });
    expect(dono.horasSemana).toBe(64);
    expect(dono.horasReduzir).toBe(2);
    expect(dono.vendaCortadaMes).toBe(1155.56);
    expect(dono.margemCortadaMes).toBe(288.89);
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

    // sem a margem informada, a margem perdida é nula (nunca zero)
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
          margemPct: null,
        },
      });
    const semMargem = await eco();
    expect(semMargem.margemInformada).toBe(false);
    expect(semMargem.margemCortadaMes).toBeNull();
    expect(semMargem.vendaCortadaMes).toBe(1155.56);
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
          margemPct: 25,
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
      expect('margemCortadaMes' in r).toBe(false);
      expect('vendaCortadaMes' in r).toBe(false);
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

    // com faturamento e margem, mas sem custos: faltam os salários
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1100, 900, 1200, 1500, 800, null],
          mensal: null,
          margemPct: 25,
        },
      });
    expect((await cen()).equilibrio.indisponivel.motivo).toBe('custos');

    await reqGe()
      .put(`/api/v1/lojas/${lojaId}/custos`)
      .set(admin)
      .send({ salarioMedio: { Farmacêutico: 8000 }, encargosPct: 40 });
    const dono = await cen();
    const e = dono.equilibrio;
    // Segunda a sexta (12h) e sábado (6h): 66h e 11 turnos; 1 farmacêutica de 40h (5 turnos).
    // Dias livres (não protegidos): segunda, quarta e sábado. De todas as combinações, a melhor fecha os três:
    // Todas as combinações: manter tudo = parcial de 26h (7280); fechar só a segunda: 54h, gap 14h = 3920 + 1083,33;
    // fechar segunda e quarta: 42h, gap de 2h → 1 parcial de 2h = 8000 × 2 × 5 ÷ 200 × 1,4 = 560; margem perdida
    // 1083,33 + 975 = 2058,33; impacto 2618,33 (fechar também o sábado: 2925, pior). Manter tudo: 7280.
    expect(e.indisponivel).toBeNull();
    expect(e.diasFechar.map((d: { dia: number }) => d.dia)).toEqual([0, 2]);
    expect(e.contratacoes[0]).toMatchObject({
      funcao: 'Farmacêutico',
      inteiras: 0,
      parcial: { turnos: 1, horas: 2 },
    });
    expect(e.custoAdicionalMensal).toBe(560);
    expect(e.margemCortadaMes).toBe(2058.33);
    expect(e.impactoMensal).toBe(2618.33);
    expect(dono.manter.impactoMensal).toBe(7280);
    expect(dono.destaque).toBe('equilibrio');
    expect(e.resumo).toContain('Fechando segunda e quarta');

    // Comparativo lado a lado. Folha atual: 8000 × 1,4 = 11200. Faturamento de referência: soma dos dias 6500 ×
    // 52 ÷ 12 = 28166,67 por mês. Impactos: Cenário 1 = 7280; Cenário 2 = 3250; Cenário 3 = 2618,33.
    const comp = dono.comparativo;
    expect(comp.cenarios.map((c: { id: string }) => c.id)).toEqual([
      'manter',
      'economia',
      'equilibrio',
    ]);
    expect(comp.destaque).toBe('equilibrio');
    const por = Object.fromEntries(comp.cenarios.map((c: { id: string }) => [c.id, c]));
    expect(por.manter).toMatchObject({
      status: 'viavel',
      custoFolhaMensal: 18480,
      resultadoLiquidoMensal: -7280,
      impactoPctFaturamento: 25.8,
    });
    // Cenário 2 (só o sábado, até 4 h): perda 1155,56, margem 288,89 (1,0% do faturamento de referência)
    expect(por.economia).toMatchObject({
      status: 'nao_resolve',
      diasFechar: [],
      custoFolhaMensal: 11200,
      margemMes: -288.89,
      impactoPctFaturamento: 1,
    });
    expect(por.equilibrio).toMatchObject({
      status: 'viavel',
      diasFechar: [0, 2],
      custoFolhaMensal: 11760,
      margemMes: -2058.33,
      resultadoLiquidoMensal: -2618.33,
      impactoPctFaturamento: 9.3,
    });
    expect(por.economia.alertas.join(' ')).toContain('Cenário 3');

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = await cen(h);
      expect(r.equilibrio.indisponivel).toBeNull();
      expect(r.equilibrio.diasFechar).toEqual([{ dia: 0 }, { dia: 2 }]);
      expect(r.equilibrio.pessoasContratar).toBe(1);
      for (const campo of [
        'custoAdicionalMensal',
        'acrescimoPct',
        'resultadoMensal',
        'margemCortadaMes',
        'impactoMensal',
      ])
        expect(campo in r.equilibrio).toBe(false);
      expect('destaque' in r).toBe(false);
      expect('impactoMensal' in r.manter).toBe(false);
      // comparativo: contratações, dias, horas, status e alertas; nenhuma linha em reais e nenhum destaque
      expect('destaque' in r.comparativo).toBe(false);
      expect(r.comparativo.cenarios.map((c: { status: string }) => c.status)).toEqual([
        'viavel',
        'nao_resolve',
        'viavel',
      ]);
      for (const c of r.comparativo.cenarios)
        for (const campo of [
          'custoFolhaMensal',
          'margemMes',
          'resultadoLiquidoMensal',
          'impactoPctFaturamento',
        ])
          expect(campo in c).toBe(false);
      const texto = JSON.stringify(r);
      for (const valor of ['2618', '2058', '560', '7280', '18480', '11200', 'R$'])
        expect(texto).not.toContain(valor);
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
      { dia: 6, abre: '08:00', fecha: '14:00', vendaMes: null, margemMes: null },
    ]);
    expect(sem.horasEstender).toBe(6);
    expect(sem.horasSemana).toBe(72);
    expect(sem.margemRefMes).toBeNull();
    expect(sem.aviso).toContain('Sem venda informada');
    expect(sem.custoAdicionalMensal).toBe(0); // a equipe já cobre o horário
    expect(sem.impactoMensal).toBeNull();

    // Com faturamento (segunda a sexta 1000, sábado 800, margem de 25%): a margem média dos dias abertos é 1047,22 por
    // mês; o domingo vale 50% disso: 523,61 de margem e 2094,44 de venda por mês.
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1000, 1000, 1000, 1000, 1000, 800, null],
          mensal: null,
          margemPct: 25,
        },
      });
    const com = await est();
    expect(com.diasAbrir.map((d: { dia: number }) => d.dia)).toEqual([6]);
    expect(com.margemRefMes).toBe(523.61);
    expect(com.vendaRefMes).toBe(2094.44);
    expect(com.impactoMensal).toBe(-523.61);
    expect(com.aviso).toContain('50%');

    // O fator de dia novo é uma premissa: com 100% o domingo vale a média inteira (2 × 523,61 = 1047,22)
    const cheio = (await reqGe().get(`${url}?fatorDiaNovo=100`).set(admin)).body.cenarios.r40
      .estender;
    expect(cheio.margemRefMes).toBe(1047.22);
    expect(cheio.aviso).toContain('100%');

    for (const h of [
      { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID },
      { 'X-Perfil': 'SCHEDULE_VIEWER', 'X-GE': GE_INICIAL_ID },
    ]) {
      const r = await est(h);
      expect(r.diasAbrir).toEqual([{ dia: 6, abre: '08:00', fecha: '14:00' }]);
      for (const campo of ['custoAdicionalMensal', 'impactoMensal']) expect(campo in r).toBe(false);
      expect(r.margemRefMes).toBeUndefined();
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

    // faturamento no cadastro (loja 08–20 seg a sex, 08–14 sáb), margem de 25%
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [12000, 12000, 12000, 12000, 12000, 6000, null],
          mensal: null,
          margemPct: 25,
        },
      });
    const dono = (await reqGe().get(url).set(admin)).body;
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

  it('o horário digitado no cadastro vira a escala atual quando nada foi importado, e a importada vence', async () => {
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
    expect(sem.fontes.escala.arquivo).toBe('Cadastro de funcionários');

    // escala importada para outra pessoa: a do cadastro completa o quadro
    await reqGe()
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
    const com = (await reqGe().get(url).set(admin)).body;
    expect(com.fontes.escala.arquivo).toBe('e.xlsx');
    const ana = com.colaboradores.filter((c: { nome: string }) => c.nome === 'Ana');
    expect(ana).toHaveLength(1);
    expect(ana[0].turno).toContain('09');
    expect(JSON.stringify(com.pontosAtencao)).toContain('difere da escala importada');
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

  it('venda e margem por dia da semana: origem, dias protegidos e valores só para o dono', async () => {
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

    // faturamento por dia (loja aberta de segunda a sábado) com margem de 25%
    await reqGe()
      .patch(`/api/v1/lojas/${lojaId}`)
      .set(admin)
      .send({
        faturamento: {
          dias: [1010, 1120, 910, 1230, 1530, 830, null],
          mensal: null,
          margemPct: 25,
        },
      });
    const dono = await regra40();
    expect(dono.origemVenda).toBe('cadastro');
    expect(dono.vendasPorDia.map((d: { venda: number }) => d.venda)).toEqual([
      1010, 1120, 910, 1230, 1530, 830, 0,
    ]);
    // sexta: margem 382,50 por dia × 52 ÷ 12 = 1657,50 por mês
    expect(dono.vendasPorDia[4]).toMatchObject({
      aberto: true,
      protegido: true,
      margem: 382.5,
      margemMes: 1657.5,
    });
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
          margemPct: 25,
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
    expect(base.vendasPorDia[0]).toMatchObject({ venda: 250, margem: 50 });

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

  it('premissas para simular: recaptura, margem, dias protegidos e limite do parcial; faixas, permissões e nada é gravado', async () => {
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
          margemPct: 25,
        },
      });
    const url = `/api/v1/lojas/${lojaId}/diagnostico`;
    const gestor = { 'X-Perfil': 'SCHEDULE_MANAGER', 'X-GE': GE_INICIAL_ID };
    const pedir = (consulta = '', perfil: Record<string, string> = admin) =>
      reqGe().get(`${url}${consulta}`).set(perfil);
    const r40 = async (consulta = '', perfil = admin) => (await pedir(consulta, perfil)).body;

    // Sem premissas (padrões): Cenário 2 reduz o sábado em 2 h (margem 288,89); Cenário 3 fecha segunda e quarta (impacto 2618,33)
    const padrao = await r40();
    expect(padrao.cenarios.r40.economia.margemCortadaMes).toBe(288.89);
    expect(padrao.cenarios.r40.equilibrio.impactoMensal).toBe(2618.33);
    expect(padrao.premissas).toMatchObject({
      recaptura: 0,
      fatorDiaNovo: 50,
      diasProtegidos: 3,
      limiteParcial: 3,
      margemPct: 25,
      margemPctCadastro: 25,
    });

    // Recaptura de 20%: a margem perdida cai 20% (288,89 → 231,11; Cenário 3: 2058,33 → 1646,66, impacto 560 + 1646,66 = 2206,66)
    const rec = await r40('?recaptura=20');
    expect(rec.cenarios.r40.economia.margemCortadaMes).toBe(231.11);
    expect(rec.cenarios.r40.equilibrio).toMatchObject({
      margemCortadaMes: 1646.66,
      impactoMensal: 2206.66,
    });
    expect(rec.premissas.recaptura).toBe(20);

    // Margem de 50% (o dobro): margem perdida dobra (577,78); Cenário 3 continua fechando segunda e quarta: 4116,67 + 560 = 4676,67
    const dobro = await r40('?margemPct=50');
    expect(dobro.cenarios.r40.economia.margemCortadaMes).toBe(577.78);
    expect(dobro.cenarios.r40.equilibrio.impactoMensal).toBe(4676.67);
    expect(dobro.premissas).toMatchObject({ margemPct: 50, margemPctCadastro: 25 });

    // Limite do parcial: desde a spec 013 o limite é legal (30 h) e esta premissa não muda mais a conta
    const semParcial = await r40('?limiteParcial=0');
    expect(semParcial.cenarios.r40.manter.contratacoes[0]).toMatchObject({
      inteiras: 0,
      parcialH: 26,
    });
    expect(semParcial.cenarios.r40.manter.custoAdicionalMensal).toBe(7280);
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
      ['?margemPct=101', 'entre 0% e 100%'],
      ['?fatorDiaNovo=101', 'entre 0% e 100%'],
      ['?diasProtegidos=7', 'entre 0 e 6'],
      ['?limiteParcial=4', 'entre 0 e 3'],
    ] as const) {
      const r = await pedir(consulta);
      expect(r.status).toBe(400);
      expect(JSON.stringify(r.body)).toContain(trecho);
    }
    expect((await pedir('?foo=1')).status).toBe(400);

    // Gestor: não simula a margem (403) e não vê a margem nas premissas; as demais premissas valem
    expect((await pedir('?margemPct=30', gestor)).status).toBe(403);
    const g = await r40('?recaptura=20&limiteParcial=0', gestor);
    expect(g.premissas).toEqual({
      recaptura: 20,
      fatorDiaNovo: 50,
      diasProtegidos: 3,
      limiteParcial: 0,
    });
    expect(JSON.stringify(g)).not.toContain('"margemPct"');

    // Nada foi gravado: sem premissas volta tudo ao cadastro, e a margem da loja segue 25%
    const depois = await r40();
    expect(depois.cenarios.r40.economia.margemCortadaMes).toBe(288.89);
    expect(depois.premissas.margemPct).toBe(25);
    expect((await prisma.loja.findFirst({ where: { codigo: '001' } }))?.faturamento).toMatchObject({
      margemPct: 25,
    });
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
        economiaMensal: 11200,
      },
    ]);
    expect(dono.pessoasExcedentes).toBe(1);
    expect(dono.economiaMensal).toBe(11200);
    expect(dono.economiaPct).toBe(25); // folha atual: 4 × 8000 × 1,4 = 44800
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
      const nada = await reqGe().get(`/api/v1/lojas/${lojaId}/diagnostico`);
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
      expect(r.config.turnosAvisos.join(' ')).toContain('Falta um turno entre 20:00 e 22:00');
    });
  });
});
