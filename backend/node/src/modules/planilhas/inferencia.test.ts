import { describe, expect, it } from 'vitest';
import { gerarModelo } from './modelo.js';
import { lerPlanilha } from './leitor.js';
import { inferirMapeamento } from './inferencia.js';

describe('inferirMapeamento', () => {
  it('reconhece a planilha modelo por completo', async () => {
    const abas = await lerPlanilha(await gerarModelo(), 'modelo.xlsx');
    const { mapeamento } = inferirMapeamento(abas.filter((a) => a.nome !== 'Como preencher'));
    expect(mapeamento.lojas?.aba).toBe('Lojas');
    expect(mapeamento.funcionarios?.aba).toBe('Funcionários');
    expect(mapeamento.lojas?.colunas.cnpj).toBe(0);
    expect(mapeamento.funcionarios?.colunas.cnpj_loja).toBe(2);
    expect(mapeamento.funcionarios?.colunas.funcao_escala).not.toBeNull(); // a coluna "Cargo" do modelo novo
  });

  it('o modelo novo é reconhecido inteiro: configuração, custos e horário fixo entram no mapeamento', async () => {
    const abas = await lerPlanilha(await gerarModelo(), 'modelo.xlsx');
    const { mapeamento } = inferirMapeamento(abas.filter((a) => a.nome !== 'Como preencher'));
    const lojas = mapeamento.lojas!.colunas;
    for (const chave of [
      'convencao_8h24',
      'meta_farmaceutico',
      'meta_atendimento',
      'meta_caixa',
      'meta_apoio',
      'meta_perfumaria',
      'salario_farmaceutico',
      'salario_atendimento',
      'salario_caixa',
      'salario_apoio',
      'salario_perfumaria',
    ])
      expect(lojas[chave], chave).not.toBeNull();
    // Colunas antigas (RAT, FAP, rescisão) ainda são reconhecidas em planilhas antigas: não caem em outro campo.
    const antiga = inferirMapeamento([
      {
        nome: 'Lojas',
        cabecalhos: ['Código da loja', 'Nome da loja', 'RAT (%)', 'FAP', 'Provisão de rescisão (Sim/Não)'],
        linhas: [['001', 'Centro', '2', '1', 'Não']],
      },
    ]).mapeamento.lojas!.colunas;
    expect(antiga.rat_pct).toBe(2);
    expect(antiga.fap).toBe(3);
    expect(antiga.rescisao).toBe(4);
    expect(mapeamento.funcionarios!.colunas.horario_fixo).not.toBeNull();
    expect(mapeamento.funcionarios!.colunas.horario_fixo).not.toBeUndefined();
  });

  it('entende colunas com outros nomes, outra ordem e abas com outros títulos', () => {
    const { mapeamento } = inferirMapeamento([
      {
        nome: 'Filiais',
        cabecalhos: ['Razão Social', 'Cód_Loja', 'Estado'],
        linhas: [
          ['Farmácia Centro', '001', 'SP'],
          ['Farmácia Norte', '002', 'RJ'],
        ],
      },
      {
        nome: 'Quadro',
        cabecalhos: ['ID_Colaborador', 'Nome_Colaborador', 'Cod_Loja', 'Funcao', 'Carga_Horaria'],
        linhas: [
          ['F1', 'Ana', '001', 'Balconista', '44'],
          ['F2', 'Bia', '002', 'Caixa', '44'],
        ],
      },
    ]);
    expect(mapeamento.lojas).toEqual({
      aba: 'Filiais',
      colunas: expect.objectContaining({ codigo: 1, nome: 0, uf: 2 }),
    });
    expect(mapeamento.funcionarios?.aba).toBe('Quadro');
    expect(mapeamento.funcionarios?.colunas).toEqual(
      expect.objectContaining({ matricula: 0, nome: 1, loja: 2, cargo: 3, carga_semanal: 4 }),
    );
  });

  it('deixa sem coluna o que não entendeu', () => {
    const { sugestoes } = inferirMapeamento([
      { nome: 'X', cabecalhos: ['Coluna A', 'Coluna B'], linhas: [['1', '2']] },
    ]);
    expect(sugestoes.lojas.every((s) => s.coluna === null)).toBe(true);
  });

  it('reconhece as colunas de horário por dia e a de loja 24 horas, em planilha fora do modelo', () => {
    const { mapeamento } = inferirMapeamento([
      {
        nome: 'Lojas',
        cabecalhos: [
          'Cód_Loja',
          'Nome',
          'Loja 24h',
          'Seg Abre',
          'Seg Fecha',
          'Abertura Sábado',
          'Fechamento Sábado',
          'Domingo abre',
          'Domingo fecha',
        ],
        linhas: [
          ['001', 'Centro', 'Não', '08:00', '22:00', '08:00', '20:00', 'Fechada', 'Fechada'],
          ['002', 'Norte', 'Sim', '', '', '', '', '', ''],
        ],
      },
    ]);
    expect(mapeamento.lojas?.colunas).toMatchObject({
      codigo: 0,
      nome: 1,
      loja_24h: 2,
      abre_seg: 3,
      fecha_seg: 4,
      abre_sab: 5,
      fecha_sab: 6,
      abre_dom: 7,
      fecha_dom: 8,
    });
  });

  it('planilha antiga com abertura e fechamento únicos continua reconhecida', () => {
    const { mapeamento } = inferirMapeamento([
      {
        nome: 'Lojas',
        cabecalhos: ['Código', 'Nome', 'Abre semana', 'Fecha semana'],
        linhas: [['001', 'Centro', '08:00', '22:00']],
      },
    ]);
    expect(mapeamento.lojas?.colunas).toMatchObject({
      codigo: 0,
      nome: 1,
      abre_semana: 2,
      fecha_semana: 3,
    });
  });

  it('o modelo novo traz as colunas por dia e loja 24h, sem as colunas antigas', async () => {
    const abas = await lerPlanilha(await gerarModelo(), 'modelo.xlsx');
    const lojas = abas.find((a) => a.nome === 'Lojas')!;
    expect(lojas.cabecalhos).toContain('Abre segunda');
    expect(lojas.cabecalhos).toContain('Fecha domingo');
    expect(lojas.cabecalhos).toContain('Loja 24 horas (Sim/Não)');
    expect(lojas.cabecalhos.some((c) => c.includes('seg a sex'))).toBe(false);
    const { mapeamento } = inferirMapeamento(abas.filter((a) => a.nome !== 'Como preencher'));
    expect(Object.values(mapeamento.lojas!.colunas).filter((c) => c !== null)).toHaveLength(
      lojas.cabecalhos.length,
    );
  });

  it('planilha antiga com "Cargo" e "Função de escala": cada coluna vai para o seu campo; só "Cargo": vale como cargo da escala', () => {
    const duas = inferirMapeamento([
      {
        nome: 'Funcionários',
        cabecalhos: ['Matrícula', 'Nome', 'Código da loja de lotação', 'Cargo', 'Função de escala'],
        linhas: [['F1', 'Ana', '001', 'Balconista', 'Caixa']],
      },
    ]).mapeamento.funcionarios!.colunas;
    expect(duas.cargo).toBe(3);
    expect(duas.funcao_escala).toBe(4);
    expect(duas.loja).toBe(2);
    const so = inferirMapeamento([
      {
        nome: 'Funcionários',
        cabecalhos: ['Matrícula', 'Nome', 'CNPJ da loja', 'Cargo'],
        linhas: [['F1', 'Ana', '11.222.333/0001-81', 'Caixa']],
      },
    ]).mapeamento.funcionarios!.colunas;
    expect(so.funcao_escala).toBe(3);
    expect(so.cnpj_loja).toBe(2);
  });
});
