import { describe, expect, it } from 'vitest';
import type { PessoaSim, TurnoSim } from '../simulacoes/avaliar.js';
import { apurarPeriodo, ROTULO_GERENCIAL } from './periodo.js';

const quadro: PessoaSim[] = [
  { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 40 },
  { matricula: 'B', nome: 'Bia', funcao: 'Farmacêutico', cargaH: 40 },
];
// Seg a sex: Ana 08–14, Bia 14–20 (6h cada, sem intervalo)
const turnos: TurnoSim[] = [0, 1, 2, 3, 4].flatMap((dia) => [
  { matricula: 'A', dia, entrada: 8, saida: 14, iniIntervalo: null, fimIntervalo: null },
  { matricula: 'B', dia, entrada: 14, saida: 20, iniIntervalo: null, fimIntervalo: null },
]);
const dias = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 8, fecha: 20 }));
const m = (h: number, min = 0) => h * 60 + min;

// Semana de 05/10/2026 (segunda) a 09/10 (sexta)
const base = {
  de: '2026-10-05',
  ate: '2026-10-09',
  vigenciaInicio: '2026-10-01',
  quadro,
  turnos,
  dias,
  minimos: { Farmacêutico: 1 },
  periodosCobertos: [{ inicio: '2026-10-01', fim: '2026-10-31' }],
};
const perfeito = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'].flatMap(
  (data) => [
    { matricula: 'A', data, minuto: m(8) },
    { matricula: 'A', data, minuto: m(14) },
    { matricula: 'B', data, minuto: m(14) },
    { matricula: 'B', data, minuto: m(20) },
  ],
);

describe('apurarPeriodo', () => {
  it('semana cumprida à risca: aderência 100%, sem hora extra e sem descoberta', () => {
    const r = apurarPeriodo({ ...base, batidas: perfeito });
    expect(r.rotulo).toBe(ROTULO_GERENCIAL);
    expect(r.loja).toMatchObject({ aderenciaPct: 100, horaExtraH: 0, faltas: 0, atrasos: 0 });
    expect(r.loja.cobertura.descobertas).toEqual([]);
  });

  it('atraso de 30 min e hora extra de 1h na terça: confere com a conta manual', () => {
    const batidas = perfeito.map((b) => {
      if (b.matricula === 'A' && b.data === '2026-10-06' && b.minuto === m(8))
        return { ...b, minuto: m(8, 30) };
      if (b.matricula === 'B' && b.data === '2026-10-06' && b.minuto === m(20))
        return { ...b, minuto: m(21) };
      return b;
    });
    const r = apurarPeriodo({ ...base, batidas });
    expect(r.loja.atrasos).toBe(1);
    expect(r.loja.horaExtraH).toBe(1);
    expect(r.loja.horaExtraPorFuncao).toEqual({ Farmacêutico: 1 });
    // planejado 60h; cumprido = 60 − 0,5 (atraso da Ana); a hora extra da Bia fora do plano não conta como cumprida
    expect(r.loja.horasPlanejadas).toBe(60);
    expect(r.loja.horasCumpridas).toBe(59.5);
    expect(r.loja.aderenciaPct).toBe(99.17);
    const ana = r.pessoas
      .find((p) => p.matricula === 'A')!
      .dias.find((d) => d.data === '2026-10-06')!;
    expect(ana.ocorrencias.map((o) => o.tipo)).toEqual(['atraso']);
  });

  it('falta da Ana na quarta: conta a falta, derruba a aderência e deixa a manhã sem farmacêutico', () => {
    const batidas = perfeito.filter((b) => !(b.matricula === 'A' && b.data === '2026-10-07'));
    const r = apurarPeriodo({ ...base, batidas });
    expect(r.loja.faltas).toBe(1);
    expect(r.loja.aderenciaPct).toBe(90);
    expect(r.loja.cobertura.descobertas).toEqual([
      { data: '2026-10-07', funcao: 'Farmacêutico', de: '08:00', ate: '14:00' },
    ]);
    expect(r.loja.cobertura.horasAbaixoDoMinimo).toEqual({ Farmacêutico: 6 });
  });

  it('sem arquivo de ponto para a data, não existe falta', () => {
    const r = apurarPeriodo({
      ...base,
      batidas: [],
      periodosCobertos: [{ inicio: '2026-10-05', fim: '2026-10-06' }],
    });
    expect(r.periodo.diasApurados).toBe(2);
    expect(r.loja.faltas).toBe(4); // 2 dias × 2 pessoas
  });

  it('antes da vigência da simulação em uso não se apura', () => {
    const r = apurarPeriodo({ ...base, vigenciaInicio: '2026-10-08', batidas: perfeito });
    expect(r.periodo).toMatchObject({ de: '2026-10-08', diasApurados: 2 });
  });

  it('descanso entre jornadas menor que 11h', () => {
    const batidas = [
      { matricula: 'B', data: '2026-10-05', minuto: m(14) },
      { matricula: 'B', data: '2026-10-05', minuto: m(23) },
      { matricula: 'B', data: '2026-10-06', minuto: m(8) },
      { matricula: 'B', data: '2026-10-06', minuto: m(14) },
    ];
    const r = apurarPeriodo({ ...base, batidas, ate: '2026-10-06' });
    const terca = r.pessoas
      .find((p) => p.matricula === 'B')!
      .dias.find((d) => d.data === '2026-10-06')!;
    expect(terca.ocorrencias.some((o) => o.tipo === 'descanso_insuficiente')).toBe(true);
  });

  it('causa provável da hora extra: sugestão por plano, quadro ou execução', () => {
    // Ana fica até 15h: o plano cobre 14–15h com a Bia (mínimo 1), então é execução
    const execucao = perfeito.map((b) =>
      b.matricula === 'A' && b.data === '2026-10-05' && b.minuto === m(14)
        ? { ...b, minuto: m(15) }
        : b,
    );
    expect(apurarPeriodo({ ...base, batidas: execucao }).loja.causaProvavelHoraExtra).toMatchObject(
      { sugestao: true, execucao: 1, plano: 0, quadro: 0 },
    );
    // Bia fica até 21h: depois das 20h ninguém está planejado e a loja fecha às 20h → plano não cobre a faixa (mínimo 1)
    const plano = perfeito.map((b) =>
      b.matricula === 'B' && b.data === '2026-10-05' && b.minuto === m(20)
        ? { ...b, minuto: m(21) }
        : b,
    );
    expect(apurarPeriodo({ ...base, batidas: plano }).loja.causaProvavelHoraExtra).toMatchObject({
      plano: 1,
    });
  });

  it('domingo aberto entra na apuração: falta no domingo conta e deixa a faixa sem farmacêutico', () => {
    const diasComDomingo = [...dias, { dia: 6, abre: 9, fecha: 13 }];
    const turnosComDomingo = [
      ...turnos,
      { matricula: 'A', dia: 6, entrada: 9, saida: 13, iniIntervalo: null, fimIntervalo: null },
    ];
    const r = apurarPeriodo({
      ...base,
      ate: '2026-10-11',
      dias: diasComDomingo,
      turnos: turnosComDomingo,
      batidas: perfeito, // ninguém bateu ponto no domingo 11/10
      periodosCobertos: [{ inicio: '2026-10-01', fim: '2026-10-11' }],
    });
    expect(r.loja.faltas).toBe(1);
    expect(r.loja.cobertura.descobertas).toEqual([
      { data: '2026-10-11', funcao: 'Farmacêutico', de: '09:00', ate: '13:00' },
    ]);
    expect(r.loja.horasPlanejadas).toBe(64); // 60h da semana + 4h do domingo
  });

  it('loja 24 horas: a cobertura realizada confere a madrugada e a noite', () => {
    const diasTodos = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 0, fecha: 24 }));
    const r = apurarPeriodo({
      ...base,
      dias: diasTodos,
      batidas: perfeito,
      de: '2026-10-05',
      ate: '2026-10-05',
      periodosCobertos: [{ inicio: '2026-10-05', fim: '2026-10-05' }],
    });
    // Ana 08–14 e Bia 14–20: faltam 00h–08h e 20h–24h
    expect(r.loja.cobertura.horasAbaixoDoMinimo).toEqual({ Farmacêutico: 12 });
  });
});
