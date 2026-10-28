// Parâmetros legais por fase (EC 141/2026): jornada, horas por dia, dias de trabalho, divisor mensal.
// Vêm de uma tabela com versões e data de início; os valores abaixo são o padrão (os de hoje).
export type FaseId = 'atual' | 'r42' | 'r40';
export const FASES: FaseId[] = ['atual', 'r42', 'r40'];

export type ParametroFase = {
  fase: FaseId;
  jornadaSemanalH: number;
  horasDiaMax: number;
  // Só na fase de 42h: horas por dia quando há convenção coletiva (8h24 = 8,4).
  horasDiaMaxConvencao: number | null;
  diasTrabalho: number;
  divisor: number;
  vigenciaInicio: string; // AAAA-MM-DD
};
export type TabelaParametros = Record<FaseId, ParametroFase>;

export const PARAMETROS_PADRAO: TabelaParametros = {
  atual: {
    fase: 'atual',
    jornadaSemanalH: 44,
    horasDiaMax: 8,
    horasDiaMaxConvencao: null,
    diasTrabalho: 6,
    divisor: 220,
    vigenciaInicio: '2000-01-01',
  },
  r42: {
    fase: 'r42',
    jornadaSemanalH: 42,
    horasDiaMax: 8,
    horasDiaMaxConvencao: 8.4,
    diasTrabalho: 5,
    divisor: 210,
    vigenciaInicio: '2026-12-16',
  },
  r40: {
    fase: 'r40',
    jornadaSemanalH: 40,
    horasDiaMax: 8,
    horasDiaMaxConvencao: null,
    diasTrabalho: 5,
    divisor: 200,
    vigenciaInicio: '2027-12-01',
  },
};

// A versão que vale hoje: a mais recente com início até hoje; se todas começam no futuro
// (a lei que ainda vai entrar), vale a mais antiga delas.
export const versaoVigente = (versoes: ParametroFase[], hoje: string): ParametroFase | null => {
  if (versoes.length === 0) return null;
  const ordenadas = [...versoes].sort((a, b) => a.vigenciaInicio.localeCompare(b.vigenciaInicio));
  const jaIniciadas = ordenadas.filter((v) => v.vigenciaInicio <= hoje);
  return jaIniciadas.length ? jaIniciadas[jaIniciadas.length - 1]! : ordenadas[0]!;
};

// A tabela de uso: a versão vigente de cada fase; fase sem nenhuma versão usa o padrão.
export const tabelaVigente = (versoes: ParametroFase[], hoje: string): TabelaParametros =>
  Object.fromEntries(
    FASES.map((f) => [
      f,
      versaoVigente(
        versoes.filter((v) => v.fase === f),
        hoje,
      ) ?? PARAMETROS_PADRAO[f],
    ]),
  ) as TabelaParametros;

export const hojeISO = () => new Date().toISOString().slice(0, 10);

// Erros em português; vazio = valores possíveis.
export const validarParametro = (p: Omit<ParametroFase, 'fase'> & { fase: string }): string[] => {
  const erros: string[] = [];
  if (!FASES.includes(p.fase as FaseId)) erros.push('Fase desconhecida.');
  if (!(p.jornadaSemanalH > 0 && p.jornadaSemanalH <= 168))
    erros.push('A jornada semanal deve ser maior que zero e até 168 horas.');
  if (!(p.horasDiaMax > 0 && p.horasDiaMax <= 24))
    erros.push('As horas por dia devem ficar entre 0 e 24.');
  if (
    p.horasDiaMaxConvencao !== null &&
    !(p.horasDiaMaxConvencao > 0 && p.horasDiaMaxConvencao <= 24)
  )
    erros.push('As horas por dia com convenção devem ficar entre 0 e 24.');
  if (!(Number.isInteger(p.diasTrabalho) && p.diasTrabalho >= 1 && p.diasTrabalho <= 7))
    erros.push('Os dias de trabalho por semana devem ser de 1 a 7.');
  if (!(p.divisor > 0)) erros.push('O divisor mensal deve ser maior que zero.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.vigenciaInicio) || Number.isNaN(Date.parse(p.vigenciaInicio)))
    erros.push('Informe a data de início da vigência.');
  return erros;
};

export const dataBR = (iso: string) => iso.split('-').reverse().join('/');
