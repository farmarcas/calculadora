import { describe, expect, it } from 'vitest';
import { deduzirFuncao, processarLinhas } from './processar.js';

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
    expect(r.lojas[0]?.horarios?.semana).toEqual({ abre: '08:00', fecha: '22:00' });
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
