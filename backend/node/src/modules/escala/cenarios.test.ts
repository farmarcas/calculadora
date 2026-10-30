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
        origemVenda: 'cadastro',
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
    expect(e.margemCortadaMes).toBe(325);
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
    expect(e.diasFechar).toEqual([{ dia: 6, vendaMes: 3033.33, margemMes: 758.33 }]);
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
    expect(e.vendaCortadaMes).toBe(3095.24);
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
    expect(e.vendaCortadaMes).toBe(3404.76);
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
    expect(e.margemCortadaMes).toBe(0);
    expect(e.direcionamento).toContain('já cobre todos os dias');
  });

  it('sem venda por dia (nem base nem faturamento) diz o que falta e não corta nada', () => {
    const e = eco({ vendas: [], origemVenda: null });
    expect(e.viavel).toBe(false);
    expect(e.motivoInviavel).toContain('faturamento por dia da semana');
    expect(e.margemCortadaMes).toBeNull();
    expect(e.passos).toEqual([]);
  });

  it('sem margem informada: a margem perdida é nula (não zero), e a perda de faturamento continua', () => {
    const e = eco({ vendas: vendasDe(seteDias, fat, null) });
    expect(e.margemInformada).toBe(false);
    expect(e.margemCortadaMes).toBeNull();
    expect(e.vendaCortadaMes).toBe(1300);
    expect(e.perdaFaturamentoPct).toBe(3.6);
    expect(e.resumo).toContain('Domingo fecha 6 h mais cedo');
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
    expect(e.vendaCortadaMes).toBe(3183.67);
    expect(e.perdaFaturamentoPct).toBe(6.1);
  });

  it('o aviso de estimativa por hora acompanha toda redução de horário', () => {
    expect(eco().aviso).toContain('supõe vendas iguais em todas as horas do dia');
  });

  it('a recaptura reduz a venda e a margem perdidas (20% de 1300 e de 325)', () => {
    const e = eco({ recaptura: 0.2 });
    expect(e.vendaCortadaMes).toBe(1040);
    expect(e.margemCortadaMes).toBe(260);
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

describe('Cenário 3 — equilíbrio por enumeração dos dias', () => {
  const dias = (abre: number, fecha: number, lista: number[]) =>
    lista.map((dia) => ({ dia, abre, fecha }));
  // Segunda a sábado, 8h às 22h: 84h e 12 turnos por semana. Margem por dia (25%): 250, 300, 225, 275, 375 e 500.
  const seisDias = dias(8, 22, [0, 1, 2, 3, 4, 5]);
  const fat = [1000, 1200, 900, 1100, 1500, 2000, null];
  const vendasDe = (f: (number | null)[] = fat, margemPct: number | null = 25) =>
    vendasDoCadastro({ dias: f, mensal: null, margemPct }, seisDias)!.linhas;
  const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
  const custos = (salario = 10000) => ({ salarioMedio: { Farmacêutico: salario }, encargosPct: 0 });
  const eq = (extra: Partial<EntradaCenarios> = {}) =>
    montarCenarios(
      base({
        minimos: { Farmacêutico: 1 },
        dias: seisDias,
        pessoas: farm(40, 40),
        vendas: vendasDe(),
        custos: custos(),
        origemVenda: 'cadastro',
        ...extra,
      }),
    );

  it('fecha a quarta e não contrata: custa 975 de margem e evita 1000 de folha', () => {
    // 2 farmacêuticos de 40h para 84h: manter tudo pede 1 parcial de 4h (10000 × 4 × 5 ÷ 200 = 1000).
    // Fechar a quarta (225 × 52 ÷ 12 = 975) cobre sem contratar. Fechar também a segunda só perderia mais margem.
    const r = eq();
    const e = r.equilibrio;
    expect(e.indisponivel).toBeNull();
    expect(e.diasFechar.map((d) => d.dia)).toEqual([2]);
    expect(e.pessoasContratar).toBe(0);
    expect(e.margemCortadaMes).toBe(975);
    expect(e.custoAdicionalMensal).toBe(0);
    expect(e.impactoMensal).toBe(975);
    expect(e.coincideComManter).toBe(false);
    // O Cenário 2 agora só mexe no fim de semana (spec 012): não coincide com este caminho. O Cenário 3 recebe as
    // mesmas travas na fatia 4 da spec 012; até lá ele segue enumerando os dias.
    expect(e.coincideComEconomia).toBe(false);
    expect(e.resumo).toContain('Fechando quarta e sem contratar ninguém');
    expect(e.resumo).toContain('economiza');
    expect(e.horasSemana).toBe(70);
  });

  it('quando contratar custa menos que a margem de qualquer dia, o equilíbrio é contratar tudo', () => {
    // salário de 1000: manter tudo custa 1000 × 4 × 5 ÷ 200 = 100 < 975 (a menor margem de dia fechável)
    const e = eq({ custos: custos(1000) }).equilibrio;
    expect(e.diasFechar).toEqual([]);
    expect(e.coincideComManter).toBe(true);
    expect(e.contratacoes).toMatchObject([{ funcao: 'Farmacêutico', inteiras: 0, parcialH: 4 }]);
    expect(e.custoAdicionalMensal).toBe(100);
    expect(e.resumo).toContain('contratar tudo');
    // margem dos seis dias: 1083,33 + 1300 + 975 + 1191,67 + 1625 + 2166,67 = 8341,67; menos 100 de folha
    expect(e.resultadoMensal).toBe(8241.67);
  });

  it('combina fechar dias e contratar: 1 farmacêutico de 40h fecha segunda, quarta e quinta e contrata 1 parcial de 2h', () => {
    // Todos abertos: faltam 44 h → 1 integral + 1 parcial de 4h = 11000. Fechando segunda, quarta e quinta (os três livres)
    // sobram 3 dias de 14h (42h): faltam 2 h → 1 parcial de 2h = 500; margem perdida 1083,33 + 975 + 1191,67 = 3250.
    const r = eq({ pessoas: farm(40) });
    const e = r.equilibrio;
    expect(e.diasFechar.map((d) => d.dia)).toEqual([0, 2, 3]);
    expect(e.contratacoes).toMatchObject([
      { funcao: 'Farmacêutico', inteiras: 0, parcial: { turnos: 1, horas: 2 } },
    ]);
    expect(e.custoAdicionalMensal).toBe(500);
    expect(e.margemCortadaMes).toBe(3250);
    expect(e.impactoMensal).toBe(3750);
    expect(e.coincideComManter).toBe(false);
    expect(e.coincideComEconomia).toBe(false);
    expect(e.resumo).toContain('Fechando segunda, quarta e quinta');
    expect(e.resumo).toContain('contratando 1 Farmacêutico (1 parcial de 2h)');
    expect(e.resumo).toContain('economiza');
    // nunca fecha dia protegido (terça, sexta e sábado)
    expect(r.diasProtegidos).toEqual([1, 4, 5]);
    // domina o Cenário 1 (manter tudo: 11000); o Cenário 2 é "não recomendado" e fica de fora
    expect(r.manter.impactoMensal).toBe(11000);
    expect(e.impactoMensal!).toBeLessThanOrEqual(r.manter.impactoMensal!);
    // 1 farmacêutico de 40h: reduzir o fim de semana não chega perto de cobrir 84 h (Cenário 2 não resolve sozinho)
    expect(r.economia.naoResolveSozinho).toBe(true);
  });

  it('é de fato o mínimo: nenhuma combinação dos dias livres tem impacto menor (conferência independente)', () => {
    const entrada = base({
      minimos: { Farmacêutico: 1 },
      dias: seisDias,
      pessoas: farm(40),
      vendas: vendasDe(),
      custos: custos(),
    });
    const regra = regraPara('r40', false);
    const margemMes = [1083.33, 1300, 975, 1191.67, 1625, 2166.67];
    const livres = [0, 2, 3]; // os protegidos (terça, sexta, sábado) não entram
    const impactos = [0, 1, 2, 3, 4, 5, 6, 7].map((mascara) => {
      const fechados = livres.filter((_, i) => mascara & (1 << i));
      const abertos = seisDias.filter((d) => !fechados.includes(d.dia));
      const linhas = verificarRegra(regra, abertos, entrada.minimos, entrada.pessoas);
      const custo = custoDasVagas('r40', contratacoesDe(linhas), linhas, entrada.custos) ?? 0;
      return custo + fechados.reduce((s, d) => s + margemMes[d]!, 0);
    });
    expect(Math.min(...impactos)).toBeCloseTo(3750, 2);
    expect(eq({ pessoas: farm(40) }).equilibrio.impactoMensal!).toBeCloseTo(
      Math.min(...impactos),
      2,
    );
  });

  it('empate no impacto: menos contratações, depois menos dias fechados, depois os dias mais tardios', () => {
    // seis dias iguais (1000): protegidos = sábado, sexta e quinta; livres = segunda, terça e quarta, com a mesma margem
    // (1083,33). Com salário de 20000 o parcial de 4h custa 2000, mais que um dia: fechar qualquer um cobre sem contratar;
    // o mais tardio é a quarta.
    const e = eq({ vendas: vendasDe(new Array(7).fill(1000)), custos: custos(20000) }).equilibrio;
    expect(e.diasFechar.map((d) => d.dia)).toEqual([2]);
    // (o Cenário 2 só mexe no fim de semana desde a spec 012)
    expect(e.coincideComEconomia).toBe(false);
  });

  it('a recaptura reduz a margem perdida (20% de 975 = 780)', () => {
    const e = eq({ recaptura: 0.2 }).equilibrio;
    expect(e.diasFechar.map((d) => d.dia)).toEqual([2]);
    expect(e.margemCortadaMes).toBe(780);
    expect(e.impactoMensal).toBe(780);
  });

  it('quem não é dono vê os dias e as contratações, sem valores em reais', () => {
    const e = eq({ dono: false }).equilibrio;
    expect(e.diasFechar).toEqual([{ dia: 2 }]);
    expect('custoAdicionalMensal' in e).toBe(false);
    expect('acrescimoPct' in e).toBe(false);
    expect('resultadoMensal' in e).toBe(false);
    expect(e.resumo).not.toContain('R$');
  });

  it('loja de um só dia: nunca fecha o último dia aberto', () => {
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
    expect(e.coincideComManter).toBe(true);
  });

  it('sem vendas, sem margem ou sem custos, explica o que falta e não mostra número', () => {
    const semVendas = eq({ vendas: [], origemVenda: null }).equilibrio;
    expect(semVendas.indisponivel?.motivo).toBe('vendas');
    expect(semVendas.diasFechar).toEqual([]);
    expect(semVendas.margemCortadaMes).toBeNull();

    const semMargem = eq({ vendas: vendasDe(fat, null) }).equilibrio;
    expect(semMargem.indisponivel?.motivo).toBe('vendas');
    expect(semMargem.indisponivel?.texto).toContain('margem bruta');

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
