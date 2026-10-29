import type { HorariosSemana } from '../cadastros/horarios.js';
import { UFS } from '../cadastros/documentos.js';
import { normalizarCnpj, validarCnpj } from '../ge/cnpj.js';
import type { Aba } from '../planilhas/leitor.js';
import { lerSemana } from './horarios-relatorio.js';

// Relatório de lojas da plataforma (uma linha por loja). Só entram lojas com status "Ativado".
export type Regime = 'simples' | 'presumido' | 'real';
export type DadosLoja = {
  nome: string;
  cidade?: string;
  uf?: string;
  marca?: string;
  regimeTributario?: Regime;
  horarios?: HorariosSemana;
};
export type LinhaRelatorio = {
  linha: number;
  geIdentificacao: string;
  geResponsavel?: string;
  cnpj: string;
  codigo: string;
  dados: DadosLoja;
  avisos: string[];
};
export type Rejeicao = { linha: number; cnpj?: string; motivo: string };
export type Leitura = {
  total: number;
  linhas: LinhaRelatorio[];
  rejeitadas: Rejeicao[];
  // Linhas que não são "Ativado", por status.
  ignoradasPorStatus: Record<string, number>;
  // CNPJ → status, das ignoradas: serve para avisar de loja que já existe e saiu do ativo.
  ignoradasCnpj: Record<string, string>;
  pendencias: { semRegime: number; semHorario: number; horarioAjustado: number };
};

const chave = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const DIAS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const OBRIGATORIAS: [string, string][] = [
  ['cnpj', 'CNPJ'],
  ['status', 'Status'],
  ['grupo economico', 'Grupo Econômico'],
];

// Índice de cada coluna pelo título; devolve o que faltou entre as obrigatórias.
export const mapearColunas = (cabecalhos: string[]) => {
  const ch = cabecalhos.map(chave);
  const achar = (pred: (c: string) => boolean) => {
    const i = ch.findIndex(pred);
    return i < 0 ? null : i;
  };
  const col = {
    cnpj: achar((c) => c === 'cnpj'),
    status: achar((c) => c === 'status'),
    ge: achar((c) => c === 'grupo economico'),
    responsavel: achar((c) => c === 'nome do responsavel pelo ge'),
    bandeira: achar((c) => c === 'bandeira'),
    apelido: achar((c) => c === 'apelido de loja'),
    regime: achar((c) => c === 'regime tributario'),
    id: achar((c) => c === 'id'),
    cidade: achar((c) => c.startsWith('cidade')),
    uf: achar((c) => c.startsWith('estado')),
    dias: DIAS.map((d) => achar((c) => c === d)),
  };
  const faltam = OBRIGATORIAS.filter(([c]) => !ch.includes(c)).map(([, r]) => r);
  return { col, faltam };
};

export const achaAba = (abas: Aba[]) =>
  abas.find((a) => chave(a.nome) === 'lojas' && mapearColunas(a.cabecalhos).faltam.length === 0) ??
  abas.find((a) => mapearColunas(a.cabecalhos).faltam.length === 0) ??
  null;

const REGIMES: Record<string, Regime> = {
  simples: 'simples',
  presumido: 'presumido',
  real: 'real',
};

// O Excel pode ter tirado o zero à esquerda do CNPJ (número): completa até 14 dígitos.
const cnpjDe = (txt: string) => {
  const d = normalizarCnpj(txt);
  return d.length >= 12 && d.length < 14 ? d.padStart(14, '0') : d;
};

export const lerRelatorio = (aba: Aba): Leitura => {
  const { col } = mapearColunas(aba.cabecalhos);
  const cel = (l: string[], i: number | null) => (i === null ? '' : (l[i] ?? '').trim());
  const leitura: Leitura = {
    total: aba.linhas.length,
    linhas: [],
    rejeitadas: [],
    ignoradasPorStatus: {},
    ignoradasCnpj: {},
    pendencias: { semRegime: 0, semHorario: 0, horarioAjustado: 0 },
  };
  const cnpjsVistos = new Map<string, number>();
  const codigosVistos = new Set<string>();

  aba.linhas.forEach((l, i) => {
    const linha = i + 2; // linha 1 é o cabeçalho
    const status = cel(l, col.status);
    const cnpjTxt = cel(l, col.cnpj);
    if (status.toLowerCase() !== 'ativado') {
      const nome = status || 'Sem status';
      leitura.ignoradasPorStatus[nome] = (leitura.ignoradasPorStatus[nome] ?? 0) + 1;
      const c = cnpjDe(cnpjTxt);
      if (validarCnpj(c)) leitura.ignoradasCnpj[c] = nome;
      return;
    }
    const rejeitar = (motivo: string, cnpj?: string) =>
      leitura.rejeitadas.push({ linha, cnpj, motivo });

    const cnpj = cnpjDe(cnpjTxt);
    if (cnpjTxt === '') return rejeitar('CNPJ ausente');
    if (!validarCnpj(cnpj)) return rejeitar('CNPJ inválido', cnpjTxt);
    const ge = cel(l, col.ge);
    if (!ge) return rejeitar('Grupo Econômico ausente', cnpj);
    const anterior = cnpjsVistos.get(cnpj);
    if (anterior) return rejeitar(`CNPJ repetido no arquivo (já na linha ${anterior})`, cnpj);

    const bandeira = cel(l, col.bandeira);
    const cidade = cel(l, col.cidade);
    const ufTxt = cel(l, col.uf).toUpperCase();
    const uf = (UFS as readonly string[]).includes(ufTxt) ? ufTxt : '';
    const codigo = (cel(l, col.id) || cnpj).slice(0, 30);
    if (codigosVistos.has(`${ge}|${codigo}`))
      return rejeitar(`Id ${codigo} repetido no mesmo grupo do arquivo`, cnpj);
    cnpjsVistos.set(cnpj, linha);
    codigosVistos.add(`${ge}|${codigo}`);

    const avisos: string[] = [];
    const regime = REGIMES[chave(cel(l, col.regime))];
    if (!regime) leitura.pendencias.semRegime++;
    const { horarios, avisos: avisosHorario } = lerSemana(col.dias.map((c) => cel(l, c)));
    if (!horarios) leitura.pendencias.semHorario++;
    if (avisosHorario.length) {
      leitura.pendencias.horarioAjustado++;
      avisos.push(...avisosHorario);
    }
    if (ufTxt && !uf) avisos.push(`UF "${ufTxt}" não reconhecida`);

    const apelido = cel(l, col.apelido);
    const local = [cidade, uf].filter(Boolean).join('/');
    const nome = (apelido || [bandeira, local].filter(Boolean).join(' ') || `Loja ${codigo}`).slice(
      0,
      120,
    );

    leitura.linhas.push({
      linha,
      geIdentificacao: ge,
      geResponsavel: cel(l, col.responsavel) || undefined,
      cnpj,
      codigo,
      dados: {
        nome: nome.length >= 2 ? nome : `Loja ${codigo}`,
        ...(cidade ? { cidade: cidade.slice(0, 80) } : {}),
        ...(uf ? { uf } : {}),
        ...(bandeira ? { marca: bandeira.slice(0, 80) } : {}),
        ...(regime ? { regimeTributario: regime } : {}),
        ...(horarios ? { horarios } : {}),
      },
      avisos,
    });
  });
  return leitura;
};
