import { describe, expect, it } from 'vitest';
import type { DiaAberto } from '../regras/capacidade.js';
import {
  estadosPermitidos,
  perdaMensal,
  sequenciaFimDeSemana,
  TRAVAS,
  type EntradaSequencia,
} from './ajustes-fim-de-semana.js';

// Loja aberta todos os dias, 8h às 22h (14 h por dia, 98 h por semana).
// Venda por mês: segunda a sexta 10000, sábado 14000, domingo 7000 → faturamento 71000.
// Travas: perda até 10% (7100) e horas até 85% (cortar no máximo 14,7 h, ficar com 83,3 h ou mais).
const hoje: DiaAberto[] = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: 8, fecha: 22 }));
const vendaMes = [10000, 10000, 10000, 10000, 10000, 14000, 7000];
const porDia = (protegidos: number[] = []) =>
  vendaMes.map((v, dia) => ({ dia, protegido: protegidos.includes(dia), vendaMes: v }));
const horas = (dias: DiaAberto[]) => dias.reduce((s, d) => s + (d.fecha - d.abre), 0);
// A equipe "cobre" quando o horário semanal cabe em `limite` horas.
const seq = (limite: number, extra: Partial<EntradaSequencia> = {}, dias = hoje) =>
  sequenciaFimDeSemana({
    dias,
    porDia: porDia(),
    cobre: (d) => horas(d) <= limite,
    faltaH: (d) => horas(d) - limite,
    ...extra,
  });
const diasUteisIguais = (r: { dias: DiaAberto[] }) =>
  r.dias.filter((d) => d.dia <= 4).every((d, i) => d.abre === 8 && d.fecha === 22 && d.dia === i);

describe('travas', () => {
  it('limites decididos pela pessoa, em uma constante só', () => {
    expect(TRAVAS).toEqual({ perdaMaxPct: 10, horasMinPct: 85, horasMinDia: 4 });
  });
});

describe('perda de faturamento estimada', () => {
  it('dia reduzido perde a parte das horas cortadas; dia fechado perde o dia inteiro', () => {
    // Domingo de 14 h cortado em 7 h: metade de 7000 = 3500. Sábado fechado: 14000.
    const reduzido = hoje.map((d) => (d.dia === 6 ? { ...d, fecha: 15 } : d));
    expect(perdaMensal(hoje, reduzido, porDia())).toBeCloseTo(3500);
    expect(
      perdaMensal(
        hoje,
        hoje.filter((d) => d.dia !== 5),
        porDia(),
      ),
    ).toBeCloseTo(14000);
    expect(perdaMensal(hoje, hoje, porDia())).toBe(0);
  });
});

describe('sequência do fim de semana', () => {
  it('equipe que já cobre: nada a fazer', () => {
    const r = seq(98);
    expect(r).toMatchObject({ cobre: true, passos: [], perdaPct: 0, horasSemana: 98 });
  });

  it('corta o fechamento do dia mais barato por hora (domingo) antes do sábado, 1 h por vez', () => {
    // Cobre com 90 h: faltam 8 h; o domingo vende menos por hora (500 contra 1000): corta 8 h dele.
    const r = seq(90);
    expect(r.cobre).toBe(true);
    expect(r.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 6,
        horas: 8,
        de: { abre: 8, fecha: 22 },
        para: { abre: 8, fecha: 14 },
      },
    ]);
    // Perda: 7000 × 8 ÷ 14 = 4000 → 4000 ÷ 71000 = 5,6%.
    expect(r.perdaPct).toBe(5.6);
    expect(r.horasSemana).toBe(90);
    expect(diasUteisIguais(r)).toBe(true);
  });

  it('o domingo só desce até 4 h; depois o sábado entra', () => {
    // 86 h: faltam 12 h → domingo 10 h (fica 8h–12h) e sábado 2 h (fica 8h–20h).
    const r = seq(86);
    expect(r.cobre).toBe(true);
    expect(r.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 6,
        horas: 10,
        de: { abre: 8, fecha: 22 },
        para: { abre: 8, fecha: 12 },
      },
      {
        tipo: 'reduzir',
        dia: 5,
        horas: 2,
        de: { abre: 8, fecha: 22 },
        para: { abre: 8, fecha: 20 },
      },
    ]);
    // Perda: 5000 + 14000 × 2 ÷ 14 = 7000 → 9,9%.
    expect(r.perdaPct).toBe(9.9);
  });

  it('quando reduzir tudo estoura a trava, fecha o domingo (fase B)', () => {
    // 84,5 h: faltam 13,5 h. Reduzir domingo 10 h + sábado 4 h daria perda de 12,7% (> 10%). Fechar o domingo
    // corta 14 h (fica com 84 h) e perde 7000 = 9,9%.
    const r = seq(84.5);
    expect(r.cobre).toBe(true);
    expect(r.passos).toEqual([{ tipo: 'fechar', dia: 6, de: { abre: 8, fecha: 22 } }]);
    expect(r.horasSemana).toBe(84);
    expect(r.perdaPct).toBe(9.9);
    expect(r.dias.some((d) => d.dia === 5 && d.fecha === 22)).toBe(true);
    expect(diasUteisIguais(r)).toBe(true);
  });

  it('domingo fechado e ainda faltando pouco: o sábado só reduz dentro do teto', () => {
    // Com o domingo fechado (7000) e o sábado cortado em 1 h (1000): perda 8000 = 11,3% > 10%: não vale.
    const r = seq(83);
    expect(r.cobre).toBe(false);
    expect(r.parou).toBe('perda');
  });

  it('não cobre dentro das travas: mostra o corte máximo da fase de reduzir e quanto falta', () => {
    // 83 h: o maior corte válido é domingo 10 h + sábado 2 h (perda 9,9%, fica com 86 h).
    const r = seq(83);
    expect(r).toMatchObject({ cobre: false, parou: 'perda', horasSemana: 86, perdaPct: 9.9 });
    expect(r.passos.map((p) => [p.tipo, p.dia])).toEqual([
      ['reduzir', 6],
      ['reduzir', 5],
    ]);
    // Faltam 86 − 83 = 3 h de cobertura.
    expect(r.faltaH).toBe(3);
    expect(diasUteisIguais(r)).toBe(true);
  });

  it('a trava de horas também para o cenário', () => {
    // Venda zero não pesa na perda: só a trava de horas (85% de 98 h = 83,3 h) limita. Precisa de 80 h.
    const semVenda = vendaMes.map((_, dia) => ({ dia, protegido: false, vendaMes: 0 }));
    const r = seq(80, { porDia: semVenda });
    expect(r.cobre).toBe(false);
    expect(r.parou).toBe('horas');
    expect(r.horasSemana).toBeGreaterThanOrEqual(83.3);
  });

  it('dia protegido só pode ser reduzido, nunca fechado', () => {
    // Domingo protegido: a fase de fechar o domingo não existe; 84,5 h não fecha e não cobre.
    const r = seq(84.5, { porDia: porDia([6]) });
    expect(r.passos.some((p) => p.tipo === 'fechar' && p.dia === 6)).toBe(false);
    expect(r.cobre).toBe(false);
  });

  it('domingo já fechado hoje: o passo de fechar o domingo é pulado', () => {
    const semDomingo = hoje.filter((d) => d.dia !== 6); // 84 h
    // Cobre com 80 h: precisa cortar 4 h do sábado (vira 8h–18h): perda 14000 × 4 ÷ 14 = 4000 de 64000 = 6,3%.
    const r = seq(80, { porDia: porDia() }, semDomingo);
    expect(r.cobre).toBe(true);
    expect(r.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 5,
        horas: 4,
        de: { abre: 8, fecha: 22 },
        para: { abre: 8, fecha: 18 },
      },
    ]);
    expect(r.perdaPct).toBe(6.3);
  });

  it('dia com poucas horas: só reduz até sobrar 4 h', () => {
    const curto = hoje.map((d) => (d.dia === 6 ? { ...d, fecha: 13 } : d)); // domingo 8h–13h (5 h)
    // Domingo vende 2000 por mês (400 por hora, o mais barato); hoje são 5 + 14 × 6 = 89 h.
    const pd = vendaMes.map((v, dia) => ({
      dia,
      protegido: false,
      vendaMes: dia === 6 ? 2000 : v,
    }));
    expect(seq(94, { porDia: pd }, curto).cobre).toBe(true);
    // Cobre com 88,5 h: faltam 0,5 h → corta 1 h do domingo e sobram 4 h; perda 2000 ÷ 5 = 400.
    const r = seq(88.5, { porDia: pd }, curto);
    expect(r.cobre).toBe(true);
    expect(r.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 6,
        horas: 1,
        de: { abre: 8, fecha: 13 },
        para: { abre: 8, fecha: 12 },
      },
    ]);
    // Cobre com 87 h: o domingo já está em 4 h (piso); o resto vem do sábado, que é o próximo mais barato.
    const r2 = seq(87, { porDia: pd }, curto);
    expect(r2.passos.map((p) => [p.tipo, p.dia])).toEqual([
      ['reduzir', 6],
      ['reduzir', 5],
    ]);
    expect(r2.dias.find((d) => d.dia === 6)!.fecha - 8).toBe(4);
  });

  it('segunda a sexta nunca mudam, em nenhum caso', () => {
    for (const limite of [98, 90, 86, 84.5, 83, 70])
      expect(diasUteisIguais(seq(limite))).toBe(true);
  });

  it('quando a redução chega ao piso de 4 h mas fechar o sábado estouraria a trava, a trava é o motivo', () => {
    // Sábado curto (8h–14h, 6 h) e sem domingo: reduz até 4 h (perda 14000 × 2 ÷ 6 = 4667, 7,3% de 64000) e para;
    // fechar o sábado perderia 14000 (21,9% > 10%): o motivo é a trava de perda, não "nada mais a mexer".
    const util = hoje.filter((d) => d.dia <= 4);
    const curto = [...util, { dia: 5, abre: 8, fecha: 14 }]; // 70 + 6 = 76 h
    const r = seq(60, {}, curto);
    expect(r).toMatchObject({ cobre: false, parou: 'perda' });
    expect(r.passos).toEqual([
      {
        tipo: 'reduzir',
        dia: 5,
        horas: 2,
        de: { abre: 8, fecha: 14 },
        para: { abre: 8, fecha: 12 },
      },
    ]);
    expect(r.horasSemana).toBe(74);
  });

  it('loja fechada no fim de semana: não há o que mexer', () => {
    const util = hoje.filter((d) => d.dia <= 4);
    const r = seq(60, {}, util); // 70 h hoje, não cobre com 60 h
    expect(r).toMatchObject({ cobre: false, parou: 'fim_de_semana', passos: [] });
    expect(r.faltaH).toBe(10);
  });
});

describe('estadosPermitidos (Cenário 3)', () => {
  const dia = (d: number, abre = 8, fecha = 22) => ({ dia: d, abre, fecha });
  const venda = (dia: number, vendaMes: number, protegido = false) => ({
    dia,
    vendaMes,
    protegido,
  });

  it('só o fim de semana muda: sábado não protegido tem 14 h → original, 10 reduções (até 4 h) e fechado', () => {
    const dias = [0, 1, 2, 3, 4, 5].map((d) => dia(d));
    // vendas pequenas no sábado para nenhuma trava de perda cortar estados
    const porDia = [0, 1, 2, 3, 4, 5].map((d) => venda(d, d === 5 ? 100 : 10000));
    const estados = estadosPermitidos({ dias, porDia });
    // sábado: 1 (hoje) + 10 (reduzir de 1 a 10 h) + 1 (fechar) = 12; mas a trava de horas (85% de 84 = 71,4 h) corta
    // quem passa de 12,6 h de corte: fechar (14 h) fica de fora → 11 estados
    expect(estados).toHaveLength(11);
    expect(estados[0]).toEqual(dias);
    for (const e of estados)
      for (const d of [0, 1, 2, 3, 4]) expect(e.find((x) => x.dia === d)).toEqual(dia(d));
  });

  it('dia protegido só reduz; a perda máxima de 10% corta as reduções grandes', () => {
    const dias = [0, 1, 2, 3, 4, 5].map((d) => dia(d));
    // faturamento 7 × 1000 + sábado 3000 = 9000 → 10% = 900; sábado: 3000 ÷ 14 por hora = 214,29 → até 4 h (857,14)
    const porDia = [0, 1, 2, 3, 4, 5].map((d) => venda(d, d === 5 ? 3000 : 1200, d === 5));
    const estados = estadosPermitidos({ dias, porDia });
    const sabados = estados.map((e) => e.find((x) => x.dia === 5)?.fecha);
    expect(sabados).toEqual([22, 21, 20, 19, 18]);
    expect(sabados).not.toContain(undefined);
  });

  it('com sábado e domingo abertos e não protegidos: combina as opções dos dois dias, respeitando as travas', () => {
    const dias = [0, 1, 2, 3, 4, 5, 6].map((d) => dia(d, 8, 12)); // 4 h por dia: não dá para reduzir, só fechar
    const porDia = [0, 1, 2, 3, 4, 5, 6].map((d) => venda(d, 1000));
    const estados = estadosPermitidos({ dias, porDia });
    // fechar sábado e/ou domingo: 4 combinações; perda de fechar um = 1000 ÷ 7000 = 14,3% > 10% → só o original passa
    expect(estados).toHaveLength(1);
  });
});
