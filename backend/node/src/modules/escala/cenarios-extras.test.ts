import { describe, expect, it } from 'vitest';
import { passa, verificarRegra } from '../regras/capacidade.js';
import { regraPara } from '../regras/perfis.js';
import { montarCenarios, type EntradaCenarios } from './cenarios.js';
import { montarExtras } from './cenarios-extras.js';
import { vendasDoCadastro } from './vendas-cadastro.js';

const farm = (cargaH: number) => ({ funcao: 'Farmacêutico', cargaH });
const entrada = (extra: Partial<EntradaCenarios> = {}): EntradaCenarios => ({
  regraId: 'r40',
  convencao8h24: false,
  // segunda a sexta, 9h às 17h
  dias: [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 9, fecha: 17 })),
  minimos: { Farmacêutico: 1 },
  pessoas: [farm(40), farm(16)],
  vendas: [],
  custos: { salarioMedio: { Farmacêutico: 10000 }, encargosPct: 0 },
  dono: true,
  ...extra,
});
const estender = (e: EntradaCenarios) => montarExtras(e, montarCenarios(e)).estender;

// Uma linha de venda por dia da semana (2026-03-02 é segunda): margem dada para as horas 9 e 16,
// as pontas do horário 9h–17h. Venda = 4 × margem.
const vendasPontas = (pontas: Record<number, [number, number]>) =>
  Object.entries(pontas).flatMap(([d, [ini, fim]]) =>
    [
      [9, ini],
      [16, fim],
    ].map(([hora, margem]) => ({
      data: `2026-03-0${2 + Number(d)}`,
      hora: hora!,
      venda: margem! * 4,
      margem: margem!,
      clientes: 1,
      unidades: 1,
    })),
  );

describe('Cenário 4 — abrir um dia hoje fechado', () => {
  // Segunda a sexta, 9h às 17h (40h e 5 turnos). Faturamento de 960 por dia com margem de 25%: margem de 240 por dia,
  // 1040 por mês (240 × 52 ÷ 12). Um dia que nunca vendeu vale 50% disso: 520 de margem e 2080 de venda por mês.
  const dias = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 9, fecha: 17 }));
  const vendasDe = () =>
    vendasDoCadastro(
      { dias: [960, 960, 960, 960, 960, null, null], mensal: null, margemPct: 25 },
      dias,
    )!.linhas;
  const aberto = (extra: Partial<EntradaCenarios> = {}) =>
    estender(entrada({ dias, vendas: vendasDe(), origemVenda: 'cadastro', ...extra }));

  it('com sobra de capacidade abre os dois dias fechados: 40h + 16h = 56h e 7 turnos cabem em 56h e 7 turnos', () => {
    // equipe de 40h e 16h: 56h e 7 turnos; sábado e domingo de 8h cada dão 56h e 7 turnos
    const e = aberto();
    expect(e.disponivel).toBe(true);
    expect(e.diasAbrir.map((d) => d.dia)).toEqual([5, 6]);
    expect(e.diasAbrir[0]).toMatchObject({
      abre: '09:00',
      fecha: '17:00',
      margemMes: 520,
      vendaMes: 2080,
    });
    expect(e.horasEstender).toBe(16);
    expect(e.horasSemana).toBe(56);
    expect(e.horarioSemana[5]).toMatchObject({ aberto: true, abre: '09:00', fecha: '17:00' });
    expect(e.vendaRefMes).toBe(4160);
    expect(e.margemRefMes).toBe(1040);
    expect(e.aviso).toContain('50%');
    expect(e.resumo).toContain('Abrindo sábado e domingo (09:00–17:00)');
    expect(e.resumo).toContain('sem nova contratação');
  });

  it('dono: custo do Cenário 1 e impacto líquido (custo menos a margem de referência)', () => {
    const e = aberto();
    // a equipe atual já cobre os cinco dias: o Cenário 1 não contrata, custo 0 → impacto −1040
    expect(e.custoAdicionalMensal).toBe(0);
    expect(e.impactoMensal).toBe(-1040);
  });

  it('dia que tem histórico de venda vale o que vendeu, não a estimativa, e abre primeiro', () => {
    // sábado vendeu 800 por dia com margem de 200: 866,67 de margem por mês (> 520 do domingo)
    const sabado = [
      { data: '2026-03-07', hora: 10, venda: 800, margem: 200, clientes: 1, unidades: 1 },
    ];
    const e = aberto({ vendas: [...vendasDe(), ...sabado], pessoas: [farm(40), farm(8)] });
    // equipe de 40h e 8h: 48h e 6 turnos: só cabe um dia a mais (48h e 6 turnos)
    expect(e.diasAbrir.map((d) => d.dia)).toEqual([5]);
    expect(e.diasAbrir[0]).toMatchObject({ margemMes: 866.67, vendaMes: 3466.67 });
    expect(e.margemRefMes).toBe(866.67);
    expect(e.aviso).toBeNull(); // nada estimado
  });

  it('usa a sobra das contratações do Cenário 1: uma inteira contratada para cobrir o resto abre o domingo', () => {
    // equipe de 8h (1 turno) para 40h e 5 turnos: faltam 4 turnos (acima do limite do parcial) → 1 inteira de 40h.
    // Com ela: 48h e 6 turnos, sobra um dia de 8h. Desempate entre sábado e domingo (520 cada): o mais tardio.
    const e = aberto({ pessoas: [farm(8)] });
    expect(e.diasAbrir.map((d) => d.dia)).toEqual([6]);
    expect(e.direcionamento).toContain('sobra das contratações do Cenário 1');
    expect(e.custoAdicionalMensal).toBe(10000); // 10000 × 40 × 5 ÷ 200 da inteira do Cenário 1
    expect(e.impactoMensal).toBe(9480); // 10000 − 520
  });

  it('sem sobra de capacidade, explica o motivo', () => {
    // 40h e 5 turnos para 40h e 5 turnos: abrir um dia pediria nova contratação
    const e = aberto({ pessoas: [farm(40)] });
    expect(e.disponivel).toBe(false);
    expect(e.diasAbrir).toEqual([]);
    expect(e.motivoIndisponivel).toContain('sobra de capacidade');
    expect(e.custoAdicionalMensal).toBeNull();
  });

  it('loja aberta todos os dias não tem dia para abrir', () => {
    const todos = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: 8, fecha: 16 }));
    const e = estender(
      entrada({ dias: todos, vendas: [], pessoas: [farm(40), farm(40), farm(40)] }),
    );
    expect(e.disponivel).toBe(false);
    expect(e.motivoIndisponivel).toContain('Todos os dias');
  });

  it('o fator de dia novo é ajustável: 25% vale 260 por dia; 0% não compensa abrir', () => {
    const e25 = aberto({ fatorDiaNovo: 0.25 });
    expect(e25.margemRefMes).toBe(520); // 2 dias × 260
    expect(e25.aviso).toContain('25%');
    const e0 = aberto({ fatorDiaNovo: 0 });
    expect(e0.disponivel).toBe(false);
    expect(e0.motivoIndisponivel).toContain('margem estimada positiva');
  });

  it('sem venda nenhuma escolhe os dias só pela capacidade, sem valores, e avisa', () => {
    const e = aberto({ vendas: [], origemVenda: null });
    expect(e.disponivel).toBe(true);
    expect(e.diasAbrir.map((d) => d.dia)).toEqual([5, 6]);
    expect(e.vendaRefMes).toBeNull();
    expect(e.margemRefMes).toBeNull();
    expect(e.aviso).toContain('Sem venda informada');
    expect(e.impactoMensal).toBeNull();
  });

  it('quem não é dono vê os dias e o horário, sem valores em reais', () => {
    const e = aberto({ dono: false });
    expect(e.diasAbrir).toEqual([
      { dia: 5, abre: '09:00', fecha: '17:00' },
      { dia: 6, abre: '09:00', fecha: '17:00' },
    ]);
    expect('custoAdicionalMensal' in e).toBe(false);
    expect('impactoMensal' in e).toBe(false);
    expect(e.resumo).not.toContain('R$');
    expect(e.direcionamento).not.toContain('R$');
  });

  it('o dia aberto continua coberto: a equipe cobre horas, turnos e farmacêutico, e mais um dia não caberia', () => {
    const e = aberto();
    const regra = regraPara('r40', false);
    const abertos = [...dias, ...e.diasAbrir.map((d) => ({ dia: d.dia, abre: 9, fecha: 17 }))];
    expect(passa(verificarRegra(regra, abertos, { Farmacêutico: 1 }, [farm(40), farm(16)]))).toBe(
      true,
    );
  });
});

describe('Cenário 5 — reduzir equipe', () => {
  const caixa = (cargaH: number) => ({ funcao: 'Caixa', cargaH });
  const reduzir = (extra: Partial<EntradaCenarios> = {}) => {
    const e = entrada({
      minimos: { Farmacêutico: 1, Caixa: 1 },
      // quatro farmacêuticos de 40h e dois caixas (40h e 16h) para 40h e 5 turnos por semana
      pessoas: [farm(40), farm(40), farm(40), farm(40), caixa(40), caixa(16)],
      custos: { salarioMedio: { Farmacêutico: 10000, Caixa: 2500 }, encargosPct: 0 },
      ...extra,
    });
    return { e, r: montarExtras(e, montarCenarios(e)).reduzir };
  };

  it('conta o excedente por cargo, tirando primeiro quem tem menor carga', () => {
    const { r } = reduzir();
    // um farmacêutico de 40h já cobre 40h e 5 turnos: sobram 3. Um caixa de 40h cobre: sobra o de 16h.
    expect(r.temExcedente).toBe(true);
    expect(r.cargos).toMatchObject([
      { funcao: 'Farmacêutico', pessoasHoje: 4, pessoasNecessarias: 1, excedente: 3 },
      { funcao: 'Caixa', pessoasHoje: 2, pessoasNecessarias: 1, excedente: 1 },
    ]);
    expect(r.pessoasExcedentes).toBe(4);
    expect(r.aviso).toContain('validação trabalhista');
    expect(r.direcionamento).toContain('não uma recomendação');
  });

  it('economia de folha por cargo, total e % sobre a folha atual (só dono)', () => {
    const { r } = reduzir();
    expect(r.cargos.map((x) => x.economiaMensal)).toEqual([30000, 2500]);
    expect(r.economiaMensal).toBe(32500);
    // folha atual: 4 × 10000 + 2 × 2500 = 45000
    expect(r.economiaPct).toBe(72.2);
    expect(r.impactoMensal).toBe(-32500);
  });

  it('retirar o excedente mantém a cobertura e retirar mais uma pessoa a quebra', () => {
    const { e, r } = reduzir();
    const regra = regraPara('r40', false);
    const ficam = (funcao: string, n: number) => [
      ...e.pessoas.filter((p) => p.funcao !== funcao),
      ...e.pessoas.filter((p) => p.funcao === funcao).slice(0, n),
    ];
    for (const x of r.cargos) {
      const ok = verificarRegra(regra, e.dias, e.minimos, ficam(x.funcao, x.pessoasNecessarias));
      const menos = verificarRegra(
        regra,
        e.dias,
        e.minimos,
        ficam(x.funcao, x.pessoasNecessarias - 1),
      );
      expect(ok.find((l) => l.funcao === x.funcao)!.falta).toBe(false);
      expect(menos.find((l) => l.funcao === x.funcao)!.falta).toBe(true);
    }
  });

  it('cargo em falta ou justo não tem excedente; avisa a falta', () => {
    const { r } = reduzir({
      // um farmacêutico de 40h (justo) e um caixa de 16h (falta)
      pessoas: [farm(40), caixa(16)],
    });
    expect(r.temExcedente).toBe(false);
    expect(r.cargos.map((x) => x.excedente)).toEqual([0, 0]);
    expect(r.direcionamento).toContain('Não há gente sobrando');
    expect(r.aviso).toContain('Falta gente em Caixa');
    expect(r.economiaMensal).toBe(0);
  });

  it('cargos sem mínimo ficam de fora', () => {
    const { r } = reduzir({
      pessoas: [
        farm(40),
        farm(40),
        { funcao: 'Apoio', cargaH: 40 },
        { funcao: 'Apoio', cargaH: 40 },
      ],
      minimos: { Farmacêutico: 1, Apoio: 0 },
    });
    expect(r.cargos.map((x) => x.funcao)).toEqual(['Farmacêutico']);
    expect(r.pessoasExcedentes).toBe(1);
  });

  it('sem salário de um cargo com excedente, o total fica nulo; sem custos, só pessoas', () => {
    const faltaSalario = reduzir({
      custos: { salarioMedio: { Farmacêutico: 10000 }, encargosPct: 0 },
    }).r;
    expect(faltaSalario.cargos[0]!.economiaMensal).toBe(30000);
    expect(faltaSalario.cargos[1]!.economiaMensal).toBeNull();
    expect(faltaSalario.economiaMensal).toBeNull();
    expect(faltaSalario.economiaPct).toBeNull();
    expect(faltaSalario.pessoasExcedentes).toBe(4);

    const semCustos = reduzir({ custos: null }).r;
    expect(semCustos.economiaMensal).toBeNull();
    expect(semCustos.pessoasExcedentes).toBe(4);
  });

  it('quem não é dono vê só pessoas, sem economia nem impacto', () => {
    const { r } = reduzir({ dono: false });
    expect('economiaMensal' in r).toBe(false);
    expect('economiaPct' in r).toBe(false);
    expect('impactoMensal' in r).toBe(false);
    expect('economiaMensal' in r.cargos[0]!).toBe(false);
    expect(r.pessoasExcedentes).toBe(4);
  });
});

describe('Encaixe dos cenários 4 e 5', () => {
  const vendas = vendasPontas({ 0: [40, 30], 1: [20, 60], 2: [10, 10], 3: [50, 25], 4: [35, 70] });

  it('ficam fora da escolha do selo de menor impacto, que segue entre os cenários 1 a 3', () => {
    const e = entrada({ vendas });
    const c = montarCenarios(e);
    const antes = c.destaque;
    const extras = montarExtras(e, c);
    expect(['manter', 'economia', 'equilibrio']).toContain(antes);
    // o selo não muda com os extras, e os extras não entram no resultado dos três
    expect(c.destaque).toBe(antes);
    expect('estender' in c).toBe(false);
    expect('reduzir' in c).toBe(false);
    // cada extra tem o próprio impacto (só para o dono)
    expect(extras.estender.impactoMensal).not.toBeUndefined();
    expect(extras.reduzir.impactoMensal).not.toBeUndefined();
  });

  it('todo cenário traz uma frase de direcionamento', () => {
    const e = entrada({ vendas });
    const x = montarExtras(e, montarCenarios(e));
    expect(x.estender.direcionamento.length).toBeGreaterThan(20);
    expect(x.reduzir.direcionamento.length).toBeGreaterThan(20);
  });
});
