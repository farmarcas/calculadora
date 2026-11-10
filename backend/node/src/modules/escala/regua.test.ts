import { describe, expect, it } from 'vitest';
import { linhasNaRegua, palavraDaRegua, reguaDaBase } from './regua.js';

const linha = (hora: number, venda: number, margem: number) => ({ data: '2026-09-07', hora, venda, margem, clientes: 5, unidades: 9 });
const completa = Array.from({ length: 10 }, (_, i) => linha(8 + i, 1000, 300));

describe('reguaDaBase', () => {
  it('base completa: margem', () => {
    expect(reguaDaBase(completa)).toEqual({ tipo: 'margem' });
  });
  it('sem linhas: nulo', () => {
    expect(reguaDaBase([])).toBeNull();
  });
  it('sem margem (zerada): venda, motivo sem_margem', () => {
    expect(reguaDaBase(completa.map((l) => ({ ...l, margem: 0 })))).toEqual({ tipo: 'venda', motivo: 'sem_margem' });
  });
  it('margem em poucas horas: venda, motivo margem_parcial', () => {
    const parcial = completa.map((l, i) => (i < 3 ? l : { ...l, margem: 0 }));
    expect(reguaDaBase(parcial)).toEqual({ tipo: 'venda', motivo: 'margem_parcial' });
  });
  it('uma hora com margem maior que a venda: venda, motivo margem_incoerente', () => {
    const ruim = [...completa, linha(20, 100, 400)];
    expect(reguaDaBase(ruim)).toEqual({ tipo: 'venda', motivo: 'margem_incoerente' });
  });
  it('margem negativa isolada conta como está e não derruba a margem', () => {
    const comNegativa = completa.map((l, i) => (i === 0 ? { ...l, margem: -50 } : l));
    expect(reguaDaBase(comNegativa)).toEqual({ tipo: 'margem' });
  });
  it('o limite de 90%: 9 de 10 horas com margem vale; 8 de 10 não vale', () => {
    expect(reguaDaBase(completa.map((l, i) => (i === 0 ? { ...l, margem: 0 } : l)))).toEqual({ tipo: 'margem' });
    expect(reguaDaBase(completa.map((l, i) => (i < 2 ? { ...l, margem: 0 } : l)))?.motivo).toBe('margem_parcial');
  });
  it('horas sem venda não contam na cobertura', () => {
    expect(reguaDaBase([...completa, linha(22, 0, 0), linha(23, 0, 0)])).toEqual({ tipo: 'margem' });
  });
});

describe('linhasNaRegua', () => {
  it('na margem troca a venda pela margem sem alterar as linhas originais', () => {
    const copia = JSON.parse(JSON.stringify(completa));
    const r = linhasNaRegua(completa, { tipo: 'margem' });
    expect(r[0]!.venda).toBe(300);
    expect(r[0]!.margem).toBe(300);
    expect(completa).toEqual(copia);
  });
  it('na venda (ou sem régua) devolve as mesmas linhas', () => {
    expect(linhasNaRegua(completa, { tipo: 'venda' })).toBe(completa);
    expect(linhasNaRegua(completa, null)).toBe(completa);
  });
  it('a palavra da régua', () => {
    expect(palavraDaRegua({ tipo: 'margem' })).toBe('margem');
    expect(palavraDaRegua({ tipo: 'venda' })).toBe('venda');
    expect(palavraDaRegua(null)).toBe('venda');
  });
});
