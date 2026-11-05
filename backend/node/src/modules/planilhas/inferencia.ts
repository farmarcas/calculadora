import { CAMPOS_FUNCIONARIO, CAMPOS_LOJA, type CampoDef } from './campos.js';
import type { Aba } from './leitor.js';
import { normalizar, similaridade } from './normalizar.js';

export type SugestaoColuna = { campo: string; coluna: number | null; confianca: number };
export type MapeamentoAba = { aba: string; colunas: Record<string, number | null> };
export type Mapeamento = { lojas: MapeamentoAba | null; funcionarios: MapeamentoAba | null };
export type Inferencia = {
  mapeamento: Mapeamento;
  sugestoes: { lojas: SugestaoColuna[]; funcionarios: SugestaoColuna[] };
};

export const LIMITE_CONFIANCA = 0.6;

// Pontua uma coluna (título + amostra do conteúdo) contra um campo esperado.
const pontuar = (cabecalho: string, amostra: string[], campo: CampoDef): number => {
  const titulo = normalizar(cabecalho.replace(/\*/g, ''));
  if (!titulo) return 0;
  const alvos = [
    normalizar(campo.rotulo),
    campo.chave.replace(/_/g, ' '),
    ...campo.sinonimos.map(normalizar),
  ];
  let porTitulo = 0;
  for (const alvo of alvos) {
    // Título igual ao alvo: 1, com um pequeno bônus pelo alvo mais específico ("função de escala" vence "cargo" numa planilha que tem as duas colunas).
    if (titulo === alvo) porTitulo = Math.max(porTitulo, 1 + alvo.length / 10000);
    else porTitulo = Math.max(porTitulo, similaridade(titulo, alvo) * 0.9);
  }
  if (campo.conteudo) {
    const cheias = amostra.filter((v) => v !== '');
    if (cheias.length > 0) {
      const acerto = cheias.filter((v) => campo.conteudo!(v)).length / cheias.length;
      // Conteúdo bate: reforça; conteúdo claramente errado: derruba.
      if (acerto >= 0.8) porTitulo = Math.min(1, porTitulo + 0.25);
      else if (acerto < 0.3) porTitulo *= 0.5;
    }
  }
  return porTitulo;
};

export const mapearColunas = (aba: Aba, campos: CampoDef[]): SugestaoColuna[] => {
  const amostra = (i: number) => aba.linhas.slice(0, 20).map((l) => l[i] ?? '');
  const pares = campos.flatMap((campo) =>
    aba.cabecalhos.map((cab, i) => ({
      campo: campo.chave,
      coluna: i,
      nota: pontuar(cab, amostra(i), campo),
    })),
  );
  pares.sort((a, b) => b.nota - a.nota);
  const usadas = new Set<number>();
  const feitos = new Map<string, SugestaoColuna>();
  for (const p of pares) {
    if (p.nota < LIMITE_CONFIANCA) break;
    if (feitos.has(p.campo) || usadas.has(p.coluna)) continue;
    feitos.set(p.campo, {
      campo: p.campo,
      coluna: p.coluna,
      confianca: Number(Math.min(1, p.nota).toFixed(2)),
    });
    usadas.add(p.coluna);
  }
  return campos.map((c) => feitos.get(c.chave) ?? { campo: c.chave, coluna: null, confianca: 0 });
};

// Nota de uma aba para ser "Lojas" ou "Funcionários": soma dos campos reconhecidos, com peso nos obrigatórios.
const notaAba = (sug: SugestaoColuna[], campos: CampoDef[]): number =>
  sug.reduce((s, x) => {
    const peso = campos.find((c) => c.chave === x.campo)?.obrigatorio ? 2 : 1;
    return s + (x.coluna === null ? 0 : x.confianca * peso);
  }, 0);

const ehTitulo = (aba: Aba, palavras: string[]) =>
  palavras.some((p) => normalizar(aba.nome).includes(p));

export const inferirMapeamento = (abas: Aba[]): Inferencia => {
  const avaliadas = abas.map((aba) => {
    const l = mapearColunas(aba, CAMPOS_LOJA);
    const f = mapearColunas(aba, CAMPOS_FUNCIONARIO);
    // O nome da aba desempata e reforça (bônus pequeno).
    return {
      aba,
      l,
      f,
      notaL: notaAba(l, CAMPOS_LOJA) + (ehTitulo(aba, ['loja', 'filial', 'unidade']) ? 1.5 : 0),
      notaF:
        notaAba(f, CAMPOS_FUNCIONARIO) +
        (ehTitulo(aba, ['funcionario', 'colaborador', 'pessoa', 'quadro']) ? 1.5 : 0),
    };
  });

  // A aba precisa trazer os campos obrigatórios e a identificação da loja: o CNPJ ou, em planilha antiga, o código.
  const obrigOk = (sug: SugestaoColuna[], campos: CampoDef[]) => {
    const tem = (chave: string) => sug.find((s) => s.campo === chave)?.coluna != null;
    const identifica = campos === CAMPOS_LOJA ? tem('cnpj') || tem('codigo') : tem('cnpj_loja') || tem('loja');
    return identifica && campos.filter((c) => c.obrigatorio).every((c) => tem(c.chave));
  };

  const escolhaLoja = avaliadas
    // Uma aba só é a de lojas se parece mais com lojas do que com funcionários (o nome não é mais obrigatório).
    .filter((a) => obrigOk(a.l, CAMPOS_LOJA) && a.notaL > a.notaF)
    .sort((a, b) => b.notaL - b.notaF - (a.notaL - a.notaF))[0];
  const escolhaFunc = avaliadas
    .filter((a) => a !== escolhaLoja && obrigOk(a.f, CAMPOS_FUNCIONARIO))
    .sort((a, b) => b.notaF - b.notaL - (a.notaF - a.notaL))[0];

  const paraMapa = (sug: SugestaoColuna[]) =>
    Object.fromEntries(sug.map((s) => [s.campo, s.coluna])) as Record<string, number | null>;

  // Quando nenhuma aba cumpre os obrigatórios, sugere a melhor mesmo assim (a pessoa completa na tela).
  // Uma aba que parece mais de funcionários nunca é sugerida como de lojas: importá-la como lojas trocaria dados de loja.
  const melhorLoja =
    escolhaLoja ??
    [...avaliadas].filter((a) => a.notaL > a.notaF).sort((a, b) => b.notaL - a.notaL)[0];
  const melhorFunc =
    escolhaFunc ??
    [...avaliadas].filter((a) => a !== melhorLoja).sort((a, b) => b.notaF - a.notaF)[0];

  return {
    mapeamento: {
      lojas:
        melhorLoja && notaAba(melhorLoja.l, CAMPOS_LOJA) > 0
          ? { aba: melhorLoja.aba.nome, colunas: paraMapa(melhorLoja.l) }
          : null,
      funcionarios:
        melhorFunc && notaAba(melhorFunc.f, CAMPOS_FUNCIONARIO) > 0
          ? { aba: melhorFunc.aba.nome, colunas: paraMapa(melhorFunc.f) }
          : null,
    },
    sugestoes: { lojas: melhorLoja?.l ?? [], funcionarios: melhorFunc?.f ?? [] },
  };
};

// Planilha de uma única tabela (escala atual, base comercial): escolhe a aba que melhor casa com os campos.
export const inferirUmaAba = (abas: Aba[], campos: CampoDef[]) => {
  const avaliadas = abas.map((aba) => {
    const sugestoes = mapearColunas(aba, campos);
    return { aba, sugestoes, nota: notaAba(sugestoes, campos) };
  });
  const melhor = avaliadas.sort((a, b) => b.nota - a.nota)[0];
  if (!melhor) return null;
  const colunas = Object.fromEntries(melhor.sugestoes.map((s) => [s.campo, s.coluna])) as Record<
    string,
    number | null
  >;
  const faltam = campos
    .filter((c) => c.obrigatorio && colunas[c.chave] == null)
    .map((c) => c.rotulo);
  return { aba: melhor.aba, colunas, sugestoes: melhor.sugestoes, faltam };
};
