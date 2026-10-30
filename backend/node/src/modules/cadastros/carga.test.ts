import { describe, expect, it } from 'vitest';
import { decimalParaHora, horaParaDecimal, mensalDeSemanal, semanalDeMensal } from './carga.js';

describe('carga', () => {
  it('converte mensal em semanal pela convenção ÷5', () => {
    expect(semanalDeMensal(220)).toBe(44);
    expect(semanalDeMensal(210)).toBe(42);
    expect(semanalDeMensal(200)).toBe(40);
    expect(semanalDeMensal(150)).toBe(30);
  });
  it('converte semanal em mensal', () => {
    expect(mensalDeSemanal(44)).toBe(220);
  });
  it('converte hora e decimal nos dois sentidos', () => {
    expect(horaParaDecimal('08:30')).toBe(8.5);
    expect(decimalParaHora(8.5)).toBe('08:30');
    expect(decimalParaHora(horaParaDecimal('22:15'))).toBe('22:15');
  });
});
