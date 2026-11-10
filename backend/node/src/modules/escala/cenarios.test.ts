import { describe, expect, it } from 'vitest';
import { verificarRegra } from '../regras/capacidade.js';
import { regraPara } from '../regras/perfis.js';
import { contratacoesDe, custoDasVagas, montarCenarios, type EntradaCenarios } from './cenarios.js';
import { vendasDoCadastro } from './vendas-cadastro.js';

// Loja de segunda a sábado, 8h às 22h (84h na semana).
const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
const base = (extra: Partial<EntradaCenarios> = {}): EntradaCenarios => ({
  regraId: 'r40',
  convencao8h24: false,
  dias,
  minimos: { Farmacêutico: 1, Atendimento: 1 },
  pessoas: [
    { funcao: 'Farmacêutico', cargaH: 44 },
    { funcao: 'Farmacêutico', cargaH: 44 },
    { funcao: 'Atendimento', cargaH: 40 },
  ],
  vendas: [],
  custos: { salarioMedio: { Farmacêutico: 10000, Atendimento: 3000 }, encargosPct: 0 },
  dono: true,
  ...extra,
});

describe('Cenário 1 — manter horários', () => {
  it('lista a contratação por cargo, com parcial e ociosidade', () => {
    const { manter } = montarCenarios(base());
    // Regra de 40 h. Farmacêutico: 2 × 40 = 80 h para 84 h → gap de 4 h → 1 parcial de 4 h. Atendimento (meta do dono
    // de 1 por hora = 84 h): 1 × 40 = 40 h → gap de 44 h → 1 integral de 40 h e 1 parcial de 4 h.
    expect(manter.contratacoes).toEqual([
      {
        funcao: 'Farmacêutico',
        pessoas: 1,
        inteiras: 0,
        parcial: { turnos: 1, horas: 4 },
        parcialH: 4,
        horasContratadas: 4,
        horasUsadas: 4,
        horasOciosas: 0,
        motivo: 'obrigatoria',
        ociosidadePct: 0,
        ajustado: false,
      },
      {
        funcao: 'Atendimento',
        pessoas: 2,
        inteiras: 1,
        parcial: { turnos: 1, horas: 4 },
        parcialH: 4,
        horasContratadas: 44,
        horasUsadas: 44,
        horasOciosas: 0,
        motivo: 'meta',
        ociosidadePct: 0,
        ajustado: false,
      },
    ]);
    expect(manter.pessoasContratar).toBe(3);
    // contratadas 4 + 44 = 48 h, faltavam 4 + 44 = 48 h → nada sobrando
    expect(manter.ociosidadePct).toBe(0);
    expect(manter.direcionamento).toContain('1 Atendimento e 1 parcial de 4h');
    expect(manter.horasSemana).toBe(84);
    expect(manter.horarioSemana[6]).toEqual({ dia: 6, aberto: false, abre: null, fecha: null });
    expect(manter.horarioSemana[0]).toMatchObject({ aberto: true, abre: '08:00', fecha: '22:00' });
  });

  it('loja sem atendente nem caixa não fica inviável por isso: só o farmacêutico conta', () => {
    // Meta do dono de 1 atendente por hora, mas ninguém no cargo: continua sendo meta, o Cenário 2 não é inviável.
    const r = montarCenarios(
      base({
        minimos: { Farmacêutico: 1, Atendimento: 1, Caixa: 1 },
        pessoas: [
          { funcao: 'Farmacêutico', cargaH: 44 },
          { funcao: 'Farmacêutico', cargaH: 44 },
          { funcao: 'Farmacêutico', cargaH: 44 },
        ],
      }),
    );
    expect(r.economia.viavel).toBe(true);
    expect(r.manter.contratacoes.map((c) => [c.funcao, c.motivo])).toEqual([
      ['Atendimento', 'meta'],
      ['Caixa', 'meta'],
    ]);
  });

  it('custo adicional e % sobre a folha atual, só para o dono', () => {
    const r = montarCenarios(base());
    // farmacêutico parcial de 4h: 10000 × 4 × 5 ÷ 200 = 1000; atendente inteira de 40h: 3000 × 40 × 5 ÷ 200 = 3000;
    // atendente parcial de 4h: 3000 × 4 × 5 ÷ 200 = 300 → 4300
    expect(r.manter.custoAdicionalMensal).toBe(4300);
    // folha atual: 2 × 10000 + 3000 = 23000
    expect(r.atual.folhaMensal).toBe(23000);
    expect(r.manter.acrescimoPct).toBe(18.7); // 4300 ÷ 23000
  });

  it('42h sem convenção usa o divisor de 210 horas', () => {
    const r = montarCenarios(base({ regraId: 'r42' }));
    // mesmas contratações (4h + 40h + 4h) com o divisor 210: 952,38 + 2857,14 + 285,71
    expect(r.manter.custoAdicionalMensal).toBe(4095.24);
  });

  it('custo por ano (mensal × 12) e peso no faturamento mensal, só para o dono', () => {
    const r = montarCenarios(base({ faturamentoMensalRef: 100000 }));
    // custo adicional 4300 por mês: × 12 = 51600 por ano; 4300 ÷ 100000 = 4,3% do faturamento
    expect(r.manter.custoAnual).toBe(51600);
    expect(r.manter.impactoPctFaturamento).toBe(4.3);
    expect(r.manter.faturamentoMensalRef).toBe(100000);
  });

  it('sem faturamento de referência o percentual some; sem custos o anual também', () => {
    const sem = montarCenarios(base());
    expect(sem.manter.custoAnual).toBe(51600);
    expect(sem.manter.impactoPctFaturamento).toBeNull();
    expect(sem.manter.faturamentoMensalRef).toBeNull();
    const semCustos = montarCenarios(base({ custos: null, faturamentoMensalRef: 100000 }));
    expect(semCustos.manter.custoAnual).toBeNull();
    expect(semCustos.manter.impactoPctFaturamento).toBeNull();
  });

  it('quem não é dono não recebe valores de custo', () => {
    const r = montarCenarios(base({ dono: false }));
    expect('custoAdicionalMensal' in r.manter).toBe(false);
    expect('acrescimoPct' in r.manter).toBe(false);
    expect('custoAnual' in r.manter).toBe(false);
    expect('impactoPctFaturamento' in r.manter).toBe(false);
    expect('faturamentoMensalRef' in r.manter).toBe(false);
    expect('folhaMensal' in r.atual).toBe(false);
  });

  it('sem custos cadastrados o custo fica nulo', () => {
    const r = montarCenarios(base({ custos: null }));
    expect(r.manter.custoAdicionalMensal).toBeNull();
    expect(r.manter.acrescimoPct).toBeNull();
  });

  it('quadro que já cobre tudo não contrata nada', () => {
    const r = montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        pessoas: Array.from({ length: 4 }, () => ({ funcao: 'Farmacêutico', cargaH: 40 })),
      }),
    );
    expect(r.manter.contratacoes).toEqual([]);
    expect(r.manter.ociosidadePct).toBe(0);
    expect(r.manter.custoAdicionalMensal).toBe(0);
    expect(r.manter.acrescimoPct).toBe(0);
    expect(r.manter.direcionamento).toContain('nada a contratar');
  });

  it('informa quantos dias de venda a base tem', () => {
    const v = { data: '2026-03-02', hora: 9, venda: 100, margem: 30, clientes: 1, unidades: 1 };
    expect(montarCenarios(base({ vendas: [v] })).vendasBase).toEqual({ dias: 1 });
    expect(montarCenarios(base()).vendasBase).toBeNull();
  });
});

describe('Cenário 2 — reduzir o fim de semana antes de fechar dias (spec 012)', () => {
  const dias = (abre: number, fecha: number, lista: number[]) =>
    lista.map((dia) => ({ dia, abre, fecha }));
  // Segunda a sábado, 8h às 22h: 84h e 12 turnos por semana (sem domingo).
  const seisDias = dias(8, 22, [0, 1, 2, 3, 4, 5]);
  // Todos os dias, 8h às 22h: 98h e 14 turnos por semana.
  const seteDias = dias(8, 22, [0, 1, 2, 3, 4, 5, 6]);
  // Faturamento por dia (segunda a domingo), margem de 25%. Por mês: × 52 ÷ 12.
  const fat = [1000, 1200, 900, 1100, 1500, 2000, 700];
  const vendasDe = (
    d: typeof seisDias,
    f: (number | null)[] = fat,
    margemPct: number | null = 25,
  ) => vendasDoCadastro({ dias: f, mensal: null, margemPct }, d)!.linhas;
  const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
  const eco = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        dias: seteDias,
        pessoas: farm(40, 40, 24),
        vendas: vendasDe(seteDias),
        origemVenda: 'base', // os fixtures têm venda igual em todas as horas: a conta hora a hora dá o mesmo que dividir o dia
        ...extra,
      }),
    ).economia;

  it('reduz o fechamento do domingo até a equipe caber, sem fechar dia nenhum', () => {
    // 40 + 40 + 24 h: 13 turnos para 14 exigidos. O domingo de 14 h (2 turnos) com 8 h vira 1 turno: 13 cabem.
    // Corte de 6 h: o domingo fecha às 16h. Perda: 700 × 52 ÷ 12 = 3033,33 por mês × 6 ÷ 14 = 1300 de venda
    // (25% = 325 de margem); faturamento: 8400 × 52 ÷ 12 = 36400 → 3,6%.
    const e = eco();
    expect(e.viavel).toBe(true);
    expect(e.naoResolveSozinho).toBe(false);
    expect(e.diasFechar).toEqual([]);
    expect(e.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 6,
        horas: 6,
        de: { abre: '08:00', fecha: '22:00' },
        para: { abre: '08:00', fecha: '16:00' },
      },
    ]);
    expect(e.horariosAjustados).toEqual([
      {
        dia: 6,
        antes: { abre: '08:00', fecha: '22:00' },
        depois: { abre: '08:00', fecha: '16:00' },
      },
    ]);
    expect(e.horasSemana).toBe(92);
    expect(e.horasReduzir).toBe(6);
    expect(e.horarioSemana[6]).toEqual({ dia: 6, aberto: true, abre: '08:00', fecha: '16:00' });
    expect(e.vendaCortadaMes).toBe(1300);
    expect(e.vendaCortadaPorDia).toEqual([{ dia: 6, horasFechadas: 6, ate: 16, vendaMes: 1300 }]);
    expect(e.semVendaHoraria).toBe(false);
    expect(e.perdaFaturamentoPct).toBe(3.6);
    expect(e.resumo).toContain('Domingo fecha 6 h mais cedo (de 08h–22h para 08h–16h)');
    expect(e.resumo).toContain('a equipe atual cobre o horário sem contratar');
  });

  it('segunda a sexta nunca mudam', () => {
    for (const pessoas of [farm(40, 40, 24), farm(40, 40), farm(40, 40, 16), farm(40)]) {
      const e = eco({ pessoas });
      for (const d of [0, 1, 2, 3, 4])
        expect(e.horarioSemana[d]).toEqual({ dia: d, aberto: true, abre: '08:00', fecha: '22:00' });
    }
  });

  it('quando reduzir estoura a trava, fecha o domingo (fase B)', () => {
    // 40 + 40 + 16 h: 12 turnos para 14. Reduzir o domingo ao piso de 4 h ainda deixa 13 turnos exigidos e o
    // sábado precisaria perder mais que os 10% do teto: só fechando o domingo cabem os 12 turnos dos 6 dias.
    // Perda do domingo: 3033,33 (25% = 758,33) de 36400 = 8,3%; horas 84 (≥ 83,3 = 85% de 98).
    const e = eco({ pessoas: farm(40, 40, 16) });
    expect(e.viavel).toBe(true);
    expect(e.passos).toEqual([{ tipo: 'fechar', dia: 6, de: { abre: '08:00', fecha: '22:00' } }]);
    expect(e.diasFechar).toEqual([{ dia: 6, vendaMes: 3033.33 }]);
    expect(e.horasSemana).toBe(84);
    expect(e.perdaFaturamentoPct).toBe(8.3);
    expect(e.naoRecomendado).toBeNull();
  });

  it('dia de maior faturamento (protegido) só reduz, nunca fecha', () => {
    // Domingo com a maior venda e protegido (1 dia): a fase de fechar o domingo não existe.
    const e = eco({
      pessoas: farm(40, 40, 16),
      vendas: vendasDe(seteDias, [1000, 1200, 900, 1100, 1500, 800, 5000]),
      diasProtegidos: 1,
    });
    expect(e.passos.some((p) => p.tipo === 'fechar')).toBe(false);
    expect(e.diasFechar).toEqual([]);
  });

  it('não cabe dentro das travas: mostra o corte possível, o que falta e "não resolve sozinho"', () => {
    // 2 farmacêuticos de 40 h numa loja de 6 dias (84 h, 12 turnos; capacidade 10 turnos): faltam 2 turnos.
    // O sábado de 14 h só cobre 10 turnos se ficar com 8 h (corte de 6 h = 3714 de 33366,67 = 11,1% > 10%).
    // O maior corte válido é de 5 h: 8666,67 × 5 ÷ 14 = 3095,24 (9,3%); ficam 79 h e faltam 16 h (2 turnos).
    const e = eco({ dias: seisDias, pessoas: farm(40, 40), vendas: vendasDe(seisDias) });
    expect(e.viavel).toBe(false);
    expect(e.naoResolveSozinho).toBe(true);
    expect(e.travou).toBe('perda');
    expect(e.faltaH).toBe(16);
    expect(e.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 5,
        horas: 5,
        de: { abre: '08:00', fecha: '22:00' },
        para: { abre: '08:00', fecha: '17:00' },
      },
    ]);
    expect(e.horasSemana).toBe(79);
    expect(e.vendaCortadaMes).toBeCloseTo(3095.24, 0); // soma das horas (cada média arredondada em centavos)
    expect(e.perdaFaturamentoPct).toBe(9.3);
    expect(e.diasFechar).toEqual([]);
    expect(e.motivoInviavel).toContain('não cobre o horário');
    expect(e.resumo).toContain('a perda chegaria ao limite de 10% do faturamento');
    expect(e.resumo).toContain('faltam 16 h de cobertura');
    expect(e.resumo).toContain('Cenário 3');
    // não resolve sozinho fica de fora do selo de sugerido
    const r = montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        dias: seisDias,
        pessoas: farm(40, 40),
        vendas: vendasDe(seisDias),
      }),
    );
    expect(r.economia.impactoMensal).toBeNull();
  });

  it('equipe pequena numa loja de sete dias: corta o fim de semana até o teto e nunca fecha a loja', () => {
    // 40 + 40 h para 98 h: faltam 18 h de cobertura. Domingo 10 h (3033,33 × 10 ÷ 14 = 2166,67) e sábado 2 h
    // (8666,67 × 2 ÷ 14 = 1238,10): perda de 3404,76 = 9,4% de 36400; ficam 86 h (≥ 83,3 = 85% de 98 h).
    // O sábado seguinte já passaria dos 10%: o cenário para e não resolve sozinho.
    const e = eco({ pessoas: farm(40, 40) });
    expect(e.naoResolveSozinho).toBe(true);
    expect(e.travou).toBe('perda');
    expect(e.diasFechar).toEqual([]);
    expect(e.passos.map((p) => [p.tipo, p.dia, p.tipo === 'reduzir' ? p.horas : 0])).toEqual([
      ['reduzir', 6, 10],
      ['reduzir', 5, 2],
    ]);
    expect(e.vendaCortadaMes).toBeCloseTo(3404.76, 0);
    expect(e.perdaFaturamentoPct).toBe(9.4);
    expect(e.horasSemana).toBe(86);
    // com 86 h abertas o gap que sobra é de 6 h (86 − 80)
    expect(e.faltaH).toBe(6);
    for (const d of [0, 1, 2, 3, 4]) expect(e.horarioSemana[d]!.fecha).toBe('22:00');
  });

  it('loja 24 horas: reduz as horas finais do dia, sem passar das travas', () => {
    const d24 = dias(0, 24, [0, 1, 2, 3, 4, 5, 6]);
    const e = eco({
      dias: d24,
      pessoas: farm(40, 40, 40),
      vendas: vendasDe(d24, new Array(7).fill(2400)),
    });
    // 168 h e 21 turnos exigidos, 120 h e 15 de capacidade: precisaria de muito mais que 10% de corte.
    expect(e.naoResolveSozinho).toBe(true);
    expect(e.travou).toBe('perda');
    expect(e.perdaFaturamentoPct).toBeLessThanOrEqual(10);
    expect(e.horasSemana).toBeGreaterThanOrEqual(168 * 0.85);
  });

  it('equipe sem farmacêutico: não há solução reduzindo o fim de semana', () => {
    const e = eco({ pessoas: [{ funcao: 'Atendimento', cargaH: 40 }] });
    expect(e.viavel).toBe(false);
    expect(e.naoResolveSozinho).toBe(false);
    expect(e.motivoInviavel).toContain('Não há Farmacêutico');
  });

  it('quadro que já cobre tudo não muda nada, com perda zero', () => {
    const e = eco({ pessoas: farm(40, 40, 40) });
    expect(e.viavel).toBe(true);
    expect(e.passos).toEqual([]);
    expect(e.horasReduzir).toBe(0);
    expect(e.vendaCortadaMes).toBe(0);
    expect(e.vendaCortadaPorDia).toEqual([]);
    expect(e.direcionamento).toContain('já cobre todos os dias');
  });

  it('sem venda por dia (nem base nem faturamento) diz o que falta e não corta nada', () => {
    const e = eco({ vendas: [], origemVenda: null });
    expect(e.viavel).toBe(false);
    expect(e.motivoInviavel).toContain('faturamento por dia da semana');
    expect(e.vendaCortadaMes).toBeNull();
    expect(e.passos).toEqual([]);
  });

  it('sem margem informada nada muda: a venda perdida não depende da margem', () => {
    const e = eco({ vendas: vendasDe(seteDias, fat, null) });
    expect(e.vendaCortadaMes).toBe(1300);
    expect(e.perdaFaturamentoPct).toBe(3.6);
    expect(e.resumo).toContain('Domingo fecha 6 h mais cedo');
  });

  it('sem venda hora a hora (só o faturamento do Cadastro): os cortes seguem, mas a venda perdida não é estimada (nulo, nunca zero)', () => {
    const e = eco({ origemVenda: 'cadastro' });
    expect(e.semVendaHoraria).toBe(true);
    expect(e.vendaCortadaMes).toBeNull();
    expect(e.vendaCortadaPorDia).toEqual([]);
    expect(e.passos).toHaveLength(1);
    expect(e.aviso).toContain('Sem venda hora a hora');
    expect(e.direcionamento).not.toContain('Deixam de entrar');
  });

  it('o corte de fim de dia perde só a venda das horas que fecham (hora a hora), não a fração do dia', () => {
    // Domingo vende 100 por hora até 15h e 20 por hora das 16h às 21h; fechar às 16h perde as 6 horas de 20.
    const linhas = [0, 1, 2, 3, 4, 5, 6].flatMap((d) =>
      Array.from({ length: 14 }, (_, i) => ({
        data: `2026-09-${String(7 + d).padStart(2, '0')}`,
        hora: 8 + i,
        venda: d === 6 && 8 + i >= 16 ? 20 : 100,
        margem: 0,
        clientes: 1,
        unidades: 1,
      })),
    );
    const e = eco({ vendas: linhas });
    expect(e.vendaCortadaPorDia).toEqual([
      { dia: 6, horasFechadas: 6, ate: 16, vendaMes: Math.round(6 * 20 * (52 / 12) * 100) / 100 },
    ]);
    expect(e.vendaCortadaMes).toBe(Math.round(6 * 20 * (52 / 12) * 100) / 100);
  });

  it('só o faturamento mensal: avisa que a venda é estimada', () => {
    // 52000 por mês, dividido igualmente entre os 7 dias (7428,57 por dia): o corte de 6 h do domingo perde
    // 7428,57 × 6 ÷ 14 = 3183,67 (6,1% de 52000).
    const mensal = vendasDoCadastro(
      { dias: new Array(7).fill(null), mensal: 52000, margemPct: 25 },
      seteDias,
    )!.linhas;
    const e = eco({ vendas: mensal, origemVenda: 'estimativa' });
    expect(e.viavel).toBe(true);
    expect(e.aviso).toContain('Venda estimada');
    expect(e.semVendaHoraria).toBe(true);
    expect(e.vendaCortadaMes).toBeNull();
    expect(e.perdaFaturamentoPct).toBe(6.1);
  });

  it('o aviso de que a venda não é hora a hora só aparece quando a loja não tem a base comercial', () => {
    expect(eco().aviso).toBeNull();
    expect(eco({ origemVenda: 'cadastro' }).aviso).toContain('Sem venda hora a hora');
  });

  it('a recaptura reduz a venda perdida (20% de 1300)', () => {
    const e = eco({ recaptura: 0.2 });
    expect(e.vendaCortadaMes).toBe(1040);
    expect(e.direcionamento).toContain('20%');
  });

  it('quem não é dono vê os passos e a frase, sem valores em reais nem % do faturamento', () => {
    const e = eco({ dono: false });
    expect(e.passos).toHaveLength(1);
    expect(e.perdaFaturamentoPct).toBeUndefined();
    expect(e.resumo).not.toContain('R$');
    expect(e.direcionamento).not.toContain('R$');
    expect(e.direcionamento).not.toContain('%');
  });
});

describe('Cenário 3 — equilíbrio com as travas do fim de semana (spec 012)', () => {
  const dias = (abre: number, fecha: number, lista: number[]) =>
    lista.map((dia) => ({ dia, abre, fecha }));
  // Segunda a sábado, 8h às 22h: 84h por semana. Margem por dia (25%, por mês): 1083,33, 1300, 975, 1191,67, 1625 e 2166,67.
  // Protegidos (os três de maior venda): terça, sexta e sábado. Só o sábado está aberto no fim de semana: pode reduzir até
  // 5 h (a perda de 10% de 33366,67 permite 5 h de 619,05 por hora) e, por ser protegido, nunca fechar. Segunda a sexta nunca mudam.
  const seisDias = dias(8, 22, [0, 1, 2, 3, 4, 5]);
  const fat = [1000, 1200, 900, 1100, 1500, 2000, null];
  const vendasDe = (f: (number | null)[] = fat, margemPct: number | null = 25) =>
    vendasDoCadastro({ dias: f, mensal: null, margemPct }, seisDias)!.linhas;
  const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
  const custos = (salario = 10000) => ({ salarioMedio: { Farmacêutico: salario }, encargosPct: 0 });
  const eq = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        estenderHorario: false, // estes testes são do corte de fim de semana; a extensão tem os seus abaixo
        minimos: { Farmacêutico: 1 },
        dias: seisDias,
        pessoas: farm(40, 40),
        vendas: vendasDe(),
        custos: custos(),
        origemVenda: 'base', // venda igual em todas as horas (fixture do cadastro): a conta hora a hora fecha com a do dia
        ...extra,
      }),
    );
  // Com a venda (e não a margem) no impacto, cortar horário só compensa quando a folha que se evita é muito maior que a venda
  // de cada hora cortada (aqui 619,05 por hora do sábado): salário de 40000 deixa a hora de parcial em 1000.
  const caro = custos(40000);

  it('2 farmacêuticos de 40h: reduz o sábado 3 h e contrata só 1 h de parcial; nunca fecha dia útil', () => {
    // Capacidade 80 h para 84 h. Reduzir o sábado de h horas deixa um gap de (4 − h) h, a 1000 por hora de parcial
    // (40000 × 5 ÷ 200), mais a venda perdida (619,05 por hora cortada): h=0 → 4000; h=1 → 3619,05; h=2 → 3238,10;
    // h=3 → 1000 + 1857,14 = 2857,14 (o melhor); h=4 → a conta de turnos volta a exigir 16 h de parcial; h=5 → ainda pior.
    const r = eq({ custos: caro });
    const e = r.equilibrio;
    expect(e.indisponivel).toBeNull();
    expect(e.diasFechar).toEqual([]);
    expect(e.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 5,
        horas: 3,
        de: { abre: '08:00', fecha: '22:00' },
        para: { abre: '08:00', fecha: '19:00' },
      },
    ]);
    expect(e.horariosAjustados).toEqual([
      {
        dia: 5,
        antes: { abre: '08:00', fecha: '22:00' },
        depois: { abre: '08:00', fecha: '19:00' },
      },
    ]);
    expect(e.contratacoes).toMatchObject([{ funcao: 'Farmacêutico', inteiras: 0, parcialH: 1 }]);
    expect(e.custoAdicionalMensal).toBe(1000);
    expect(e.vendaCortadaMes).toBeCloseTo(1857.14, 0);
    expect(e.vendaCortadaPorDia).toMatchObject([{ dia: 5, horasFechadas: 3, ate: 19 }]);
    expect(e.impactoMensal).toBeCloseTo(2857.14, 0);
    expect(e.horasSemana).toBe(81);
    expect(e.horasReduzir).toBe(3);
    expect(e.coincideComManter).toBe(false);
    expect(e.coincideComEconomia).toBe(false);
    expect(e.resumo).toContain('Sábado fecha 3 h mais cedo');
    expect(e.resumo).toContain('economiza');
    // segunda a sexta ficam com o horário de hoje
    for (const d of [0, 1, 2, 3, 4])
      expect(e.horarioSemana[d]).toMatchObject({ abre: '08:00', fecha: '22:00' });
    expect(e.horarioSemana[5]).toMatchObject({ abre: '08:00', fecha: '19:00' });
  });

  it('quando contratar custa menos que a venda de qualquer corte, o equilíbrio é contratar tudo', () => {
    // salário de 1000: manter tudo custa 1000 × 4 × 5 ÷ 200 = 100, menos que a venda de 1 h do sábado (619,05)
    const e = eq({ custos: custos(1000) }).equilibrio;
    expect(e.passos).toEqual([]);
    expect(e.diasFechar).toEqual([]);
    expect(e.coincideComManter).toBe(true);
    expect(e.contratacoes).toMatchObject([{ funcao: 'Farmacêutico', inteiras: 0, parcialH: 4 }]);
    expect(e.custoAdicionalMensal).toBe(100);
    expect(e.resumo).toContain('contratar tudo');
    expect(e.vendaCortadaMes).toBe(0);
    expect(e.impactoMensal).toBe(100);
  });

  it('1 farmacêutico de 40h: reduz o sábado 4 h e ainda contrata 1 integral; custa menos que manter tudo', () => {
    // Salário de 40000. Manter tudo: faltam 44 h → 1 integral + 1 parcial de 4h = 44000. Reduzindo o sábado 4 h (80 h abertas)
    // falta 40 h → 1 integral = 40000, mais a venda de 4 h (619,05 × 4 = 2476,19): impacto 42476,19 < 44000. A 5 h (limite da
    // trava de perda) ficam 39 h faltando e já não compensa.
    const r = eq({ pessoas: farm(40), custos: caro });
    const e = r.equilibrio;
    expect(e.passos).toMatchObject([{ tipo: 'reduzir', dia: 5, horas: 4 }]);
    expect(e.contratacoes).toMatchObject([{ funcao: 'Farmacêutico', inteiras: 1, parcial: null }]);
    expect(e.custoAdicionalMensal).toBe(40000);
    expect(e.vendaCortadaMes).toBeCloseTo(2476.19, 0);
    expect(e.impactoMensal).toBeCloseTo(42476.19, 0);
    expect(e.horasSemana).toBe(80);
    expect(e.coincideComManter).toBe(false);
    expect(e.resumo).toContain('Sábado fecha 4 h mais cedo');
    expect(r.manter.impactoMensal).toBe(44000);
    expect(e.impactoMensal!).toBeLessThanOrEqual(r.manter.impactoMensal!);
    expect(r.diasProtegidos).toEqual([1, 4, 5]);
  });

  it('com a folha em salário de 10000 e a venda hora a hora, cortar o sábado não compensa: o equilíbrio é manter o horário', () => {
    // a hora cortada vende 619,05 e poupa só 250 de parcial: o melhor é contratar tudo e não mexer no horário
    const e = eq({ pessoas: farm(40) }).equilibrio;
    expect(e.passos).toEqual([]);
    expect(e.coincideComManter).toBe(true);
    expect(e.vendaCortadaMes).toBe(0);
  });

  it('é de fato o mínimo: nenhuma redução do sábado dentro das travas tem impacto menor (conferência independente)', () => {
    const entrada = base({
      minimos: { Farmacêutico: 1 },
      dias: seisDias,
      pessoas: farm(40),
      vendas: vendasDe(),
      custos: caro,
    });
    const regra = regraPara('r40', false);
    const vendaPorHora = 8666.67 / 14;
    const impactos = [0, 1, 2, 3, 4, 5].map((h) => {
      const abertos = seisDias.map((d) => (d.dia === 5 ? { ...d, fecha: d.fecha - h } : d));
      const linhas = verificarRegra(regra, abertos, entrada.minimos, entrada.pessoas);
      const custo = custoDasVagas('r40', contratacoesDe(linhas), linhas, entrada.custos) ?? 0;
      return custo + vendaPorHora * h;
    });
    expect(Math.min(...impactos)).toBeCloseTo(42476.19, 0);
    expect(eq({ pessoas: farm(40), custos: caro }).equilibrio.impactoMensal!).toBeCloseTo(
      Math.min(...impactos),
      0,
    );
  });

  it('nunca fecha dia útil nem passa das travas, mesmo quando fechar a terça sairia mais barato', () => {
    // margem baixíssima nos dias úteis e salário altíssimo: fechar segunda, quarta ou quinta seria o melhor antes da spec 012
    const e = eq({ custos: custos(50000) }).equilibrio;
    expect(e.diasFechar.every((d) => d.dia >= 5)).toBe(true);
    for (const d of [0, 1, 2, 3, 4]) expect(e.horarioSemana[d]!.aberto).toBe(true);
    // perda de até 10% do faturamento (33366,67) e ao menos 85% das 84 h
    expect(e.vendaCortadaMes!).toBeLessThanOrEqual(3336.67);
    expect(e.horasSemana).toBeGreaterThanOrEqual(71.4);
  });

  it('com domingo aberto e não protegido: pode reduzir ou fechar o domingo', () => {
    // sete dias, domingo vende pouco (700): é o corte mais barato; 2 farmacêuticos de 40 h para 98 h
    const sete = dias(8, 22, [0, 1, 2, 3, 4, 5, 6]);
    const f7 = [1000, 1200, 900, 1100, 1500, 2000, 700];
    const e = eq({
      dias: sete,
      custos: caro,
      vendas: vendasDoCadastro({ dias: f7, mensal: null, margemPct: 25 }, sete)!.linhas,
    }).equilibrio;
    expect(e.passos.every((p) => p.dia >= 5)).toBe(true);
    expect(e.passos.some((p) => p.dia === 6)).toBe(true);
  });

  it('empate no impacto: menos contratações, depois menos dias fechados, depois menos horas cortadas', () => {
    // salário altíssimo e dias iguais: nenhum corte permitido (até 5 h do sábado) cobre sem contratar, então
    // vence quem corta menos horas entre os que custam o mesmo
    const e = eq({ custos: custos(0.01) }).equilibrio;
    expect(e.passos).toEqual([]);
    expect(e.coincideComManter).toBe(true);
  });

  it('a recaptura reduz a venda perdida (20% de 1857,14 = 1485,71)', () => {
    const e = eq({ recaptura: 0.2, custos: caro }).equilibrio;
    expect(e.passos).toMatchObject([{ tipo: 'reduzir', dia: 5, horas: 3 }]);
    expect(e.vendaCortadaMes).toBeCloseTo(1485.71, 0);
    expect(e.impactoMensal).toBeCloseTo(2485.71, 0);
  });

  it('quem não é dono vê os passos e as contratações, sem valores em reais', () => {
    const e = eq({ dono: false, custos: caro }).equilibrio;
    expect(e.diasFechar).toEqual([]);
    expect(e.passos).toMatchObject([{ tipo: 'reduzir', dia: 5, horas: 3 }]);
    expect('custoAdicionalMensal' in e).toBe(false);
    expect('acrescimoPct' in e).toBe(false);
    expect('vendaGanhaMes' in e).toBe(false);
    expect(e.resumo).not.toContain('R$');
  });

  it('loja de um só dia útil: nada a cortar, coincide com o Cenário 1', () => {
    const um = dias(8, 22, [2]);
    const e = eq({
      dias: um,
      pessoas: farm(8),
      vendas: vendasDoCadastro(
        { dias: [null, null, 900, null, null, null, null], mensal: null, margemPct: 25 },
        um,
      )!.linhas,
    }).equilibrio;
    expect(e.diasFechar).toEqual([]);
    expect(e.passos).toEqual([]);
    expect(e.coincideComManter).toBe(true);
  });

  it('sem vendas, sem venda hora a hora ou sem custos, explica o que falta e não mostra número', () => {
    const semVendas = eq({ vendas: [], origemVenda: null }).equilibrio;
    expect(semVendas.indisponivel?.motivo).toBe('vendas');
    expect(semVendas.diasFechar).toEqual([]);
    expect(semVendas.vendaCortadaMes).toBeNull();

    // só o faturamento por dia do Cadastro: não dá para comparar contratar com abrir ou fechar horário
    const semHoraria = eq({ origemVenda: 'cadastro' }).equilibrio;
    expect(semHoraria.indisponivel?.motivo).toBe('vendas');
    expect(semHoraria.indisponivel?.texto).toContain('hora a hora');
    expect(semHoraria.semVendaHoraria).toBe(true);

    // sem margem nada muda: a margem não é mais usada
    expect(eq({ vendas: vendasDe(fat, null) }).equilibrio.indisponivel).toBeNull();

    expect(eq({ custos: null }).equilibrio.indisponivel?.motivo).toBe('custos');

    const faltaFuncao = eq({
      minimos: { Farmacêutico: 1, Atendimento: 1 },
      custos: { salarioMedio: { Farmacêutico: 10000 }, encargosPct: 0 },
    }).equilibrio;
    expect(faltaFuncao.indisponivel?.motivo).toBe('custos');
    expect(faltaFuncao.indisponivel?.texto).toContain('Atendimento');
    expect(faltaFuncao.custoAdicionalMensal).toBeNull();

    expect(eq({ custos: null, dono: false }).equilibrio.indisponivel?.texto).toContain(
      'dono do grupo',
    );
  });
});

describe('Direcionamento — destaque de menor impacto financeiro', () => {
  const semana = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 8, fecha: 17 }));
  const vendas = [0, 1, 2, 3, 4].flatMap((d) =>
    Array.from({ length: 9 }, (_, i) => {
      const hora = 8 + i;
      const venda = hora === 16 ? 100 : d === 1 && hora === 8 ? 50 : 200;
      return {
        data: `2026-03-0${2 + d}`,
        hora,
        venda,
        margem: venda * 0.3,
        clientes: 1,
        unidades: 1,
      };
    }),
  );
  const com = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        pessoas: [{ funcao: 'Farmacêutico', cargaH: 40 }],
        dias: semana,
        vendas,
        ...extra,
      }),
    );

  it('escolhe o menor entre custo adicional e margem perdida', () => {
    // Farmacêutico de 40h e outro de 16h: 56h e 7 turnos para 45h e 10 turnos. Cenário 1: faltam 3 turnos →
    // 1 parcial de 24h: 10000 × 24 × 5 ÷ 200 = 6000. O Cenário 2 (só fim de semana, com travas) não cobre e fica de
    // fora da escolha; o selo vai para o menor impacto entre os cenários calculáveis.
    const r = com({
      pessoas: [
        { funcao: 'Farmacêutico', cargaH: 40 },
        { funcao: 'Farmacêutico', cargaH: 16 },
      ],
    });
    expect(r.manter.impactoMensal).toBe(6000);
    expect(r.economia.impactoMensal).toBeNull();
    const impactos = [r.manter.impactoMensal, r.equilibrio.impactoMensal].filter(
      (x): x is number => typeof x === 'number',
    );
    expect(r[r.destaque!].impactoMensal).toBe(Math.min(...impactos));
  });

  it('Cenário 2 que não resolve sozinho não entra na escolha do selo', () => {
    // 1 farmacêutico de 40h: o fim de semana sozinho não cobre o horário.
    const r = com();
    expect(r.economia.naoResolveSozinho).toBe(true);
    expect(r.economia.impactoMensal).toBeNull();
    expect(r.destaque).not.toBe('economia');
  });

  it('empate no impacto: vence o que contrata menos, depois a ordem 1, 3, 2', () => {
    const r = com({
      pessoas: Array.from({ length: 4 }, () => ({ funcao: 'Farmacêutico', cargaH: 40 })),
    });
    expect(r.manter.impactoMensal).toBe(0);
    expect(r.economia.impactoMensal).toBe(0);
    expect(r.equilibrio.impactoMensal).toBe(0);
    expect(r.destaque).toBe('manter');
  });

  it('Cenário 2 sem solução fica de fora da comparação', () => {
    const r = com({ pessoas: [{ funcao: 'Atendimento', cargaH: 40 }] });
    expect(r.economia.viavel).toBe(false);
    expect(r.economia.impactoMensal).toBeNull();
    expect(['manter', 'equilibrio']).toContain(r.destaque);
  });

  it('sem custos ou sem base comercial não há destaque', () => {
    expect(com({ custos: null }).destaque).toBeNull();
    expect(com({ vendas: [] }).destaque).toBeNull();
  });

  it('quem não é dono não recebe destaque nem impactos', () => {
    const r = com({ dono: false });
    expect('destaque' in r).toBe(false);
    expect('impactoMensal' in r.manter).toBe(false);
    expect('impactoMensal' in r.economia).toBe(false);
    expect('impactoMensal' in r.equilibrio).toBe(false);
  });
});

describe('Cenário 2 — premissa, resultado e falta de cobertura', () => {
  // Farmacêutico coberto; o atendimento fica abaixo do nível de hoje (44 h) quando a regra cai para 42 h.
  const coberto = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        regraId: 'r42',
        minimos: { Farmacêutico: 1 },
        pessoas: [
          { funcao: 'Farmacêutico', cargaH: 44 },
          { funcao: 'Farmacêutico', cargaH: 44 },
          { funcao: 'Farmacêutico', cargaH: 44 },
          { funcao: 'Atendimento', cargaH: 44 },
          { funcao: 'Atendimento', cargaH: 44 },
        ],
        ...extra,
      }),
    ).economia;

  it('sem corte: premissa fixa, nenhum horário muda e a falta aparece por função, sem farmacêutico descoberto', () => {
    const eco = coberto();
    expect(eco.foco).toBe('Não contratar; ajustar horários só se precisar');
    expect(eco.resultado).toBe('Nenhum horário precisa mudar');
    expect(eco.passos).toEqual([]);
    expect(eco.semFarmaceuticoH).toBe(0);
    expect(eco.faltaPorFuncao.length).toBeGreaterThan(0);
    expect(eco.faltaPorFuncao.every((f) => f.funcao !== 'Farmacêutico' && f.horasSemana > 0)).toBe(true);
  });

  it('sem falta de nenhuma função: lista vazia', () => {
    const eco = coberto({ regraId: 'r40', pessoas: base().pessoas.concat(base().pessoas) });
    expect(eco.faltaPorFuncao).toEqual([]);
    expect(eco.semFarmaceuticoH).toBe(0);
  });

  it('quem não é dono recebe as mesmas horas', () => {
    expect(coberto({ dono: false }).faltaPorFuncao).toEqual(coberto().faltaPorFuncao);
  });

  it('farmacêutico sem cobertura em todo o horário: mostra as horas descobertas', () => {
    const eco = coberto({
      pessoas: [
        { funcao: 'Farmacêutico', cargaH: 40 },
        { funcao: 'Atendimento', cargaH: 44 },
      ],
    });
    expect(eco.semFarmaceuticoH).toBeGreaterThan(0);
  });

  it('com corte de fim de semana: o resultado descreve o dia que muda', () => {
    const r = montarCenarios(
      base({
        regraId: 'r42',
        dias: [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: 8, fecha: 22 })),
        pessoas: [
          { funcao: 'Farmacêutico', cargaH: 44 },
          { funcao: 'Farmacêutico', cargaH: 44 },
        ],
        minimos: { Farmacêutico: 1 },
      }),
    ).economia;
    if (r.passos.length) expect(r.resultado).toContain('fecha');
    expect(r.resultado).not.toBe('Nenhum horário precisa mudar');
  });
});

describe('régua do cenário: margem ou venda (spec 033)', () => {
  const seis = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
  const porMes = vendasDoCadastro({ dias: [1000, 1200, 900, 1100, 1500, 2000, null], mensal: null, margemPct: null }, seis)!.linhas;
  // Margem uniforme de 25% da venda de cada hora.
  const uniforme = porMes.map((l) => ({ ...l, margem: l.venda * 0.25 }));
  const cenario = (vendas: typeof porMes, regua: EntradaCenarios['regua'], extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        dias: seis,
        pessoas: [
          { funcao: 'Farmacêutico', cargaH: 40 },
          { funcao: 'Farmacêutico', cargaH: 40 },
        ],
        vendas,
        custos: { salarioMedio: { Farmacêutico: 40000 }, encargosPct: 0 },
        origemVenda: 'base',
        estenderHorario: false,
        regua,
        ...extra,
      }),
    );

  it('sem régua ou na régua de venda, o resultado é o mesmo de antes', () => {
    const a = cenario(uniforme, null);
    const b = cenario(uniforme, { tipo: 'venda' });
    expect(b.equilibrio).toEqual(a.equilibrio);
    expect(b.economia).toEqual(a.economia);
    expect(a.regua).toBeNull();
    expect(b.regua).toEqual({ tipo: 'venda' });
  });

  it('na régua de margem a perda do Cenário 3 é a margem das horas cortadas; a venda real fica à parte', () => {
    const m = cenario(uniforme, { tipo: 'margem' }).equilibrio;
    expect(m.vendaCortadaMes).not.toBeNull();
    expect(m.vendaCortadaRealMes).toBeGreaterThan(0);
    // Margem uniforme de 25%: a margem perdida é um quarto da venda perdida, qualquer que seja o horário escolhido.
    expect(m.vendaCortadaMes!).toBeCloseTo(m.vendaCortadaRealMes! * 0.25, 0);
  });

  it('a trava de perda segue em venda real: com margem baixa o corte não passa de 10% do faturamento', () => {
    const m = cenario(uniforme, { tipo: 'margem' }).equilibrio;
    const v = cenario(uniforme, { tipo: 'venda' }).equilibrio;
    const fatMes = ((1000 + 1200 + 900 + 1100 + 1500 + 2000) * 52) / 12;
    expect(m.vendaCortadaRealMes! / fatMes).toBeLessThanOrEqual(0.1 + 1e-9);
    expect(v.vendaCortadaRealMes! / fatMes).toBeLessThanOrEqual(0.1 + 1e-9);
  });

  it('hora de venda alta e margem baixa deixa de ser protegida: o Cenário 3 corta mais do que cortaria pela venda', () => {
    // No sábado, as horas do fim do dia vendem igual às outras mas rendem 5% de margem (as demais, 90%).
    const contraria = porMes.map((l) => {
      const dia = (new Date(`${l.data}T00:00:00Z`).getUTCDay() + 6) % 7;
      const fimDoDia = l.hora >= 16;
      return { ...l, margem: l.venda * (dia === 5 && fimDoDia ? 0.05 : 0.9) };
    });
    const porVenda = cenario(contraria, { tipo: 'venda' }).equilibrio;
    const porMargem = cenario(contraria, { tipo: 'margem' }).equilibrio;
    expect(porMargem.horasReduzir).toBeGreaterThanOrEqual(porVenda.horasReduzir);
    expect(porMargem.vendaCortadaMes!).toBeLessThan(porMargem.vendaCortadaRealMes!);
  });

  it('o ganho das horas novas também é medido na régua (50% da hora vizinha)', () => {
    const m = cenario(uniforme, { tipo: 'margem' }, { estenderHorario: true, custos: { salarioMedio: { Farmacêutico: 1000 }, encargosPct: 0 } }).equilibrio;
    if (m.vendaGanhaMes != null && m.vendaGanhaRealMes != null && m.vendaGanhaRealMes > 0)
      expect(m.vendaGanhaMes).toBeCloseTo(m.vendaGanhaRealMes * 0.25, 0);
  });

  it('o texto diz margem quando a régua é margem e venda quando é venda', () => {
    const m = cenario(uniforme, { tipo: 'margem' }, { custos: { salarioMedio: { Farmacêutico: 40000 }, encargosPct: 0 } });
    const v = cenario(uniforme, { tipo: 'venda' }, { custos: { salarioMedio: { Farmacêutico: 40000 }, encargosPct: 0 } });
    expect(m.economia.direcionamento).toMatch(/de margem por mês|margem perdida/);
    expect(v.economia.direcionamento).not.toMatch(/margem/);
  });
});
