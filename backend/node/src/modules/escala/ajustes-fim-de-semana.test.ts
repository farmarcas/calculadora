import { describe, expect, it } from 'vitest';
import type { DiaAberto } from '../regras/capacidade.js';
import {
  estadosPermitidos,
  ganhoDasHorasNovas,
  LIMITES_EXTENSAO,
  melhorEstado,
  passosDe,
  perdaMensal,
  vendaPerdidaHoraria,
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

describe('horário estendido (Cenário 3)', () => {
  const dia = (d: number, abre = 8, fecha = 20) => ({ dia: d, abre, fecha });
  const dias = [0, 1, 2, 3, 4, 5, 6].map((d) => dia(d));
  const porDia = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dia: d, vendaMes: 10000, protegido: d >= 5 }));
  // Venda e margem por hora iguais a 100 e 30 nas horas abertas (8h a 19h), em todos os dias.
  const tabela = (extra: Record<string, number> = {}) => {
    const venda = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
    const margem = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
    for (let d = 0; d < 7; d++)
      for (let h = 8; h < 20; h++) {
        venda[d]![h] = 100;
        margem[d]![h] = 30;
      }
    for (const [chave, v] of Object.entries(extra)) {
      const [d, h] = chave.split(':').map(Number);
      venda[d!]![h!] = v;
      margem[d!]![h!] = v * 0.3;
    }
    return { venda, margem, dias: 12 };
  };

  it('os limites são decididos em uma constante só', () => {
    expect(LIMITES_EXTENSAO).toEqual({
      horasMax: 3,
      aberturaMin: 6,
      fechamentoMax: 24,
      horasMaxDia: 16,
      fatorHoraNova: 0.5,
    });
  });

  it('sem `estender`, nada muda: os estados são os de sempre', () => {
    const base = estadosPermitidos({ dias, porDia });
    expect(estadosPermitidos({ dias, porDia, estender: false })).toEqual(base);
  });

  it('com `estender`, só sábado e domingo ganham horas, o primeiro estado segue sendo o de hoje e nenhum passa dos limites', () => {
    const estados = estadosPermitidos({ dias, porDia, estender: true });
    expect(estados[0]).toEqual(dias);
    expect(estados.length).toBeGreaterThan(estadosPermitidos({ dias, porDia }).length);
    for (const e of estados) {
      for (const d of [0, 1, 2, 3, 4]) expect(e.find((x) => x.dia === d)).toEqual(dia(d));
      for (const x of e) {
        expect(x.abre).toBeGreaterThanOrEqual(LIMITES_EXTENSAO.aberturaMin);
        expect(x.fecha).toBeLessThanOrEqual(LIMITES_EXTENSAO.fechamentoMax);
        expect(x.fecha - x.abre).toBeLessThanOrEqual(LIMITES_EXTENSAO.horasMaxDia);
      }
    }
    // sábado: abrir 1 a 3 h mais cedo e/ou fechar 1 a 3 h mais tarde, no total de 1 a 3 h (9 combinações)
    const sabados = new Set(estados.map((e) => JSON.stringify(e.find((x) => x.dia === 5))));
    expect(sabados).toContain(JSON.stringify({ dia: 5, abre: 7, fecha: 21 }));
    expect(sabados).toContain(JSON.stringify({ dia: 5, abre: 8, fecha: 23 }));
  });

  it('respeita 6h, 24h e 16 h por dia', () => {
    const cedo = [dia(5, 6, 20), dia(6, 8, 23)];
    const estados = estadosPermitidos({ dias: cedo, porDia, estender: true });
    expect(estados.every((e) => (e.find((x) => x.dia === 5)?.abre ?? 6) >= 6)).toBe(true);
    // domingo já em 23h: só dá para fechar 1 h mais tarde (24h)
    expect(Math.max(...estados.map((e) => e.find((x) => x.dia === 6)?.fecha ?? 0))).toBe(24);
    const longo = [dia(5, 7, 23), dia(6, 8, 20)]; // sábado com 16 h: não estende
    expect(
      estadosPermitidos({ dias: longo, porDia, estender: true }).every(
        (e) => (e.find((x) => x.dia === 5)?.fecha ?? 23) <= 23 && (e.find((x) => x.dia === 5)?.abre ?? 7) >= 7,
      ),
    ).toBe(true);
  });

  it('passo "estender" descreve as horas novas', () => {
    const final = dias.map((d) => (d.dia === 5 ? { ...d, abre: 7, fecha: 22 } : d));
    expect(passosDe(dias, final)).toEqual([
      {
        tipo: 'estender',
        dia: 5,
        horas: 3,
        de: { abre: 8, fecha: 20 },
        para: { abre: 7, fecha: 22 },
      },
    ]);
  });

  it('venda registrada na hora vale o registrado; sem registro vale metade da hora de borda', () => {
    const final = dias.map((d) => (d.dia === 5 ? { ...d, fecha: 22 } : d)); // 20h e 21h novas
    // 20h com 80 de venda registrada; 21h sem registro → 50% da última hora aberta (19h: 100)
    const g = ganhoDasHorasNovas(dias, final, tabela({ '5:20': 80 }));
    expect(g.porDia).toEqual([
      { dia: 5, horasNovas: 2, origem: 'mista', vendaMes: 563.33, margemMes: 169 },
    ]);
    // (80 + 50) × 52/12 = 563,33; margem (24 + 15) × 52/12 = 169
    expect(g.margemMes).toBe(169);
    expect(ganhoDasHorasNovas(dias, final, tabela()).porDia[0]!.origem).toBe('vizinha');
    expect(ganhoDasHorasNovas(dias, final, tabela({ '5:20': 80, '5:21': 60 })).porDia[0]!.origem).toBe('registrada');
  });

  it('sem tabela de vendas por hora, o ganho é zero', () => {
    const final = dias.map((d) => (d.dia === 5 ? { ...d, fecha: 22 } : d));
    expect(ganhoDasHorasNovas(dias, final, null)).toEqual({ vendaMes: 0, margemMes: 0, porDia: [] });
  });

  it('dia reduzido ou igual a hoje não gera ganho', () => {
    const reduzido = dias.map((d) => (d.dia === 5 ? { ...d, fecha: 18 } : d));
    expect(ganhoDasHorasNovas(dias, reduzido, tabela()).porDia).toEqual([]);
  });

  it('a perda de um horário maior que o de hoje é zero (o ganho é calculado à parte)', () => {
    const final = dias.map((d) => (d.dia === 5 ? { ...d, fecha: 22 } : d));
    expect(perdaMensal(dias, final, porDia)).toBe(0);
  });

  it('melhorEstado escolhe estender quando a margem das horas novas passa do custo, e não quando não passa', () => {
    const avaliar = (d: DiaAberto[]) => ({
      // cada hora aberta além de hoje (20h) custa 10 de folha
      custo: d.reduce((s, x) => s + Math.max(0, x.fecha - 20) * 10, 0),
      pessoas: 0,
    });
    const margemMes = () => 0;
    const comGanho = (porHora: number) => (d: DiaAberto[]) =>
      d.reduce((s, x) => s + Math.max(0, x.fecha - 20) * porHora, 0);
    const bom = melhorEstado({ dias, porDia, margemMes, avaliar, ganhoMes: comGanho(50) });
    expect(bom.horasNovas).toBeGreaterThan(0);
    expect(bom.impacto).toBeLessThan(0);
    expect(bom.ganho).toBeGreaterThan(0);
    const ruim = melhorEstado({ dias, porDia, margemMes, avaliar, ganhoMes: comGanho(5) });
    expect(ruim.dias).toEqual(dias);
    expect(ruim.horasNovas).toBe(0);
    // sem `ganhoMes` nunca estende
    expect(melhorEstado({ dias, porDia, margemMes, avaliar }).horasNovas).toBe(0);
  });
});

describe('venda perdida hora a hora (spec 022)', () => {
  const dia = (d: number, abre = 8, fecha = 20) => ({ dia: d, abre, fecha });
  const hojeL: DiaAberto[] = [0, 1, 2, 3, 4, 5, 6].map((d) => dia(d));
  // Venda média por hora (8h a 19h): segunda a sexta 100; sábado 100 até 15h e 20 depois; domingo 100 até 15h e 50 depois.
  const tabelaH = (extra: Record<string, number> = {}) => {
    const venda = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
    for (let d = 0; d < 7; d++)
      for (let h = 8; h < 20; h++) venda[d]![h] = d === 5 && h >= 16 ? 20 : d === 6 && h >= 16 ? 50 : 100;
    for (const [k, v] of Object.entries(extra)) {
      const [d, h] = k.split(':').map(Number);
      venda[d!]![h!] = v;
    }
    return { venda, margem: venda.map((l) => l.map((x) => x * 0.3)), dias: 12 };
  };
  const SEMANAS = 52 / 12;

  it('corte de fim de dia: soma só a venda das horas que fecham, × 52 ÷ 12, por dia alterado', () => {
    const final = hojeL.map((d) => (d.dia === 5 ? { ...d, fecha: 16 } : d));
    const r = vendaPerdidaHoraria(hojeL, final, tabelaH());
    // sábado: 16h, 17h, 18h e 19h valem 20 cada = 80 por semana
    expect(r.porDia).toEqual([{ dia: 5, horasFechadas: 4, ate: 16, vendaMes: Math.round(80 * SEMANAS * 100) / 100 }]);
    expect(r.vendaMes).toBe(Math.round(80 * SEMANAS * 100) / 100);
  });

  it('perde menos que a divisão igual do dia quando o fim do dia vende pouco', () => {
    const final = hojeL.map((d) => (d.dia === 5 ? { ...d, fecha: 16 } : d));
    const porDia = hojeL.map((d) => ({ dia: d.dia, protegido: false, vendaMes: Math.round(((d.dia === 5 ? 880 : 1200) * SEMANAS) * 100) / 100 }));
    // divisão igual: 4/12 de 880 = 293,33 por semana; hora a hora: 80
    expect(perdaMensal(hojeL, final, porDia, tabelaH())).toBeLessThan(perdaMensal(hojeL, final, porDia));
    expect(perdaMensal(hojeL, final, porDia, tabelaH())).toBe(vendaPerdidaHoraria(hojeL, final, tabelaH()).vendaMes);
  });

  it('dia fechado perde todas as horas; sem mudança perde zero; horário maior não é perda', () => {
    const fechado = hojeL.filter((d) => d.dia !== 6);
    const r = vendaPerdidaHoraria(hojeL, fechado, tabelaH());
    expect(r.porDia).toMatchObject([{ dia: 6, horasFechadas: 12, ate: null }]);
    expect(r.porDia[0]!.vendaMes).toBe(Math.round((8 * 100 + 4 * 50) * SEMANAS * 100) / 100);
    expect(vendaPerdidaHoraria(hojeL, hojeL, tabelaH())).toEqual({ vendaMes: 0, porDia: [] });
    const maior = hojeL.map((d) => (d.dia === 5 ? { ...d, fecha: 22 } : d));
    expect(vendaPerdidaHoraria(hojeL, maior, tabelaH())).toEqual({ vendaMes: 0, porDia: [] });
  });

  it('hora sem venda registrada conta zero', () => {
    const t = tabelaH({ '5:19': 0, '5:18': 0, '5:17': 0, '5:16': 0 });
    const final = hojeL.map((d) => (d.dia === 5 ? { ...d, fecha: 16 } : d));
    expect(vendaPerdidaHoraria(hojeL, final, t).vendaMes).toBe(0);
  });

  it('o Cenário 2 corta primeiro o dia cuja última hora vende menos, não o de menor venda média', () => {
    const porDia = hojeL.map((d) => ({ dia: d.dia, protegido: false, vendaMes: d.dia === 5 ? 14000 : d.dia === 6 ? 7000 : 10000 }));
    const horasTotal = (ds: DiaAberto[]) => ds.reduce((s, x) => s + (x.fecha - x.abre), 0);
    const cobre = (ds: DiaAberto[]) => horasTotal(ds) <= 82;
    const venda = Array.from({ length: 7 }, () => new Array<number>(24).fill(100));
    venda[5]![19] = 5;
    venda[5]![18] = 5;
    venda[6]![19] = 50;
    venda[6]![18] = 50;
    const tabela = { venda, margem: venda, dias: 12 };
    const comTabela = sequenciaFimDeSemana({ dias: hojeL, porDia, cobre, tabela });
    expect(comTabela.dias.find((d) => d.dia === 5)!.fecha).toBe(18);
    expect(comTabela.dias.find((d) => d.dia === 6)!.fecha).toBe(20);
    // sem a tabela, vale a venda média do dia: o domingo (7000) é o mais barato por hora
    const semTabela = sequenciaFimDeSemana({ dias: hojeL, porDia, cobre });
    expect(semTabela.dias.find((d) => d.dia === 6)!.fecha).toBe(18);
    expect(semTabela.dias.find((d) => d.dia === 5)!.fecha).toBe(20);
  });

  it('melhorEstado com a tabela: o impacto é custo + venda perdida − venda ganha; sem mudança fica o horário de hoje', () => {
    const avaliar = () => ({ custo: 0, pessoas: 0 });
    const porDia = hojeL.map((d) => ({ dia: d.dia, protegido: d.dia >= 5, vendaMes: 10000 }));
    const r = melhorEstado({ dias: hojeL, porDia, tabela: tabelaH(), avaliar });
    expect(r.dias).toEqual(hojeL);
    expect(r.perdida).toBe(0);
    expect(r.impacto).toBe(0);
  });

  it('ganhoDasHorasNovas aceita o percentual da hora vizinha', () => {
    const t = tabelaH();
    const final = hojeL.map((d) => (d.dia === 5 ? { ...d, fecha: 21 } : d));
    // hora nova 20h: vizinha é 19h (20 no sábado)
    expect(ganhoDasHorasNovas(hojeL, final, t).vendaMes).toBe(Math.round(10 * SEMANAS * 100) / 100);
    expect(ganhoDasHorasNovas(hojeL, final, t, 0.8).vendaMes).toBe(Math.round(16 * SEMANAS * 100) / 100);
    expect(ganhoDasHorasNovas(hojeL, final, t, 0).vendaMes).toBe(0);
  });
});

