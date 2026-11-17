import { describe, expect, it } from 'vitest';
import { planejarMigracao, type FuncionarioCadastro, type TurnoEscala } from './migrar-escala.js';

const turno = (m: string, extra: Partial<TurnoEscala> = {}): TurnoEscala => ({
  matricula: m,
  nome: `Pessoa ${m}`,
  funcao: 'Farmacêutico',
  dias: [0, 1, 2, 3, 4],
  entrada: 8,
  saida: 17,
  iniIntervalo: 12,
  fimIntervalo: 13,
  cargaH: 44,
  ...extra,
});
const func = (m: string, extra: Partial<FuncionarioCadastro> = {}): FuncionarioCadastro => ({
  id: `id-${m}`,
  matricula: m,
  nome: `Pessoa ${m}`,
  funcaoEscala: null,
  cargaSemanalH: null,
  entrada: null,
  saida: null,
  iniIntervalo: null,
  fimIntervalo: null,
  dias: [],
  ...extra,
});

describe('planejarMigracao', () => {
  it('preenche tudo o que está vazio no funcionário', () => {
    const r = planejarMigracao([turno('A')], [func('A')]);
    expect(r.preenchimentos).toEqual([
      {
        funcionarioId: 'id-A',
        matricula: 'A',
        dados: {
          dias: [0, 1, 2, 3, 4],
          entrada: 8,
          saida: 17,
          iniIntervalo: 12,
          fimIntervalo: 13,
          funcaoEscala: 'Farmacêutico',
          cargaSemanalH: 44,
        },
      },
    ]);
    expect(r.relatorio).toEqual({ preenchidos: 1, jaTinhamDados: 0, semCorrespondente: [] });
  });

  it('não sobrescreve nada que o Cadastro já tem', () => {
    const cheio = func('B', {
      funcaoEscala: 'Caixa',
      cargaSemanalH: 40,
      entrada: 9,
      saida: 18,
      iniIntervalo: 13,
      fimIntervalo: 14,
      dias: [0, 1],
    });
    const r = planejarMigracao(
      [turno('B', { funcao: 'Farmacêutico', entrada: 7, saida: 16 })],
      [cheio],
    );
    expect(r.preenchimentos).toEqual([]);
    expect(r.relatorio).toEqual({ preenchidos: 0, jaTinhamDados: 1, semCorrespondente: [] });
  });

  it('completa só o que falta (horário vazio, resto preenchido)', () => {
    const r = planejarMigracao(
      [turno('C')],
      [func('C', { funcaoEscala: 'Caixa', cargaSemanalH: 40 })],
    );
    expect(Object.keys(r.preenchimentos[0]!.dados).sort()).toEqual([
      'dias',
      'entrada',
      'fimIntervalo',
      'iniIntervalo',
      'saida',
    ]);
  });

  it('pessoa da escala sem funcionário no Cadastro vai para o relatório e não é criada', () => {
    const r = planejarMigracao([turno('Z')], [func('A')]);
    expect(r.preenchimentos).toEqual([]);
    expect(r.relatorio.semCorrespondente).toEqual([{ matricula: 'Z', nome: 'Pessoa Z' }]);
  });

  it('matrícula casa sem diferenciar maiúsculas e espaços', () => {
    const r = planejarMigracao([turno(' f1 ')], [func('F1')]);
    expect(r.relatorio.preenchidos).toBe(1);
  });

  it('intervalo fora do turno ou incompleto não é copiado', () => {
    const fora = planejarMigracao([turno('D', { iniIntervalo: 7, fimIntervalo: 8 })], [func('D')]);
    expect(fora.preenchimentos[0]!.dados).not.toHaveProperty('iniIntervalo');
    const meio = planejarMigracao([turno('E', { fimIntervalo: null })], [func('E')]);
    expect(meio.preenchimentos[0]!.dados).not.toHaveProperty('iniIntervalo');
  });

  it('é repetível: aplicando o plano ao funcionário, a segunda rodada não muda nada', () => {
    const f = func('A');
    const um = planejarMigracao([turno('A')], [f]);
    const d = um.preenchimentos[0]!.dados;
    const depois: FuncionarioCadastro = { ...f, ...d };
    const dois = planejarMigracao([turno('A')], [depois]);
    expect(dois.preenchimentos).toEqual([]);
    expect(dois.relatorio.jaTinhamDados).toBe(1);
  });

  it('matrícula repetida na escala vale a primeira linha', () => {
    const r = planejarMigracao(
      [turno('A', { entrada: 8 }), turno('A', { entrada: 10 })],
      [func('A')],
    );
    expect(r.preenchimentos).toHaveLength(1);
    expect(r.preenchimentos[0]!.dados.entrada).toBe(8);
  });

  it('pessoa sem correspondente gera uma criação (só usada com --criar-ausentes), com o intervalo válido', () => {
    const r = planejarMigracao([turno('Z')], []);
    expect(r.criacoes).toEqual([
      {
        matricula: 'Z',
        nome: 'Pessoa Z',
        funcaoEscala: 'Farmacêutico',
        cargaSemanalH: 44,
        entrada: 8,
        saida: 17,
        iniIntervalo: 12,
        fimIntervalo: 13,
        dias: [0, 1, 2, 3, 4],
      },
    ]);
    expect(planejarMigracao([turno('Y', { fimIntervalo: null })], []).criacoes[0]).toMatchObject({
      iniIntervalo: null,
      fimIntervalo: null,
    });
  });
});
