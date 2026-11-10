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
      'CNPJ da loja vazio',
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

describe('equipe: intervalo (início e fim)', () => {
  const m = {
    lojas: null,
    funcionarios: {
      aba: 'F',
      colunas: {
        matricula: 0,
        nome: 1,
        loja: 2,
        entrada: 3,
        saida: 4,
        inicio_intervalo: 5,
        fim_intervalo: 6,
      },
    },
  };
  const rodar = (linha: string[]) =>
    processarLinhas([{ nome: 'F', cabecalhos: [], linhas: [linha] }], m);

  it('lê o início e o fim do intervalo', () => {
    const r = rodar(['F1', 'Ana', '001', '08:00', '17:00', '12:00', '13:00']);
    expect(r.erros).toEqual([]);
    expect(r.funcionarios[0]).toMatchObject({ iniIntervalo: '12:00', fimIntervalo: '13:00' });
  });
  it('sem as colunas de intervalo, ou em branco, continua válido', () => {
    const r = rodar(['F1', 'Ana', '001', '08:00', '17:00', '', '']);
    expect(r.erros).toEqual([]);
    expect(r.funcionarios[0]?.iniIntervalo).toBeUndefined();
    const antiga = processarLinhas(
      [{ nome: 'F', cabecalhos: [], linhas: [['F1', 'Ana', '001', '08:00', '17:00']] }],
      {
        lojas: null,
        funcionarios: {
          aba: 'F',
          colunas: { matricula: 0, nome: 1, loja: 2, entrada: 3, saida: 4 },
        },
      },
    );
    expect(antiga.erros).toEqual([]);
  });
  it('recusa só um dos dois, fim antes do início, fora do turno e sem horário de trabalho', () => {
    expect(rodar(['F1', 'Ana', '001', '08:00', '17:00', '12:00', '']).erros[0]?.motivo).toContain(
      'início e o fim do intervalo',
    );
    expect(
      rodar(['F1', 'Ana', '001', '08:00', '17:00', '13:00', '12:00']).erros[0]?.motivo,
    ).toContain('depois do início');
    expect(
      rodar(['F1', 'Ana', '001', '08:00', '17:00', '07:00', '08:30']).erros[0]?.motivo,
    ).toContain('dentro do horário');
    expect(rodar(['F1', 'Ana', '001', '', '', '12:00', '13:00']).erros[0]?.motivo).toContain(
      'entrada e a saída',
    );
    expect(
      rodar(['F1', 'Ana', '001', '08:00', '17:00', 'abc', '13:00']).erros[0]?.motivo,
    ).toContain('inválido');
  });
  it('só a linha com erro é recusada; as outras entram', () => {
    const r = processarLinhas(
      [
        {
          nome: 'F',
          cabecalhos: [],
          linhas: [
            ['F1', 'Ana', '001', '08:00', '17:00', '12:00', ''],
            ['F2', 'Bia', '001', '08:00', '17:00', '12:00', '13:00'],
          ],
        },
      ],
      m,
    );
    expect(r.erros).toHaveLength(1);
    expect(r.funcionarios.map((f) => f.matricula)).toEqual(['F2']);
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
        salario_caixa: 4,
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
      custos: { salarioMedio: { Caixa: 1900 }, encargosPct: 66 },
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

// CNPJs válidos para os testes (o segundo difere do primeiro só nos dígitos finais).
const CNPJ_A = '11222333000181';
const CNPJ_B = '45997418000153';

describe('processarLinhas: loja identificada pelo CNPJ', () => {
  const mapaCnpj = {
    lojas: { aba: 'L', colunas: { cnpj: 0, nome: 1, fat_seg: 2 } },
    funcionarios: {
      aba: 'F',
      colunas: { matricula: 0, nome: 1, cnpj_loja: 2, funcao_escala: 3 },
    },
  };
  const abas = (lojas: string[][], funcs: string[][] = []) => [
    { nome: 'L', cabecalhos: [], linhas: lojas },
    { nome: 'F', cabecalhos: [], linhas: funcs },
  ];

  it('aceita o CNPJ com ou sem pontuação e sem o código da loja', () => {
    const r = processarLinhas(
      abas([
        ['11.222.333/0001-81', 'Centro', '1000'],
        [CNPJ_B, '', ''],
      ]),
      mapaCnpj,
    );
    expect(r.erros).toEqual([]);
    expect(r.lojas.map((l) => l.cnpj)).toEqual([CNPJ_A, CNPJ_B]);
    expect(r.lojas[0]).toMatchObject({ nome: 'Centro', codigo: undefined });
    expect(r.lojas[1]?.nome).toBeUndefined(); // nome em branco mantém o cadastrado
  });

  it('completa com zeros o CNPJ que o Excel guardou como número (perdeu o zero da frente)', () => {
    // 04.252.011/0001-10 → o Excel guarda 4252011000110 (13 dígitos)
    const r = processarLinhas(abas([['4252011000110', 'Zero', '']]), mapaCnpj);
    expect(r.erros).toEqual([]);
    expect(r.lojas[0]?.cnpj).toBe('04252011000110');
  });

  it('recusa só a linha com CNPJ vazio, inválido ou repetido', () => {
    const r = processarLinhas(
      abas([
        [CNPJ_A, 'Ok', ''],
        ['', 'Sem CNPJ', ''],
        ['11222333000180', 'Verificador errado', ''],
        ['123', 'Curto', ''],
        ['11.222.333/0001-81', 'Repetida', ''],
      ]),
      mapaCnpj,
    );
    expect(r.lojas).toHaveLength(1);
    expect(r.erros.map((e) => [e.linha, e.motivo])).toEqual([
      [3, 'CNPJ da loja vazio'],
      [4, 'CNPJ inválido'],
      [5, 'CNPJ inválido'],
      [6, 'CNPJ 11.222.333/0001-81 repetido na planilha'],
    ]);
  });

  it('funcionário pelo CNPJ da loja; o cargo vem da lista ou é deduzido do texto', () => {
    const r = processarLinhas(
      abas(
        [],
        [
          ['F1', 'Ana', '11.222.333/0001-81', 'Farmacêutico'],
          ['F2', 'Bia', CNPJ_B, 'Balconista'],
          ['F3', 'Caio', CNPJ_A, 'Vendedor'],
          ['F4', 'Dani', CNPJ_A, 'Gerente'],
          ['F5', 'Edu', '', 'Caixa'],
          ['F6', 'Fabi', '11222333000180', 'Caixa'],
        ],
      ),
      mapaCnpj,
    );
    expect(r.funcionarios.map((f) => [f.matricula, f.lojaCnpj, f.funcaoEscala])).toEqual([
      ['F1', CNPJ_A, 'Farmacêutico'],
      ['F2', CNPJ_B, 'Atendimento'],
      ['F3', CNPJ_A, 'Atendimento'],
      ['F4', CNPJ_A, null], // "Outros cargos": fica fora do cálculo
    ]);
    expect(r.erros.map((e) => e.motivo)).toEqual(['CNPJ da loja vazio', 'CNPJ inválido']);
  });

  it('planilha antiga com código: a loja é reconhecida pelo código, como antes', () => {
    const r = processarLinhas(
      abas([['', '', '']], []).map((a) => a),
      mapa,
    );
    expect(r.lojas).toEqual([]);
    const antiga = processarLinhas(
      [
        { nome: 'L', cabecalhos: [], linhas: [['001', 'Centro', '8:00', '22:00']] },
        { nome: 'F', cabecalhos: [], linhas: [['F1', 'Ana', '001', 'Caixa', '44']] },
      ],
      mapa,
    );
    expect(antiga.erros).toEqual([]);
    expect(antiga.lojas[0]).toMatchObject({ codigo: '001', nome: 'Centro', cnpj: undefined });
    expect(antiga.funcionarios[0]).toMatchObject({ lojaCodigo: '001', lojaCnpj: undefined });
  });
});
