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
    expect(mapeamento.lojas?.colunas.codigo).toBe(0);
    expect(mapeamento.funcionarios?.colunas.loja).toBe(2);
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
});
