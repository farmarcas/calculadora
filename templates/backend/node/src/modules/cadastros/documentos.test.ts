import { describe, expect, it } from 'vitest';
import { mascararCpf, UFS, validarCnpj, validarCpf } from './documentos.js';

describe('validarCnpj', () => {
  it('aceita CNPJ válido com ou sem pontuação', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
    expect(validarCnpj('28927087000247')).toBe(true);
  });
  it('recusa dígito errado, tamanho errado e repetidos', () => {
    expect(validarCnpj('11.222.333/0001-82')).toBe(false);
    expect(validarCnpj('1122233300018')).toBe(false);
    expect(validarCnpj('00000000000000')).toBe(false);
  });
});

describe('validarCpf', () => {
  it('aceita CPF válido com ou sem pontuação', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
    expect(validarCpf('52998224725')).toBe(true);
  });
  it('recusa dígito errado, tamanho errado e repetidos', () => {
    expect(validarCpf('529.982.247-26')).toBe(false);
    expect(validarCpf('5299822472')).toBe(false);
    expect(validarCpf('111.111.111-11')).toBe(false);
  });
});

describe('mascararCpf', () => {
  it('mostra só os três dígitos do meio', () => {
    expect(mascararCpf('529.982.247-25')).toBe('***.982.247-**');
    expect(mascararCpf('52998224725')).toBe('***.982.247-**');
  });
  it('deixa vazio quando não há CPF', () => {
    expect(mascararCpf(undefined)).toBeUndefined();
  });
});

it('lista as 27 unidades da federação', () => {
  expect(UFS).toHaveLength(27);
});
