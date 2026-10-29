import { describe, expect, it } from 'vitest';
import { regraPara } from '../regras/perfis.js';
import { avaliarSimulacao, type PessoaSim, type TurnoSim } from './avaliar.js';

const dias = [0, 1, 2, 3, 4].map((dia) => ({ dia, abre: 8, fecha: 20 }));
const quadro: PessoaSim[] = [
  { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 40 },
  { matricula: 'B', nome: 'Bia', funcao: 'Farmacêutico', cargaH: 40 },
];
const t = (
  matricula: string,
  dia: number,
  entrada: number,
  saida: number,
  ini: number | null = null,
  fim: number | null = null,
): TurnoSim => ({
  matricula,
  dia,
  entrada,
  saida,
  iniIntervalo: ini,
  fimIntervalo: fim,
});
const base = { regra: regraPara('r40', false), dias, minimos: { Farmacêutico: 1 }, quadro };

// Ana 08–14 e Bia 14–20, sem intervalo (6h cada): cobre o dia inteiro.
const cobreTudo = [0, 1, 2, 3, 4].flatMap((d) => [t('A', d, 8, 14), t('B', d, 14, 20)]);

describe('avaliarSimulacao', () => {
  it('escala de revezamento válida não tem erros', () => {
    const r = avaliarSimulacao({ ...base, turnos: cobreTudo });
    expect(r.erros).toEqual([]);
    expect(r.podeGravar).toBe(true);
    expect(r.porPessoa[0]).toMatchObject({ horas: 30, dias: 5 });
  });

  it('mover o turno cria buraco sem farmacêutico e bloqueia gravar', () => {
    const turnos = cobreTudo.map((x) =>
      x.matricula === 'B' && x.dia === 2 ? { ...x, entrada: 15, saida: 20 } : x,
    );
    const r = avaliarSimulacao({ ...base, turnos });
    expect(r.podeGravar).toBe(false);
    expect(r.erros[0]).toMatchObject({ regra: 'farmaceutico', dia: 2 });
    expect(r.erros[0]!.texto).toContain('Qua 14:00–15:00');
  });

  it('jornada diária acima de 8h e intervalo faltando são erros', () => {
    const r = avaliarSimulacao({ ...base, turnos: [t('A', 0, 8, 18, 12, 13), t('A', 1, 8, 15)] });
    const regras = r.erros.map((e) => e.regra);
    expect(regras).toContain('jornada-diaria');
    expect(regras).toContain('intervalo');
  });

  it('mais dias que a regra permite exige folga', () => {
    const seis = [0, 1, 2, 3, 4, 5].map((d) => t('A', d, 8, 12));
    const r = avaliarSimulacao({ ...base, turnos: seis });
    expect(r.erros.some((e) => e.regra === 'folgas' && e.texto.includes('2 folga'))).toBe(true);
  });

  it('teto semanal pela carga contratada', () => {
    const r = avaliarSimulacao({
      ...base,
      quadro: [{ matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 30 }, quadro[1]!],
      turnos: [0, 1, 2, 3, 4]
        .map((d) => t('A', d, 8, 16, 11, 12))
        .concat(cobreTudo.filter((x) => x.matricula === 'B')),
    });
    expect(
      r.erros.some((e) => e.regra === 'jornada-semanal' && e.texto.includes('carga contratada')),
    ).toBe(true);
  });

  it('interjornada menor que 11h', () => {
    const r = avaliarSimulacao({ ...base, turnos: [t('A', 0, 12, 20, 15, 16), t('A', 1, 6, 12)] });
    expect(r.erros.some((e) => e.regra === 'interjornada')).toBe(true);
  });

  it('farmacêutico sozinho por mais de 6h gera aviso', () => {
    const turnos = [0, 1, 2, 3, 4].map((d) => t('A', d, 8, 20, 12, 13));
    const r = avaliarSimulacao({ ...base, turnos });
    expect(r.avisos.some((x) => x.regra === 'intervalo-descoberto')).toBe(true);
  });

  it('desligado simulado sai da cobertura e dos erros', () => {
    const q = [{ ...quadro[0]!, desligado: true }, quadro[1]!];
    const r = avaliarSimulacao({ ...base, quadro: q, turnos: cobreTudo });
    // sem a Ana, só a Bia cobre 14h–20h: faltam 08h–14h, e os turnos da Ana não contam
    expect(r.erros.some((e) => e.regra === 'farmaceutico')).toBe(true);
    expect(r.porPessoa.map((p) => p.matricula)).toEqual(['B']);
  });

  it('vaga entra como pessoa com limite igual à carga da vaga', () => {
    const vaga = {
      matricula: 'VAGA-1',
      nome: 'Vaga 1',
      funcao: 'Farmacêutico',
      cargaH: 16,
      vaga: true,
    };
    const turnos = [...cobreTudo, ...[0, 1, 2].map((d) => t('VAGA-1', d, 8, 14))];
    const r = avaliarSimulacao({ ...base, quadro: [...quadro, vaga], turnos });
    expect(r.erros.some((e) => e.regra === 'jornada-semanal' && e.texto.includes('Vaga 1'))).toBe(
      true,
    );
  });

  it('vaga sem turnos gera aviso', () => {
    const vaga = {
      matricula: 'VAGA-1',
      nome: 'Vaga 1',
      funcao: 'Atendimento',
      cargaH: 24,
      vaga: true,
    };
    const r = avaliarSimulacao({ ...base, quadro: [...quadro, vaga], turnos: cobreTudo });
    expect(r.avisos.some((x) => x.regra === 'vaga-sem-turnos')).toBe(true);
  });
});
