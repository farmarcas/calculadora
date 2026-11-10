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

describe('lerPlanilha (arquivo grande)', () => {
  it('lê 200 mil linhas sem estourar a pilha (base por CNPJ de vários meses)', async () => {
    const linhas = Array.from(
      { length: 200_000 },
      (_, i) => `"00112423000101","1","Monday","${i % 24}","10.00"`,
    );
    const csv = `cnpj,dia_semana,dia_semana_nome,hora,faturamento\n${linhas.join('\n')}\n`;
    const [aba] = await lerPlanilha(Buffer.from(csv), 'base.csv');
    expect(aba!.linhas).toHaveLength(200_000);
    expect(aba!.cabecalhos).toHaveLength(5);
  });
}, 60_000);
