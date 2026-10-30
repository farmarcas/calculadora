import { describe, expect, it } from 'vitest';
import { configuracaoDaLinha, lerSimNao } from './configuracao.js';

const de = (valores: Record<string, string>) => (chave: string) => valores[chave] ?? '';

describe('lerSimNao', () => {
  it('Sim e Não em várias grafias; vazio é "não informado"; o resto é inválido', () => {
    expect(lerSimNao('Sim')).toBe(true);
    expect(lerSimNao(' x ')).toBe(true);
    expect(lerSimNao('Não')).toBe(false);
    expect(lerSimNao('nao')).toBe(false);
    expect(lerSimNao('')).toBeNull();
    expect(lerSimNao('talvez')).toBeNaN();
  });
});

describe('configuracaoDaLinha', () => {
  it('linha sem nenhuma coluna de configuração não devolve nada (mantém a loja como está)', () => {
    expect(configuracaoDaLinha(de({}))).toEqual({});
  });

  it('lê convenção, metas e custos; só entra o que veio preenchido', () => {
    const r = configuracaoDaLinha(
      de({
        convencao_8h24: 'Sim',
        meta_farmaceutico: '2',
        meta_caixa: '1',
        salario_farmaceutico: '6.000,50',
        salario_atendimento: '2100',
        rat_pct: '3',
        fap: '1,5',
        rescisao: 'Sim',
      }),
    );
    expect(r.erro).toBeUndefined();
    expect(r.configuracao).toEqual({
      convencao8h24: true,
      minimos: { Farmacêutico: 2, Caixa: 1 },
      custos: {
        salarioMedio: { Farmacêutico: 6000.5, Atendimento: 2100 },
        encargos: { ratPct: 3, fap: 1.5, rescisaoLigada: true },
      },
    });
  });

  it('convenção "Não" é um valor (desliga); em branco não mexe', () => {
    expect(configuracaoDaLinha(de({ convencao_8h24: 'Não' })).configuracao).toEqual({
      convencao8h24: false,
    });
    expect(configuracaoDaLinha(de({ convencao_8h24: '' })).configuracao).toBeUndefined();
  });

  it('só o salário: sem ajuste de encargos (o encargo vem do regime da loja)', () => {
    const r = configuracaoDaLinha(de({ salario_caixa: '1900' }));
    expect(r.configuracao?.custos).toEqual({ salarioMedio: { Caixa: 1900 } });
  });

  it('a coluna antiga "Encargos (%)" ainda é lida, só para o serviço avisar que foi ignorada', () => {
    const r = configuracaoDaLinha(de({ salario_caixa: '1900', encargos_pct: '66' }));
    expect(r.configuracao?.custos).toEqual({ salarioMedio: { Caixa: 1900 }, encargosPct: 66 });
  });

  it('rescisão Não é um valor (desliga); em branco não mexe', () => {
    expect(configuracaoDaLinha(de({ rescisao: 'Não' })).configuracao?.custos?.encargos).toEqual({
      rescisaoLigada: false,
    });
    expect(configuracaoDaLinha(de({ rescisao: '' })).configuracao).toBeUndefined();
  });

  it.each([
    [{ convencao_8h24: 'talvez' }, 'Convenção 8h24'],
    [{ meta_atendimento: '11' }, 'Meta de Atendimento'],
    [{ meta_apoio: '-1' }, 'Meta de Apoio'],
    [{ meta_caixa: '1,5' }, 'Meta de Caixa'],
    [{ meta_farmaceutico: '0' }, 'ao menos 1'],
    [{ salario_perfumaria: '0' }, 'Salário médio de Perfumaria'],
    [{ salario_apoio: 'abc' }, 'Salário médio de Apoio'],
    [{ rat_pct: '3,5' }, 'RAT'],
    [{ rat_pct: '-1' }, 'RAT'],
    [{ fap: '2,5' }, 'FAP'],
    [{ fap: '0,4' }, 'FAP'],
    [{ rescisao: 'talvez' }, 'Provisão de rescisão'],
  ])('valor inválido %j recusa a linha citando a coluna', (valores, trecho) => {
    expect(configuracaoDaLinha(de(valores)).erro).toContain(trecho);
  });
});
