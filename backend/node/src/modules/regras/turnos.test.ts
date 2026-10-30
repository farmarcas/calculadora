import { describe, expect, it } from 'vitest';
import type { DiaAberto } from './capacidade.js';
import { requisitos } from './requisitos.js';
import {
  avisosDeTurnos,
  coberturaDeTurnos,
  exigenciasDaLoja,
  normalizarTurnos,
  validarTurnos,
  type TurnoLoja,
} from './turnos.js';

const dias = (abre: number, fecha: number, n = 5): DiaAberto[] =>
  Array.from({ length: n }, (_, dia) => ({ dia, abre, fecha }));
const t = (
  nome: string,
  inicio: string,
  fim: string,
  minimos: Record<string, number> = {},
): TurnoLoja => ({
  nome,
  inicio,
  fim,
  minimos: { Farmacêutico: 1, ...minimos },
});

const tres = [
  t('Manhã', '08:00', '14:00', { Atendimento: 1 }),
  t('Tarde', '14:00', '18:00', { Atendimento: 3 }),
  t('Noite', '18:00', '20:00', { Atendimento: 1 }),
];

describe('validarTurnos', () => {
  it('aceita turnos que cobrem o horário sem sobrepor nem deixar buraco', () => {
    expect(validarTurnos(tres, dias(8, 20))).toEqual([]);
  });

  it('aceita um só turno com o dia todo', () => {
    expect(validarTurnos([t('Dia todo', '08:00', '20:00')], dias(8, 20))).toEqual([]);
  });

  it('aceita turnos que se sobrepõem, que começam antes da abertura e que terminam depois do fechamento', () => {
    expect(validarTurnos([t('A', '08:00', '15:00'), t('B', '14:00', '20:00')], dias(8, 20))).toEqual([]);
    expect(validarTurnos([t('A', '07:00', '20:00')], dias(8, 20))).toEqual([]);
    expect(validarTurnos([t('A', '08:00', '22:00')], dias(8, 20))).toEqual([]);
  });

  it('buraco não é erro: vira faixa sem turno (informativo)', () => {
    expect(validarTurnos([t('A', '08:00', '13:00'), t('B', '14:00', '20:00')], dias(8, 20))).toEqual([]);
    expect(
      coberturaDeTurnos([t('A', '08:00', '13:00'), t('B', '14:00', '20:00')], dias(8, 20)),
    ).toEqual([{ dias: [0, 1, 2, 3, 4], de: 13, ate: 14 }]);
    expect(coberturaDeTurnos([t('A', '08:00', '18:00')], dias(8, 20))).toEqual([
      { dias: [0, 1, 2, 3, 4], de: 18, ate: 20 },
    ]);
    expect(coberturaDeTurnos([t('A', '10:00', '20:00')], dias(8, 20))).toEqual([
      { dias: [0, 1, 2, 3, 4], de: 8, ate: 10 },
    ]);
  });

  it('cobertura completa não tem faixa; turno que passa do horário não cria faixa', () => {
    expect(coberturaDeTurnos(tres, dias(8, 20))).toEqual([]);
    expect(coberturaDeTurnos([t('A', '06:00', '23:00')], dias(8, 20))).toEqual([]);
  });

  it('cobertura por dia: o sábado fecha mais cedo e agrupa dias com a mesma faixa', () => {
    const d = [...dias(8, 20, 5), { dia: 5, abre: 8, fecha: 14 }];
    expect(coberturaDeTurnos([t('A', '08:00', '14:00')], d)).toEqual([
      { dias: [0, 1, 2, 3, 4], de: 14, ate: 20 },
    ]);
  });

  it('recusa nome repetido ou vazio, início igual ao fim, mais de 6 turnos e farmacêutico 0', () => {
    expect(
      validarTurnos([t('A', '08:00', '14:00'), t('a', '14:00', '20:00')], dias(8, 20)).join(' '),
    ).toContain('repetido');
    expect(validarTurnos([t(' ', '08:00', '20:00')], dias(8, 20)).join(' ')).toContain(
      'precisa de um nome',
    );
    expect(validarTurnos([t('A', '08:00', '08:00')], dias(8, 20)).join(' ')).toContain('iguais');
    const sete = Array.from({ length: 7 }, (_, i) => t(`T${i}`, '08:00', '09:00'));
    expect(validarTurnos(sete, dias(8, 20)).join(' ')).toContain('no máximo 6');
    expect(
      validarTurnos([t('A', '08:00', '20:00', { Farmacêutico: 0 })], dias(8, 20)).join(' '),
    ).toContain('farmacêutico é 1');
  });

  it('recorta pelos dias: sábado fecha mais cedo e os turnos continuam valendo', () => {
    const d = [...dias(8, 20, 5), { dia: 5, abre: 8, fecha: 14 }];
    expect(validarTurnos(tres, d)).toEqual([]);
  });

  it('exige horário de funcionamento cadastrado', () => {
    expect(validarTurnos(tres, [])[0]).toContain('horário de funcionamento');
  });

  it('loja 24 horas: turno da noite vira a meia-noite', () => {
    const noite = [t('Dia', '06:00', '22:00'), t('Noite', '22:00', '06:00')];
    expect(validarTurnos(noite, dias(0, 24, 7))).toEqual([]);
    const buraco = [t('Dia', '06:00', '22:00'), t('Noite', '22:00', '05:00')];
    expect(validarTurnos(buraco, dias(0, 24, 7))).toEqual([]);
    expect(coberturaDeTurnos(buraco, dias(0, 24, 7))[0]).toMatchObject({ de: 5, ate: 6 });
    expect(validarTurnos([t('Tudo', '00:00', '24:00')], dias(0, 24, 7))).toEqual([]);
    expect(validarTurnos([t('Tudo', '00:00', '00:00')], dias(0, 24, 7)).join(' ')).toContain(
      'iguais',
    );
  });

  it('avisos de turnos gravados: o horário mudou e deixaram de caber', () => {
    expect(avisosDeTurnos({ versao: 1, turnos: tres }, dias(8, 20))).toEqual([]);
    expect(avisosDeTurnos({ versao: 1, turnos: tres }, dias(8, 22)).join(' ')).toContain(
      'Sem turno entre 20:00 e 22:00',
    );
    expect(avisosDeTurnos(null, dias(8, 22))).toEqual([]);
    // Modo "mínimo único": os turnos ficam guardados e não geram aviso.
    expect(avisosDeTurnos({ versao: 1, modo: 'unico', turnos: tres }, dias(8, 22))).toEqual([]);
  });
});

describe('normalizarTurnos e exigenciasDaLoja', () => {
  it('farmacêutico ausente vira 1 e o nome é aparado', () => {
    const [x] = normalizarTurnos([
      { nome: ' Manhã ', inicio: '08:00', fim: '14:00', minimos: { Atendimento: 2 } },
    ]);
    expect(x).toMatchObject({ nome: 'Manhã', minimos: { Atendimento: 2, Farmacêutico: 1 } });
  });

  it('sem turnos, a exigência é o mínimo único', () => {
    const m = { Farmacêutico: 1, Atendimento: 2 };
    expect(exigenciasDaLoja(m, null)).toBe(m);
    expect(exigenciasDaLoja(m, { versao: 1, turnos: [] })).toBe(m);
  });

  it('com turnos, cada hora exige o mínimo do seu turno', () => {
    const r = requisitos(
      exigenciasDaLoja({ Farmacêutico: 1, Atendimento: 1 }, { versao: 1, turnos: tres }),
    );
    expect(r.emHora('Atendimento', 0, 9)).toBe(1);
    expect(r.emHora('Atendimento', 0, 15)).toBe(3);
    expect(r.emHora('Atendimento', 0, 19)).toBe(1);
    expect(r.emHora('Caixa', 0, 15)).toBe(0);
  });

  it('turno que vira a noite vale nos dois pedaços do relógio', () => {
    const turnos = {
      versao: 1 as const,
      turnos: [
        t('Dia', '06:00', '22:00', { Atendimento: 1 }),
        t('Noite', '22:00', '06:00', { Atendimento: 3 }),
      ],
    };
    const r = requisitos(exigenciasDaLoja({ Farmacêutico: 1 }, turnos));
    expect(r.emHora('Atendimento', 0, 23)).toBe(3);
    expect(r.emHora('Atendimento', 0, 2)).toBe(3);
    expect(r.emHora('Atendimento', 0, 10)).toBe(1);
  });
});

describe('sobreposição e modo do mínimo', () => {
  it('onde dois turnos se sobrepõem, vale o maior mínimo por cargo (não soma)', () => {
    const turnos = {
      versao: 1 as const,
      turnos: [
        t('Manhã', '08:00', '15:00', { Atendimento: 2 }),
        t('Tarde', '12:00', '20:00', { Atendimento: 3, Caixa: 1 }),
      ],
    };
    const r = requisitos(exigenciasDaLoja({ Farmacêutico: 1 }, turnos));
    expect(r.emHora('Atendimento', 0, 9)).toBe(2);
    expect(r.emHora('Atendimento', 0, 13)).toBe(3); // sobreposição: o maior, não 2 + 3
    expect(r.emHora('Caixa', 0, 13)).toBe(1);
    expect(r.emHora('Atendimento', 0, 18)).toBe(3);
    expect(r.emHora('Farmacêutico', 0, 13)).toBe(1);
  });

  it('hora sem nenhum turno cai no mínimo único (reserva)', () => {
    const turnos = { versao: 1 as const, turnos: [t('A', '08:00', '12:00', { Atendimento: 3 })] };
    const r = requisitos(exigenciasDaLoja({ Farmacêutico: 1, Atendimento: 1 }, turnos));
    expect(r.emHora('Atendimento', 0, 9)).toBe(3);
    expect(r.emHora('Atendimento', 0, 15)).toBe(1);
  });

  it('turno que passa do horário da loja só conta dentro das horas abertas', () => {
    const turnos = { versao: 1 as const, turnos: [t('Longo', '06:00', '23:00', { Atendimento: 2 })] };
    const m = exigenciasDaLoja({ Farmacêutico: 1 }, turnos);
    const r = requisitos(m);
    // O motor só olha as horas abertas (08–20): a necessidade são 12h × 2, não 17h × 2.
    expect(r.emHora('Atendimento', 0, 8)).toBe(2);
    expect(r.emHora('Atendimento', 0, 22)).toBe(2);
  });

  it('modo "unico": a exigência é o mínimo único e os turnos continuam guardados', () => {
    const m = { Farmacêutico: 1, Atendimento: 1 };
    const turnos = { versao: 1 as const, modo: 'unico' as const, turnos: tres };
    expect(exigenciasDaLoja(m, turnos)).toBe(m);
    // Sem modo, ou com modo "turnos", os turnos valem como antes.
    expect(exigenciasDaLoja(m, { versao: 1, turnos: tres })).not.toBe(m);
    expect(exigenciasDaLoja(m, { versao: 1, modo: 'turnos', turnos: tres })).not.toBe(m);
  });
});

