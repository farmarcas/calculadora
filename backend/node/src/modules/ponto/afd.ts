import { CAMPO, TAMANHO_REGISTRO, TIPOS_COM_CRC, VERSOES_ACEITAS } from './afd.layout.js';
import { crc16Kermit } from './crc16.js';

export class AfdInvalidoError extends Error {
  constructor(
    message: string,
    readonly linha?: number,
  ) {
    super(linha ? `Linha ${linha}: ${message}` : message);
    this.name = 'AfdInvalidoError';
  }
}

export type BatidaAfd = { nsr: number; tipo: '3' | '7'; data: string; minuto: number; cpf: string };
export type CabecalhoAfd = {
  cnpj: string;
  dataInicial: string;
  dataFinal: string;
  versao: string;
};
export type AfdLido = { cabecalho: CabecalhoAfd; batidas: BatidaAfd[]; avisos: string[] };

const campo = (linha: string, [a, b]: readonly [number, number]) => linha.slice(a, b);
const RE_DH = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{4})$/;
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

const lerDataHora = (txt: string, n: number) => {
  const m = RE_DH.exec(txt);
  if (!m)
    throw new AfdInvalidoError(
      `data e hora fora do formato AAAA-MM-ddThh:mm:00±hhmm ("${txt}")`,
      n,
    );
  const [, ano, mes, dia, hh, mm] = m;
  if (
    Number(mes) < 1 ||
    Number(mes) > 12 ||
    Number(dia) < 1 ||
    Number(dia) > 31 ||
    Number(hh) > 23 ||
    Number(mm) > 59
  )
    throw new AfdInvalidoError(`data ou hora inexistente ("${txt}")`, n);
  // Vale o horário de parede escrito no arquivo (o do REP); o fuso é lido e não usado na apuração.
  return { data: `${ano}-${mes}-${dia}`, minuto: Number(hh) * 60 + Number(mm) };
};

const lerCpf = (txt: string, n: number) => {
  let d = txt.replace(/\s/g, '');
  if (d.length === 12 && d.startsWith('0')) d = d.slice(1);
  if (!/^\d{11}$/.test(d))
    throw new AfdInvalidoError(`CPF do empregado inválido ("${txt.trim()}")`, n);
  return d;
};

// Lê o AFD inteiro antes de gravar qualquer coisa: arquivo inválido, truncado ou com CRC errado é rejeitado por inteiro.
export const lerAfd = (conteudo: Buffer | string): AfdLido => {
  const texto = typeof conteudo === 'string' ? conteudo : conteudo.toString('latin1');
  const linhas = texto.split(/\r?\n/);
  while (linhas.length && linhas[linhas.length - 1] === '') linhas.pop();
  if (linhas.length === 0) throw new AfdInvalidoError('o arquivo está vazio');

  const avisos: string[] = [];
  const batidas: BatidaAfd[] = [];
  const contagem: Record<string, number> = { '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0 };
  let cabecalho: CabecalhoAfd | null = null;
  let ultimoNsr = 0;
  let trailer: string | null = null;
  let hashNaoVerificado = false;

  for (let i = 0; i < linhas.length; i++) {
    const n = i + 1;
    const linha = linhas[i]!;
    if (trailer) break; // depois do trailer só existe a assinatura digital, que o sistema ignora
    if (linha.trim() === '') throw new AfdInvalidoError('linha em branco não é permitida', n);

    if (linha.startsWith('999999999')) {
      if (linha.length !== TAMANHO_REGISTRO['9'] || linha[CAMPO.trailer.tipo[0]] !== '9')
        throw new AfdInvalidoError('trailer (tipo 9) fora do tamanho esperado', n);
      trailer = linha;
      continue;
    }

    const tipo = campo(linha, CAMPO.tipo);
    const esperado = TAMANHO_REGISTRO[tipo];
    if (!esperado || tipo === '9')
      throw new AfdInvalidoError(`tipo de registro desconhecido ("${tipo}")`, n);
    if (linha.length !== esperado)
      throw new AfdInvalidoError(
        `registro tipo ${tipo} com ${linha.length} caracteres (esperado ${esperado})`,
        n,
      );

    if (i === 0 && tipo !== '1')
      throw new AfdInvalidoError('o arquivo precisa começar pelo cabeçalho (tipo 1)', n);
    if (i > 0 && tipo === '1') throw new AfdInvalidoError('cabeçalho repetido', n);

    if (TIPOS_COM_CRC.has(tipo)) {
      const crcLido = linha.slice(-4).toUpperCase();
      const crcCalculado = crc16Kermit(linha.slice(0, -4));
      if (crcLido !== crcCalculado)
        throw new AfdInvalidoError(
          `CRC-16 não confere (lido ${crcLido}, calculado ${crcCalculado})`,
          n,
        );
    }

    const nsrTxt = campo(linha, CAMPO.nsr);
    if (!/^\d{9}$/.test(nsrTxt)) throw new AfdInvalidoError('NSR inválido', n);
    const nsr = Number(nsrTxt);
    if (tipo !== '1') {
      if (nsr <= ultimoNsr)
        throw new AfdInvalidoError('os registros precisam estar em ordem crescente de NSR', n);
      ultimoNsr = nsr;
    }

    if (tipo === '1') {
      const c = CAMPO.cabecalho;
      if (nsrTxt !== '000000000')
        throw new AfdInvalidoError('o NSR do cabeçalho deve ser 000000000', n);
      if (campo(linha, c.tipoIdEmpregador) !== '1')
        throw new AfdInvalidoError(
          'empregador identificado por CPF não é suportado: use arquivo com CNPJ',
          n,
        );
      const cnpj = campo(linha, c.idEmpregador).replace(/\D/g, '');
      if (cnpj.length !== 14) throw new AfdInvalidoError('CNPJ do empregador inválido', n);
      const dataInicial = campo(linha, c.dataInicial);
      const dataFinal = campo(linha, c.dataFinal);
      if (!RE_DATA.test(dataInicial) || !RE_DATA.test(dataFinal))
        throw new AfdInvalidoError('datas inicial e final fora do formato AAAA-MM-dd', n);
      const versao = campo(linha, c.versao);
      if (!VERSOES_ACEITAS.has(versao))
        throw new AfdInvalidoError(`versão do leiaute não suportada ("${versao}")`, n);
      cabecalho = { cnpj, dataInicial, dataFinal, versao };
      continue;
    }

    if (tipo === '3' || tipo === '7') {
      const { data, minuto } = lerDataHora(campo(linha, CAMPO.marcacao.dataHora), n);
      const cpf = lerCpf(campo(linha, CAMPO.marcacao.cpf), n);
      if (tipo === '7') {
        const r = CAMPO.marcacaoRepP;
        if (!/^0[1-5]$/.test(campo(linha, r.coletor)))
          throw new AfdInvalidoError('identificador do coletor inválido', n);
        if (!/^[01]$/.test(campo(linha, r.online)))
          throw new AfdInvalidoError('indicador on-line/off-line inválido', n);
        if (!/^[0-9a-fA-F]{64}$/.test(campo(linha, r.hash)))
          throw new AfdInvalidoError('código hash SHA-256 inválido', n);
        hashNaoVerificado = true;
      }
      batidas.push({ nsr, tipo, data, minuto, cpf });
    }
    if (tipo in contagem) contagem[tipo] = (contagem[tipo] ?? 0) + 1;
  }

  if (!cabecalho) throw new AfdInvalidoError('cabeçalho (tipo 1) ausente');
  if (!trailer)
    throw new AfdInvalidoError('trailer (tipo 9) ausente: arquivo incompleto ou cortado');

  const declaradas = campo(trailer, CAMPO.trailer.contagens).match(/\d{9}/g) ?? [];
  ['2', '3', '4', '5', '6', '7'].forEach((t, k) => {
    if (Number(declaradas[k]) !== contagem[t])
      throw new AfdInvalidoError(
        `o trailer declara ${Number(declaradas[k])} registro(s) tipo ${t}, mas o arquivo tem ${contagem[t]}`,
      );
  });

  if (hashNaoVerificado)
    avisos.push('Hash SHA-256 das marcações (tipo 7) não verificado: só o formato foi conferido.');
  return { cabecalho, batidas, avisos };
};
