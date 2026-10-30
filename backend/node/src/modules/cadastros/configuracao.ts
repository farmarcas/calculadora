// Configuração da loja lida de uma linha da planilha: convenção de 8h24, meta de pessoas por hora de cada função e,
// só para o dono, salário médio por função e encargos. Coluna vazia não entra (mantém o valor da loja).
export const FUNCOES_CONFIG = [
  ['farmaceutico', 'Farmacêutico'],
  ['atendimento', 'Atendimento'],
  ['caixa', 'Caixa'],
  ['apoio', 'Apoio'],
  ['perfumaria', 'Perfumaria'],
] as const;

const SIM = /^(sim|s|x|true|1|yes)$/i;
const NAO = /^(nao|não|n|false|0|no)$/i;

// Sim/Não: vazio = não informado (mantém); qualquer outra coisa é inválida.
export const lerSimNao = (texto: string): boolean | null | typeof Number.NaN => {
  const t = texto.trim();
  if (!t) return null;
  if (SIM.test(t)) return true;
  if (NAO.test(t)) return false;
  return Number.NaN;
};

const numero = (texto: string) => {
  const t = texto.replace(/[R$\s%]/g, '');
  if (!t) return null;
  const milhar = /^\d{1,3}(\.\d{3})+$/.test(t);
  const n = Number(
    t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : milhar ? t.replace(/\./g, '') : t,
  );
  return Number.isFinite(n) ? n : Number.NaN;
};

export type ConfiguracaoLinha = {
  convencao8h24?: boolean;
  // Pessoas por hora de cada função (só as informadas).
  minimos?: Partial<Record<string, number>>;
  // Salários informados e os ajustes de encargos desta loja (RAT, FAP, rescisão). `encargosPct` é o formato antigo:
  // é lido só para avisar que foi ignorado (o encargo vem do regime tributário).
  custos?: {
    salarioMedio: Partial<Record<string, number>>;
    encargos?: { ratPct?: number; fap?: number; rescisaoLigada?: boolean };
    encargosPct?: number;
  };
};

export const configuracaoDaLinha = (
  celula: (chave: string) => string,
): { configuracao?: ConfiguracaoLinha; erro?: string } => {
  const out: ConfiguracaoLinha = {};

  const conv = lerSimNao(celula('convencao_8h24'));
  if (Number.isNaN(conv)) return { erro: 'Convenção 8h24: use Sim ou Não' };
  if (conv !== null) out.convencao8h24 = conv as boolean;

  const minimos: Record<string, number> = {};
  for (const [k, nome] of FUNCOES_CONFIG) {
    const n = numero(celula(`meta_${k}`));
    if (n === null) continue;
    if (!Number.isInteger(n) || n < 0 || n > 10)
      return { erro: `Meta de ${nome}: use um número inteiro de 0 a 10` };
    if (nome === 'Farmacêutico' && n < 1)
      return { erro: 'Meta de Farmacêutico: a lei exige ao menos 1 em todo o horário' };
    minimos[nome] = n;
  }
  if (Object.keys(minimos).length) out.minimos = minimos;

  const salarioMedio: Record<string, number> = {};
  for (const [k, nome] of FUNCOES_CONFIG) {
    const n = numero(celula(`salario_${k}`));
    if (n === null) continue;
    if (!(n > 0) || n > 1_000_000)
      return { erro: `Salário médio de ${nome}: informe um valor maior que zero` };
    salarioMedio[nome] = n;
  }
  const antigo = numero(celula('encargos_pct'));
  const rat = numero(celula('rat_pct'));
  if (rat !== null && (Number.isNaN(rat) || rat < 0 || rat > 3))
    return { erro: 'RAT: use um percentual de 0 a 3' };
  const fap = numero(celula('fap'));
  if (fap !== null && (Number.isNaN(fap) || fap < 0.5 || fap > 2))
    return { erro: 'FAP: use um multiplicador de 0,5 a 2,0' };
  const resc = lerSimNao(celula('rescisao'));
  if (Number.isNaN(resc)) return { erro: 'Provisão de rescisão: use Sim ou Não' };
  const encargos: { ratPct?: number; fap?: number; rescisaoLigada?: boolean } = {};
  if (rat !== null) encargos.ratPct = rat;
  if (fap !== null) encargos.fap = fap;
  if (resc !== null) encargos.rescisaoLigada = resc as boolean;
  if (Object.keys(salarioMedio).length || Object.keys(encargos).length || antigo !== null)
    out.custos = {
      salarioMedio,
      ...(Object.keys(encargos).length ? { encargos } : {}),
      ...(antigo !== null && !Number.isNaN(antigo) ? { encargosPct: antigo } : {}),
    };

  return Object.keys(out).length ? { configuracao: out } : {};
};
