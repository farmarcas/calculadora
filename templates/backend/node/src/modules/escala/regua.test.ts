import { describe, expect, it } from 'vitest';
import { linhasNaRegua, palavraDaRegua, preencherComCmvMedio, reguaDaBase } from './regua.js';

// `margem` é o lucro bruto da hora (venda − CMV); nulo quando a hora não tem CMV.
const linha = (hora: number, venda: number, margem: number | null) => ({
  data: '2026-09-07',
  hora,
  venda,
  margem,
  clientes: 5,
  unidades: 9,
});
const completa = Array.from({ length: 10 }, (_, i) => linha(8 + i, 1000, 300));
const semCmv = completa.map((l) => ({ ...l, margem: null }));

describe('reguaDaBase', () => {
  it('base com CMV em todas as horas: margem', () => {
    expect(reguaDaBase(completa)).toEqual({ tipo: 'margem' });
  });
  it('sem linhas: nulo', () => {
    expect(reguaDaBase([])).toBeNull();
  });
  it('sem CMV em nenhuma hora: venda, motivo sem_margem', () => {
    expect(reguaDaBase(semCmv)).toEqual({ tipo: 'venda', motivo: 'sem_margem' });
  });
  it('CMV em poucas horas e sem CMV médio: venda, motivo margem_parcial', () => {
    const parcial = completa.map((l, i) => (i < 3 ? l : { ...l, margem: null }));
    expect(reguaDaBase(parcial)).toEqual({ tipo: 'venda', motivo: 'margem_parcial' });
  });
  it('CMV maior que a venda numa hora (lucro bruto negativo): venda, motivo margem_incoerente', () => {
    expect(reguaDaBase([...completa, linha(20, 100, -50)])).toEqual({
      tipo: 'venda',
      motivo: 'margem_incoerente',
    });
  });
  it('CMV negativo (lucro bruto maior que a venda): venda, motivo margem_incoerente', () => {
    expect(reguaDaBase([...completa, linha(20, 100, 400)])).toEqual({
      tipo: 'venda',
      motivo: 'margem_incoerente',
    });
  });
  it('o limite de 90% vale quando falta CMV e não há CMV médio: 9 de 10 horas vale; 8 de 10 não vale', () => {
    expect(reguaDaBase(completa.map((l, i) => (i === 0 ? { ...l, margem: null } : l)))).toEqual({
      tipo: 'margem',
    });
    expect(reguaDaBase(completa.map((l, i) => (i < 2 ? { ...l, margem: null } : l)))?.motivo).toBe(
      'margem_parcial',
    );
  });
  it('horas sem venda não contam na cobertura', () => {
    expect(reguaDaBase([...completa, linha(22, 0, null), linha(23, 0, null)])).toEqual({
      tipo: 'margem',
    });
  });
  it('lucro bruto zero em todas as horas (CMV igual à venda) é um dado válido: margem', () => {
    expect(reguaDaBase(completa.map((l) => ({ ...l, margem: 0 })))).toEqual({ tipo: 'margem' });
  });
});

describe('preencherComCmvMedio', () => {
  it('as horas sem CMV recebem venda × (1 − CMV médio); as com CMV ficam como estão', () => {
    const r = preencherComCmvMedio([linha(8, 1000, null), linha(9, 1000, 200)], 65);
    expect(r[0]!.margem).toBeCloseTo(350, 6);
    expect(r[1]!.margem).toBe(200);
  });
  it('sem CMV médio devolve as mesmas linhas, e não altera as originais', () => {
    expect(preencherComCmvMedio(semCmv, null)).toBe(semCmv);
    expect(preencherComCmvMedio(semCmv, undefined)).toBe(semCmv);
    preencherComCmvMedio(semCmv, 65);
    expect(semCmv.every((l) => l.margem === null)).toBe(true);
  });
  it('base sem nenhum CMV mas com CMV médio: margem, nunca volta à venda', () => {
    expect(reguaDaBase(preencherComCmvMedio(semCmv, 65))).toEqual({ tipo: 'margem' });
  });
  it('CMV médio de 0% é lucro bruto igual à venda; de 100% é lucro bruto zero; os dois valem', () => {
    expect(reguaDaBase(preencherComCmvMedio(semCmv, 0))).toEqual({ tipo: 'margem' });
    const cem = preencherComCmvMedio(semCmv, 100);
    expect(reguaDaBase(cem)).toEqual({ tipo: 'margem' });
    expect(linhasNaRegua(cem, { tipo: 'margem' }).every((l) => l.venda === 0)).toBe(true);
  });
  it('uma hora com CMV maior que a venda continua incoerente mesmo com CMV médio', () => {
    const r = preencherComCmvMedio([...semCmv, linha(20, 100, -10)], 65);
    expect(reguaDaBase(r)).toEqual({ tipo: 'venda', motivo: 'margem_incoerente' });
  });
});

describe('linhasNaRegua', () => {
  it('na margem troca a venda pelo lucro bruto sem alterar as linhas originais', () => {
    const copia = JSON.parse(JSON.stringify(completa));
    const r = linhasNaRegua(completa, { tipo: 'margem' });
    expect(r[0]!.venda).toBe(300);
    expect(r[0]!.margem).toBe(300);
    expect(completa).toEqual(copia);
  });
  it('na margem, hora sem lucro bruto vale zero', () => {
    expect(linhasNaRegua(semCmv, { tipo: 'margem' }).every((l) => l.venda === 0)).toBe(true);
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
