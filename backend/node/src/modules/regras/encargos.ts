// Encargos da folha por regime tributário da loja (spec 015; DM-61, DM-62, CALC-20, CALC-21).
// Cada regime guarda os componentes; o percentual total é sempre calculado, nunca digitado.
export type RegimeId = 'simples' | 'presumido' | 'real';
export const REGIMES_ENCARGOS: RegimeId[] = ['simples', 'presumido', 'real'];
export const NOME_REGIME: Record<RegimeId, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
};
// Regime usado quando a loja não tem regime válido: o mais conservador para o custo de contratação.
export const REGIME_PADRAO: RegimeId = 'presumido';

export type ParametroEncargos = {
  regime: RegimeId;
  vigenciaInicio: string; // AAAA-MM-DD
  // Percentuais sobre o salário (o FAP é um multiplicador do RAT, não um percentual).
  inssPatronalPct: number;
  ratPct: number;
  fap: number;
  terceirosPct: number;
  fgtsPct: number;
  decimoTerceiroPct: number;
  feriasPct: number;
  // Provisão de rescisão (multa do FGTS + aviso prévio): só entra quando a loja liga.
  rescisaoPct: number;
};
export type TabelaEncargos = Record<RegimeId, ParametroEncargos>;

// No Simples (comércio, Anexo I) a contribuição patronal já está no DAS: só o FGTS é encargo direto.
const SIMPLES: ParametroEncargos = {
  regime: 'simples',
  vigenciaInicio: '2000-01-01',
  inssPatronalPct: 0,
  ratPct: 0,
  fap: 1,
  terceirosPct: 0,
  fgtsPct: 8,
  decimoTerceiroPct: 8.33,
  feriasPct: 11.11,
  rescisaoPct: 4,
};
const PRESUMIDO: ParametroEncargos = {
  regime: 'presumido',
  vigenciaInicio: '2000-01-01',
  inssPatronalPct: 20,
  ratPct: 2,
  fap: 1,
  terceirosPct: 5.8,
  fgtsPct: 8,
  decimoTerceiroPct: 8.33,
  feriasPct: 11.11,
  rescisaoPct: 5,
};
export const ENCARGOS_PADRAO: TabelaEncargos = {
  simples: SIMPLES,
  presumido: PRESUMIDO,
  // Lucro Real tem os mesmos encargos de folha do Presumido.
  real: { ...PRESUMIDO, regime: 'real' },
};

export const FAIXA_RAT = { min: 1, max: 3 } as const;
export const FAIXA_FAP = { min: 0.5, max: 2 } as const;

// Ajustes de uma loja (guardados nos custos dela): só o que a loja mudou; o resto vem do regime.
export type AjustesEncargos = { ratPct?: number; fap?: number; rescisaoLigada?: boolean };

export type ComponenteEncargo = { chave: string; nome: string; pct: number };
export type ResultadoEncargos = {
  regime: RegimeId;
  // A loja não tinha regime válido: o cálculo usou o padrão.
  regimeAusente: boolean;
  totalPct: number;
  componentes: ComponenteEncargo[];
  // RAT e FAP em uso (já com o ajuste da loja), para a tela mostrar e restaurar o padrão.
  ratPct: number;
  fap: number;
  rescisaoLigada: boolean;
};

const arred2 = (n: number) => Math.round(n * 100) / 100;
const arred4 = (n: number) => Math.round(n * 10000) / 10000;

export const regimeValido = (r: unknown): r is RegimeId =>
  typeof r === 'string' && (REGIMES_ENCARGOS as string[]).includes(r);

// Versão vigente do regime: a mais recente com início até hoje; sem nenhuma, o padrão.
export const versaoVigenteEncargos = (
  versoes: ParametroEncargos[],
  regime: RegimeId,
  hoje: string,
): ParametroEncargos => {
  const doRegime = versoes
    .filter((v) => v.regime === regime)
    .sort((a, b) => a.vigenciaInicio.localeCompare(b.vigenciaInicio));
  const iniciadas = doRegime.filter((v) => v.vigenciaInicio <= hoje);
  return iniciadas.length ? iniciadas[iniciadas.length - 1]! : ENCARGOS_PADRAO[regime];
};
export const tabelaEncargosVigente = (versoes: ParametroEncargos[], hoje: string): TabelaEncargos =>
  Object.fromEntries(
    REGIMES_ENCARGOS.map((r) => [r, versaoVigenteEncargos(versoes, r, hoje)]),
  ) as TabelaEncargos;

// Erros em português; vazio = valores possíveis.
export const validarEncargos = (
  p: Partial<Omit<ParametroEncargos, 'regime'>> & { regime?: string },
): string[] => {
  const erros: string[] = [];
  if (!regimeValido(p.regime)) erros.push('Regime desconhecido.');
  const pct = (nome: string, v: number | undefined, max = 100) => {
    if (v === undefined || !Number.isFinite(v) || v < 0 || v > max)
      erros.push(`${nome}: informe um percentual de 0 a ${max}.`);
  };
  pct('INSS patronal', p.inssPatronalPct);
  pct('Terceiros', p.terceirosPct);
  pct('FGTS', p.fgtsPct);
  pct('13º salário', p.decimoTerceiroPct);
  pct('Férias + 1/3', p.feriasPct);
  pct('Rescisão', p.rescisaoPct);
  erros.push(...validarAjustes({ ratPct: p.ratPct, fap: p.fap }, p.regime === 'simples'));
  if (
    !p.vigenciaInicio ||
    !/^\d{4}-\d{2}-\d{2}$/.test(p.vigenciaInicio) ||
    Number.isNaN(Date.parse(p.vigenciaInicio))
  )
    erros.push('Informe a data de início da vigência.');
  return erros;
};

// RAT de 1% a 3% e FAP de 0,5 a 2,0. No Simples o RAT padrão é zero (já está no DAS), então 0 também vale lá.
export const validarAjustes = (a: AjustesEncargos, simples = false): string[] => {
  const erros: string[] = [];
  if (a.ratPct !== undefined) {
    const piso = simples ? 0 : FAIXA_RAT.min;
    if (!Number.isFinite(a.ratPct) || a.ratPct < piso || a.ratPct > FAIXA_RAT.max)
      erros.push(`RAT: use um percentual de ${piso}% a ${FAIXA_RAT.max}%.`);
  }
  if (
    a.fap !== undefined &&
    (!Number.isFinite(a.fap) || a.fap < FAIXA_FAP.min || a.fap > FAIXA_FAP.max)
  )
    erros.push(`FAP: use um multiplicador de ${FAIXA_FAP.min} a ${FAIXA_FAP.max}.`);
  return erros;
};

// total = diretos + provisões + (provisões × diretos) + rescisão (se ligada)
//   diretos   = INSS + RAT × FAP + terceiros + FGTS
//   provisões = 13º + férias + 1/3
export const calcularEncargos = (
  regimeDaLoja: unknown,
  tabela: TabelaEncargos = ENCARGOS_PADRAO,
  ajustes: AjustesEncargos = {},
): ResultadoEncargos => {
  const regimeAusente = !regimeValido(regimeDaLoja);
  const regime: RegimeId = regimeValido(regimeDaLoja) ? regimeDaLoja : REGIME_PADRAO;
  const p = tabela[regime];
  const ratPct = ajustes.ratPct ?? p.ratPct;
  const fap = ajustes.fap ?? p.fap;
  const rescisaoLigada = ajustes.rescisaoLigada === true;

  const ratEfetivo = ratPct * fap;
  const diretos = p.inssPatronalPct + ratEfetivo + p.terceirosPct + p.fgtsPct;
  const provisoes = p.decimoTerceiroPct + p.feriasPct;
  const sobreProvisoes = (provisoes * diretos) / 100;
  const rescisao = rescisaoLigada ? p.rescisaoPct : 0;
  const total = diretos + provisoes + sobreProvisoes + rescisao;

  const componentes: ComponenteEncargo[] = [
    { chave: 'inss', nome: 'INSS patronal', pct: arred4(p.inssPatronalPct) },
    { chave: 'rat', nome: `RAT × FAP (${ratPct}% × ${fap})`, pct: arred4(ratEfetivo) },
    {
      chave: 'terceiros',
      nome: 'Terceiros (Sistema S, salário-educação, INCRA)',
      pct: arred4(p.terceirosPct),
    },
    { chave: 'fgts', nome: 'FGTS', pct: arred4(p.fgtsPct) },
    { chave: 'decimo', nome: '13º salário (provisão)', pct: arred4(p.decimoTerceiroPct) },
    { chave: 'ferias', nome: 'Férias + 1/3 (provisão)', pct: arred4(p.feriasPct) },
    { chave: 'sobre_provisoes', nome: 'Encargos sobre as provisões', pct: arred4(sobreProvisoes) },
    ...(rescisaoLigada
      ? [{ chave: 'rescisao', nome: 'Provisão de rescisão', pct: arred4(rescisao) }]
      : []),
  ];
  return {
    regime,
    regimeAusente,
    totalPct: arred2(total),
    componentes,
    ratPct,
    fap,
    rescisaoLigada,
  };
};
