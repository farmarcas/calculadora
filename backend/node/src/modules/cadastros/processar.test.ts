import { describe, expect, it } from 'vitest';
import {
  deduzirFuncao,
  interpretarHorarioLoja,
  interpretarRegime,
  processarLinhas,
} from './processar.js';

const mapa = {
  lojas: { aba: 'L', colunas: { codigo: 0, nome: 1, abre_semana: 2, fecha_semana: 3 } },
  funcionarios: {
    aba: 'F',
    colunas: { matricula: 0, nome: 1, loja: 2, cargo: 3, carga_semanal: 4 },
  },
};

describe('processarLinhas', () => {
  it('aceita linhas válidas e aponta as com problema, sem travar as demais', () => {
    const r = processarLinhas(
      [
        {
          nome: 'L',
          cabecalhos: [],
          linhas: [
            ['001', 'Centro', '8:00', '22:00'],
            ['', 'Sem código', '', ''],
            ['001', 'Dup', '', ''],
          ],
        },
        {
          nome: 'F',
          cabecalhos: [],
          linhas: [
            ['F1', 'Ana', '001', 'Farmacêutica', '44'],
            ['F2', 'Bia', '001', 'X', 'abc'],
            ['F3', '', '001', '', ''],
          ],
        },
      ],
      mapa,
    );
    expect(r.lojas).toHaveLength(1);
    expect(r.lojas[0]?.horarios?.dias[0]).toEqual({ aberta: true, abre: '08:00', fecha: '22:00' });
    expect(r.funcionarios).toHaveLength(1);
    expect(r.funcionarios[0]?.funcaoEscala).toBe('Farmacêutico');
    expect(r.erros.map((e) => e.motivo)).toEqual([
      'Código da loja vazio',
      'Código 001 repetido na planilha',
      'Carga semanal inválida',
      'Nome vazio',
    ]);
  });

  it('deduz função de escala pelo cargo', () => {
    expect(deduzirFuncao(undefined, 'Balconista')).toBe('Atendimento');
    expect(deduzirFuncao('Caixa', undefined)).toBe('Caixa');
    expect(deduzirFuncao(undefined, 'Gerente')).toBeNull();
  });
});

const cel = (valores: Record<string, string>) => (chave: string) => valores[chave] ?? '';

describe('interpretarHorarioLoja', () => {
  it('sem nenhum horário informado não mexe no que a loja já tem', () => {
    expect(interpretarHorarioLoja(cel({}))).toEqual({});
    expect(interpretarHorarioLoja(cel({ loja_24h: 'Não' }))).toEqual({});
  });

  it('horário por dia: dia sem horário é fechado, "Fechada" também', () => {
    const r = interpretarHorarioLoja(
      cel({
        abre_seg: '08:00',
        fecha_seg: '22:00',
        abre_ter: '8:00',
        fecha_ter: '22:00',
        abre_sab: '08:00',
        fecha_sab: '20:00',
        abre_dom: 'Fechada',
        fecha_dom: 'Fechada',
      }),
    );
    const d = r.horarios!.dias;
    expect(d[0]).toEqual({ aberta: true, abre: '08:00', fecha: '22:00' });
    expect(d[1]).toEqual({ aberta: true, abre: '08:00', fecha: '22:00' });
    expect(d[2]).toEqual({ aberta: false }); // quarta sem horário
    expect(d[5]).toEqual({ aberta: true, abre: '08:00', fecha: '20:00' });
    expect(d[6]).toEqual({ aberta: false });
  });

  it('24h na abertura vale 24 horas no dia; "Loja 24h = Sim" vale para os sete dias e vence as colunas', () => {
    expect(interpretarHorarioLoja(cel({ abre_dom: '24h' })).horarios!.dias[6]).toMatchObject({
      aberta: true,
      h24: true,
    });
    const l = interpretarHorarioLoja(
      cel({ loja_24h: 'Sim', abre_seg: '08:00', fecha_seg: '22:00' }),
    ).horarios!;
    expect(l.dias.every((x) => x.h24)).toBe(true);
  });

  it('colunas antigas: semana vale segunda a sexta; a coluna do dia manda', () => {
    const r = interpretarHorarioLoja(
      cel({
        abre_semana: '08:00',
        fecha_semana: '22:00',
        abre_sex: '08:00',
        fecha_sex: '18:00',
        abre_sab: '09:00',
        fecha_sab: '13:00',
      }),
    );
    const d = r.horarios!.dias;
    expect([d[0]!.fecha, d[4]!.fecha, d[5]!.fecha, d[6]!.aberta]).toEqual([
      '22:00',
      '18:00',
      '13:00',
      false,
    ]);
  });

  it('fechamento 00:00 vira meia-noite', () => {
    expect(
      interpretarHorarioLoja(cel({ abre_seg: '08:00', fecha_seg: '00:00' })).horarios!.dias[0]!
        .fecha,
    ).toBe('24:00');
  });

  it('horário inválido, incompleto ou com fechamento antes da abertura rejeita a linha', () => {
    expect(interpretarHorarioLoja(cel({ abre_seg: 'cedo', fecha_seg: '22:00' })).erro).toContain(
      'Horário de segunda inválido',
    );
    expect(interpretarHorarioLoja(cel({ abre_ter: '08:00' })).erro).toContain('terça');
    expect(interpretarHorarioLoja(cel({ abre_qua: '22:00', fecha_qua: '08:00' })).erro).toContain(
      'Qua: o fechamento (08:00) precisa ser depois da abertura (22:00)',
    );
  });
});

describe('interpretarRegime', () => {
  it('entende os três regimes e ignora o resto', () => {
    expect(interpretarRegime('Simples Nacional')).toBe('simples');
    expect(interpretarRegime('LUCRO PRESUMIDO')).toBe('presumido');
    expect(interpretarRegime('lucro real')).toBe('real');
    expect(interpretarRegime('MEI')).toBeUndefined();
    expect(interpretarRegime('')).toBeUndefined();
  });
});

describe('equipe: carga mensal, horário e dias', () => {
  const m = {
    lojas: null,
    funcionarios: {
      aba: 'F',
      colunas: { matricula: 0, nome: 1, loja: 2, carga_mensal: 3, entrada: 4, saida: 5, dias: 6 },
    },
  };
  const rodar = (linha: string[]) =>
    processarLinhas([{ nome: 'F', cabecalhos: [], linhas: [linha] }], m);

  it('lê carga mensal (e deriva a semanal), entrada, saída e dias', () => {
    const r = rodar(['F1', 'Ana', '001', '220', '08:00', '17:30', 'Seg a Sex']);
    expect(r.erros).toEqual([]);
    expect(r.funcionarios[0]).toMatchObject({
      cargaMensalH: 220,
      cargaSemanalH: 44,
      entrada: '08:00',
      saida: '17:30',
      dias: [0, 1, 2, 3, 4],
    });
  });
  it('recusa entrada sem saída, saída igual à entrada e carga fora do limite', () => {
    expect(rodar(['F1', 'Ana', '001', '', '08:00', '', '']).erros[0]?.motivo).toContain(
      'entrada e a saída',
    );
    expect(rodar(['F1', 'Ana', '001', '', '08:00', '08:00', '']).erros[0]?.motivo).toContain(
      'diferente',
    );
    expect(rodar(['F1', 'Ana', '001', '999', '', '', '']).erros[0]?.motivo).toContain('mensal');
  });
  it('linha sem as colunas novas continua válida', () => {
    const r = rodar(['F1', 'Ana', '001', '', '', '', '']);
    expect(r.erros).toEqual([]);
    expect(r.funcionarios[0]?.entrada).toBeUndefined();
  });
});

describe('importação em massa: configuração da loja e horário fixo', () => {
  const m = {
    lojas: {
      aba: 'L',
      colunas: {
        codigo: 0,
        nome: 1,
        convencao_8h24: 2,
        meta_atendimento: 3,
        salario_apoio: 4,
        encargos_pct: 5,
      },
    },
    funcionarios: {
      aba: 'F',
      colunas: { matricula: 0, nome: 1, loja: 2, horario_fixo: 3 },
    },
  };
  const rodar = (lojas: string[][], funcs: string[][] = []) =>
    processarLinhas(
      [
        { nome: 'L', cabecalhos: [], linhas: lojas },
        { nome: 'F', cabecalhos: [], linhas: funcs },
      ],
      m,
    );

  it('a loja traz a configuração lida; sem as colunas preenchidas, não traz nada', () => {
    const r = rodar([
      ['001', 'Centro', 'Sim', '2', '1900', '66'],
      ['002', 'Norte', '', '', '', ''],
    ]);
    expect(r.erros).toEqual([]);
    expect(r.lojas[0]?.configuracao).toEqual({
      convencao8h24: true,
      minimos: { Atendimento: 2 },
      custos: { salarioMedio: { Apoio: 1900 }, encargosPct: 66 },
    });
    expect(r.lojas[1]?.configuracao).toBeUndefined();
  });

  it('valor inválido na configuração recusa só aquela loja e cita a linha', () => {
    const r = rodar([
      ['001', 'Centro', 'talvez', '', '', ''],
      ['002', 'Norte', 'Não', '', '', ''],
    ]);
    expect(r.lojas.map((l) => l.codigo)).toEqual(['002']);
    expect(r.erros).toEqual([{ aba: 'L', linha: 2, motivo: 'Convenção 8h24: use Sim ou Não' }]);
  });

  it('funcionário: horário fixo Sim, Não e em branco (mantém)', () => {
    const r = rodar(
      [],
      [
        ['F1', 'Ana', '001', 'Sim'],
        ['F2', 'Bia', '001', 'Não'],
        ['F3', 'Cris', '001', ''],
        ['F4', 'Dani', '001', 'quem sabe'],
      ],
    );
    expect(r.funcionarios.map((f) => [f.matricula, f.horarioFixo])).toEqual([
      ['F1', true],
      ['F2', false],
      ['F3', undefined],
    ]);
    expect(r.erros).toEqual([{ aba: 'F', linha: 5, motivo: 'Horário fixo: use Sim ou Não' }]);
  });
});
