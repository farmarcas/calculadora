import { describe, expect, it } from 'vitest';
import { gerarPdf, nomeDoArquivo, textoParaPdf } from './parecer-pdf.js';

describe('parecer em PDF (spec 056)', () => {
  it('troca o que a fonte padrão não desenha e mantém os acentos', () => {
    expect(textoParaPdf('Resultado: −R$ 6.694 → não recomendado')).toBe(
      'Resultado: -R$ 6.694 para não recomendado',
    );
    expect(textoParaPdf('“Cenário” — ação…')).toBe('"Cenário" - ação...');
    expect(textoParaPdf('ok ✓')).toBe('ok ');
  });

  it('nome do arquivo sem acentos nem caracteres inválidos, com um padrão se ficar vazio', () => {
    expect(nomeDoArquivo('Plano reforço sábado!')).toBe('parecer-plano-reforco-sabado.pdf');
    expect(nomeDoArquivo('///')).toBe('parecer-cenario.pdf');
    expect(nomeDoArquivo('a'.repeat(200)).length).toBeLessThanOrEqual('parecer-.pdf'.length + 60);
  });

  it('gera um PDF válido com o parecer, também com texto longo e várias páginas', async () => {
    const itens = Array.from(
      { length: 80 },
      (_, i) => `Item ${i + 1} com acentuação: ação, coração, não.`,
    );
    const buffer = await gerarPdf({
      nome: 'Plano reforço',
      loja: 'Cosmópolis',
      regra: 'Regra de 42h',
      salvoEm: new Date('2026-11-11T12:00:00Z'),
      salvoPor: 'Dono',
      observacao: 'Aprovado pelo regional.\nRever em janeiro.',
      resumo: [
        'Este cenário contrata 1 farmacêutico.',
        'Com isso o horário fica coberto.',
        'A folha sobe.',
      ],
      decisoes: [{ titulo: 'Contratações', itens: ['1 farmacêutico, 42 h por semana.'] }],
      efeitos: [{ titulo: 'Equipe', itens }],
      montadoAgora: false,
    });
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1500);
    expect(buffer.subarray(buffer.length - 8).toString()).toContain('%%EOF');
    // o logo do Radar vai como imagem no PDF
    expect(buffer.toString('latin1')).toContain('/Subtype /Image');
  });
});
