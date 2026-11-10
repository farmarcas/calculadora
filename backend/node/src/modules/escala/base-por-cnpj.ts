import type { Aba } from '../planilhas/leitor.js';
import { normalizar } from '../planilhas/normalizar.js';
import { lerHora, lerNumero, type ErroLinha } from './interpretar.js';
import { diaDaSemana, type VendaLinha } from './vendas.js';

// Base comercial por CNPJ e dia da semana (spec 036): uma linha por loja, dia da semana e hora, com os TOTAIS de um período.
// Aqui o total vira a média de um dia (o formato que os cálculos esperam) e cada dia da semana ganha uma data de referência.

export type Periodo = { inicio: string; fim: string };

const COLUNAS = {
  cnpj: ['cnpj'],
  dia: ['dia semana', 'dia da semana'],
  hora: ['hora'],
  venda: ['faturamento', 'venda liquida', 'venda liquida rs'],
  cmv: ['cmv valor', 'cmv', 'cmv rs'],
  tickets: ['tickets vendidos', 'tickets', 'clientes atendidos', 'clientes'],
  unidades: ['unidades vendidas', 'unidades', 'qtd unidades vendidas'],
} satisfies Record<string, string[]>;

export type ColunasPorCnpj = { [K in keyof typeof COLUNAS]: number | null };

// Acha as colunas pelo cabeçalho (sem acento, sem diferença de maiúsculas e com `_` ou espaço). Nulo se não for este formato:
// precisa de CNPJ, dia da semana e faturamento.
export const colunasPorCnpj = (cabecalhos: string[]): ColunasPorCnpj | null => {
  const normais = cabecalhos.map(normalizar);
  const achar = (nomes: string[]) => {
    const i = normais.findIndex((c) => nomes.includes(c));
    return i < 0 ? null : i;
  };
  const colunas = Object.fromEntries(
    Object.entries(COLUNAS).map(([chave, nomes]) => [chave, achar(nomes)]),
  ) as ColunasPorCnpj;
  return colunas.cnpj !== null && colunas.dia !== null && colunas.venda !== null ? colunas : null;
};
export const ehBasePorCnpj = (cabecalhos: string[]) => colunasPorCnpj(cabecalhos) !== null;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const dataUtc = (s: string) => {
  const m = ISO.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === s ? d : null;
};
const DIA_MS = 86_400_000;

// Mensagem de erro, ou nulo quando o período serve: datas válidas, fim depois do início e pelo menos uma semana.
export const erroDoPeriodo = (inicio?: string | null, fim?: string | null): string | null => {
  const a = inicio ? dataUtc(inicio) : null;
  const b = fim ? dataUtc(fim) : null;
  const base = 'Informe o período que o arquivo cobre (data inicial e final, com pelo menos uma semana).';
  if (!a || !b) return base;
  const dias = Math.round((b.getTime() - a.getTime()) / DIA_MS) + 1;
  if (dias < 7) return base;
  if (dias > 800) return 'O período do arquivo é longo demais (máximo de mais de 2 anos). Confira as datas.';
  return null;
};

// Quantas vezes cada dia da semana (segunda = 0 … domingo = 6) aparece no período, contando início e fim.
export const vezesPorDia = (p: Periodo): number[] => {
  const vezes = new Array<number>(7).fill(0);
  const a = dataUtc(p.inicio)!;
  const b = dataUtc(p.fim)!;
  for (let t = a.getTime(); t <= b.getTime(); t += DIA_MS) {
    vezes[diaDaSemana(new Date(t).toISOString().slice(0, 10))]! += 1;
  }
  return vezes;
};

// Primeira data do período que cai naquele dia da semana (0 = segunda).
export const dataDeReferencia = (p: Periodo, dia: number): string => {
  const a = dataUtc(p.inicio)!;
  for (let i = 0; i < 7; i++) {
    const d = new Date(a.getTime() + i * DIA_MS).toISOString().slice(0, 10);
    if (diaDaSemana(d) === dia) return d;
  }
  return p.inicio;
};

export type AvisosDaBase = {
  linhaZerada: number;
  unidadesMenoresQueClientes: number;
  cmvMaiorQueVenda: number;
  lojaComPoucosDias: number;
};

export const soDigitos = (s: string) => s.replace(/\D/g, '');

type Soma = { venda: number; cmv: number | null; tickets: number; unidades: number };

export const interpretarPorCnpj = (aba: Aba, colunas: ColunasPorCnpj, periodo: Periodo) => {
  const vezes = vezesPorDia(periodo);
  const datas = Array.from({ length: 7 }, (_, d) => dataDeReferencia(periodo, d));
  const celula = (l: string[], k: keyof ColunasPorCnpj) => {
    const i = colunas[k];
    return i === null ? '' : (l[i] ?? '').trim();
  };
  const erros: ErroLinha[] = [];
  const avisos: AvisosDaBase = {
    linhaZerada: 0,
    unidadesMenoresQueClientes: 0,
    cmvMaiorQueVenda: 0,
    lojaComPoucosDias: 0,
  };
  // loja → "dia|hora" → soma do período
  const porLoja = new Map<string, Map<string, Soma & { dia: number; hora: number }>>();
  let aceitas = 0;

  aba.linhas.forEach((l, idx) => {
    const linha = idx + 2;
    const cnpjTxt = celula(l, 'cnpj');
    if (!cnpjTxt && !celula(l, 'dia') && !celula(l, 'venda')) return;
    const cnpj = soDigitos(cnpjTxt);
    const erro = (motivo: string) => erros.push({ linha, motivo, loja: cnpj.length === 14 ? cnpj : undefined });
    if (cnpj.length !== 14) return erro('CNPJ inválido (precisa ter 14 dígitos)');
    const diaNum = lerNumero(celula(l, 'dia'));
    if (diaNum === null || !Number.isInteger(diaNum) || diaNum < 1 || diaNum > 7)
      return erro('Dia da semana inválido (use 1 para segunda até 7 para domingo)');
    const hora = lerHora(celula(l, 'hora'));
    if (hora === null || hora >= 24) return erro('Hora inválida (use de 0 a 23)');
    const venda = lerNumero(celula(l, 'venda'));
    if (venda === null || venda < 0) return erro('Faturamento vazio, negativo ou inválido');
    const cmv = lerNumero(celula(l, 'cmv'));
    const tickets = lerNumero(celula(l, 'tickets')) ?? 0;
    const unidades = lerNumero(celula(l, 'unidades')) ?? 0;

    if (venda === 0) avisos.linhaZerada++;
    if (cmv !== null && cmv > venda) avisos.cmvMaiorQueVenda++;
    if (celula(l, 'unidades') !== '' && celula(l, 'tickets') !== '' && unidades < tickets)
      avisos.unidadesMenoresQueClientes++;

    const dia = diaNum - 1;
    const h = Math.floor(hora);
    const loja = porLoja.get(cnpj) ?? new Map();
    const k = `${dia}|${h}`;
    const a = loja.get(k);
    if (a) {
      a.venda += venda;
      a.cmv = a.cmv === null || cmv === null ? null : a.cmv + cmv;
      a.tickets += tickets;
      a.unidades += unidades;
    } else loja.set(k, { dia, hora: h, venda, cmv, tickets, unidades });
    porLoja.set(cnpj, loja);
    aceitas++;
  });

  const porCnpj = new Map<string, VendaLinha[]>();
  for (const [cnpj, horas] of porLoja) {
    const dias = new Set<number>();
    const linhas: VendaLinha[] = [];
    for (const s of horas.values()) {
      dias.add(s.dia);
      const n = vezes[s.dia]!;
      linhas.push({
        data: datas[s.dia]!,
        hora: s.hora,
        venda: s.venda / n,
        // O CMV é opcional: sem ele a hora fica sem lucro bruto (nulo), nunca zero.
        margem: s.cmv === null ? null : (s.venda - s.cmv) / n,
        clientes: s.tickets / n,
        unidades: s.unidades / n,
      });
    }
    if (dias.size < 6) avisos.lojaComPoucosDias++;
    porCnpj.set(cnpj, linhas);
  }
  return { porCnpj, erros, avisos, aceitas, vezes };
};

const arred = (n: number, casas: number) => {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
};

// Do que a base trouxe de uma loja: faturamento médio por dia da semana (soma das horas, em reais) e CMV médio em %
// (soma do CMV ÷ soma da venda das horas que têm CMV). Nulo onde não há dado.
export const faturamentoDaBase = (linhas: VendaLinha[]) => {
  const dias = new Array<number | null>(7).fill(null);
  let vendaComCmv = 0;
  let cmv = 0;
  for (const l of linhas) {
    const d = diaDaSemana(l.data);
    dias[d] = (dias[d] ?? 0) + l.venda;
    if (l.margem !== null) {
      vendaComCmv += l.venda;
      cmv += l.venda - l.margem;
    }
  }
  return {
    dias: dias.map((v) => (v === null || v <= 0 ? null : arred(v, 2))),
    cmvPct: vendaComCmv > 0 ? arred((cmv / vendaComCmv) * 100, 1) : null,
  };
};

// Preenche o faturamento do Cadastro com o que veio da base, SÓ onde está vazio: o que alguém digitou nunca muda.
// `novo` é nulo quando nada precisa mudar. `jaTinha` diz se a loja já tinha algum valor próprio (faturamento do dia ou CMV médio).
export const mesclarCadastro = (
  atual: unknown,
  calculado: { dias: (number | null)[]; cmvPct: number | null },
) => {
  const a = atual as { dias?: (number | null)[]; mensal?: number | null; cmvPct?: unknown } | null | undefined;
  const diasAtuais = Array.isArray(a?.dias) ? a.dias : new Array<number | null>(7).fill(null);
  const cmvAtual = typeof a?.cmvPct === 'number' ? a.cmvPct : null;
  const jaTinha = diasAtuais.some((v) => typeof v === 'number') || cmvAtual !== null;
  let preencheuDias = 0;
  const dias = Array.from({ length: 7 }, (_, i) => {
    const antes = diasAtuais[i] ?? null;
    const novo = calculado.dias[i] ?? null;
    if (antes === null && novo !== null) {
      preencheuDias++;
      return novo;
    }
    return antes;
  });
  const preencheuCmv = cmvAtual === null && calculado.cmvPct !== null;
  const cmvPct = preencheuCmv ? calculado.cmvPct : cmvAtual;
  const mudou = preencheuDias > 0 || preencheuCmv;
  return {
    novo: mudou
      ? { dias, mensal: a?.mensal ?? null, ...(cmvPct !== null ? { cmvPct } : {}) }
      : null,
    preencheuDias,
    preencheuCmv,
    jaTinha,
  };
};
