import { duracaoTurno, tetoEfetivo, type Regra } from './perfis.js';
import { camadasDoDia, requisitos, type Minimos } from './requisitos.js';

export type DiaAberto = { dia: number; abre: number; fecha: number }; // dia 0 = segunda
export type Pessoa = { funcao: string; cargaH: number };

export type LinhaFuncao = {
  funcao: string;
  pessoas: number;
  minimo: number;
  necessidadeH: number;
  necessidadeT: number;
  capacidadeH: number;
  capacidadeT: number;
  saldoH: number;
  saldoT: number;
  okH: boolean;
  okT: boolean;
  falta: boolean;
  faltaH: number; // horas que faltam (maior entre o saldo de horas e o de turnos)
  cargaCheiaH: number; // jornada cheia de uma pessoa nesta regra
  // Contratação pela regra do documento: inteiras = ⌊turnos faltantes ÷ dias da fase⌋; resto de até
  // `limiteParcial` turnos vira 1 contrato parcial, acima disso +1 inteira; depois confere as horas.
  contratar: number; // total de pessoas (inteiras + parcial)
  contratarInteiras: number;
  parcialTurnos: number; // 0 = sem contrato parcial
  parcialH: number | null; // horas semanais do contrato parcial
  ajustado: boolean; // a conferência final por horas acrescentou contratação
  memoria: string;
};

export const LIMITE_PARCIAL_PADRAO = 3;
export type OpcoesContratacao = { limiteParcial?: number };

export const contratacaoPorTurnos = (a: {
  turnosFaltantes: number;
  horasFaltantes: number;
  diasDaFase: number;
  horasPorPessoa: number;
  duracaoTurno: number;
  limiteParcial: number;
}) => {
  const limite = Math.min(LIMITE_PARCIAL_PADRAO, Math.max(0, Math.floor(a.limiteParcial)));
  let inteiras = Math.floor(a.turnosFaltantes / a.diasDaFase);
  const resto = a.turnosFaltantes % a.diasDaFase;
  let parcialTurnos = 0;
  if (resto > 0) {
    if (resto <= limite) parcialTurnos = resto;
    else inteiras += 1;
  }
  const horasDe = (i: number, p: number) => i * a.horasPorPessoa + p * a.duracaoTurno;
  // Conferência final: as horas também precisam fechar; senão, mais uma inteira por vez.
  let ajustado = false;
  while (horasDe(inteiras, parcialTurnos) < a.horasFaltantes - EPS) {
    inteiras += 1;
    ajustado = true;
  }
  // Se as inteiras já cobrem turnos e horas, o parcial deixou de ser necessário.
  if (
    ajustado &&
    parcialTurnos > 0 &&
    inteiras * a.diasDaFase >= a.turnosFaltantes &&
    horasDe(inteiras, 0) >= a.horasFaltantes - EPS
  )
    parcialTurnos = 0;
  return { inteiras, parcialTurnos, resto, ajustado };
};

const EPS = 1e-9;
const arred = (n: number) => Math.round(n * 100) / 100;

// Capacidade do quadro (horas e turnos) × necessidade da loja, por função, numa regra.
export const verificarRegra = (
  regra: Regra,
  dias: DiaAberto[],
  minimos: Minimos,
  pessoas: Pessoa[],
  opcoes: OpcoesContratacao = {},
): LinhaFuncao[] => {
  const req = requisitos(minimos);
  const funcoes = [...new Set([...req.funcoes, ...pessoas.map((p) => p.funcao)])];
  const TL = duracaoTurno(regra);
  const porPessoa = tetoEfetivo(regra);

  return funcoes.map((funcao) => {
    const minimo = req.pico(funcao);
    const quadro = pessoas.filter((p) => p.funcao === funcao);
    // Exigência igual em todas as horas: a conta de sempre. Exigência por turno: soma por camada
    // (camada k = k-ésima pessoa), que dá o mesmo número quando todas as horas exigem igual.
    let necessidadeH: number;
    let necessidadeT: number;
    if (req.uniforme) {
      necessidadeH = minimo * dias.reduce((s, d) => s + (d.fecha - d.abre), 0);
      necessidadeT = minimo * dias.reduce((s, d) => s + Math.ceil((d.fecha - d.abre) / 8 - EPS), 0);
    } else {
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
    const saldoT = capacidadeT - necessidadeT;
    const faltaH = Math.max(0, -saldoH, -saldoT * TL);
    const turnosFaltantes = Math.max(0, -saldoT);
    const c = contratacaoPorTurnos({
      turnosFaltantes,
      horasFaltantes: Math.max(0, -saldoH),
      diasDaFase: regra.dias,
      horasPorPessoa: porPessoa,
      duracaoTurno: TL,
      limiteParcial: opcoes.limiteParcial ?? LIMITE_PARCIAL_PADRAO,
    });
    const contratar = c.inteiras + (c.parcialTurnos > 0 ? 1 : 0);
    const parcialH = c.parcialTurnos > 0 ? arred(c.parcialTurnos * TL) : null;

    return {
      funcao,
      pessoas: quadro.length,
      minimo,
      necessidadeH: arred(necessidadeH),
      necessidadeT,
      capacidadeH: arred(capacidadeH),
      capacidadeT,
      saldoH,
      saldoT,
      okH: saldoH >= 0,
      okT: saldoT >= 0,
      falta: saldoH < 0 || saldoT < 0,
      faltaH: arred(faltaH),
      cargaCheiaH: arred(porPessoa),
      contratar,
      contratarInteiras: c.inteiras,
      parcialTurnos: c.parcialTurnos,
      parcialH,
      ajustado: c.ajustado,
      memoria:
        (req.uniforme
          ? `Necessidade: ${minimo} pessoa(s) × ${arred(dias.reduce((s, d) => s + (d.fecha - d.abre), 0))}h abertas na semana = ${arred(necessidadeH)}h. `
          : `Necessidade por turno${req.porTurno(funcao) ? ` (${req.porTurno(funcao)} pessoa(s))` : ''}: soma das pessoas exigidas em cada hora, até ${minimo} ao mesmo tempo = ${arred(necessidadeH)}h na semana. `) +
        `Capacidade: cada pessoa até ${arred(porPessoa)}h em até ${regra.dias} dias (turno de ${arred(TL)}h) = ${arred(capacidadeH)}h e ${capacidadeT} turnos.` +
        (contratar > 0
          ? ` Contratar: ${turnosFaltantes} turno(s) faltantes ÷ ${regra.dias} dias = ${Math.floor(turnosFaltantes / regra.dias)} inteira(s), resto ${c.resto} turno(s)${c.parcialTurnos > 0 ? ` → 1 parcial de ${c.parcialTurnos} turno(s) (${arred(c.parcialTurnos * TL)}h)` : c.resto > 0 ? ' → +1 inteira (acima do limite do parcial)' : ''}${c.ajustado ? '; as horas pediram mais contratação' : ''}.`
          : ''),
    };
  });
};

export const passa = (linhas: LinhaFuncao[]) => linhas.every((l) => !l.falta);
