import { describe, expect, it } from 'vitest';
import { cobertura } from '../escala/cobertura.js';
import { coberturaDaSimulacao } from './cobertura-simulacao.js';

const seg = (abre: number, fecha: number) => [{ dia: 0, abre, fecha }];
const turno = (matricula: string, entrada: number, saida: number, dia = 0) => ({
  matricula,
  dia,
  entrada,
  saida,
  iniIntervalo: null,
  fimIntervalo: null,
});
const pessoa = (matricula: string, funcao: string, extra = {}) => ({
  matricula,
  nome: matricula,
  funcao,
  cargaH: 40,
  ...extra,
});
const base = {
  horarios: null,
  minimos: { Farmacêutico: 1 },
  vendas: [],
  dono: true,
};
const celulas = (r: ReturnType<typeof coberturaDaSimulacao>, funcao = 'Farmacêutico') =>
  r.funcoes.find((f) => f.funcao === funcao)!.porHora;

describe('coberturaDaSimulacao', () => {
  it('é a mesma conta do Diagnóstico quando horário e quadro são os mesmos', () => {
    const dias = seg(8, 12);
    const t = [turno('A', 8, 12)];
    const r = coberturaDaSimulacao({
      ...base,
      dias,
      quadro: [pessoa('A', 'Farmacêutico')],
      turnos: t,
    });
    const d = cobertura(
      dias,
      [
        {
          funcao: 'Farmacêutico',
          dias: [0],
          entrada: 8,
          saida: 12,
          iniIntervalo: null,
          fimIntervalo: null,
        },
      ],
      { Farmacêutico: 1 },
    );
    expect(r.horas).toEqual(d.horas);
    expect(r.funcoes).toEqual(d.funcoes);
  });

  it('hora fora do horário simulado não conta e hora nova entra na conta', () => {
    const quadro = [pessoa('A', 'Farmacêutico')];
    const turnos = [turno('A', 8, 12)];
    // A simulação fecha às 10h: as 10h e 11h saem. Depois estende até 14h: as 12h e 13h entram sem ninguém.
    const reduzido = coberturaDaSimulacao({ ...base, dias: seg(8, 10), quadro, turnos });
    expect(celulas(reduzido).map((c) => c.hora)).toEqual([8, 9]);
    const estendido = coberturaDaSimulacao({ ...base, dias: seg(8, 14), quadro, turnos });
    expect(celulas(estendido).find((c) => c.hora === 13)).toMatchObject({ pessoas: 0, ok: false });
  });

  it('desligado não cobre nada', () => {
    const turnos = [turno('A', 8, 12)];
    const r = coberturaDaSimulacao({
      ...base,
      dias: seg(8, 12),
      quadro: [pessoa('A', 'Farmacêutico', { desligado: true })],
      turnos,
    });
    expect(celulas(r).every((c) => c.pessoas === 0 && c.ok === false)).toBe(true);
  });

  it('vaga com turnos cobre; vaga sem turnos não cobre e é contada à parte', () => {
    const quadro = [
      pessoa('V1', 'Farmacêutico', { vaga: true }),
      pessoa('V2', 'Atendimento', { vaga: true }),
    ];
    const r = coberturaDaSimulacao({
      ...base,
      dias: seg(8, 12),
      quadro,
      turnos: [turno('V1', 8, 12)],
    });
    expect(celulas(r).every((c) => c.pessoas === 1)).toBe(true);
    expect(r.vagasSemTurnos).toBe(1);
  });

  it('sem base de vendas, vendas é nulo', () => {
    const r = coberturaDaSimulacao({ ...base, dias: seg(8, 12), quadro: [], turnos: [] });
    expect(r.vendas).toBeNull();
  });

  const linhas = [
    { data: '2026-09-07', hora: 8, venda: 100, margem: 10, clientes: 5, unidades: 9 },
    { data: '2026-09-07', hora: 9, venda: 300, margem: 30, clientes: 8, unidades: 20 },
  ];
  it('o dono recebe a venda média em reais e os outros perfis só a participação', () => {
    const dono = coberturaDaSimulacao({
      ...base,
      dias: seg(8, 10),
      quadro: [],
      turnos: [],
      vendas: linhas,
    });
    expect(dono.vendas!.horas[0]).toHaveProperty('vendaMedia');
    const gestor = coberturaDaSimulacao({
      ...base,
      dias: seg(8, 10),
      quadro: [],
      turnos: [],
      vendas: linhas,
      dono: false,
    });
    expect(gestor.vendas!.horas[0]).not.toHaveProperty('vendaMedia');
    expect(gestor.vendas!.horas[0]).toHaveProperty('participacao');
    expect(JSON.stringify(gestor)).not.toMatch(/vendaMedia|"venda"/);
  });

  it('devolve os turnos da loja e o modo do mínimo; sem turnos, nulo', () => {
    const turnosDaLoja = {
      versao: 1 as const,
      modo: 'turnos' as const,
      turnos: [{ nome: 'Manhã', inicio: '08:00', fim: '12:00', minimos: { Farmacêutico: 1 } }],
    };
    const r = coberturaDaSimulacao({
      ...base,
      dias: seg(8, 12),
      quadro: [],
      turnos: [],
      turnosDaLoja,
    });
    expect(r.turnosDaLoja).toMatchObject({ modoMinimo: 'turnos' });
    expect(
      coberturaDaSimulacao({ ...base, dias: seg(8, 12), quadro: [], turnos: [] }).turnosDaLoja,
    ).toBeNull();
  });
});
