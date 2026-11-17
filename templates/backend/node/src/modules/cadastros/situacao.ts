import type { Faturamento } from './faturamento.js';
import { faixasDaSemana, type HorariosSemana } from './horarios.js';

// Pendências do cadastro de uma loja: tudo o que falta para a Escala simular e para o diagnóstico (inclui o salário médio
// das funções que contam; a margem bruta, que não tem mais tela, nunca é cobrada). É a ÚNICA regra disso: a situação "Completo" é "nenhuma pendência" e "Revisar" é a
// primeira delas em texto; a lista, o filtro, o detalhe e o painel "O que falta preencher" saem daqui (suposição provisória do
// pedido, marcada "a confirmar"). Nada aqui traz valores em reais, só o que falta.
export type AbaPendencia = 'dados' | 'equipe' | 'regras';

export type Pendencia = {
  // dados, funcionamento, faturamentoDia, faturamentoMes, farmaceutico ou salario:<Função>.
  id: string;
  aba: AbaPendencia;
  // O nome do item no painel ("Dados da loja", "Faturamento por dia").
  titulo: string;
  // O texto da situação "Revisar" (o de sempre, com o nome do dia ou da função).
  resumo: string;
  // A linha curta do painel.
  texto: string;
  // Por que importa; aparece no campo.
  porque: string;
  // `data-campo` de cada campo a preencher (o primeiro é o destino do "Preencher"); vazio quando o destino é a aba.
  campos: string[];
  // Depende de faturamento ou salário: só o dono do grupo preenche.
  soDono: boolean;
  // Não é campo vazio, é um valor para conferir (faturamento do mês).
  alerta?: boolean;
};

export type SituacaoCadastro = {
  status: 'completo' | 'revisar';
  motivo: string | null;
  quantidade: number;
};

export type LojaParaSituacao = {
  nome?: string | null;
  cidade?: string | null;
  uf?: string | null;
  regimeTributario?: string | null;
  horarios: HorariosSemana | null;
  faturamento?: Faturamento | null;
};

const DIAS_DE = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
// Quanto o mensal informado pode diferir da soma dos dias (× 52 ÷ 12) antes de a loja ir para revisão.
export const TOLERANCIA_MENSAL = 0.1;

const lista = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`;

// O que o cadastro da equipe e dos custos informa: funções que têm gente na equipe e funções com salário médio informado.
export type CadastroDaLoja = { funcoesNaEquipe: string[]; salariosInformados: string[] };

const CAMPOS_DA_LOJA: [string, string, string][] = [
  ['nome', 'nome', 'nome'],
  ['cidade', 'cidade', 'cidade'],
  ['uf', 'UF', 'uf'],
  ['regimeTributario', 'regime tributário', 'regime'],
];

export const pendenciasDoCadastro = (
  loja: LojaParaSituacao,
  farmaceuticos: number,
  cadastro: CadastroDaLoja = { funcoesNaEquipe: [], salariosInformados: [] },
): Pendencia[] => {
  const p: Pendencia[] = [];

  const faltam = CAMPOS_DA_LOJA.filter(([k]) => {
    const v = loja[k as keyof LojaParaSituacao];
    return typeof v === 'string' ? !v.trim() : !v;
  });
  if (faltam.length) {
    const nomes = faltam.map(([, nome]) => nome);
    p.push({
      id: 'dados',
      aba: 'dados',
      titulo: 'Dados da loja',
      resumo: `Faltam dados da loja: ${lista(nomes)}`,
      texto: `Falta: ${lista(nomes)}.`,
      porque: 'Esses dados identificam a loja e definem os encargos.',
      campos: faltam.map(([, , campo]) => campo),
      soDono: false,
    });
  }

  const abertos = faixasDaSemana(loja.horarios);
  if (abertos.length === 0)
    p.push({
      id: 'funcionamento',
      aba: 'dados',
      titulo: 'Horário de funcionamento',
      resumo: 'Falta definir o funcionamento da loja',
      texto: 'Informe quando a loja abre e fecha em pelo menos um dia.',
      porque: 'Sem o horário de funcionamento não dá para calcular a escala.',
      campos: ['dia-0'],
      soDono: false,
    });

  if (farmaceuticos < 1)
    p.push({
      id: 'farmaceutico',
      aba: 'equipe',
      titulo: 'Farmacêutico na equipe',
      resumo: 'Falta cadastrar um farmacêutico na equipe',
      texto: 'Cadastre pelo menos um farmacêutico.',
      porque: 'A lei exige farmacêutico em todo o horário de funcionamento.',
      campos: [],
      soDono: false,
    });

  const dias = loja.faturamento?.dias ?? [];
  const semFat = abertos.filter((d) => dias[d.dia] == null);
  if (semFat.length) {
    const nenhum = semFat.length === abertos.length && !dias.some((v) => v != null);
    const nomes = semFat.map((d) => DIAS_DE[d.dia]!);
    p.push({
      id: 'faturamentoDia',
      aba: 'dados',
      titulo: 'Faturamento por dia',
      resumo: nenhum ? 'Falta o faturamento por dia' : `Falta faturamento de ${lista(nomes)}`,
      texto: nenhum
        ? 'Informe o faturamento de cada dia aberto.'
        : `${semFat.length === 1 ? 'Falta 1 dia aberto' : `Faltam ${semFat.length} dias abertos`}: ${lista(nomes)}.`,
      porque: 'Sem o faturamento por dia não dá para estimar o impacto dos cenários.',
      campos: semFat.map((d) => `fat-${d.dia}`),
      soDono: true,
    });
  }

  const mensal = loja.faturamento?.mensal;
  const soma = abertos.reduce((s, d) => s + (dias[d.dia] ?? 0), 0);
  const calculado = (soma * 52) / 12;
  if (
    !semFat.length &&
    mensal &&
    calculado > 0 &&
    Math.abs(mensal - calculado) / calculado > TOLERANCIA_MENSAL
  )
    p.push({
      id: 'faturamentoMes',
      aba: 'dados',
      titulo: 'Faturamento do mês',
      resumo: 'O faturamento mensal informado difere mais de 10% da soma dos dias',
      texto: 'O valor do mês é diferente da soma dos dias. Confira.',
      porque:
        'Confira o faturamento do mês: o valor informado é diferente da soma dos dias em mais de 10%.',
      campos: ['mensal'],
      soDono: true,
      alerta: true,
    });

  // A margem bruta não tem mais tela nem entra em conta: nunca é pendência.
  // Sem os salários o diagnóstico não calcula a folha nem a economia dos cenários.
  const precisam = [
    'Farmacêutico',
    ...cadastro.funcoesNaEquipe.filter((f) => f !== 'Farmacêutico'),
  ];
  const semSalario = precisam.filter((f) => !cadastro.salariosInformados.includes(f));
  for (const f of semSalario)
    p.push({
      id: `salario:${f}`,
      aba: 'regras',
      titulo: `Salário médio · ${f}`,
      resumo: `Falta o salário médio de ${f}`,
      texto: 'Informe o salário médio sem premiação.',
      porque: 'Sem o salário, não dá para calcular o custo de contratar.',
      campos: [`salario-${f}`],
      soDono: true,
    });

  return p;
};

// O texto de "Revisar": o da primeira pendência; as de salário juntas, como sempre ("Falta o salário médio de A e B").
const motivoDe = (pendencias: Pendencia[]): string | null => {
  const primeira = pendencias[0];
  if (!primeira) return null;
  if (!primeira.id.startsWith('salario:')) return primeira.resumo;
  const funcoes = pendencias.filter((x) => x.id.startsWith('salario:')).map((x) => x.id.slice(8));
  return `Falta o salário médio de ${lista(funcoes)}`;
};

export const situacaoDoCadastro = (
  loja: LojaParaSituacao,
  farmaceuticos: number,
  cadastro: CadastroDaLoja = { funcoesNaEquipe: [], salariosInformados: [] },
): SituacaoCadastro => {
  const pendencias = pendenciasDoCadastro(loja, farmaceuticos, cadastro);
  return {
    status: pendencias.length ? 'revisar' : 'completo',
    motivo: motivoDe(pendencias),
    quantidade: pendencias.length,
  };
};
