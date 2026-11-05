import { describe, expect, it } from 'vitest';
import { lerPlanilha } from './leitor.js';

describe('lerPlanilha (.csv)', () => {
  it('mantém tudo como texto: o código da loja não perde o zero e datas e números ficam como vieram', async () => {
    const csv = 'Data,Hora,Código da loja,Venda líquida (R$)\n2026-10-01,9,001,"1.234,56"\n';
    const [aba] = await lerPlanilha(Buffer.from(csv), 'base.csv');
    expect(aba!.cabecalhos).toEqual(['Data', 'Hora', 'Código da loja', 'Venda líquida (R$)']);
    expect(aba!.linhas).toEqual([['2026-10-01', '9', '001', '1.234,56']]);
  });

  it('CNPJ com zero à esquerda em CSV continua com os 14 dígitos', async () => {
    const [aba] = await lerPlanilha(Buffer.from('CNPJ\n04252011000110\n'), 'lojas.csv');
    expect(aba!.linhas).toEqual([['04252011000110']]);
  });
});
