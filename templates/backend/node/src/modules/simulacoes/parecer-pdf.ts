import PDFDocument from 'pdfkit';
import { LOGO_RADAR_PNG, PROPORCAO_DO_LOGO } from './logo-radar.js';
import type { SecaoDoParecer } from './parecer.js';

// O PDF do parecer (spec 056): o mesmo conteúdo da tela, só texto, em Helvetica (fonte padrão do PDF, com os acentos do português).
// A fonte padrão não tem alguns símbolos: o sinal de menos vira hífen e as setas viram "para".

export type ParecerParaPdf = {
  nome: string;
  loja: string;
  regra: string;
  salvoEm: Date;
  salvoPor: string | null;
  observacao: string | null;
  resumo: string[];
  decisoes: SecaoDoParecer[];
  efeitos: SecaoDoParecer[];
  montadoAgora: boolean;
};

// Troca o que a fonte padrão não desenha (e qualquer coisa fora do Latin-1) por algo equivalente.
export const textoParaPdf = (t: string) =>
  Array.from(
    t
      .replace(/[−–—]/g, '-')
      .replace(/[→⇒]/g, 'para')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/…/g, '...'),
  )
    .filter((ch) => {
      const c = ch.codePointAt(0)!;
      return ch === '\n' || (c >= 0x20 && c <= 0xff);
    })
    .join('');

export const nomeDoArquivo = (nome: string) => {
  const limpo = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);
  return `parecer-${limpo || 'cenario'}.pdf`;
};

const dataBr = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export const gerarPdf = (p: ParecerParaPdf): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      info: { Title: textoParaPdf(`Parecer: ${p.nome}`), Author: 'Radar Escala' },
    });
    const partes: Buffer[] = [];
    doc.on('data', (b: Buffer) => partes.push(b));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const t = textoParaPdf;
    // O logo do Radar no topo, à esquerda; o texto começa logo abaixo dele.
    const larguraDoLogo = 110;
    const alturaDoLogo = larguraDoLogo / PROPORCAO_DO_LOGO;
    doc.image(LOGO_RADAR_PNG, doc.page.margins.left, doc.page.margins.top, {
      width: larguraDoLogo,
    });
    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top + alturaDoLogo + 18;
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor('#1D2433')
      .text(t(`Parecer: ${p.nome}`));
    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#42526E')
      .text(t(`Loja: ${p.loja}  ·  Regra: ${p.regra}`))
      .text(t(`Salvo em ${dataBr(p.salvoEm)}${p.salvoPor ? ` por ${p.salvoPor}` : ''}`));
    if (p.montadoAgora) doc.text(t('Cenário salvo antes do parecer: texto montado agora.'));
    doc.moveDown(0.8);

    const titulo = (texto: string) => {
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1D2433').text(t(texto));
      doc.moveDown(0.2);
    };
    const subtitulo = (texto: string) => {
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1D2433').text(t(texto));
    };
    const paragrafo = (texto: string) =>
      doc.font('Helvetica').fontSize(11).fillColor('#1D2433').text(t(texto), { lineGap: 2 });
    const secoes = (lista: SecaoDoParecer[]) => {
      for (const s of lista) {
        subtitulo(s.titulo);
        for (const item of s.itens)
          doc
            .font('Helvetica')
            .fontSize(11)
            .fillColor('#1D2433')
            .text(`- ${t(item)}`, { indent: 8, lineGap: 2 });
      }
    };

    titulo('Resumo');
    for (const frase of p.resumo) paragrafo(frase);
    titulo('Decisões');
    secoes(p.decisoes);
    titulo('Efeitos');
    secoes(p.efeitos);
    if (p.observacao) {
      titulo('Observação de quem salvou');
      doc
        .font('Helvetica-Oblique')
        .fontSize(11)
        .fillColor('#1D2433')
        .text(t(p.observacao), { lineGap: 2 });
    }
    doc.moveDown(1.2);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#42526E')
      .text(t('Esta é uma estimativa e não altera o Cadastro.'));
    doc.end();
  });
