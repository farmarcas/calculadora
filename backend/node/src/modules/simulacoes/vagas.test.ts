import { describe, expect, it } from 'vitest';
import { regraPara } from '../regras/perfis.js';
import type { PessoaSim, TurnoSim } from './avaliar.js';
import { aplicarVagasEDesligados, vagasSugeridas } from './vagas.js';

const quadro: PessoaSim[] = [
  { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 40 },
  { matricula: 'B', nome: 'Bia', funcao: 'Caixa', cargaH: 40 },
];
const t = (matricula: string, dia = 0): TurnoSim => ({
  matricula,
  dia,
  entrada: 8,
  saida: 12,
  iniIntervalo: null,
  fimIntervalo: null,
});

describe('aplicarVagasEDesligados', () => {
  it('adiciona vagas numeradas e mantém as existentes ao reenviar a lista', () => {
    const a = aplicarVagasEDesligados(quadro, [t('A')], [{ funcao: 'Atendimento', cargaH: 24 }]);
    expect(a.quadro.filter((p) => p.vaga).map((p) => [p.matricula, p.nome])).toEqual([
      ['VAGA-1', 'Vaga 1'],
    ]);
    expect(a.adicionadas).toEqual(['VAGA-1']);
    const b = aplicarVagasEDesligados(
      a.quadro,
      [t('A'), t('VAGA-1', 1)],
      [
        { matricula: 'VAGA-1', funcao: 'Atendimento', cargaH: 32 },
        { funcao: 'Caixa', cargaH: 16 },
      ],
    );
    expect(b.quadro.filter((p) => p.vaga).map((p) => [p.matricula, p.cargaH])).toEqual([
      ['VAGA-1', 32],
      ['VAGA-2', 16],
    ]);
    expect(b.turnos).toHaveLength(2);
  });

  it('remover a vaga apaga os turnos dela', () => {
    const a = aplicarVagasEDesligados(quadro, [], [{ funcao: 'Apoio', cargaH: 20 }]);
    const b = aplicarVagasEDesligados(a.quadro, [t('A'), t('VAGA-1')], []);
    expect(b.removidas).toEqual(['VAGA-1']);
    expect(b.turnos.map((x) => x.matricula)).toEqual(['A']);
  });

  it('desliga e desfaz o desligamento; vaga não se desliga', () => {
    const a = aplicarVagasEDesligados(quadro, [t('B')], undefined, ['B']);
    expect(a.quadro.find((p) => p.matricula === 'B')!.desligado).toBe(true);
    expect(a.turnos).toHaveLength(1); // turnos ficam guardados: se desfizer, voltam
    const b = aplicarVagasEDesligados(a.quadro, a.turnos, undefined, []);
    expect(b.quadro.find((p) => p.matricula === 'B')!.desligado).toBeUndefined();
    const v = aplicarVagasEDesligados(quadro, [], [{ funcao: 'Caixa', cargaH: 20 }]);
    expect(() => aplicarVagasEDesligados(v.quadro, [], undefined, ['VAGA-1'])).toThrow(
      'remova a vaga',
    );
    expect(() => aplicarVagasEDesligados(quadro, [], undefined, ['ZZ'])).toThrow('não faz parte');
  });

  it('recusa vaga inexistente e mais de 20 vagas', () => {
    expect(() =>
      aplicarVagasEDesligados(quadro, [], [{ matricula: 'VAGA-9', funcao: 'Caixa', cargaH: 20 }]),
    ).toThrow('não existe');
    const muitas = Array.from({ length: 21 }, () => ({ funcao: 'Caixa', cargaH: 20 }));
    expect(() => aplicarVagasEDesligados(quadro, [], muitas)).toThrow('No máximo 20');
  });
});

describe('vagasSugeridas', () => {
  const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
  it('sugere uma vaga parcial quando falta pouco', () => {
    const q: PessoaSim[] = [
      { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 44 },
      { matricula: 'B', nome: 'Bia', funcao: 'Farmacêutico', cargaH: 44 },
    ];
    expect(vagasSugeridas(regraPara('r40', false), dias, { Farmacêutico: 1 }, q)).toEqual([
      { funcao: 'Farmacêutico', cargaH: 4 },
    ]);
  });
  it('falta muito: 84 h sem ninguém = 2 vagas inteiras e 1 parcial de 4 h, para o farmacêutico e para a meta do dono', () => {
    const v = vagasSugeridas(regraPara('r40', false), dias, { Caixa: 1 }, []);
    expect(v).toEqual([
      { funcao: 'Farmacêutico', cargaH: 40 },
      { funcao: 'Farmacêutico', cargaH: 40 },
      { funcao: 'Farmacêutico', cargaH: 4 },
      { funcao: 'Caixa', cargaH: 40 },
      { funcao: 'Caixa', cargaH: 40 },
      { funcao: 'Caixa', cargaH: 4 },
    ]);
  });
});
