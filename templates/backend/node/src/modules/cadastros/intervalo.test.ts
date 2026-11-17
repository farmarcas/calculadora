import { describe, expect, it } from 'vitest';
import { validarIntervalo } from './intervalo.js';

const base = { entrada: '08:00', saida: '17:00' };

describe('validarIntervalo', () => {
  it('sem intervalo é válido, com ou sem horário de trabalho', () => {
    expect(validarIntervalo({ ...base })).toBeNull();
    expect(validarIntervalo({})).toBeNull();
    expect(validarIntervalo({ ...base, ini: null, fim: null })).toBeNull();
    expect(validarIntervalo({ ...base, ini: '', fim: '' })).toBeNull();
  });
  it('12:00 às 13:00 dentro de 08:00 às 17:00 é válido', () => {
    expect(validarIntervalo({ ...base, ini: '12:00', fim: '13:00' })).toBeNull();
  });
  it('as pontas do turno valem (início na entrada, fim na saída)', () => {
    expect(validarIntervalo({ ...base, ini: '08:00', fim: '17:00' })).toBeNull();
  });
  it('só o início ou só o fim: informe os dois', () => {
    const msg = 'Informe o início e o fim do intervalo (ou deixe os dois em branco)';
    expect(validarIntervalo({ ...base, ini: '12:00' })).toBe(msg);
    expect(validarIntervalo({ ...base, fim: '13:00' })).toBe(msg);
  });
  it('o fim tem de ser depois do início', () => {
    const msg = 'O fim do intervalo deve ser depois do início';
    expect(validarIntervalo({ ...base, ini: '13:00', fim: '12:00' })).toBe(msg);
    expect(validarIntervalo({ ...base, ini: '12:00', fim: '12:00' })).toBe(msg);
  });
  it('fora do horário de trabalho', () => {
    const msg = 'O intervalo deve ficar dentro do horário de trabalho';
    expect(validarIntervalo({ ...base, ini: '07:30', fim: '08:30' })).toBe(msg);
    expect(validarIntervalo({ ...base, ini: '16:30', fim: '17:30' })).toBe(msg);
  });
  it('sem entrada e saída não há intervalo', () => {
    const msg = 'Informe a entrada e a saída antes do intervalo';
    expect(validarIntervalo({ ini: '12:00', fim: '13:00' })).toBe(msg);
    expect(validarIntervalo({ entrada: '08:00', ini: '12:00', fim: '13:00' })).toBe(msg);
  });
  it('minutos quebrados contam', () => {
    expect(validarIntervalo({ ...base, ini: '12:15', fim: '12:45' })).toBeNull();
  });
});
