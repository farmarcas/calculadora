import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { gerarPdf, nomeDoArquivo, textoParaPdf, type ParecerParaPdf } from './parecer-pdf.js';

// O texto de cada página do PDF (as páginas têm o conteúdo em fluxos comprimidos, em ordem).
const textoDasPaginas = (pdf: Buffer): string[] => {
  const bruto = pdf.toString('latin1');
  const paginas: string[] = [];
  for (const m of bruto.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    let conteudo: string;
    try {
      conteudo = inflateSync(Buffer.from(m[1]!, 'latin1')).toString('latin1');
    } catch {
      continue;
    }
    if (!/\bTJ\b/.test(conteudo)) continue;
    const linhas = [...conteudo.matchAll(/\[(.*?)\]\s*TJ/gs)].map((t) =>
      [...t[1]!.matchAll(/<([0-9a-fA-F]*)>/g)]
        .map((h) => Buffer.from(h[1]!, 'hex').toString('latin1'))
        .join(''),
    );
    paginas.push(linhas.join('\n'));
  }
  return paginas;
};
const quantasPaginas = (pdf: Buffer) =>
  (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) ?? []).length;

const base = (): ParecerParaPdf => ({
  loja: 'Cosmópolis',
  regra: 'Regra de 42h',
  numeroCenario: 5,
  salvoEm: new Date('2026-11-11T12:00:00'),
  salvoPor: 'dono',
  observacao: 'Aprovado pelo regional.\nRever em janeiro.',
  montadoAgora: false,
  status: { texto: 'Cobre o horário', tom: 'verde' },
  paragrafo:
    'Contratando 1 farmacêutico e 1 atendente (desejável), 42h por semana cada, a loja passa a cobrir todo o horário de funcionamento. Ninguém é desligado, o horário continua igual ao do Cadastro e todos trabalham 5 dias por semana e folgam 2. A venda não muda, mas a folha pesa mais no faturamento.',
  cartoes: {
    folha: {
      titulo: 'Folha no faturamento',
      valor: '9,7%',
      chip: { texto: '+2,5%', tom: 'ambar' },
      apoio: 'hoje 7,2% · R$ 11.113 a mais por mês',
    },
    equipe: {
      titulo: 'Equipe',
      valor: '9 pessoas',
      chip: { texto: '+2', tom: 'verde' },
      apoio: 'hoje 7',
    },
    farmaceutico: {
      titulo: 'Farmacêutico faltando',
      valor: '0 h',
      chip: { texto: 'coberto', tom: 'verde' },
      apoio: 'hoje faltam 16 h por semana',
    },
  },
  tabela: [
    {
      rotulo: 'Farmacêutico faltando',
      hoje: '16 h por semana',
      comOCenario: '0 h',
      mudanca: { texto: '−16 h', tom: 'verde' },
    },
    {
      rotulo: 'Venda',
      hoje: '—',
      comOCenario: 'sem mudança',
      mudanca: { texto: '—', tom: 'neutro' },
    },
    { rotulo: 'Pessoas', hoje: '7', comOCenario: '9', mudanca: { texto: '+2', tom: 'verde' } },
    {
      rotulo: 'Horas contratadas por semana',
      hoje: '308h',
      comOCenario: '392h',
      mudanca: { texto: '+84h', tom: 'verde' },
    },
    {
      rotulo: 'Folha por mês',
      hoje: 'R$ 32.584',
      comOCenario: 'R$ 43.697',
      mudanca: { texto: '+R$ 11.113', tom: 'ambar' },
    },
  ],
  horarioAMais: null,
  semValoresEmReais: false,
});

describe('parecer em PDF (specs 056 e 057)', () => {
  it('troca o que a fonte padrão não desenha e mantém os acentos', () => {
    expect(textoParaPdf('Resultado: −R$ 6.694 → não recomendado')).toBe(
      'Resultado: -R$ 6.694 para não recomendado',
    );
    expect(textoParaPdf('“Cenário” — ação…')).toBe('"Cenário" - ação...');
    expect(textoParaPdf('ok ✓')).toBe('ok ');
  });

  it('nome do arquivo: loja em minúsculas sem acento e o número do cenário', () => {
    expect(nomeDoArquivo('Cosmópolis', 5)).toBe('parecer-cosmopolis-cenario-5.pdf');
    expect(nomeDoArquivo('1099 · Sumaré - Centro', 12)).toBe(
      'parecer-1099-sumare-centro-cenario-12.pdf',
    );
    expect(nomeDoArquivo('Cosmópolis', null)).toBe('parecer-cosmopolis.pdf');
    expect(nomeDoArquivo('///', 1)).toBe('parecer-loja-cenario-1.pdf');
  });

  it('gera uma página com logo, título, chip, parágrafo, números, tabela e rodapé "Página 1 de 1"', async () => {
    const pdf = await gerarPdf(base());
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1')).toContain('/Subtype /Image');
    expect(quantasPaginas(pdf)).toBe(1);
    const [pagina] = textoDasPaginas(pdf);
    expect(pagina).toContain('Parecer do cenário · Cosmópolis');
    expect(pagina).toContain('Cosmópolis · Regra de 42h · Cenário 5');
    expect(pagina).toContain('Salvo em 11/11/2026 pelo dono');
    expect(pagina).toContain('Cobre o horário');
    expect(pagina).toContain('Contratando 1 farmacêutico');
    expect(pagina).toContain('9,7%');
    expect(pagina).toContain('9 pessoas');
    expect(pagina).toContain('O QUE MUDA');
    expect(pagina).toContain('Com o cenário');
    expect(pagina).toContain('R$ 43.697');
    expect(pagina).toContain('Observação de quem salvou');
    expect(pagina).toContain(
      'Estimativa feita com os dados importados da loja. Não altera o Cadastro.',
    );
    expect(pagina).toContain('Página 1 de 1');
    expect(pagina).not.toContain('Valores em reais aparecem só para o dono do grupo.');
  });

  it('gestor e consulta: sem valores em reais e com o aviso no rodapé', async () => {
    const p = base();
    p.semValoresEmReais = true;
    p.salvoPor = 'gestor';
    p.paragrafo = p.paragrafo.replace(
      'mas a folha pesa mais no faturamento',
      'mas o custo de pessoal aumenta',
    );
    p.cartoes.folha = {
      titulo: 'Custo de pessoal',
      valor: '—',
      chip: { texto: 'Aumenta', tom: 'ambar' },
      apoio: 'sem valores em reais',
    };
    p.tabela = p.tabela.slice(0, 4);
    const texto = textoDasPaginas(await gerarPdf(p)).join('\n');
    expect(texto).toContain('Custo de pessoal');
    expect(texto).toContain('Aumenta');
    expect(texto).toContain('Valores em reais aparecem só para o dono do grupo.');
    expect(texto).not.toMatch(/R\$ \d|%/);
  });

  it('conteúdo longo: a tabela vai inteira para a página 2, antes de "O que muda", e o rodapé numera as páginas', async () => {
    const p = base();
    p.paragrafo = Array.from({ length: 14 }, () => p.paragrafo).join(' ');
    p.observacao = null;
    const pdf = await gerarPdf(p);
    const paginas = textoDasPaginas(pdf);
    expect(quantasPaginas(pdf)).toBe(2);
    expect(paginas[0]).not.toContain('O QUE MUDA');
    expect(paginas[0]).toContain('Página 1 de 2');
    expect(paginas[1]).toContain('O QUE MUDA');
    for (const l of p.tabela) expect(paginas[1]).toContain(l.rotulo);
    expect(paginas[1]).toContain('Página 2 de 2');
  });

  it('cenário sem número e montado agora: o subtítulo e o aviso se ajustam', async () => {
    const p = base();
    p.numeroCenario = null;
    p.montadoAgora = true;
    const [pagina] = textoDasPaginas(await gerarPdf(p));
    expect(pagina).toContain('Cosmópolis · Regra de 42h');
    expect(pagina).not.toContain('Cenário 5');
    expect(pagina).toContain('Cenário salvo antes do parecer: texto montado agora.');
  });
});
