import { createHash } from 'node:crypto';
import { ASSINATURA_REP_AP } from './afd.layout.js';
import { crc16Kermit } from './crc16.js';

// Gera um AFD FICTÍCIO no layout da Portaria 671 (CRC-16, trailer e assinatura corretos).
// Serve para testes, dados de exemplo e demonstração: nunca contém dado real.
export type Marcacao = { cpf: string; data: string; hora: string }; // data AAAA-MM-dd, hora HH:MM

export type OpcoesAfd = {
  cnpj: string;
  dataInicial: string;
  dataFinal: string;
  marcacoes: Marcacao[];
  tipo?: 3 | 7;
  razaoSocial?: string;
  fuso?: string;
};

const dir = (txt: string, n: number) => txt.padEnd(n, ' ').slice(0, n);
const nsr = (n: number) => String(n).padStart(9, '0');
const dh = (data: string, hora: string, fuso: string) => `${data}T${hora}:00${fuso}`;
const comCrc = (corpo: string) => corpo + crc16Kermit(corpo);

export const gerarAfd = (o: OpcoesAfd): string => {
  const fuso = o.fuso ?? '-0300';
  const tipo = o.tipo ?? 3;
  const linhas: string[] = [];

  linhas.push(
    comCrc(
      nsr(0) +
        '1' +
        '1' +
        o.cnpj.padEnd(14, ' ') +
        '0'.repeat(14) +
        dir(o.razaoSocial ?? 'EMPRESA EXEMPLO LTDA', 150) +
        '9'.repeat(17) +
        o.dataInicial +
        o.dataFinal +
        dh(o.dataFinal, '23:59', fuso) +
        '004' +
        '1' +
        '0'.repeat(14) +
        dir('REP FICTICIO', 30),
    ),
  );

  let hashAnterior = '';
  o.marcacoes.forEach((m, i) => {
    const n = nsr(i + 1);
    const cpf = m.cpf.padEnd(12, ' ');
    if (tipo === 3) {
      linhas.push(comCrc(n + '3' + dh(m.data, m.hora, fuso) + cpf));
    } else {
      const grav = dh(m.data, m.hora, fuso);
      const hash = createHash('sha256')
        .update(n + '7' + dh(m.data, m.hora, fuso) + m.cpf + grav + '04' + '0' + hashAnterior)
        .digest('hex');
      hashAnterior = hash;
      linhas.push(n + '7' + dh(m.data, m.hora, fuso) + cpf + grav + '04' + '0' + hash);
    }
  });

  const qtd = (t: number) => String(tipo === t ? o.marcacoes.length : 0).padStart(9, '0');
  linhas.push('999999999' + qtd(2) + qtd(3) + qtd(4) + qtd(5) + qtd(6) + qtd(7) + '9');
  if (tipo !== 3) linhas.push(dir(ASSINATURA_REP_AP, 100));
  return linhas.join('\r\n') + '\r\n';
};

// Quatro batidas de um dia de trabalho: entrada, ida e volta do intervalo, saída.
export const diaDeTrabalho = (
  cpf: string,
  data: string,
  h: [string, string, string, string],
): Marcacao[] => h.map((hora) => ({ cpf, data, hora }));
