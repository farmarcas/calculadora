import type { Faturamento } from './faturamento.js';
import { faixasDaSemana, type HorariosSemana } from './horarios.js';

// Situação do cadastro de uma loja: "Completo" quando a Escala já tem o que precisa para simular; senão "Revisar", com o
// primeiro motivo em texto. É a ÚNICA regra disso (suposição provisória do pedido, marcada "a confirmar"): mudar aqui muda
// a lista, o filtro e o detalhe. O motivo nunca traz valores em reais, só o que falta.
export type SituacaoCadastro = { status: 'completo' | 'revisar'; motivo: string | null };

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

export const situacaoDoCadastro = (loja: LojaParaSituacao, farmaceuticos: number): SituacaoCadastro => {
  const revisar = (motivo: string): SituacaoCadastro => ({ status: 'revisar', motivo });

  const faltam = [
    !loja.nome?.trim() && 'nome',
    !loja.cidade?.trim() && 'cidade',
    !loja.uf?.trim() && 'UF',
    !loja.regimeTributario && 'regime tributário',
  ].filter((x): x is string => !!x);
  if (faltam.length) return revisar(`Faltam dados da loja: ${lista(faltam)}`);

  const abertos = faixasDaSemana(loja.horarios);
  if (abertos.length === 0) return revisar('Falta definir o funcionamento da loja');

  if (farmaceuticos < 1) return revisar('Falta cadastrar um farmacêutico na equipe');

  const dias = loja.faturamento?.dias ?? [];
  const semFat = abertos.filter((d) => dias[d.dia] == null).map((d) => DIAS_DE[d.dia]!);
  if (semFat.length === abertos.length && !dias.some((v) => v != null))
    return revisar('Falta o faturamento por dia');
  if (semFat.length) return revisar(`Falta faturamento de ${lista(semFat)}`);

  const mensal = loja.faturamento?.mensal;
  const soma = abertos.reduce((s, d) => s + (dias[d.dia] ?? 0), 0);
  const calculado = (soma * 52) / 12;
  if (mensal && calculado > 0 && Math.abs(mensal - calculado) / calculado > TOLERANCIA_MENSAL)
    return revisar('O faturamento mensal informado difere mais de 10% da soma dos dias');

  return { status: 'completo', motivo: null };
};
