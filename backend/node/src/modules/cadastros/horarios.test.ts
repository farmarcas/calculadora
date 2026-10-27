import { describe, expect, it } from 'vitest';
import {
  faixasDaSemana,
  horasAbertasNaSemana,
  normalizarHorarios,
  resumoHorarios,
  semana24h,
  validarHorarios,
} from './horarios.js';

describe('normalizarHorarios', () => {
  it('converte o formato antigo: semana vale segunda a sexta, o que falta fica fechado', () => {
    const h = normalizarHorarios({
      semana: { abre: '08:00', fecha: '22:00' },
      sabado: { abre: '08:00', fecha: '20:00' },
    })!;
    expect(h.versao).toBe(2);
    expect(h.dias).toHaveLength(7);
    expect(
      h.dias.slice(0, 5).every((d) => d.aberta && d.abre === '08:00' && d.fecha === '22:00'),
    ).toBe(true);
    expect(h.dias[5]).toEqual({ aberta: true, abre: '08:00', fecha: '20:00' });
    expect(h.dias[6]).toEqual({ aberta: false });
  });

  it('lê o formato novo e normaliza horas como "8:00"', () => {
    const dias = Array.from({ length: 7 }, () => ({ aberta: true, abre: '8:00', fecha: '22:00' }));
    const h = normalizarHorarios({ versao: 2, dias })!;
    expect(h.dias[0]).toEqual({ aberta: true, abre: '08:00', fecha: '22:00' });
  });

  it('24 horas implica 00:00–24:00 e dia fechado esquece o horário', () => {
    const dias = [
      { aberta: true, h24: true, abre: '09:00', fecha: '10:00' },
      { aberta: false, abre: '08:00' },
      ...Array.from({ length: 5 }, () => ({ aberta: false })),
    ];
    const h = normalizarHorarios({ versao: 2, dias })!;
    expect(h.dias[0]).toEqual({ aberta: true, h24: true, abre: '00:00', fecha: '24:00' });
    expect(h.dias[1]).toEqual({ aberta: false });
  });

  it('formato antigo com 00:00–24:00 vira 24 horas', () => {
    expect(
      normalizarHorarios({ semana: { abre: '00:00', fecha: '24:00' } })!.dias[0],
    ).toMatchObject({ h24: true });
  });

  it('sem horário nenhum ou formato quebrado: nulo', () => {
    for (const v of [
      null,
      undefined,
      {},
      'x',
      { versao: 2, dias: [] },
      { versao: 2, dias: [{ aberta: 1 }] },
    ])
      expect(normalizarHorarios(v)).toBeNull();
  });

  it('é idempotente: converter o que já é novo não muda nada', () => {
    const h = normalizarHorarios({
      semana: { abre: '08:00', fecha: '22:00' },
      domingo: { abre: '09:00', fecha: '18:00' },
    })!;
    expect(normalizarHorarios(h)).toEqual(h);
  });
});

describe('validarHorarios', () => {
  const com = (d: object) => ({
    versao: 2 as const,
    dias: [d as never, ...Array.from({ length: 6 }, () => ({ aberta: false }))],
  });
  it('aceita horários válidos, 24 horas e fechado', () => {
    expect(validarHorarios(com({ aberta: true, abre: '08:00', fecha: '22:00' }))).toEqual([]);
    expect(validarHorarios(com({ aberta: true, h24: true }))).toEqual([]);
    expect(validarHorarios(com({ aberta: false }))).toEqual([]);
  });
  it('recusa fechamento antes ou igual à abertura, e horário faltando', () => {
    expect(validarHorarios(com({ aberta: true, abre: '22:00', fecha: '08:00' }))[0]).toContain(
      'Seg: o fechamento (08:00) precisa ser depois da abertura (22:00)',
    );
    expect(validarHorarios(com({ aberta: true, abre: '08:00', fecha: '08:00' }))).toHaveLength(1);
    expect(validarHorarios(com({ aberta: true, abre: '08:00' }))[0]).toContain(
      'informe a abertura e o fechamento',
    );
  });
});

describe('faixasDaSemana', () => {
  it('só dias abertos, com 24 horas indo de 0 a 24', () => {
    expect(faixasDaSemana(semana24h())).toHaveLength(7);
    expect(horasAbertasNaSemana(semana24h())).toBe(168);
    const h = normalizarHorarios({
      semana: { abre: '08:00', fecha: '22:00' },
      domingo: { abre: '09:00', fecha: '13:30' },
    });
    expect(faixasDaSemana(h).map((d) => d.dia)).toEqual([0, 1, 2, 3, 4, 6]);
    expect(horasAbertasNaSemana(h)).toBe(5 * 14 + 4.5);
    expect(faixasDaSemana(null)).toEqual([]);
  });
});

describe('resumoHorarios', () => {
  it('agrupa dias seguidos iguais', () => {
    const h = normalizarHorarios({
      semana: { abre: '08:00', fecha: '22:00' },
      sabado: { abre: '08:00', fecha: '22:00' },
    });
    expect(resumoHorarios(h)).toBe('Seg a sáb 08:00–22:00 · Dom fechada');
  });
  it('mostra horários diferentes por grupo', () => {
    const h = normalizarHorarios({
      semana: { abre: '08:00', fecha: '22:00' },
      sabado: { abre: '08:00', fecha: '20:00' },
      domingo: { abre: '09:00', fecha: '13:00' },
    });
    expect(resumoHorarios(h)).toBe('Seg a sex 08:00–22:00 · Sáb 08:00–20:00 · Dom 09:00–13:00');
  });
  it('loja 24 horas, tudo igual e tudo fechado', () => {
    expect(resumoHorarios(semana24h())).toBe('Todos os dias 24h');
    expect(
      resumoHorarios(
        normalizarHorarios({
          versao: 2,
          dias: Array.from({ length: 7 }, () => ({ aberta: false })),
        }),
      ),
    ).toBe('Fechada todos os dias');
    expect(resumoHorarios(null)).toBe('Não cadastrado');
  });
  it('24 horas só em alguns dias', () => {
    const dias = [
      ...Array.from({ length: 5 }, () => ({ aberta: true, abre: '08:00', fecha: '22:00' })),
      { aberta: true, h24: true },
      { aberta: true, h24: true },
    ];
    expect(resumoHorarios(normalizarHorarios({ versao: 2, dias }))).toBe(
      'Seg a sex 08:00–22:00 · Sáb a dom 24h',
    );
  });
});
