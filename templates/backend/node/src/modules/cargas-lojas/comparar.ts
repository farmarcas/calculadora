import { normalizarHorarios } from '../cadastros/horarios.js';
import type { DadosLoja, Leitura, LinhaRelatorio, Rejeicao } from './relatorio.js';

// Compara o relatório com o que já está no sistema e diz o que criar, atualizar, rejeitar e o que é conflito
// (o empresário corrigiu um dado depois da última carga e a plataforma também mudou). Função pura.
export const CAMPOS = ['nome', 'cidade', 'uf', 'marca', 'regimeTributario', 'horarios'] as const;
export type Campo = (typeof CAMPOS)[number];
export type Retrato = Partial<Record<Campo, unknown>>;

export type LojaExistente = {
  id: string;
  geId: string;
  codigo: string;
  cnpj: string | null;
  nome: string;
  cidade: string | null;
  uf: string | null;
  marca: string | null;
  regimeTributario: string | null;
  horarios: unknown;
  // Retrato dos valores da última carga (nulo: loja que nunca veio do relatório).
  ultimaCarga: Retrato | null;
};
export type GeExistente = { id: string; identificacao: string; nome: string; ativo: boolean };
export type Estado = {
  ges: Map<string, GeExistente>; // por identificação
  lojasPorCnpj: Map<string, LojaExistente>;
  lojasDoGe: Map<string, LojaExistente[]>; // por id do GE
};

export type Conflito = {
  cnpj: string;
  loja: string;
  campo: Campo;
  atual: unknown;
  planilha: unknown;
};
export type Atualizacao = {
  lojaId: string;
  cnpj: string;
  // O que muda sem conflito (o empresário não tinha mexido).
  mudancas: Retrato;
  // O que o relatório diz, para guardar como retrato da carga.
  retrato: Retrato;
  conflitos: Conflito[];
};
export type PlanoGe = {
  identificacao: string;
  nome: string;
  responsavel?: string;
  novo: boolean;
  geId?: string;
  criar: LinhaRelatorio[];
  atualizar: Atualizacao[];
  semMudanca: number;
  foraDoArquivo: { cnpj: string; nome: string }[];
  saiuDoAtivo: { cnpj: string; nome: string; status: string }[];
};
export type Plano = { porGe: PlanoGe[]; rejeitadas: Rejeicao[] };

// JSON com as chaves em ordem fixa: o banco guarda JSON sem garantir a ordem das chaves.
const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x as object).sort(([a], [b]) => a.localeCompare(b)))
      : x,
  );
const vazioParaNada = (v: unknown) => (v === null || v === '' ? undefined : v);
const norm = (campo: Campo, v: unknown) =>
  campo === 'horarios' ? (normalizarHorarios(v) ?? undefined) : vazioParaNada(v);
const igual = (campo: Campo, a: unknown, b: unknown) =>
  canon(norm(campo, a) ?? null) === canon(norm(campo, b) ?? null);

const retratoDe = (d: DadosLoja): Retrato =>
  Object.fromEntries(CAMPOS.filter((c) => d[c] !== undefined).map((c) => [c, d[c]]));
const atualDe = (l: LojaExistente, c: Campo): unknown => l[c];

export const planejar = (leitura: Leitura, estado: Estado): Plano => {
  const rejeitadas: Rejeicao[] = [...leitura.rejeitadas];
  const grupos = new Map<string, LinhaRelatorio[]>();
  for (const l of leitura.linhas)
    grupos.set(l.geIdentificacao, [...(grupos.get(l.geIdentificacao) ?? []), l]);

  const porGe: PlanoGe[] = [];
  for (const [identificacao, linhas] of grupos) {
    const ge = estado.ges.get(identificacao);
    const responsavel = linhas.find((l) => l.geResponsavel)?.geResponsavel;
    if (ge && !ge.ativo) {
      for (const l of linhas)
        rejeitadas.push({
          linha: l.linha,
          cnpj: l.cnpj,
          motivo: `O grupo ${identificacao} está desativado`,
        });
      continue;
    }
    const doGe = ge ? (estado.lojasDoGe.get(ge.id) ?? []) : [];
    const plano: PlanoGe = {
      identificacao,
      nome: ge?.nome ?? (responsavel || `GE ${identificacao}`),
      responsavel,
      novo: !ge,
      geId: ge?.id,
      criar: [],
      atualizar: [],
      semMudanca: 0,
      foraDoArquivo: [],
      saiuDoAtivo: [],
    };
    const noArquivo = new Set(linhas.map((l) => l.cnpj));

    for (const l of linhas) {
      const existente = estado.lojasPorCnpj.get(l.cnpj);
      if (existente && existente.geId !== ge?.id) {
        // O operador vê todos os grupos, então pode saber qual é.
        const dono = [...estado.ges.values()].find((g) => g.id === existente.geId);
        rejeitadas.push({
          linha: l.linha,
          cnpj: l.cnpj,
          motivo: `CNPJ já cadastrado em outro grupo (${dono ? `${dono.nome}, ${dono.identificacao}` : 'outro GE'})`,
        });
        continue;
      }
      if (!existente) {
        const ocupado = doGe.find((x) => x.codigo === l.codigo);
        if (ocupado) {
          rejeitadas.push({
            linha: l.linha,
            cnpj: l.cnpj,
            motivo: `O código ${l.codigo} já é de outra loja do grupo`,
          });
          continue;
        }
        plano.criar.push(l);
        continue;
      }
      // Loja do mesmo GE: compara campo a campo.
      const retrato = retratoDe(l.dados);
      const mudancas: Retrato = {};
      const conflitos: Conflito[] = [];
      for (const campo of CAMPOS) {
        const f = retrato[campo];
        if (f === undefined) continue; // o relatório sem valor não apaga o que existe
        const atual = atualDe(existente, campo);
        if (igual(campo, atual, f)) continue;
        const anterior = existente.ultimaCarga?.[campo];
        if (existente.ultimaCarga && igual(campo, anterior, f)) continue; // a plataforma não mudou: é correção do empresário
        const empresarioMexeu = !existente.ultimaCarga || !igual(campo, atual, anterior);
        if (empresarioMexeu)
          conflitos.push({
            cnpj: l.cnpj,
            loja: existente.nome,
            campo,
            atual: norm(campo, atual) ?? null,
            planilha: f,
          });
        else mudancas[campo] = f;
      }
      const retratoNovo = { ...(existente.ultimaCarga ?? {}), ...retrato };
      const mudouRetrato = canon(retratoNovo) !== canon(existente.ultimaCarga ?? {});
      if (Object.keys(mudancas).length === 0 && conflitos.length === 0 && !mudouRetrato)
        plano.semMudanca++;
      else
        plano.atualizar.push({
          lojaId: existente.id,
          cnpj: l.cnpj,
          mudancas,
          retrato: retratoNovo,
          conflitos,
        });
    }

    for (const x of doGe) {
      if (x.cnpj && noArquivo.has(x.cnpj)) continue;
      const status = x.cnpj ? leitura.ignoradasCnpj[x.cnpj] : undefined;
      if (status) plano.saiuDoAtivo.push({ cnpj: x.cnpj!, nome: x.nome, status });
      else plano.foraDoArquivo.push({ cnpj: x.cnpj ?? '', nome: x.nome });
    }
    porGe.push(plano);
  }
  return { porGe, rejeitadas };
};

// Aplica a escolha do operador sobre os conflitos: substituir pelo valor da planilha ou manter o atual.
export type Substituir = 'nenhum' | 'todos' | string[];
export const aplicarEscolha = (a: Atualizacao, substituir: Substituir): Retrato => {
  const quer = substituir === 'todos' || (Array.isArray(substituir) && substituir.includes(a.cnpj));
  return quer
    ? { ...a.mudancas, ...Object.fromEntries(a.conflitos.map((c) => [c.campo, c.planilha])) }
    : a.mudancas;
};
