import { describe, expect, it } from 'vitest';
import { regraPara } from '../regras/perfis.js';
import {
  aplicarFolgas,
  coberturaDaFuncao,
  semanaComFolgas,
  turnosDosHorarios,
  type HorarioPessoa,
} from './semana-com-folgas.js';

const dias = (n = 7) => Array.from({ length: n }, (_, dia) => ({ dia, abre: 8, fecha: 18 }));
const todos = [0, 1, 2, 3, 4, 5, 6];
const h = (
  matricula: string,
  funcao = 'Caixa',
  diasDe: number[] = todos,
  extra: Partial<HorarioPessoa> = {},
): HorarioPessoa => ({
  matricula,
  funcao,
  cargaH: 44,
  dias: diasDe,
  entrada: 8,
  saida: 18,
  iniIntervalo: null,
  fimIntervalo: null,
  ...extra,
});
const r44 = regraPara('atual', false);
const r42 = regraPara('r42', false);
const minimos = { Caixa: 1 };
const contaDias = (ts: { matricula: string }[], m: string) =>
  ts.filter((t) => t.matricula === m).length;

describe('aplicarFolgas', () => {
  it('regra de 44h tira 1 dia e a de 42h tira 2', () => {
    const horarios = [h('A'), h('B'), h('C')];
    const a = aplicarFolgas({ horarios, dias: dias(), regra: r44, minimos });
    expect(['A', 'B', 'C'].map((m) => contaDias(a.turnos, m))).toEqual([6, 6, 6]);
    const b = aplicarFolgas({ horarios, dias: dias(), regra: r42, minimos });
    expect(['A', 'B', 'C'].map((m) => contaDias(b.turnos, m))).toEqual([5, 5, 5]);
  });

  it('quem já está no limite não muda', () => {
    const horarios = [h('A', 'Caixa', [0, 1, 2, 3, 4, 5])];
    const a = aplicarFolgas({ horarios, dias: dias(), regra: r44, minimos: { Caixa: 0 } });
    expect(a.retirados).toEqual([]);
  });

  it('pessoas da mesma função folgam em dias diferentes quando dá', () => {
    const a = aplicarFolgas({ horarios: [h('A'), h('B')], dias: dias(), regra: r44, minimos });
    const ds = a.retirados.map((r) => r.dia);
    expect(new Set(ds).size).toBe(ds.length);
  });

  it('mantém o horário e o intervalo dos turnos que sobram', () => {
    const horarios = [h('A', 'Caixa', todos, { iniIntervalo: 12, fimIntervalo: 13 })];
    const a = aplicarFolgas({ horarios, dias: dias(), regra: r44, minimos: { Caixa: 0 } });
    expect(a.turnos.every((t) => t.entrada === 8 && t.iniIntervalo === 12)).toBe(true);
  });

  it('domingo: ceil(n/3) pessoas por função folgam', () => {
    const horarios = ['A', 'B', 'C', 'D', 'E', 'F'].map((m) => h(m));
    const a = aplicarFolgas({ horarios, dias: dias(), regra: r44, minimos });
    const folgam = horarios.filter(
      (p) => !a.turnos.some((t) => t.matricula === p.matricula && t.dia === 6),
    );
    expect(folgam).toHaveLength(2);
    expect(a.domingoSugerido).toBe(true);
  });

  it('loja fechada no domingo: o domingo não entra', () => {
    const horarios = ['A', 'B', 'C'].map((m) => h(m, 'Caixa', [0, 1, 2, 3, 4, 5]));
    const a = aplicarFolgas({ horarios, dias: dias(6), regra: r42, minimos });
    expect(a.domingoSugerido).toBe(false);
    expect(a.turnos.every((t) => t.dia < 6)).toBe(true);
  });

  it('função com 1 pessoa e mínimo 1: domingo não é forçado e o aviso aparece', () => {
    const a = aplicarFolgas({ horarios: [h('A')], dias: dias(), regra: r44, minimos });
    expect(a.avisos.some((x) => x.startsWith('Domingo:'))).toBe(true);
    expect(a.turnos.some((t) => t.dia === 6)).toBe(true);
  });

  it('falta inevitável vira aviso por dia e função', () => {
    const a = aplicarFolgas({ horarios: [h('A')], dias: dias(), regra: r44, minimos });
    expect(a.avisos.some((x) => /vai faltar caixa das 8h às 17h/.test(x))).toBe(true);
  });
});

describe('coberturaDaFuncao', () => {
  it('exige 1 farmacêutico em todas as horas; intervalo de até 2 h não desconta, o de 3 h desconta (spec 045)', () => {
    const horarios = [h('F', 'Farmacêutico', [0], { iniIntervalo: 12, fimIntervalo: 13 })];
    const cob = coberturaDaFuncao('Farmacêutico', turnosDosHorarios(horarios), dias(1), {});
    expect(cob[0]!.find((c) => c.hora === 12)).toMatchObject({ pessoas: 1, exigido: 1 });
    expect(cob[0]!.find((c) => c.hora === 9)).toMatchObject({ pessoas: 1, exigido: 1 });
    const longo = [h('F', 'Farmacêutico', [0], { iniIntervalo: 12, fimIntervalo: 15 })];
    const c2 = coberturaDaFuncao('Farmacêutico', turnosDosHorarios(longo), dias(1), {});
    expect(c2[0]!.find((c) => c.hora === 13)).toMatchObject({ pessoas: 0, exigido: 1 });
  });

  it('o almoço do único farmacêutico não vira falta nem contratação', () => {
    const horarios = [
      h('F', 'Farmacêutico', [0, 1, 2, 3, 4], { saida: 17, iniIntervalo: 12, fimIntervalo: 13 }),
    ];
    const aberta = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 8, fecha: 17 }));
    const s = semanaComFolgas({ regra: r42, dias: aberta, minimos: {}, horarios });
    expect(s.funcoes['Farmacêutico']!.faltaH).toBe(0);
    expect(s.funcoes['Farmacêutico']!.vagas).toEqual([]);
  });
});

describe('semanaComFolgas', () => {
  it('cobre o que as folgas descobrem com contratações posicionadas', () => {
    const horarios = [
      h('F1', 'Farmacêutico', todos, { saida: 13 }),
      h('F2', 'Farmacêutico', todos, { entrada: 13 }),
    ];
    const s = semanaComFolgas({ regra: r42, dias: dias(), minimos: {}, horarios });
    const f = s.funcoes['Farmacêutico']!;
    expect(f.faltaH).toBeGreaterThan(0);
    expect(f.vagas.length).toBeGreaterThan(0);
    expect(f.vagas.every((v) => v.turnos.length > 0)).toBe(true);
    expect(f.resolve).toBe(true);
  });

  it('sem falta, não há contratação', () => {
    const horarios = ['A', 'B', 'C', 'D']
      .map((m) => h(m, 'Farmacêutico', todos, { entrada: 8, saida: 16 }))
      .concat(
        ['E', 'F', 'G', 'H'].map((m) => h(m, 'Farmacêutico', todos, { entrada: 10, saida: 18 })),
      );
    const s = semanaComFolgas({ regra: r42, dias: dias(), minimos: {}, horarios });
    expect(s.funcoes['Farmacêutico']!.faltaH).toBe(0);
    expect(s.funcoes['Farmacêutico']!.vagas).toEqual([]);
  });

  it('o gap da sugestão cobre ao menos a falta', () => {
    const s = semanaComFolgas({
      regra: r42,
      dias: dias(),
      minimos: {},
      horarios: [h('F1', 'Farmacêutico')],
    });
    const f = s.funcoes['Farmacêutico']!;
    expect(f.gapParaSugestaoH).toBeGreaterThanOrEqual(f.faltaH);
  });
});

describe('ajustarJornada (a pessoa cabe na regra)', () => {
  it('corta o fim do turno que passa do máximo do dia e do teto da semana', () => {
    const horarios = [h('A', 'Caixa', todos, { entrada: 8, saida: 17 })]; // 9 h por dia, 7 dias
    const a = aplicarFolgas({ horarios, dias: dias(), regra: r42, minimos: { Caixa: 0 } });
    const total = a.turnos.reduce((s, t) => s + (t.saida - t.entrada), 0);
    expect(a.turnos).toHaveLength(5);
    expect(total).toBeLessThanOrEqual(40 + 1e-9);
    expect(a.turnos.every((t) => t.entrada === 8 && t.saida - t.entrada <= 8)).toBe(true);
  });
});
