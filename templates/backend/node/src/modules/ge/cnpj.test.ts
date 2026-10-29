import { describe, expect, it } from 'vitest';
import { formatarCnpj, normalizarCnpj, validarCnpj } from './cnpj.js';

describe('CNPJ', () => {
  it('guarda só os dígitos, com ou sem pontuação', () => {
    expect(normalizarCnpj('11.222.333/0001-81')).toBe('11222333000181');
    expect(normalizarCnpj('11222333000181')).toBe('11222333000181');
  });

  it('confere os dígitos verificadores', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('11222333000181')).toBe(true);
    expect(validarCnpj('11.222.333/0001-82')).toBe(false);
    expect(validarCnpj('00000000000000')).toBe(false);
    expect(validarCnpj('123')).toBe(false);
  });

  it('formata para mostrar e deixa como veio o que não tem 14 dígitos', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(formatarCnpj('123')).toBe('123');
  });

  it('o CNPJ de um relatório real de exemplo (fictício aqui) com zero à esquerda continua válido', () => {
    expect(validarCnpj('06787293000185')).toBe(true);
    expect(normalizarCnpj('6787293000185'.padStart(14, '0'))).toBe('06787293000185');
  });
});
