import { describe, expect, it } from 'vitest';
import {
  interpretarBase,
  lerDias,
  lerHora,
  lerNumero,
  somarPorHora,
} from './interpretar.js';

describe('leitura de valores', () => {
  it('horas em vários formatos', () => {
    expect(lerHora('08:30')).toBe(8.5);
    expect(lerHora('8')).toBe(8);
    expect(lerHora('0.375')).toBe(9);
    expect(lerHora('25:00')).toBeNull();
  });
  it('dias por extenso, intervalo ou lista', () => {
    expect(lerDias('Seg a Sáb')).toEqual([0, 1, 2, 3, 4, 5]);
    expect(lerDias('Seg-Sex')).toEqual([0, 1, 2, 3, 4]);
    expect(lerDias('Segunda, Quarta e Sexta')).toEqual([0, 2, 4]);
    expect(lerDias('xyz')).toBeNull();
  });
  it('números no formato brasileiro', () => {
    expect(lerNumero('1.234,56')).toBe(1234.56);
    expect(lerNumero('R$ 310,00')).toBe(310);
  });
});


describe('interpretarBase', () => {
  it('lê e soma por data e hora', () => {
    const aba = {
      nome: 'B',
      cabecalhos: [],
      linhas: [
        ['01/09/2026', '9', '001', '100,50', '30', '3', '8'],
        ['2026-09-01', '09:00', '001', '50', '10', '2', '4'],
        ['2026-09-01', 'x', '001', '50', '', '', ''],
      ],
    };
    const r = interpretarBase(aba, {
      data: 0,
      hora: 1,
      loja: 2,
      venda: 3,
      margem: 4,
      clientes: 5,
      unidades: 6,
    });
    expect(r.erros).toEqual([{ linha: 4, motivo: 'Hora inválida', loja: '001' }]);
    const soma = somarPorHora(r.vendas);
    expect(soma).toHaveLength(1);
    expect(soma[0]).toMatchObject({ venda: 150.5, clientes: 5, unidades: 12 });
  });
});
