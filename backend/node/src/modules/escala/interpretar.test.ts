import { describe, expect, it } from 'vitest';
import {
  interpretarBase,
  interpretarEscala,
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

const colE = {
  loja: 0,
  matricula: 1,
  nome: 2,
  funcao: 3,
  dias: 4,
  folga: 5,
  entrada: 6,
  ini_intervalo: 7,
  fim_intervalo: 8,
  saida: 9,
  carga: 10,
};

describe('interpretarEscala', () => {
  it('aceita, deduz função, aceita dias contados com folga e rejeita turno ruim', () => {
    const aba = {
      nome: 'E',
      cabecalhos: [],
      linhas: [
        [
          '001',
          'F1',
          'Ana',
          'Farmacêutica',
          'Seg a Sáb',
          '',
          '08:00',
          '12:00',
          '13:00',
          '17:00',
          '44',
        ],
        ['001', 'F2', 'Bia', 'Balconista', '6', 'Dom', '09:00', '', '', '18:00', ''],
        ['001', 'F3', 'Caio', 'Gerente', 'Seg a Sex', '', '08:00', '', '', '17:00', ''],
        ['001', 'F4', 'Duda', 'Caixa', 'Seg a Sex', '', '18:00', '', '', '08:00', ''],
        ['001', 'F5', 'Edu', 'Caixa', 'Seg a Sex', '', '08:00', '12:00', '', '17:00', ''],
      ],
    };
    const r = interpretarEscala(aba, colE, new Map());
    expect(r.turnos.map((t) => [t.matricula, t.funcao, t.status])).toEqual([
      ['F1', 'Farmacêutico', 'ok'],
      ['F2', 'Atendimento', 'ok'],
      ['F3', null, 'fora_calculo'],
    ]);
    expect(r.turnos[1]!.dias).toEqual([0, 1, 2, 3, 4, 5]);
    expect(r.turnos[0]!.cargaH).toBe(44);
    expect(r.erros.map((e) => e.motivo)).toEqual([
      'Saída antes da entrada',
      'Intervalo incompleto (informe início e fim)',
    ]);
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
