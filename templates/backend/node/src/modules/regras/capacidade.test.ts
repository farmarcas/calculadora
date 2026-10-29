import { describe, expect, it } from 'vitest';
import { contratacaoPorTurnos, passa, verificarRegra } from './capacidade.js';
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
    expect(linhas[0]).toMatchObject({
      capacidadeH: 80,
      saldoH: -4,
      contratar: 1,
      parcialH: 16,
      faltaH: 16, // o turno que falta (2 × 8h) pesa mais que as 4h de saldo
      cargaCheiaH: 40,
    });
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

describe('contratação por turnos (regra do documento)', () => {
  // Fase de 40h: 5 dias, turno de 8h, jornada cheia de 40h.
  const c = (turnosFaltantes: number, horasFaltantes: number, limiteParcial = 3) =>
    contratacaoPorTurnos({
      turnosFaltantes,
      horasFaltantes,
      diasDaFase: 5,
      horasPorPessoa: 40,
      duracaoTurno: 8,
      limiteParcial,
    });

  it('7 turnos faltantes: 1 inteira e resto 2 → 1 parcial de 2 turnos', () => {
    expect(c(7, 56)).toEqual({ inteiras: 1, parcialTurnos: 2, resto: 2, ajustado: false });
  });
  it('9 turnos: resto 4 acima do limite → 2 inteiras, sem parcial', () => {
    expect(c(9, 72)).toEqual({ inteiras: 2, parcialTurnos: 0, resto: 4, ajustado: false });
  });
  it('10 turnos: 2 inteiras exatas', () => {
    expect(c(10, 80)).toEqual({ inteiras: 2, parcialTurnos: 0, resto: 0, ajustado: false });
  });
  it('de 1 a 3 turnos faltantes: só um parcial; 4 turnos: uma inteira', () => {
    expect(c(1, 8)).toMatchObject({ inteiras: 0, parcialTurnos: 1 });
    expect(c(3, 24)).toMatchObject({ inteiras: 0, parcialTurnos: 3 });
    expect(c(4, 32)).toMatchObject({ inteiras: 1, parcialTurnos: 0 });
  });
  it('nada faltando: nada a contratar', () => {
    expect(c(0, 0)).toEqual({ inteiras: 0, parcialTurnos: 0, resto: 0, ajustado: false });
  });
  it('o limite do parcial vai de 0 a 3: 0 desliga, 2 recusa resto 3, 5 vale 3', () => {
    expect(c(2, 16, 0)).toMatchObject({ inteiras: 1, parcialTurnos: 0 });
    expect(c(3, 24, 2)).toMatchObject({ inteiras: 1, parcialTurnos: 0 });
    expect(c(4, 32, 5)).toMatchObject({ inteiras: 1, parcialTurnos: 0 }); // 5 é cortado para 3
  });
  it('conferência final: se as horas não fecham, acrescenta inteira e avisa', () => {
    expect(c(5, 100)).toEqual({ inteiras: 3, parcialTurnos: 0, resto: 0, ajustado: true });
  });
  it('conferência final mantém o parcial quando as inteiras novas ainda não bastam sem ele', () => {
    expect(c(2, 90)).toMatchObject({ inteiras: 2, parcialTurnos: 2, ajustado: true });
  });
  it('conferência final dispensa o parcial quando as inteiras novas já cobrem tudo', () => {
    expect(c(2, 70)).toMatchObject({ inteiras: 2, parcialTurnos: 0, ajustado: true });
  });

  it('na linha da função: inteiras, parcial, horas e a explicação da conta', () => {
    const dias6 = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
    const l = verificarRegra(regraPara('r40', false), dias6, { Atendimento: 1 }, [
      { funcao: 'Atendimento', cargaH: 40 },
    ])[0]!;
    // 12 turnos necessários, 5 de capacidade → 7 faltantes
    expect(l).toMatchObject({
      saldoT: -7,
      contratarInteiras: 1,
      parcialTurnos: 2,
      parcialH: 16,
      contratar: 2,
      ajustado: false,
    });
    expect(l.memoria).toContain(
      '7 turno(s) faltantes ÷ 5 dias = 1 inteira(s), resto 2 turno(s) → 1 parcial de 2 turno(s) (16h)',
    );
  });

  it('opção limiteParcial na verificação: 0 desliga o parcial', () => {
    const dias6 = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 8, fecha: 22 }));
    const l = verificarRegra(
      regraPara('r40', false),
      dias6,
      { Atendimento: 1 },
      [{ funcao: 'Atendimento', cargaH: 40 }],
      { limiteParcial: 0 },
    )[0]!;
    expect(l).toMatchObject({
      contratarInteiras: 2,
      parcialTurnos: 0,
      parcialH: null,
      contratar: 2,
    });
  });

  it('sem falta, sem contratação', () => {
    const l = verificarRegra(regraPara('r40', false), dias, { Apoio: 0 }, [
      { funcao: 'Apoio', cargaH: 40 },
    ])[0]!;
    expect(l).toMatchObject({
      contratar: 0,
      contratarInteiras: 0,
      parcialTurnos: 0,
      parcialH: null,
    });
  });
});
