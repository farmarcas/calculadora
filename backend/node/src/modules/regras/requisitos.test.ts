import { describe, expect, it } from 'vitest';
import { verificarRegra, type DiaAberto } from './capacidade.js';
import { regraPara } from './perfis.js';
import { camadasDoDia, minimosIguais, requisitos, type MinimosPorFatia } from './requisitos.js';
import { cobertura } from '../escala/cobertura.js';
import { avaliarSimulacao } from '../simulacoes/avaliar.js';

const semana = (abre: number, fecha: number, ate = 5): DiaAberto[] =>
  Array.from({ length: ate }, (_, dia) => ({ dia, abre, fecha }));

// Atendimento: 1 de manhã (8–14), 3 à tarde (14–18), 1 à noite (18–20); farmacêutico 1 o dia todo.
const porTurno: MinimosPorFatia = {
  fatias: [
    { de: 8, ate: 14, minimos: { Farmacêutico: 1, Atendimento: 1 } },
    { de: 14, ate: 18, minimos: { Farmacêutico: 1, Atendimento: 3 } },
    { de: 18, ate: 20, minimos: { Farmacêutico: 1, Atendimento: 1 } },
  ],
  reserva: { Farmacêutico: 1, Atendimento: 1 },
};

describe('requisitos', () => {
  it('forma simples: exigência igual em todas as horas', () => {
    const r = requisitos({ Farmacêutico: 1, Atendimento: 2, Apoio: 0 });
    expect(r.funcoes).toEqual(['Farmacêutico', 'Atendimento']);
    expect(r.emHora('Atendimento', 3, 17)).toBe(2);
    expect(r.pico('Apoio')).toBe(0);
    expect(r.uniforme).not.toBeNull();
  });

  it('por fatia: cada hora vale a fatia que contém o seu meio; fora de todas vale a reserva', () => {
    const r = requisitos(porTurno);
    expect(r.emHora('Atendimento', 0, 8)).toBe(1);
    expect(r.emHora('Atendimento', 0, 13)).toBe(1);
    expect(r.emHora('Atendimento', 0, 14)).toBe(3);
    expect(r.emHora('Atendimento', 0, 17)).toBe(3);
    expect(r.emHora('Atendimento', 0, 18)).toBe(1);
    expect(r.emHora('Atendimento', 0, 22)).toBe(1); // reserva
    expect(r.pico('Atendimento')).toBe(3);
    expect(r.uniforme).toBeNull();
  });

  it('camadas: horas em que o cargo é exigido por k ou mais', () => {
    const [seg] = semana(8, 20, 1);
    expect(camadasDoDia(requisitos(porTurno), 'Atendimento', seg!)).toEqual([12, 4, 4]);
    expect(camadasDoDia(requisitos({ Atendimento: 2 }), 'Atendimento', seg!)).toEqual([12, 12]);
    expect(
      camadasDoDia(requisitos({ Atendimento: 1 }), 'Atendimento', { dia: 0, abre: 8.5, fecha: 12 }),
    ).toEqual([3.5]);
  });

  it('minimosIguais: simples compara cargo a cargo (ausente = 0); por fatia por conteúdo', () => {
    expect(minimosIguais({ A: 1, B: 0 }, { A: 1 })).toBe(true);
    expect(minimosIguais({ A: 1 }, { A: 2 })).toBe(false);
    expect(minimosIguais(porTurno, porTurno)).toBe(true);
    expect(minimosIguais(porTurno, { Atendimento: 1 })).toBe(false);
  });
});

describe('capacidade com exigência por turno', () => {
  const r40 = regraPara('r40', false);
  const pessoas = [
    { funcao: 'Atendimento', cargaH: 40 },
    { funcao: 'Atendimento', cargaH: 40 },
  ];
  const linha = (m: Parameters<typeof verificarRegra>[2]) =>
    verificarRegra(r40, semana(8, 20), m, pessoas).find((l) => l.funcao === 'Atendimento')!;

  it('soma por camada: conta feita à mão (12h + 4h + 4h por dia × 5 dias)', () => {
    const l = linha(porTurno);
    // horas: (12 + 4 + 4) × 5 = 100; turnos: (⌈12/8⌉ + ⌈4/8⌉ + ⌈4/8⌉) × 5 = 4 × 5 = 20
    expect(l.necessidadeH).toBe(100);
    expect(l.necessidadeT).toBe(20);
    expect(l.minimo).toBe(3);
    // 2 pessoas de 40h: 80h → faltam 20h, que cabem em 1 contrato parcial (até 30h)
    expect(l.falta).toBe(true);
    expect(l.gapH).toBe(20);
    expect(l.contratar).toBe(1);
    expect(l.parcialH).toBe(20);
  });

  it('exige menos que o pico aplicado ao dia todo e mais que o mínimo da manhã', () => {
    const pico = linha({ Atendimento: 3, Farmacêutico: 1 });
    const manha = linha({ Atendimento: 1, Farmacêutico: 1 });
    const turno = linha(porTurno);
    expect(manha.necessidadeH).toBeLessThan(turno.necessidadeH);
    expect(turno.necessidadeH).toBeLessThan(pico.necessidadeH);
  });

  it('paridade: exigência igual em todas as horas dá exatamente a conta antiga', () => {
    const casos: Record<string, number>[] = [
      { Farmacêutico: 1, Atendimento: 1, Caixa: 1 },
      { Farmacêutico: 2, Atendimento: 3, Apoio: 0 },
    ];
    for (const m of casos) {
      const comoFatia: MinimosPorFatia = { fatias: [{ de: 0, ate: 24, minimos: m }], reserva: m };
      for (const regra of [regraPara('atual', false), r40, regraPara('r42', true)]) {
        for (const dias of [semana(8, 20), semana(8.5, 21.5, 6), semana(0, 24, 7)]) {
          const a = verificarRegra(regra, dias, m, pessoas);
          const b = verificarRegra(regra, dias, comoFatia, pessoas);
          const sem = (ls: typeof a) => ls.map(({ memoria: _m, ...resto }) => resto);
          expect(sem(b)).toEqual(sem(a));
        }
      }
    }
  });

  it('a explicação diz que é meta do dono', () => {
    expect(linha(porTurno).memoria).toContain('Meta do dono');
  });
});

describe('cobertura e simulação com exigência por turno', () => {
  const dias = semana(8, 20, 1);
  const um = {
    funcao: 'Atendimento',
    dias: [0],
    entrada: 8,
    saida: 20,
    iniIntervalo: null,
    fimIntervalo: null,
  };

  it('cobertura: a hora só está ok se atende a exigência da própria hora', () => {
    const c = cobertura(dias, [um], porTurno).funcoes.find((f) => f.funcao === 'Atendimento')!;
    const ok = (h: number) => c.porHora.find((x) => x.hora === h)!.ok;
    expect(ok(9)).toBe(true); // manhã exige 1
    expect(ok(15)).toBe(false); // tarde exige 3
    expect(c.porHora.find((x) => x.hora === 15)).toMatchObject({ pessoas: 1, exigido: 3 });
    expect(c.minimo).toBe(3);
  });

  it('simulação: aponta falta só no turno que exige mais', () => {
    const r = avaliarSimulacao({
      regra: regraPara('r40', false),
      dias,
      minimos: porTurno,
      quadro: [{ matricula: 'A', nome: 'Ana', funcao: 'Atendimento', cargaH: 40 }],
      turnos: [
        { matricula: 'A', dia: 0, entrada: 8, saida: 20, iniIntervalo: 12, fimIntervalo: 13 },
      ],
    });
    const faltas = r.erros.filter((e) => e.regra === 'cobertura');
    expect(faltas).toHaveLength(1);
    expect(faltas[0]!.texto).toContain('abaixo do mínimo (3)');
    const cob = r.cobertura[0]!.find((f) => f.funcao === 'Atendimento')!;
    expect(cob.porHora.find((h) => h.hora === 9)!.ok).toBe(true);
    expect(cob.porHora.find((h) => h.hora === 15)!.ok).toBe(false);
  });
});
