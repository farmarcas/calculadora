import PDFDocument from 'pdfkit';
import { LOGO_RADAR_PNG, PROPORCAO_DO_LOGO } from './logo-radar.js';
import type { CartaoDoParecer, Chip, LinhaDaTabela, Tom } from './parecer.js';

// O PDF do parecer (specs 056 e 057): A4, uma página, com o mesmo conteúdo da modal (chip, parágrafo, três números grandes e a
// tabela "O que muda"). Só texto, em Helvetica (fonte padrão do PDF, com os acentos do português): o sinal de menos vira hífen e
// as setas viram "para". O conteúdo chega pronto de `montarParecer`, na versão do perfil.

export type ParecerParaPdf = {
  loja: string;
  regra: string;
  numeroCenario: number | null;
  salvoEm: Date;
  // "dono", "gestor" ou "consulta" (ou o nome da pessoa, quando houver).
  salvoPor: string | null;
  observacao: string | null;
  montadoAgora: boolean;
  status: Chip;
  paragrafo: string;
  cartoes: { folha: CartaoDoParecer; equipe: CartaoDoParecer; farmaceutico: CartaoDoParecer };
  tabela: LinhaDaTabela[];
  horarioAMais: string[] | null;
  // Gestor e consulta: sem valores em reais (o aviso entra no rodapé).
  semValoresEmReais: boolean;
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

const slug = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);

// "parecer-cosmopolis-cenario-5.pdf"; sem número de cenário, "parecer-cosmopolis.pdf".
export const nomeDoArquivo = (loja: string, numeroCenario: number | null = null) =>
  `parecer-${slug(loja) || 'loja'}${numeroCenario != null ? `-cenario-${numeroCenario}` : ''}.pdf`;

const dataBr = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

// Cores do chip e dos textos de mudança. O âmbar (#B45F00 / #8F4A00) e o verde (#3E7500) estão fora do Alquimia DS: são os mesmos
// valores dos tokens `--chip-*` da tela (contraste AA verificado sobre os fundos).
const FUNDO: Record<Tom, string> = {
  verde: '#DFF0C0',
  ambar: '#FFE9C7',
  vermelho: '#FBE3E6',
  neutro: '#EDEFF2',
};
const TEXTO: Record<Tom, string> = {
  verde: '#3E7500',
  ambar: '#8F4A00',
  vermelho: '#9B1C31',
  neutro: '#42526E',
};
const MUDANCA: Record<Tom, string> = {
  verde: '#3E7500',
  ambar: '#B45F00',
  vermelho: '#9B1C31',
  neutro: '#42526E',
};
const TINTA = '#1D2433';
const SECUNDARIO = '#42526E';
const CARTAO = '#F3F5F8';
const LINHA = '#D9DDE3';

const MARGEM = 48;
const LARGURA_DA_PAGINA = 595.28;
const ALTURA_DA_PAGINA = 841.89;
const RODAPE_ALTURA = 40;

export const gerarPdf = (p: ParecerParaPdf): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const titulo = `Parecer do cenário · ${p.loja}`;
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGEM, bottom: MARGEM + RODAPE_ALTURA - 10, left: MARGEM, right: MARGEM },
      bufferPages: true,
      info: { Title: textoParaPdf(titulo), Author: 'Radar Escala' },
    });
    const partes: Buffer[] = [];
    doc.on('data', (b: Buffer) => partes.push(b));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const t = textoParaPdf;
    const larguraUtil = LARGURA_DA_PAGINA - 2 * MARGEM;
    const limiteInferior = () => ALTURA_DA_PAGINA - MARGEM - RODAPE_ALTURA;

    // ---- Cabeçalho: logo, título e subtítulo ----
    const larguraDoLogo = 88;
    doc.image(LOGO_RADAR_PNG, MARGEM, MARGEM - 8, { width: larguraDoLogo });
    doc.x = MARGEM;
    doc.y = MARGEM - 8 + larguraDoLogo / PROPORCAO_DO_LOGO + 16;
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(TINTA)
      .text(t(titulo), { width: larguraUtil });
    doc.moveDown(0.25);
    const rotuloDoCenario = p.numeroCenario != null ? ` · Cenário ${p.numeroCenario}` : '';
    doc.font('Helvetica').fontSize(9.5).fillColor(SECUNDARIO);
    doc.text(t(`${p.loja} · ${p.regra}${rotuloDoCenario}`), { width: larguraUtil });
    const por = p.salvoPor ? ` ${p.salvoPor.startsWith('pel') ? '' : 'pelo '}${p.salvoPor}` : '';
    doc.text(t(`Salvo em ${dataBr(p.salvoEm)}${por}`), { width: larguraUtil });
    if (p.montadoAgora)
      doc.text(t('Cenário salvo antes do parecer: texto montado agora.'), { width: larguraUtil });
    doc.moveDown(0.8);

    // ---- Chip de status ----
    const desenharChip = (chip: Chip, x: number, y: number, tamanho = 8.5) => {
      doc.font('Helvetica-Bold').fontSize(tamanho);
      const texto = t(chip.texto);
      const w = doc.widthOfString(texto) + 14;
      const h = tamanho + 8;
      doc.roundedRect(x, y, w, h, h / 2).fill(FUNDO[chip.tom]);
      doc.fillColor(TEXTO[chip.tom]).text(texto, x + 7, y + 4, { lineBreak: false });
      return w;
    };
    const yChip = doc.y;
    desenharChip(p.status, MARGEM, yChip, 9);
    doc.x = MARGEM;
    doc.y = yChip + 26;

    // ---- Parágrafo ----
    doc
      .font('Helvetica')
      .fontSize(10.5)
      .fillColor(TINTA)
      .text(t(p.paragrafo), MARGEM, doc.y, { width: larguraUtil, lineGap: 3 });
    doc.moveDown(1);

    // ---- Três números grandes ----
    const cartoes = [p.cartoes.folha, p.cartoes.equipe, p.cartoes.farmaceutico];
    const folga = 10;
    const larguraDoCartao = (larguraUtil - 2 * folga) / 3;
    const alturaDoCartao = 84;
    const yCartoes = doc.y;
    cartoes.forEach((c, i) => {
      const x = MARGEM + i * (larguraDoCartao + folga);
      doc.roundedRect(x, yCartoes, larguraDoCartao, alturaDoCartao, 6).fill(CARTAO);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(SECUNDARIO)
        .text(t(c.titulo), x + 10, yCartoes + 9, { width: larguraDoCartao - 20, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(19).fillColor(TINTA);
      const valor = t(c.valor);
      doc.text(valor, x + 10, yCartoes + 22, { lineBreak: false });
      if (c.chip) desenharChip(c.chip, x + 10 + doc.widthOfString(valor) + 8, yCartoes + 25, 7.5);
      if (c.apoio)
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor(SECUNDARIO)
          .text(t(c.apoio), x + 10, yCartoes + 52, { width: larguraDoCartao - 20, lineGap: 1.5 });
    });
    doc.x = MARGEM;
    doc.y = yCartoes + alturaDoCartao + 18;

    // ---- "O QUE MUDA": a tabela inteira vai para a página seguinte se não couber (nunca corta uma linha) ----
    const alturaDaLinha = 24;
    const alturaDaTabela = 22 + alturaDaLinha * (p.tabela.length + 1);
    if (doc.y + alturaDaTabela > limiteInferior()) {
      doc.addPage();
      doc.x = MARGEM;
      doc.y = MARGEM;
    }
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(SECUNDARIO)
      .text('O QUE MUDA', MARGEM, doc.y, { characterSpacing: 0.6, lineBreak: false });
    let y = doc.y + 16;
    const colunas = {
      rotulo: MARGEM,
      hoje: MARGEM + larguraUtil * 0.42,
      depois: MARGEM + larguraUtil * 0.62,
      mudancaDireita: MARGEM + larguraUtil,
    };
    doc.font('Helvetica').fontSize(8).fillColor(SECUNDARIO);
    doc.text('Hoje', colunas.hoje, y, { lineBreak: false });
    doc.text('Com o cenário', colunas.depois, y, { lineBreak: false });
    doc.text('Mudança', colunas.mudancaDireita - 80, y, {
      width: 80,
      align: 'right',
      lineBreak: false,
    });
    y += 14;
    doc
      .moveTo(MARGEM, y)
      .lineTo(MARGEM + larguraUtil, y)
      .strokeColor(LINHA)
      .lineWidth(0.5)
      .stroke();
    for (const l of p.tabela) {
      const yl = y + 7;
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(TINTA)
        .text(t(l.rotulo), colunas.rotulo, yl, {
          width: colunas.hoje - colunas.rotulo - 8,
          lineBreak: false,
        });
      doc.fillColor(SECUNDARIO).text(t(l.hoje), colunas.hoje, yl, {
        width: colunas.depois - colunas.hoje - 8,
        lineBreak: false,
      });
      doc
        .font('Helvetica-Bold')
        .fillColor(TINTA)
        .text(t(l.comOCenario), colunas.depois, yl, { width: 110, lineBreak: false });
      doc
        .fillColor(MUDANCA[l.mudanca.tom])
        .text(t(l.mudanca.texto), colunas.mudancaDireita - 90, yl, {
          width: 90,
          align: 'right',
          lineBreak: false,
        });
      y += alturaDaLinha;
      doc
        .moveTo(MARGEM, y)
        .lineTo(MARGEM + larguraUtil, y)
        .strokeColor(LINHA)
        .lineWidth(0.5)
        .stroke();
    }
    doc.x = MARGEM;
    doc.y = y + 16;

    // ---- Horário a mais (só dono) e a observação de quem salvou ----
    for (const linha of p.horarioAMais ?? [])
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(TINTA)
        .text(t(linha), MARGEM, doc.y, { width: larguraUtil, lineGap: 2 });
    if (p.horarioAMais?.length) doc.moveDown(0.8);
    if (p.observacao) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(TINTA)
        .text('Observação de quem salvou', MARGEM, doc.y, { width: larguraUtil });
      doc
        .font('Helvetica-Oblique')
        .fontSize(9.5)
        .fillColor(TINTA)
        .text(t(p.observacao), MARGEM, doc.y + 2, { width: larguraUtil, lineGap: 2 });
    }

    // ---- Rodapé de cada página: o aviso à esquerda e "Página n de total" à direita ----
    const total = doc.bufferedPageRange().count;
    for (let i = 0; i < total; i++) {
      doc.switchToPage(i);
      // Sem margem inferior, para escrever perto da borda sem abrir outra página.
      doc.page.margins.bottom = 0;
      const yr = ALTURA_DA_PAGINA - MARGEM - 8;
      doc
        .moveTo(MARGEM, yr - 8)
        .lineTo(MARGEM + larguraUtil, yr - 8)
        .strokeColor(LINHA)
        .lineWidth(0.5)
        .stroke();
      doc.font('Helvetica').fontSize(7.5).fillColor(SECUNDARIO);
      const aviso = 'Estimativa feita com os dados importados da loja. Não altera o Cadastro.';
      const doDono = 'Valores em reais aparecem só para o dono do grupo.';
      // Para gestor e consulta o aviso dos valores em reais vai numa segunda linha, sem quebrar o texto no meio.
      doc.text(t(aviso), MARGEM, p.semValoresEmReais ? yr - 5 : yr, {
        width: larguraUtil - 90,
        lineBreak: false,
      });
      if (p.semValoresEmReais)
        doc.text(t(doDono), MARGEM, yr + 5, { width: larguraUtil - 90, lineBreak: false });
      doc.text(
        t(`Página ${i + 1} de ${total}`),
        MARGEM + larguraUtil - 80,
        p.semValoresEmReais ? yr - 5 : yr,
        {
          width: 80,
          align: 'right',
          lineBreak: false,
        },
      );
    }
    doc.end();
  });
