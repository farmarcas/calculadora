import { describe, expect, it } from 'vitest';
import { lerAfd } from './afd.js';
import { CNPJ_EXEMPLO, gerarAfdsDeExemplo } from './exemplo.js';

describe('AFD de exemplo', () => {
  it('os arquivos gerados são válidos no layout da Portaria 671', () => {
    const arquivos = gerarAfdsDeExemplo();
    expect(arquivos).toHaveLength(2);
    for (const a of arquivos) {
      const r = lerAfd(Buffer.from(a.conteudo, 'latin1'));
      expect(r.cabecalho.cnpj).toBe(CNPJ_EXEMPLO);
      expect(r.batidas.length).toBeGreaterThan(50);
    }
  });
});
