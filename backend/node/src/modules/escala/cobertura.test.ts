import { describe, expect, it } from 'vitest';
import { cobertura } from './cobertura.js';

const dias = [0, 1].map((dia) => ({ dia, abre: 8, fecha: 12 }));

describe('cobertura', () => {
  it('intervalo de até 2 horas não desconta (spec 045); acima disso desconta e usa o pior dia', () => {
    const turnos = [
      { funcao: 'Caixa', dias: [0, 1], entrada: 8, saida: 12, iniIntervalo: 10, fimIntervalo: 11 },
      { funcao: 'Caixa', dias: [0], entrada: 8, saida: 12, iniIntervalo: null, fimIntervalo: null },
    ];
    const r = cobertura(dias, turnos, { Caixa: 1 });
    const caixa = r.funcoes.find((f) => f.funcao === 'Caixa')!;
    // terça só tem 1 pessoa, em intervalo de 1 h às 10h: ela continua contando
    expect(caixa.porHora.map((c) => c.pessoas)).toEqual([1, 1, 1, 1]);
    expect(caixa.porHora.find((c) => c.hora === 10)).toMatchObject({ pessoas: 1, ok: true });
    // com 3 h de intervalo (9h–12h) a pessoa sai da cobertura nessas horas
    const longo = [
      { funcao: 'Caixa', dias: [0, 1], entrada: 8, saida: 12, iniIntervalo: 9, fimIntervalo: 12 },
    ];
    const c2 = cobertura(dias, longo, { Caixa: 1 }).funcoes.find((f) => f.funcao === 'Caixa')!;
    expect(c2.porHora.map((c) => c.pessoas)).toEqual([1, 0, 0, 0]);
  });

  it('mostra falta de farmacêutico mesmo sem ninguém na escala', () => {
    const r = cobertura(dias, [], { Farmacêutico: 1 });
    expect(r.funcoes[0]!.porHora.every((c) => c.ok === false)).toBe(true);
  });
});
