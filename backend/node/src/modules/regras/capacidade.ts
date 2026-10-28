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
  contratar: number;
  parcialH: number | null;
  memoria: string;
};

const EPS = 1e-9;
const arred = (n: number) => Math.round(n * 100) / 100;

// Capacidade do quadro (horas e turnos) × necessidade da loja, por função, numa regra.
export const verificarRegra = (
  regra: Regra,
  dias: DiaAberto[],
  minimos: Minimos,
  pessoas: Pessoa[],
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
    const contratar = faltaH > EPS ? Math.ceil(faltaH / porPessoa - EPS) : 0;
    const parcialH =
      contratar === 1
        ? ([16, 24, 32, porPessoa].find((q) => q >= faltaH - EPS && q <= porPessoa) ?? null)
        : null;

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
      parcialH,
      memoria:
        (req.uniforme
          ? `Necessidade: ${minimo} pessoa(s) × ${arred(dias.reduce((s, d) => s + (d.fecha - d.abre), 0))}h abertas na semana = ${arred(necessidadeH)}h. `
          : `Necessidade: soma das pessoas exigidas em cada hora, por turno (até ${minimo} ao mesmo tempo) = ${arred(necessidadeH)}h na semana. `) +
        `Capacidade: cada pessoa até ${arred(porPessoa)}h em até ${regra.dias} dias (turno de ${arred(TL)}h) = ${arred(capacidadeH)}h e ${capacidadeT} turnos.`,
    };
  });
};

export const passa = (linhas: LinhaFuncao[]) => linhas.every((l) => !l.falta);
