import { describe, expect, it } from 'vitest';
import type { DiaAberto } from './capacidade.js';
import { requisitos } from './requisitos.js';
import {
  avisosDeTurnos,
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

  it('avisa sobreposição, buraco e fora do horário, em português', () => {
    const sobrepoe = [t('A', '08:00', '15:00'), t('B', '14:00', '20:00')];
    expect(validarTurnos(sobrepoe, dias(8, 20)).join(' ')).toContain(
      'se sobrepõem entre 14:00 e 15:00',
    );
    const buraco = [t('A', '08:00', '13:00'), t('B', '14:00', '20:00')];
    expect(validarTurnos(buraco, dias(8, 20)).join(' ')).toContain(
      'Falta um turno entre 13:00 e 14:00',
    );
    const cedo = [t('A', '07:00', '20:00')];
    expect(validarTurnos(cedo, dias(8, 20)).join(' ')).toContain('começa antes da abertura');
    const tarde = [t('A', '08:00', '21:00')];
    expect(validarTurnos(tarde, dias(8, 20)).join(' ')).toContain('termina depois do fechamento');
    expect(validarTurnos([t('A', '08:00', '18:00')], dias(8, 20)).join(' ')).toContain(
      'Falta um turno entre 18:00 e 20:00',
    );
    expect(validarTurnos([t('A', '10:00', '20:00')], dias(8, 20)).join(' ')).toContain(
      'Falta um turno entre 08:00 e 10:00',
    );
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
    expect(validarTurnos(buraco, dias(0, 24, 7)).join(' ')).toContain(
      'Falta um turno entre 05:00 e 06:00',
    );
    expect(validarTurnos([t('Tudo', '00:00', '24:00')], dias(0, 24, 7))).toEqual([]);
    expect(validarTurnos([t('Tudo', '00:00', '00:00')], dias(0, 24, 7)).join(' ')).toContain(
      'iguais',
    );
  });

  it('avisos de turnos gravados: o horário mudou e deixaram de caber', () => {
    expect(avisosDeTurnos({ versao: 1, turnos: tres }, dias(8, 20))).toEqual([]);
    expect(avisosDeTurnos({ versao: 1, turnos: tres }, dias(8, 22)).join(' ')).toContain(
      'Falta um turno entre 20:00 e 22:00',
    );
    expect(avisosDeTurnos(null, dias(8, 22))).toEqual([]);
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
