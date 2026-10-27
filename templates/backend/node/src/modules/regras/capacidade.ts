import { duracaoTurno, tetoEfetivo, type Regra } from './perfis.js';

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
  minimos: Record<string, number>,
  pessoas: Pessoa[],
): LinhaFuncao[] => {
  const funcoes = [
    ...new Set([
      ...Object.keys(minimos).filter((f) => (minimos[f] ?? 0) > 0),
      ...pessoas.map((p) => p.funcao),
    ]),
  ];
  const TL = duracaoTurno(regra);
  const porPessoa = tetoEfetivo(regra);

  return funcoes.map((funcao) => {
    const minimo = minimos[funcao] ?? 0;
    const quadro = pessoas.filter((p) => p.funcao === funcao);
    const necessidadeH = minimo * dias.reduce((s, d) => s + (d.fecha - d.abre), 0);
    const necessidadeT =
      minimo * dias.reduce((s, d) => s + Math.ceil((d.fecha - d.abre) / 8 - EPS), 0);

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
      contratar,
      parcialH,
      memoria:
        `Necessidade: ${minimo} pessoa(s) × ${arred(dias.reduce((s, d) => s + (d.fecha - d.abre), 0))}h abertas na semana = ${arred(necessidadeH)}h. ` +
        `Capacidade: cada pessoa até ${arred(porPessoa)}h em até ${regra.dias} dias (turno de ${arred(TL)}h) = ${arred(capacidadeH)}h e ${capacidadeT} turnos.`,
    };
  });
};

export const passa = (linhas: LinhaFuncao[]) => linhas.every((l) => !l.falta);
