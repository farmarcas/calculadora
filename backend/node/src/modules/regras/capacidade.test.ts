import { describe, expect, it } from 'vitest';
import { AVISO_CRF, passa, verificarRegra, type LinhaFuncao } from './capacidade.js';
import { regraPara } from './perfis.js';

// Loja aberta de segunda a sábado, das 8h às 22h (14h por dia: 84 h e 12 turnos por semana).
const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
const quadro = farm(44, 44);
const de = (linhas: LinhaFuncao[], funcao: string) => linhas.find((l) => l.funcao === funcao)!;

describe('farmacêutico: único cargo obrigatório', () => {
  it('passa na regra atual com dois farmacêuticos de 44 h', () => {
    // Necessidade 84 h e 12 turnos; capacidade 2 × 44 = 88 h e 12 turnos (turno de 7,33 h).
    const l = de(
      verificarRegra(regraPara('atual', false), dias, { Farmacêutico: 1 }, quadro),
      'Farmacêutico',
    );
    expect(l).toMatchObject({
      obrigatorio: true,
      origemMeta: 'lei',
      necessidadeH: 84,
      necessidadeT: 12,
      capacidadeH: 88,
      saldoH: 4,
      saldoT: 0,
      falta: false,
      gapH: 0,
      sugestao: null,
      contratar: 0,
    });
  });

  it('falta na regra de 40 h: o gap é em horas (4 h) e a sugestão é um parcial de 4 h', () => {
    const linhas = verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, quadro);
    const l = de(linhas, 'Farmacêutico');
    expect(passa(linhas)).toBe(false);
    // 2 × 40 = 80 h para 84 h: faltam 4 h. Pela conta de turnos (10 de 12) ainda falta 1 turno depois do parcial.
    expect(l).toMatchObject({
      capacidadeH: 80,
      saldoH: -4,
      saldoT: -2,
      gapH: 4,
      faltaH: 4,
      cargaCheiaH: 40,
    });
    expect(l).toMatchObject({ contratar: 1, contratarInteiras: 0, parcialH: 4, falta: true });
    expect(l.sugestao).toMatchObject({
      tipo: 'parcial',
      parcialH: 4,
      horasContratadas: 4,
      horasOciosas: 0,
      ociosidadePct: 0,
    });
    expect(l.sugestao!.avisos).toContain(AVISO_CRF);
    expect(l.sugestao!.avisos.join(' ')).toContain('ainda podem faltar 1 turno(s)');
  });

  it('42 h sem convenção vale 40 h; com convenção as horas passam, mas faltam turnos', () => {
    const sem = de(
      verificarRegra(regraPara('r42', false), dias, { Farmacêutico: 1 }, quadro),
      'Farmacêutico',
    );
    const com = de(
      verificarRegra(regraPara('r42', true), dias, { Farmacêutico: 1 }, quadro),
      'Farmacêutico',
    );
    expect(sem.capacidadeH).toBe(80);
    expect(com.capacidadeH).toBe(84);
    // as horas passam, mas 2 pessoas em 5 dias dão 10 turnos para 12: 2 turnos de 8,4 h = 16,8 h de gap
    expect(com).toMatchObject({ okH: true, okT: false, saldoT: -2, gapH: 16.8 });
    expect(com.sugestao).toMatchObject({ tipo: 'parcial', parcialH: 16.8 });
  });

  it('sem nenhum farmacêutico o gap é a necessidade inteira, mesmo sem mínimo escrito', () => {
    const l = de(verificarRegra(regraPara('r40', false), dias, {}, []), 'Farmacêutico');
    expect(l).toMatchObject({
      pessoas: 0,
      minimo: 1,
      necessidadeH: 84,
      capacidadeH: 0,
      gapH: 84,
      falta: true,
    });
    // 84 h com jornada de 40 h: 2 integrais (80 h) não bastam; 3 integrais (120 h)? não: 2 integrais + parcial de 4 h
    expect(l.sugestao).toMatchObject({
      tipo: 'integral_parcial',
      inteiras: 2,
      parcialH: 4,
      horasOciosas: 0,
    });
  });

  it('o parâmetro limiteParcial é ignorado desde a spec 013', () => {
    const a = de(
      verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, quadro),
      'Farmacêutico',
    );
    const b = de(
      verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, quadro, {
        limiteParcial: 0,
      }),
      'Farmacêutico',
    );
    expect(b.sugestao).toEqual(a.sugestao);
  });
});

describe('demais cargos: sem mínimo', () => {
  it('loja sem atendente nem caixa não acusa falta desses cargos', () => {
    const linhas = verificarRegra(
      regraPara('r40', false),
      dias,
      { Farmacêutico: 1 },
      farm(40, 40, 40),
    );
    expect(linhas.map((l) => l.funcao)).toEqual(['Farmacêutico']);
    expect(passa(linhas)).toBe(true);
  });

  it('meta é manter o nível de hoje: 4 atendentes de 44 h na regra de 40 h → gap de 16 h e parcial de 16 h', () => {
    const atendentes = [1, 2, 3, 4].map(() => ({ funcao: 'Atendimento', cargaH: 44 }));
    const l = de(
      verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, [
        ...farm(40, 40, 40),
        ...atendentes,
      ]),
      'Atendimento',
    );
    expect(l).toMatchObject({
      obrigatorio: false,
      origemMeta: 'nivel_de_hoje',
      minimo: 0,
      metaH: 176,
      capacidadeH: 160,
      gapH: 16,
      falta: false, // nível de hoje nunca "falta"
      contratar: 1,
      parcialH: 16,
    });
  });

  it('na regra atual (44 h) o quadro mantém o nível de hoje: nenhuma sugestão', () => {
    const atendentes = [1, 2].map(() => ({ funcao: 'Atendimento', cargaH: 44 }));
    const l = de(
      verificarRegra(regraPara('atual', false), dias, { Farmacêutico: 1 }, [
        ...quadro,
        ...atendentes,
      ]),
      'Atendimento',
    );
    expect(l).toMatchObject({ metaH: 88, capacidadeH: 88, gapH: 0, sugestao: null, contratar: 0 });
  });

  it('meta do dono (pessoas por hora): vale no lugar do nível de hoje, é opcional e não bloqueia', () => {
    // Caixa 1 por hora = 84 h; sem ninguém no quadro, tudo é gap; na regra atual (jornada 44 h): 2 integrais (88 h)
    const linhas = verificarRegra(
      regraPara('atual', false),
      dias,
      { Farmacêutico: 1, Caixa: 1 },
      quadro,
    );
    const c = de(linhas, 'Caixa');
    expect(c).toMatchObject({
      pessoas: 0,
      origemMeta: 'dono',
      minimo: 1,
      metaH: 84,
      capacidadeH: 0,
      gapH: 84,
      falta: true,
      contratar: 2,
      contratarInteiras: 2,
    });
    expect(c.sugestao).toMatchObject({
      tipo: 'integral',
      inteiras: 2,
      horasContratadas: 88,
      horasOciosas: 4,
    });
    // o farmacêutico cobre: a meta do dono não bloqueia
    expect(passa(linhas)).toBe(true);
  });

  it('cargo com carga acima da jornada atual conta até a jornada atual na meta', () => {
    const l = de(
      verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, [
        ...farm(40, 40, 40),
        { funcao: 'Apoio', cargaH: 60 },
      ]),
      'Apoio',
    );
    // meta = min(60, 44) = 44; capacidade = min(60, 40) = 40
    expect(l).toMatchObject({ metaH: 44, capacidadeH: 40, gapH: 4 });
  });

  it('com horário menor (cenário) a meta acompanha as horas abertas', () => {
    // Domingo de 6 h: 90 h abertas em vez de 84. Ao todo 98 → aqui usamos 84 de hoje e 90 do cenário (mais horas).
    const comDomingo = [...dias, { dia: 6, abre: 8, fecha: 14 }];
    const atendentes = [1, 2, 3, 4].map(() => ({ funcao: 'Atendimento', cargaH: 44 }));
    const l = de(
      verificarRegra(
        regraPara('r40', false),
        comDomingo,
        { Farmacêutico: 1 },
        [...farm(40, 40, 40), ...atendentes],
        { horasAbertasHoje: 98 },
      ),
      'Atendimento',
    );
    // 90 ÷ 98 de 176 h = 161,63 h de meta; capacidade 160 h → gap 1,63 h
    expect(l).toMatchObject({ metaH: 161.63, gapH: 1.63 });
  });
});

describe('contratação por horas na linha do cargo', () => {
  // Porto Feliz: segunda a sábado 8h–22h e domingo 8h–18h = 94 h por semana e 14 turnos; 1 farmacêutico de 44 h.
  const portoFeliz = [...dias, { dia: 6, abre: 8, fecha: 18 }];
  const custos = { salarioMedio: { Farmacêutico: 4722 }, encargosPct: 66 };

  it('gap de 54 h (regra de 42 h): 1 integral de 40 h + 1 parcial de 14 h, custo e avisos', () => {
    const l = de(
      verificarRegra(regraPara('r42', false), portoFeliz, { Farmacêutico: 1 }, farm(44), {
        custos,
      }),
      'Farmacêutico',
    );
    expect(l).toMatchObject({
      necessidadeH: 94,
      capacidadeH: 40,
      saldoH: -54,
      saldoT: -9,
      gapH: 54,
      contratar: 2,
      contratarInteiras: 1,
      parcialH: 14,
    });
    expect(l.sugestao).toMatchObject({
      tipo: 'integral_parcial',
      inteiras: 1,
      parcialH: 14,
      horasContratadas: 54,
      horasUsadas: 54,
      horasOciosas: 0,
      ociosidadePct: 0,
      custoMensal: 10078.1, // 7465,2571 + 2612,84
    });
    // o parcial de farmacêutico leva o aviso do CRF; as horas fecham, mas pela conta de turnos faltam 2 turnos
    // (9 faltantes − 5 do integral − 2 do parcial de 14 h)
    expect(l.sugestao!.avisos).toContain(AVISO_CRF);
    expect(l.sugestao!.avisos.join(' ')).toContain('ainda podem faltar 2 turno(s)');
  });

  it('a regra de 40 h dá o mesmo gap; sem custos o custo fica nulo e as horas aparecem', () => {
    const l = de(
      verificarRegra(regraPara('r40', false), portoFeliz, { Farmacêutico: 1 }, farm(44)),
      'Farmacêutico',
    );
    expect(l.gapH).toBe(54);
    expect(l.sugestao).toMatchObject({ inteiras: 1, parcialH: 14, custoMensal: null });
  });

  it('gap de 10 h de farmacêutico: parcial de 10 h; de 35 h: integral', () => {
    // Loja de 90 h: 1 farmacêutico de 40 h e 1 integral de 40 h → 80 h; gap 10 h
    const dez = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 23 })); // 6 × 15 = 90 h
    expect(
      de(
        verificarRegra(regraPara('r40', false), dez, { Farmacêutico: 1 }, farm(40, 40)),
        'Farmacêutico',
      ).sugestao,
    ).toMatchObject({ tipo: 'parcial', parcialH: 10 });
    // 75 h abertas (5 × 15) com 1 farmacêutico de 40 h: gap 35 h → integral
    const setenta5 = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 8, fecha: 23 }));
    expect(
      de(
        verificarRegra(regraPara('r40', false), setenta5, { Farmacêutico: 1 }, farm(40)),
        'Farmacêutico',
      ).sugestao,
    ).toMatchObject({ tipo: 'integral', inteiras: 1, horasOciosas: 5 });
  });

  it('loja 24 horas: 168 h por semana, 2 farmacêuticos de 40 h → gap de 88 h = 2 integrais + parcial de 8 h', () => {
    const d24 = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: 0, fecha: 24 }));
    const l = de(
      verificarRegra(regraPara('r40', false), d24, { Farmacêutico: 1 }, farm(40, 40)),
      'Farmacêutico',
    );
    expect(l).toMatchObject({ necessidadeH: 168, capacidadeH: 80, gapH: 88 });
    expect(l.sugestao).toMatchObject({
      tipo: 'integral_parcial',
      inteiras: 2,
      parcialH: 8,
      horasOciosas: 0,
    });
  });

  it('a variante de 26 h + 6 h extras aparece como alternativa quando reduz a ociosidade', () => {
    // gap de 32 h: 1 farmacêutico de 40 h e loja de 72 h (6 × 12)
    const doze = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 20 }));
    const l = de(
      verificarRegra(regraPara('r40', false), doze, { Farmacêutico: 1 }, farm(40)),
      'Farmacêutico',
    );
    expect(l.gapH).toBe(32);
    expect(l.sugestao).toMatchObject({ tipo: 'integral', horasOciosas: 8 });
    expect(l.alternativa).toMatchObject({
      variante: 'com_hora_extra',
      parcialH: 26,
      extrasH: 6,
      horasOciosas: 0,
    });
  });

  it('parcial de outro cargo não leva o aviso do CRF', () => {
    const atendentes = [1, 2, 3, 4].map(() => ({ funcao: 'Atendimento', cargaH: 44 }));
    const l = de(
      verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, [
        ...farm(40, 40, 40),
        ...atendentes,
      ]),
      'Atendimento',
    );
    expect(l.sugestao!.avisos).toEqual([]);
  });
});
