import { describe, expect, it } from 'vitest';
import { calcularIndicadores, sintese } from './comparar.js';

const quadro = [
  { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 40 },
  { matricula: 'B', nome: 'Bia', funcao: 'Farmacêutico', cargaH: 40 },
];
const turnos = [
  { matricula: 'A', dia: 0, entrada: 8, saida: 14, iniIntervalo: null, fimIntervalo: null },
  { matricula: 'B', dia: 6, entrada: 14, saida: 20, iniIntervalo: null, fimIntervalo: null },
];
const cob = {
  0: [
    {
      funcao: 'Farmacêutico',
      minimo: 1,
      porHora: [
        { hora: 8, pessoas: 1, ok: true },
        { hora: 9, pessoas: 0, ok: false },
        { hora: 10, pessoas: 2, ok: true },
      ],
    },
  ],
};

describe('calcularIndicadores', () => {
  it('conta cobertura, falta, sobra e domingos', () => {
    const i = calcularIndicadores({
      quadro,
      turnos,
      erros: [{ regra: 'farmaceutico' }],
      avisos: [],
      cobertura: cob,
    });
    expect(i).toMatchObject({
      coberturaPct: 66.67,
      horasFalta: 1,
      horasSobra: 1,
      pessoas: 2,
      horasPlanejadas: 12,
      horasContratadas: 80,
      domingosTrabalhados: 1,
      semFarmaceutico: true,
      erros: 1,
    });
    expect(i.folgasPorPessoa).toBe(6);
  });
});

describe('sintese', () => {
  it('compara com a simulação em uso', () => {
    const base = {
      erros: 0,
      avisos: 0,
      semFarmaceutico: false,
      coberturaPct: 90,
      horasFalta: 0,
      horasSobra: 0,
      pessoas: 2,
      horasPlanejadas: 80,
      horasContratadas: 80,
      domingosTrabalhados: 0,
      folgasPorPessoa: 2,
    };
    const t = sintese('5x2', { ...base, coberturaPct: 100, horasPlanejadas: 70 }, base, '6x1');
    expect(t).toContain('melhora a cobertura em 10 ponto(s)');
    expect(t).toContain('corta 10h por semana');
  });
  it('avisa quando não pode ser aprovada', () => {
    const base = {
      erros: 2,
      avisos: 0,
      semFarmaceutico: true,
      coberturaPct: 50,
      horasFalta: 4,
      horasSobra: 0,
      pessoas: 1,
      horasPlanejadas: 10,
      horasContratadas: 40,
      domingosTrabalhados: 0,
      folgasPorPessoa: 3,
    };
    const t = sintese('Rascunho', base, null, null);
    expect(t).toContain('não pode ser aprovada');
    expect(t).toContain('sem farmacêutico');
  });
});
