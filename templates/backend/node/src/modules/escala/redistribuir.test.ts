import { describe, expect, it } from 'vitest';
import { regraPara } from '../regras/perfis.js';
import { redistribuir, type PessoaRedistribuir } from './redistribuir.js';

const dia = (d: number, abre = 8, fecha = 22) => ({ dia: d, abre, fecha });
const seis = [0, 1, 2, 3, 4, 5].map((d) => dia(d));
const farm = (
  matricula: string,
  cargaH: number,
  extra: Partial<PessoaRedistribuir> = {},
): PessoaRedistribuir => ({
  matricula,
  nome: `Farm ${matricula}`,
  funcao: 'Farmacêutico',
  cargaH,
  fixo: false,
  ...extra,
});
const r40 = regraPara('r40', false);

describe('redistribuir', () => {
  it('dois farmacêuticos de 40 h cobrem quatro dias de 14 h: não sobra descoberto', () => {
    // 4 dias abertos de 14 h = 56 h; cada pessoa faz 5 dias, mas só há 4: 4 dias × 8 h. As duas juntas cobrem 8–16 e 14–22.
    const r = redistribuir(
      r40,
      [0, 1, 2, 3].map((d) => dia(d)),
      [farm('1', 40), farm('2', 40)],
      { Farmacêutico: 1 },
    );
    expect(r.descoberto).toEqual([{ funcao: 'Farmacêutico', horas: 0, faixas: [] }]);
    // cada pessoa em 4 dias (limite de dias abertos), turno de 8 h
    expect(r.turnos).toHaveLength(8);
    expect(r.remanejados).toBe(2);
  });

  it('o limite de 5 dias por pessoa deixa descoberto: 2 × 40 h em 6 dias de 14 h = 12 h descobertas em 2 dias', () => {
    // 10 turnos de 8 h para 6 dias de 14 h (precisaria de 12): 2 dias com 1 turno só, 6 h descobertas em cada
    const r = redistribuir(r40, seis, [farm('1', 40), farm('2', 40)], { Farmacêutico: 1 });
    const d = r.descoberto[0]!;
    expect(d.horas).toBe(12);
    expect(d.faixas).toHaveLength(2);
    expect(d.faixas.every((f) => f.horas === 6)).toBe(true);
    for (const m of ['1', '2']) expect(r.turnos.filter((t) => t.matricula === m)).toHaveLength(5);
  });

  it('nunca passa de 8 h por dia nem do teto semanal (44 h viram 40 h na regra de 40 h)', () => {
    const r = redistribuir(r40, seis, [farm('1', 44)], { Farmacêutico: 1 });
    const horas = r.turnos.reduce((s, t) => s + (t.saida - t.entrada), 0);
    expect(horas).toBe(40);
    expect(Math.max(...r.turnos.map((t) => t.saida - t.entrada))).toBeLessThanOrEqual(8);
  });

  it('folga no domingo: com sete dias abertos e uma pessoa, o domingo é o dia que fica sem ela', () => {
    const sete = [0, 1, 2, 3, 4, 5, 6].map((d) => dia(d));
    const r = redistribuir(r40, sete, [farm('1', 40)], { Farmacêutico: 1 });
    expect(r.turnos.map((t) => t.dias[0]).sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('o domingo entra quando é ele que mais precisa: sábado e domingo sem ninguém e só 1 dia livre', () => {
    // dois dias abertos de 8 h (sábado e domingo) e uma pessoa que pode trabalhar 5 dias: trabalha nos dois
    const r = redistribuir(r40, [dia(5, 8, 16), dia(6, 8, 16)], [farm('1', 40)], {
      Farmacêutico: 1,
    });
    expect(r.turnos.map((t) => t.dias[0]).sort()).toEqual([5, 6]);
    expect(r.descoberto[0]!.horas).toBe(0);
  });

  it('horário fixo: mantém dias e horários, não conta como remanejado e gera aviso', () => {
    const fixa = farm('1', 44, {
      fixo: true,
      turno: {
        funcao: 'Farmacêutico',
        dias: [0, 1],
        entrada: 8,
        saida: 16,
        iniIntervalo: null,
        fimIntervalo: null,
      },
    });
    const r = redistribuir(r40, [dia(0), dia(1)], [fixa, farm('2', 40)], { Farmacêutico: 1 });
    expect(
      r.turnos.filter((t) => t.matricula === '1').map((t) => [t.dias[0], t.entrada, t.saida]),
    ).toEqual([
      [0, 8, 16],
      [1, 8, 16],
    ]);
    expect(r.remanejados).toBe(1);
    expect(r.avisos).toEqual(['Farm 1 (Farmacêutico) tem horário fixo: não foi remanejado(a).']);
    // a outra pessoa cobre o que a fixa deixa descoberto (16h–22h) nos dois dias
    expect(r.descoberto[0]!.horas).toBe(0);
    expect(r.turnos.filter((t) => t.matricula === '2').map((t) => [t.entrada, t.saida])).toEqual([
      [14, 22],
      [14, 22],
    ]);
  });

  it('cargo sem exigência não entra; exigência maior que 1 pede mais gente por hora', () => {
    expect(redistribuir(r40, seis, [farm('1', 40)], { Farmacêutico: 0 }).turnos).toEqual([]);
    const r = redistribuir(r40, [dia(0)], [farm('1', 40)], { Farmacêutico: 2 });
    // 14 h abertas pedindo 2 pessoas por hora; 1 pessoa de 8 h: todas as 14 h seguem com falta (descoberto = horas com falta)
    expect(r.descoberto[0]!.horas).toBe(14);
  });
});
