import { PARAMETROS_PADRAO } from './parametros.js';
import { duracaoTurno, regraPara, tetoEfetivo, type Regra } from './perfis.js';
import { camadasDoDia, requisitos, type Minimos } from './requisitos.js';
import { sugerirContratacao, type Sugestao } from './contratacao-horas.js';
import { FARMACEUTICO, metaNivelDeHoje } from './gap-horas.js';

export type DiaAberto = { dia: number; abre: number; fecha: number }; // dia 0 = segunda
export type Pessoa = { funcao: string; cargaH: number };

export type OrigemMeta = 'lei' | 'dono' | 'nivel_de_hoje' | 'nenhuma';

export type LinhaFuncao = {
  funcao: string;
  pessoas: number;
  // Pessoas por hora que o dono pediu (meta) ou a lei exige (farmacêutico); 0 nos demais cargos sem meta.
  minimo: number;
  // Só o farmacêutico é obrigatório (presente em todo o horário de funcionamento).
  obrigatorio: boolean;
  origemMeta: OrigemMeta;
  // Horas semanais que o cargo precisa (farmacêutico), deseja (meta do dono) ou mantém (nível de hoje).
  metaH: number;
  necessidadeH: number;
  necessidadeT: number;
  capacidadeH: number;
  capacidadeT: number;
  saldoH: number;
  saldoT: number;
  okH: boolean;
  okT: boolean;
  // Uma exigência explícita (lei ou meta do dono) que a capacidade não cobre. O nível de hoje nunca "falta".
  falta: boolean;
  // Horas semanais que a capacidade deixa descobertas da meta.
  gapH: number;
  faltaH: number; // igual ao gap (nome antigo, para quem já lê)
  cargaCheiaH: number; // jornada cheia de uma pessoa nesta regra
  // Contratação por horas (parcial até 30 h, integral ou integral + parcial); nulo sem gap.
  sugestao: Sugestao | null;
  // Variante de 26 h com horas extras, só quando reduz a ociosidade.
  alternativa: Sugestao | null;
  // Resumo da sugestão no formato antigo: total de pessoas, inteiras e horas do parcial.
  contratar: number;
  contratarInteiras: number;
  parcialTurnos: number; // só para compatibilidade: horas do parcial ÷ duração do turno, arredondado para cima
  parcialH: number | null; // horas semanais do contrato parcial
  ajustado: boolean; // mantido por compatibilidade; sempre falso
  memoria: string;
};

export type OpcoesVerificacao = {
  // Ignorado desde a spec 013: o limite do parcial agora é legal (30 h), não em turnos.
  limiteParcial?: number;
  // A regra atual define o "nível de hoje" dos cargos sem mínimo; sem ela vale a de hoje do padrão.
  regraAtual?: Regra;
  // Horas abertas da loja hoje: com horário menor (cenário), a meta dos demais cargos acompanha as horas abertas.
  horasAbertasHoje?: number;
  // Para dar custo à sugestão (só quem pode ver valores em reais).
  custos?: { salarioMedio: Partial<Record<string, number>>; encargosPct: number } | null;
  divisor?: number;
};
export type OpcoesContratacao = OpcoesVerificacao;

export const AVISO_CRF =
  'O horário do farmacêutico parcial precisa ser registrado no CRF e não pode coincidir com o horário em que ele atua em outra farmácia.';

const EPS = 1e-9;
const arred = (n: number) => Math.round(n * 100) / 100;

// Capacidade do quadro (horas e turnos) × necessidade da loja, por função, numa regra. O farmacêutico é o único
// cargo obrigatório; os demais não têm mínimo (meta = nível de hoje, ou a meta do dono, se houver).
export const verificarRegra = (
  regra: Regra,
  dias: DiaAberto[],
  minimos: Minimos,
  pessoas: Pessoa[],
  opcoes: OpcoesVerificacao = {},
): LinhaFuncao[] => {
  const req = requisitos(minimos);
  const funcoes = [...new Set([FARMACEUTICO, ...req.funcoes, ...pessoas.map((p) => p.funcao)])];
  const TL = duracaoTurno(regra);
  const porPessoa = tetoEfetivo(regra);
  const abertas = dias.reduce((s, d) => s + (d.fecha - d.abre), 0);
  const hoje = opcoes.horasAbertasHoje ?? abertas;
  const escala = hoje > 0 ? abertas / hoje : 1;
  const tetoHoje = tetoEfetivo(opcoes.regraAtual ?? regraPara('atual', false));
  const divisor = opcoes.divisor ?? PARAMETROS_PADRAO[regra.id].divisor;

  return funcoes.map((funcao) => {
    const obrigatorio = funcao === FARMACEUTICO;
    // Farmacêutico: ao menos 1 em todas as horas, mesmo que o dono não tenha escrito nada.
    const pico = req.pico(funcao);
    const minimo = obrigatorio ? Math.max(1, pico) : pico;
    const quadro = pessoas.filter((p) => p.funcao === funcao);
    const comExigencia = obrigatorio || pico > 0;
    const origemMeta: OrigemMeta = obrigatorio
      ? 'lei'
      : pico > 0
        ? 'dono'
        : quadro.length > 0
          ? 'nivel_de_hoje'
          : 'nenhuma';

    let necessidadeH: number;
    let necessidadeT: number;
    if (!comExigencia) {
      // Sem mínimo: manter o nível de hoje (as horas que o cargo cumpre hoje); turnos não se aplicam.
      necessidadeH = metaNivelDeHoje(quadro, tetoHoje, escala);
      necessidadeT = 0;
    } else if (req.uniforme || pico === 0) {
      // Exigência igual em todas as horas: a conta de sempre.
      necessidadeH = minimo * abertas;
      necessidadeT = minimo * dias.reduce((s, d) => s + Math.ceil((d.fecha - d.abre) / 8 - EPS), 0);
    } else {
      // Exigência por turno: soma por camada (camada k = k-ésima pessoa).
      const camadas = dias.map((d) => camadasDoDia(req, funcao, d));
      necessidadeH = camadas.reduce((s, c) => s + c.reduce((a, h) => a + h, 0), 0);
      necessidadeT = camadas.reduce(
        (s, c) => s + c.reduce((a, h) => a + Math.ceil(h / 8 - EPS), 0),
        0,
      );
    }

    const horasDe = quadro.map((p) => Math.min(p.cargaH, regra.teto, regra.dias * regra.maxDia));
    const capacidadeH = horasDe.reduce((s, h) => s + h, 0);
    const capacidadeT = horasDe.reduce(
      (s, h) => s + Math.min(regra.dias, Math.floor(h / TL + EPS)),
      0,
    );

    const saldoH = arred(capacidadeH - necessidadeH);
    const saldoT = comExigencia ? capacidadeT - necessidadeT : capacidadeT;
    // Gap em horas semanais. Se as horas fecham mas algum dia ficaria sem cobertura (turnos), o farmacêutico
    // ainda precisa do que falta em turnos.
    let gapH = Math.max(0, -saldoH);
    if (obrigatorio && gapH <= EPS && saldoT < 0) gapH = -saldoT * TL;
    gapH = arred(gapH);
    const falta = comExigencia && (saldoH < 0 || (obrigatorio && saldoT < 0));

    const opcoesSug = sugerirContratacao({
      gapH,
      jornadaIntegralH: porPessoa,
      divisor,
      salarioMedio: opcoes.custos?.salarioMedio[funcao] ?? null,
      encargosPct: opcoes.custos?.encargosPct ?? 0,
    });
    const parcial = opcoesSug?.principal ?? null;
    const avisos: string[] = [];
    if (parcial && obrigatorio) {
      if (parcial.parcialH) avisos.push(AVISO_CRF);
      // As horas fecham, mas os dias podem não fechar: cada pessoa trabalha em até `regra.dias` dias.
      const turnosNovos =
        parcial.inteiras * Math.min(regra.dias, Math.floor(porPessoa / TL + EPS)) +
        (parcial.parcialH ? Math.min(regra.dias, Math.ceil(parcial.parcialH / TL - EPS)) : 0);
      const restantes = -saldoT - turnosNovos;
      if (restantes > 0)
        avisos.push(
          `Pelas horas a contratação fecha, mas pela conta de turnos ainda podem faltar ${restantes} turno(s) em alguns dias: a distribuição dos horários confirma.`,
        );
    }
    const sugestao = parcial ? { ...parcial, avisos } : null;
    const parcialH = sugestao?.parcialH ?? null;
    const inteiras = sugestao?.inteiras ?? 0;

    return {
      funcao,
      pessoas: quadro.length,
      minimo,
      obrigatorio,
      origemMeta,
      metaH: arred(necessidadeH),
      necessidadeH: arred(necessidadeH),
      necessidadeT,
      capacidadeH: arred(capacidadeH),
      capacidadeT,
      saldoH,
      saldoT,
      okH: saldoH >= 0,
      okT: saldoT >= 0,
      falta,
      gapH,
      faltaH: gapH,
      cargaCheiaH: arred(porPessoa),
      sugestao,
      alternativa: opcoesSug?.alternativa
        ? { ...opcoesSug.alternativa, avisos: obrigatorio ? [AVISO_CRF] : [] }
        : null,
      contratar: inteiras + (parcialH ? 1 : 0),
      contratarInteiras: inteiras,
      parcialTurnos: parcialH ? Math.ceil(parcialH / TL - EPS) : 0,
      parcialH,
      ajustado: false,
      memoria:
        (obrigatorio
          ? `Farmacêutico: obrigatório em todas as horas abertas (${arred(abertas)}h na semana)${minimo > 1 ? ` com ${minimo} por hora` : ''} = ${arred(necessidadeH)}h. `
          : origemMeta === 'dono'
            ? `Meta do dono${req.uniforme ? `: ${minimo} pessoa(s) por hora` : ` por turno${req.porTurno(funcao) ? ` (${req.porTurno(funcao)} pessoa(s))` : ''}: soma das pessoas pedidas em cada hora, até ${minimo} ao mesmo tempo`} = ${arred(necessidadeH)}h na semana. `
            : origemMeta === 'nivel_de_hoje'
              ? `Sem mínimo: a meta é manter o nível de hoje (${arred(necessidadeH)}h por semana, o que o cargo cumpre hoje). `
              : 'Sem mínimo e sem ninguém no cargo: nada a cobrir. ') +
        `Capacidade: cada pessoa até ${arred(porPessoa)}h em até ${regra.dias} dias = ${arred(capacidadeH)}h.` +
        (gapH > 0
          ? ` Falta cobrir ${gapH}h${sugestao ? `: ${sugestao.tipo === 'parcial' ? `1 parcial de ${sugestao.parcialH}h` : sugestao.tipo === 'integral' ? `${sugestao.inteiras} integral(is)` : `${sugestao.inteiras} integral(is) e 1 parcial de ${sugestao.parcialH}h`}` : ''}.`
          : ''),
    };
  });
};

// A equipe cobre o que a lei exige? Só o farmacêutico bloqueia; metas dos demais cargos não.
export const passa = (linhas: LinhaFuncao[]) => linhas.every((l) => !(l.obrigatorio && l.falta));
