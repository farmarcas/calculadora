import type { Aba } from '../planilhas/leitor.js';
import { normalizar } from '../planilhas/normalizar.js';
import { deduzirFuncao, type FuncaoEscala } from '../cadastros/processar.js';
import type { VendaLinha } from './vendas.js';

export type ErroLinha = { linha: number; motivo: string; loja?: string };
export type Colunas = Record<string, number | null>;

const cel = (l: string[], c: Colunas, k: string) => {
  const i = c[k];
  return i == null ? '' : (l[i] ?? '').trim();
};

// "08:00", "8", "8:30", "08:00:00" ou fração de dia do Excel (0,375) → horas decimais.
export const lerHora = (txt: string): number | null => {
  const t = txt.trim().replace(',', '.');
  if (!t) return null;
  const m = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/.exec(t);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2] ?? 0);
    return h <= 24 && min < 60 ? h + min / 60 : null;
  }
  if (/^0\.\d+$/.test(t)) return Math.round(Number(t) * 24 * 4) / 4;
  return null;
};

const DIAS: [RegExp, number][] = [
  [/^seg/, 0],
  [/^ter/, 1],
  [/^qua/, 2],
  [/^qui/, 3],
  [/^sex/, 4],
  [/^sab/, 5],
  [/^dom/, 6],
];
const diaDe = (t: string) => DIAS.find(([re]) => re.test(t))?.[1] ?? null;

// "Seg a Sáb", "Seg-Sex", "Seg,Qua,Sex", "Dom" → índices (0 = segunda).
export const lerDias = (txt: string): number[] | null => {
  const t = normalizar(txt);
  if (!t) return null;
  const partes = t
    .split(' ')
    .filter((p) => p && p !== 'e' && p !== 'a' && p !== 'ate' && p !== 'feira');
  const dias = partes.map(diaDe);
  if (dias.some((d) => d === null)) return null;
  const lista = dias as number[];
  const ehIntervalo = /\b(a|ate)\b/.test(t) || /[-–]/.test(txt);
  if (ehIntervalo && lista.length === 2) {
    const [ini, fim] = lista as [number, number];
    const r: number[] = [];
    for (let d = ini; ; d = (d + 1) % 7) {
      r.push(d);
      if (d === fim) break;
    }
    return r;
  }
  return [...new Set(lista)].sort();
};

export const lerNumero = (txt: string): number | null => {
  let t = txt.trim().replace(/[^\d.,-]/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export const lerData = (txt: string): string | null => {
  const t = txt.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t);
  if (m) return `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  return null;
};

export type TurnoLinha = {
  loja: string;
  matricula: string;
  nome: string;
  funcao: FuncaoEscala | null;
  tipoEscala?: string;
  dias: number[];
  entrada: number;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
  saida: number;
  cargaH: number;
  status: 'ok' | 'fora_calculo';
  motivo?: string;
};

export type CadastroPessoa = {
  nome: string;
  funcaoEscala: string | null;
  cargaSemanalH: number | null;
};

export const interpretarEscala = (aba: Aba, c: Colunas, cadastro: Map<string, CadastroPessoa>) => {
  const turnos: TurnoLinha[] = [];
  const erros: ErroLinha[] = [];
  const vistos = new Set<string>();

  aba.linhas.forEach((l, idx) => {
    const linha = idx + 2;
    const loja = cel(l, c, 'loja');
    const matricula = cel(l, c, 'matricula');
    if (!loja && !matricula) return;
    const erro = (motivo: string) => erros.push({ linha, motivo, loja: loja || undefined });
    if (!loja) return erro('Código da loja vazio');
    if (!matricula) return erro('ID do colaborador vazio');
    if (vistos.has(`${loja}|${matricula}`))
      return erro(`Colaborador ${matricula} repetido na loja ${loja}`);

    let dias = lerDias(cel(l, c, 'dias'));
    if (!dias) {
      // Contagem de dias (ex.: 6) com a folga informada: trabalha todos os outros.
      const folga = lerDias(cel(l, c, 'folga'));
      if (folga && /^\d$/.test(cel(l, c, 'dias')))
        dias = [0, 1, 2, 3, 4, 5, 6].filter((d) => !folga.includes(d));
    }
    if (!dias || dias.length === 0)
      return erro('Dias de trabalho não entendidos (use "Seg a Sáb" ou "Seg,Ter,Qua")');

    const entrada = lerHora(cel(l, c, 'entrada'));
    const saida = lerHora(cel(l, c, 'saida'));
    if (entrada === null) return erro('Hora de entrada vazia ou inválida');
    if (saida === null) return erro('Hora de saída vazia ou inválida');
    if (saida <= entrada) return erro('Saída antes da entrada');
    const ini = lerHora(cel(l, c, 'ini_intervalo'));
    const fim = lerHora(cel(l, c, 'fim_intervalo'));
    if ((ini === null) !== (fim === null))
      return erro('Intervalo incompleto (informe início e fim)');
    if (ini !== null && fim !== null && !(entrada <= ini && ini < fim && fim <= saida))
      return erro('Intervalo fora do turno');

    const horasDia = saida - entrada - (ini !== null && fim !== null ? fim - ini : 0);
    const cargaInformada = lerNumero(cel(l, c, 'carga'));
    const pessoa = cadastro.get(matricula);
    const funcao =
      (pessoa?.funcaoEscala as FuncaoEscala | null | undefined) ??
      deduzirFuncao(cel(l, c, 'funcao') || undefined, undefined);

    vistos.add(`${loja}|${matricula}`);
    turnos.push({
      loja,
      matricula,
      nome: cel(l, c, 'nome') || pessoa?.nome || matricula,
      funcao,
      tipoEscala: cel(l, c, 'tipo_escala') || undefined,
      dias,
      entrada,
      iniIntervalo: ini,
      fimIntervalo: fim,
      saida,
      cargaH: cargaInformada ?? Math.round(horasDia * dias.length * 100) / 100,
      status: funcao ? 'ok' : 'fora_calculo',
      motivo: funcao ? undefined : 'Sem função de escala: fora do cálculo',
    });
  });
  return { turnos, erros };
};

export type VendaComLoja = VendaLinha & { loja: string };

export const interpretarBase = (aba: Aba, c: Colunas) => {
  const vendas: VendaComLoja[] = [];
  const erros: ErroLinha[] = [];
  aba.linhas.forEach((l, idx) => {
    const linha = idx + 2;
    const loja = cel(l, c, 'loja');
    const dataTxt = cel(l, c, 'data');
    if (!loja && !dataTxt) return;
    const erro = (motivo: string) => erros.push({ linha, motivo, loja: loja || undefined });
    if (!loja) return erro('Código da loja vazio');
    const data = lerData(dataTxt);
    if (!data) return erro('Data inválida (use AAAA-MM-DD ou DD/MM/AAAA)');
    const hora = lerHora(cel(l, c, 'hora'));
    if (hora === null) return erro('Hora inválida');
    const venda = lerNumero(cel(l, c, 'venda'));
    if (venda === null) return erro('Venda líquida vazia ou inválida');
    vendas.push({
      loja,
      data,
      hora: Math.floor(hora),
      venda,
      margem: lerNumero(cel(l, c, 'margem')) ?? 0,
      clientes: Math.round(lerNumero(cel(l, c, 'clientes')) ?? 0),
      unidades: Math.round(lerNumero(cel(l, c, 'unidades')) ?? 0),
    });
  });
  return { vendas, erros };
};

// Soma as linhas da mesma loja, data e hora (a base pode vir uma linha por colaborador).
export const somarPorHora = (vendas: VendaLinha[]): VendaLinha[] => {
  const m = new Map<string, VendaLinha>();
  for (const v of vendas) {
    const k = `${v.data}|${v.hora}`;
    const a = m.get(k);
    if (a) {
      a.venda += v.venda;
      a.margem += v.margem;
      a.clientes += v.clientes;
      a.unidades += v.unidades;
    } else m.set(k, { ...v });
  }
  return [...m.values()];
};
