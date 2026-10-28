import { describe, expect, it } from 'vitest';
import type { DiaAberto } from '../regras/capacidade.js';
import { exigenciasDaLoja, type TurnosLoja } from '../regras/turnos.js';
import { cobertura, type TurnoPessoa } from './cobertura.js';
import { montarQuadroTurnos } from './quadro-turnos.js';

const dias: DiaAberto[] = Array.from({ length: 5 }, (_, dia) => ({ dia, abre: 8, fecha: 20 }));
const turnosLoja: TurnosLoja = {
  versao: 1,
  turnos: [
    { nome: 'Manhã', inicio: '08:00', fim: '14:00', minimos: { Farmacêutico: 1, Atendimento: 1 } },
    { nome: 'Tarde', inicio: '14:00', fim: '18:00', minimos: { Farmacêutico: 1, Atendimento: 3 } },
    { nome: 'Noite', inicio: '18:00', fim: '20:00', minimos: { Farmacêutico: 1, Atendimento: 1 } },
  ],
};
const pessoa = (
  funcao: string,
  entrada: number,
  saida: number,
  diasT = [0, 1, 2, 3, 4],
): TurnoPessoa => ({
  funcao,
  dias: diasT,
  entrada,
  saida,
  iniIntervalo: null,
  fimIntervalo: null,
});

const montar = (
  pessoas: TurnoPessoa[],
  turnos: TurnosLoja | null = turnosLoja,
  minimos = { Farmacêutico: 1, Atendimento: 1 },
) => {
  const exigencias = exigenciasDaLoja(minimos, turnos);
  return montarQuadroTurnos({
    dias,
    turnosLoja: turnos,
    exigencias,
    cob: cobertura(dias, pessoas, exigencias),
    fora: [],
  });
};
const celula = (q: ReturnType<typeof montar>, cargo: string, turno: string) =>
  q.cargos.find((c) => c.cargo === cargo)!.turnos.find((t) => t.turno === turno)!;

describe('quadro por cargo e turno', () => {
  const equipe = [
    pessoa('Farmacêutico', 8, 14),
    pessoa('Farmacêutico', 14, 20),
    pessoa('Atendimento', 8, 20),
  ];

  it('mostra presentes × exigido e destaca só o turno que falta', () => {
    const q = montar(equipe);
    expect(q.turnos.map((t) => t.nome)).toEqual(['Manhã', 'Tarde', 'Noite']);
    expect(celula(q, 'Atendimento', 'Manhã')).toEqual({
      turno: 'Manhã',
      presentes: 1,
      exigido: 1,
      falta: false,
    });
    expect(celula(q, 'Atendimento', 'Tarde')).toEqual({
      turno: 'Tarde',
      presentes: 1,
      exigido: 3,
      falta: true,
    });
    expect(celula(q, 'Atendimento', 'Noite')).toMatchObject({
      presentes: 1,
      exigido: 1,
      falta: false,
    });
    for (const t of ['Manhã', 'Tarde', 'Noite'])
      expect(celula(q, 'Farmacêutico', t).falta).toBe(false);
  });

  it('o número do turno é o da pior hora: quem cobre só parte do turno não conta nas horas que faltam', () => {
    const q = montar([pessoa('Farmacêutico', 8, 20), pessoa('Atendimento', 9, 20)]);
    expect(celula(q, 'Atendimento', 'Manhã')).toMatchObject({ presentes: 0, falta: true }); // 8h sem ninguém
  });

  it('no pior dia: quem só trabalha alguns dias deixa o turno descoberto nos outros', () => {
    const q = montar([pessoa('Farmacêutico', 8, 20), pessoa('Atendimento', 8, 20, [0, 1, 2, 3])]);
    expect(celula(q, 'Atendimento', 'Manhã')).toMatchObject({ presentes: 0, falta: true });
  });

  it('sem turnos definidos: um turno "Dia todo" com o mínimo único', () => {
    const q = montar([pessoa('Farmacêutico', 8, 20), pessoa('Atendimento', 8, 20)], null, {
      Farmacêutico: 1,
      Atendimento: 2,
    });
    expect(q.turnos).toEqual([{ nome: 'Dia todo', inicio: '08:00', fim: '20:00' }]);
    expect(celula(q, 'Atendimento', 'Dia todo')).toEqual({
      turno: 'Dia todo',
      presentes: 1,
      exigido: 2,
      falta: true,
    });
    expect(celula(q, 'Farmacêutico', 'Dia todo')).toMatchObject({
      presentes: 1,
      exigido: 1,
      falta: false,
    });
  });

  it('cargo que ninguém exige nem ocupa fica fora; cargo ocupado sem exigência aparece', () => {
    const q = montar([...equipe, pessoa('Apoio', 8, 20)]);
    expect(q.cargos.map((c) => c.cargo)).not.toContain('Caixa');
    expect(celula(q, 'Apoio', 'Tarde')).toMatchObject({ presentes: 1, exigido: 0, falta: false });
  });

  it('a lista de fora da conta segue como veio', () => {
    const exigencias = exigenciasDaLoja({ Farmacêutico: 1 }, null);
    const q = montarQuadroTurnos({
      dias,
      turnosLoja: null,
      exigencias,
      cob: cobertura(dias, [], exigencias),
      fora: [{ nome: 'Ana', motivo: 'sem função de escala' }],
    });
    expect(q.foraDaConta).toEqual([{ nome: 'Ana', motivo: 'sem função de escala' }]);
  });
});
