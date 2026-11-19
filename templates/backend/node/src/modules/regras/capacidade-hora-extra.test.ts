import { describe, expect, it } from 'vitest';
import { verificarRegra, type LinhaFuncao } from './capacidade.js';
import { custoMensalDaHoraExtra } from './hora-extra.js';
import { regraPara } from './perfis.js';

// Loja aberta de segunda a sábado, das 8h às 22h (84 h por semana). Spec 063: hora extra antes de contratar.
const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
const farm = (...horas: number[]) => horas.map((cargaH) => ({ funcao: 'Farmacêutico', cargaH }));
const de = (linhas: LinhaFuncao[], funcao: string) => linhas.find((l) => l.funcao === funcao)!;
const custos = { salarioMedio: { Farmacêutico: 4722, Atendimento: 2129 }, encargosPct: 62.2 };
const verificar = (
  pessoas: { funcao: string; cargaH: number }[],
  horaExtra: boolean,
  regraId: 'atual' | 'r40' = 'r40',
) =>
  verificarRegra(regraPara(regraId, false), dias, { Farmacêutico: 1 }, pessoas, {
    horaExtra,
    custos,
    divisor: 220,
  });

describe('verificarRegra com hora extra (spec 063)', () => {
  it('desligada (o padrão), nada muda: a falta de 4 h vira contratação', () => {
    const l = de(verificar(farm(44, 44), false), 'Farmacêutico');
    expect(l.gapH).toBe(4);
    expect(l.contratar).toBe(1);
    expect(l.horaExtraH).toBe(0);
    expect(l.horaExtraCustoMensal).toBe(0);
    expect(l.faltaAposHoraExtraH).toBe(0);
  });

  it('fecha só com hora extra: 2 farmacêuticos e 4 h por semana faltando, sem contratar ninguém', () => {
    const l = de(verificar(farm(44, 44), true), 'Farmacêutico');
    // A falta bruta continua a mesma (o diagnóstico segue vendo a falta); a decisão vive nos campos novos.
    expect(l.gapH).toBe(4);
    expect(l.falta).toBe(true);
    expect(l.horaExtraH).toBe(4);
    expect(l.contratar).toBe(0);
    expect(l.sugestao).toBeNull();
    expect(l.horaExtraCustoMensal).toBe(
      custoMensalDaHoraExtra({
        horasSemana: 4,
        salarioMedio: 4722,
        divisor: 220,
        encargosPct: 62.2,
      }),
    );
    expect(l.memoria).toContain('A hora extra de quem já está escalado cobre 4h por semana');
  });

  it('fecha em parte: contrata só o que sobra e mantém a hora extra da ponta', () => {
    // 1 farmacêutico de 44 h (40 h na regra de 40 h): faltam 44 h; a hora extra (até 10 h) deixa 34 h para 1 pessoa de 40 h,
    // que cobre tudo; as 4 h da ponta ficam como hora extra e só 1 pessoa entra.
    const l = de(verificar(farm(44), true), 'Farmacêutico');
    expect(l.gapH).toBe(44);
    expect(l.contratarInteiras).toBe(1);
    expect(l.horaExtraH).toBe(4);
    expect(l.contratar).toBe(1);
  });

  it('se uma pessoa nova já cobre tudo, não há hora extra a pagar', () => {
    // 1 farmacêutico de 44 h na regra atual: falta 40 h; 1 contratação integral (44 h) cobre tudo, hora extra 0.
    const l = de(verificar(farm(44), true, 'atual'), 'Farmacêutico');
    expect(l.contratar).toBe(1);
    expect(l.horaExtraH).toBe(0);
  });

  it('continua precisando contratar quando ninguém da função está escalado', () => {
    const linhas = verificarRegra(
      regraPara('atual', false),
      dias,
      { Farmacêutico: 1, Atendimento: 1 },
      farm(44, 44),
      { horaExtra: true, custos, divisor: 220 },
    );
    const a = de(linhas, 'Atendimento');
    expect(a.horaExtraH).toBe(0);
    expect(a.contratar).toBeGreaterThan(0);
  });

  it('sem salário informado, as horas de hora extra aparecem e o custo fica nulo', () => {
    const l = de(
      verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, farm(44, 44), {
        horaExtra: true,
        custos: { salarioMedio: {}, encargosPct: 62.2 },
        divisor: 220,
      }),
      'Farmacêutico',
    );
    expect(l.horaExtraH).toBe(4);
    expect(l.horaExtraCustoMensal).toBeNull();
  });
});
