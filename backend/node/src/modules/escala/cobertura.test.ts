import { describe, expect, it } from 'vitest';
import { cobertura } from './cobertura.js';

const dias = [0, 1].map((dia) => ({ dia, abre: 8, fecha: 12 }));

describe('cobertura', () => {
  it('desconta o intervalo e usa o pior dia', () => {
    const turnos = [
      { funcao: 'Caixa', dias: [0, 1], entrada: 8, saida: 12, iniIntervalo: 10, fimIntervalo: 11 },
      { funcao: 'Caixa', dias: [0], entrada: 8, saida: 12, iniIntervalo: null, fimIntervalo: null },
    ];
    const r = cobertura(dias, turnos, { Caixa: 1 });
    const caixa = r.funcoes.find((f) => f.funcao === 'Caixa')!;
    expect(caixa.porHora.map((c) => c.pessoas)).toEqual([1, 1, 0, 1]);
    // terça só tem 1 pessoa, que sai para o intervalo às 10h: a hora 10 fica descoberta
    expect(caixa.porHora.find((c) => c.hora === 10)).toMatchObject({ pessoas: 0, ok: false });
  });

  it('mostra falta de farmacêutico mesmo sem ninguém na escala', () => {
    const r = cobertura(dias, [], { Farmacêutico: 1 });
    expect(r.funcoes[0]!.porHora.every((c) => c.ok === false)).toBe(true);
  });
});
