import { describe, expect, it } from 'vitest';
import { lerAfd } from './afd.js';
import { gerarAfd } from './afd.fake.js';
import { crc16Kermit } from './crc16.js';
import { cpfComDigitosValidos, gerarCpfFicticio, mascararCpf } from './util.js';

const CNPJ = '11222333000181';
const cpf = gerarCpfFicticio(1);
const base = {
  cnpj: CNPJ,
  dataInicial: '2026-10-01',
  dataFinal: '2026-10-31',
  marcacoes: [
    { cpf, data: '2026-10-05', hora: '08:02' },
    { cpf, data: '2026-10-05', hora: '12:00' },
    { cpf, data: '2026-10-05', hora: '13:01' },
    { cpf, data: '2026-10-05', hora: '17:30' },
  ],
};

describe('crc16Kermit', () => {
  it('bate com o valor de referência do anexo oficial', () => {
    expect(crc16Kermit('123456789')).toBe('2189');
  });
});

describe('lerAfd', () => {
  it('lê um arquivo REP-C válido', () => {
    const r = lerAfd(gerarAfd(base));
    expect(r.cabecalho).toMatchObject({
      cnpj: CNPJ,
      dataInicial: '2026-10-01',
      dataFinal: '2026-10-31',
      versao: '004',
    });
    expect(r.batidas).toHaveLength(4);
    expect(r.batidas[0]).toMatchObject({
      nsr: 1,
      tipo: '3',
      data: '2026-10-05',
      minuto: 8 * 60 + 2,
      cpf,
    });
    expect(r.avisos).toEqual([]);
  });

  it('lê REP-P (tipo 7) com a assinatura final e avisa que o hash não foi verificado', () => {
    const r = lerAfd(gerarAfd({ ...base, tipo: 7 }));
    expect(r.batidas).toHaveLength(4);
    expect(r.batidas[0]!.tipo).toBe('7');
    expect(r.avisos[0]).toContain('Hash');
  });

  it('aceita o CPF com zero à esquerda nas 12 posições e fim de linha só com LF', () => {
    const txt = gerarAfd(base).replace(/\r\n/g, '\n');
    expect(lerAfd(txt).batidas).toHaveLength(4);
  });

  it('rejeita CRC errado, apontando a linha', () => {
    const linhas = gerarAfd(base).split('\r\n');
    linhas[2] = linhas[2]!.slice(0, 46) + '0000';
    expect(() => lerAfd(linhas.join('\r\n'))).toThrow(/Linha 3: CRC-16 não confere/);
  });

  it('rejeita arquivo cortado (sem trailer) e contagem diferente da declarada', () => {
    const linhas = gerarAfd(base).trim().split('\r\n');
    expect(() => lerAfd(linhas.slice(0, 3).join('\r\n'))).toThrow(/trailer .* ausente/);
    const semUma = [...linhas.slice(0, 2), ...linhas.slice(3)];
    expect(() => lerAfd(semUma.join('\r\n'))).toThrow(
      /trailer declara 4 registro\(s\) tipo 3, mas o arquivo tem 3/,
    );
  });

  it('rejeita linha de tamanho errado, em branco, fora de ordem e tipo desconhecido', () => {
    const linhas = gerarAfd(base).trim().split('\r\n');
    expect(() =>
      lerAfd([...linhas.slice(0, 2), linhas[2] + 'X', ...linhas.slice(3)].join('\r\n')),
    ).toThrow(/com 51 caracteres/);
    expect(() => lerAfd([...linhas.slice(0, 2), '', ...linhas.slice(2)].join('\r\n'))).toThrow(
      /em branco/,
    );
    expect(() =>
      lerAfd([linhas[0], linhas[2], linhas[1], ...linhas.slice(3)].join('\r\n')),
    ).toThrow(/ordem crescente/);
    expect(() => lerAfd('abc')).toThrow(/tipo de registro desconhecido|cabeçalho/);
  });

  it('rejeita arquivo vazio, sem cabeçalho e com data inexistente', () => {
    expect(() => lerAfd('')).toThrow(/vazio/);
    const linhas = gerarAfd(base).trim().split('\r\n');
    expect(() => lerAfd(linhas.slice(1).join('\r\n'))).toThrow(/cabeçalho/);
  });
});

describe('util de CPF', () => {
  it('gera CPFs fictícios válidos e mascara', () => {
    expect(cpfComDigitosValidos(gerarCpfFicticio(7))).toBe(true);
    expect(mascararCpf('12345678909')).toBe('***.456.789-**');
  });
});
