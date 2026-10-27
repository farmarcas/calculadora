import { describe, expect, it } from 'vitest';
import { verificarRegra, passa } from './capacidade.js';
import { regraPara } from './perfis.js';

// Loja aberta de segunda a sábado, das 8h às 22h (14h por dia).
const dias = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
const quadro = [
  { funcao: 'Farmacêutico', cargaH: 44 },
  { funcao: 'Farmacêutico', cargaH: 44 },
];

describe('verificarRegra', () => {
  it('passa na regra atual com dois farmacêuticos de 44h', () => {
    const [l] = verificarRegra(regraPara('atual', false), dias, { Farmacêutico: 1 }, quadro);
    expect(l).toMatchObject({
      necessidadeH: 84,
      necessidadeT: 12,
      capacidadeH: 88,
      saldoH: 4,
      saldoT: 0,
      falta: false,
    });
  });

  it('falta na regra de 40h e sugere contratação parcial', () => {
    const linhas = verificarRegra(regraPara('r40', false), dias, { Farmacêutico: 1 }, quadro);
    expect(passa(linhas)).toBe(false);
    expect(linhas[0]).toMatchObject({ capacidadeH: 80, saldoH: -4, contratar: 1, parcialH: 16 });
  });

  it('42h sem convenção vale 40h; com convenção as horas passam, mas faltam turnos', () => {
    const sem = verificarRegra(regraPara('r42', false), dias, { Farmacêutico: 1 }, quadro)[0]!;
    const com = verificarRegra(regraPara('r42', true), dias, { Farmacêutico: 1 }, quadro)[0]!;
    expect(sem.capacidadeH).toBe(80);
    expect(com.capacidadeH).toBe(84);
    // as horas passam, mas 2 pessoas em 5 dias dão 10 turnos para 12 necessários
    expect(com).toMatchObject({ okH: true, okT: false, saldoT: -2 });
  });

  it('função exigida sem ninguém no quadro falta por inteiro', () => {
    const l = verificarRegra(
      regraPara('atual', false),
      dias,
      { Farmacêutico: 1, Caixa: 1 },
      quadro,
    ).find((x) => x.funcao === 'Caixa')!;
    expect(l).toMatchObject({ pessoas: 0, capacidadeH: 0, falta: true, contratar: 2 });
  });

  it('função sem mínimo não cria déficit', () => {
    const l = verificarRegra(regraPara('r40', false), dias, { Apoio: 0 }, [
      { funcao: 'Apoio', cargaH: 40 },
    ])[0]!;
    expect(l.falta).toBe(false);
  });
});
