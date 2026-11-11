import { describe, expect, it } from 'vitest';
import { intervaloDesconta, LIMITE_INTERVALO_SEM_COBERTURA_H } from './intervalo.js';

describe('intervalo que não precisa de cobertura', () => {
  it('o limite é de 2 horas', () => {
    expect(LIMITE_INTERVALO_SEM_COBERTURA_H).toBe(2);
  });
  it('até 2 horas não desconta; acima disso desconta; sem intervalo não desconta', () => {
    expect(intervaloDesconta(10, 11)).toBe(false);
    expect(intervaloDesconta(10, 12)).toBe(false);
    expect(intervaloDesconta(10, 12.25)).toBe(true);
    expect(intervaloDesconta(10, 13)).toBe(true);
    expect(intervaloDesconta(null, null)).toBe(false);
    expect(intervaloDesconta(10, null)).toBe(false);
  });
});
