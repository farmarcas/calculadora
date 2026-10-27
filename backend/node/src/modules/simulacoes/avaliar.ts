import type { DiaAberto } from '../regras/capacidade.js';
import { tetoEfetivo, type Regra } from '../regras/perfis.js';

export type PessoaSim = {
  matricula: string;
  nome: string;
  funcao: string | null;
  cargaH: number;
  // Vaga simulada: nunca existe no cadastro. Desligado: pessoa do cadastro fora desta simulação.
  vaga?: boolean;
  desligado?: boolean;
};
export type TurnoSim = {
  matricula: string;
  dia: number; // 0 = segunda
  entrada: number;
  saida: number;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
};

export type Achado = {
  tipo: 'erro' | 'aviso';
  regra: string;
  texto: string;
  matricula?: string;
  dia?: number;
};
export type CelulaCobertura = { hora: number; pessoas: number; ok: boolean };
export type CoberturaDia = { funcao: string; minimo: number; porHora: CelulaCobertura[] }[];

const NOMES_DIA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const INTERJORNADA = 11;
const EPS = 1e-9;
const arred = (n: number) => Math.round(n * 100) / 100;
const hh = (h: number) =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

export const horasLiquidas = (t: TurnoSim) =>
  t.saida -
  t.entrada -
  (t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0);

// Junta horas seguidas em faixas: [12, 13, 17] → "12:00–14:00, 17:00–18:00".
const faixas = (horas: number[]) => {
  const out: string[] = [];
  let i = 0;
  while (i < horas.length) {
    let j = i;
    while (j + 1 < horas.length && horas[j + 1] === horas[j]! + 1) j++;
    out.push(`${hh(horas[i]!)}–${hh(horas[j]! + 1)}`);
    i = j + 1;
  }
  return out.join(', ');
};

const presente = (t: TurnoSim, h: number) =>
  t.entrada <= h + EPS &&
  t.saida >= h + 1 - EPS &&
  !(
    t.iniIntervalo != null &&
    t.fimIntervalo != null &&
    t.iniIntervalo < h + 1 - EPS &&
    t.fimIntervalo > h + EPS
  );

// Quem conta na simulação: tira os desligados simulados e os turnos deles.
export const ativos = <T extends { matricula: string }>(quadro: PessoaSim[], turnos: T[]) => {
  const fora = new Set(quadro.filter((p) => p.desligado).map((p) => p.matricula));
  return {
    quadro: quadro.filter((p) => !p.desligado),
    turnos: turnos.filter((t) => !fora.has(t.matricula)),
  };
};

export const avaliarSimulacao = (a: {
  regra: Regra;
  dias: DiaAberto[];
  minimos: Record<string, number>;
  quadro: PessoaSim[];
  turnos: TurnoSim[];
}) => {
  const { regra, dias, minimos } = a;
  const { quadro, turnos } = ativos(a.quadro, a.turnos);
  const achados: Achado[] = [];
  const erro = (r: string, texto: string, extra: Partial<Achado> = {}) =>
    achados.push({ tipo: 'erro', regra: r, texto, ...extra });
  const aviso = (r: string, texto: string, extra: Partial<Achado> = {}) =>
    achados.push({ tipo: 'aviso', regra: r, texto, ...extra });
  const maxTxt = regra.maxDia === 8 ? '8h' : '8h24';

  const porPessoa = quadro.map((p) => {
    const meus = turnos.filter((t) => t.matricula === p.matricula);
    const horas = arred(meus.reduce((s, t) => s + horasLiquidas(t), 0));
    const limite = Math.min(p.cargaH, tetoEfetivo(regra));

    for (const t of meus) {
      if (!(t.saida > t.entrada))
        erro('turno', `${p.nome}: saída antes da entrada em ${NOMES_DIA[t.dia]}.`, {
          matricula: p.matricula,
          dia: t.dia,
        });
      const liq = horasLiquidas(t);
      if (liq > regra.maxDia + EPS)
        erro(
          'jornada-diaria',
          `${p.nome}: ${arred(liq)}h em ${NOMES_DIA[t.dia]}, acima do máximo de ${maxTxt} por dia.`,
          { matricula: p.matricula, dia: t.dia },
        );
      const bruto = t.saida - t.entrada;
      const intervalo =
        t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0;
      if (bruto > 6 + EPS && intervalo < 1 - EPS)
        erro(
          'intervalo',
          `${p.nome}: turno de ${arred(bruto)}h em ${NOMES_DIA[t.dia]} exige intervalo de pelo menos 1h.`,
          { matricula: p.matricula, dia: t.dia },
        );
      if (
        t.iniIntervalo != null &&
        t.fimIntervalo != null &&
        !(
          t.entrada <= t.iniIntervalo &&
          t.iniIntervalo < t.fimIntervalo &&
          t.fimIntervalo <= t.saida
        )
      )
        erro('intervalo', `${p.nome}: intervalo fora do turno em ${NOMES_DIA[t.dia]}.`, {
          matricula: p.matricula,
          dia: t.dia,
        });
    }

    const diasTrab = new Set(meus.map((t) => t.dia));
    if (diasTrab.size > regra.dias)
      erro(
        'folgas',
        `${p.nome} trabalha ${diasTrab.size} dias: a regra de ${regra.nome} exige ${7 - regra.dias} folga(s) por semana.`,
        { matricula: p.matricula },
      );
    if (horas > limite + EPS)
      erro(
        'jornada-semanal',
        `${p.nome}: ${horas}h na semana, acima de ${arred(limite)}h (${p.cargaH < tetoEfetivo(regra) ? 'carga contratada' : `teto da regra de ${regra.nome}`}).`,
        { matricula: p.matricula },
      );

    for (let d = 0; d < 7; d++) {
      const hoje = meus.find((t) => t.dia === d);
      const amanha = meus.find((t) => t.dia === (d + 1) % 7);
      if (hoje && amanha && 24 - hoje.saida + amanha.entrada < INTERJORNADA - EPS)
        erro(
          'interjornada',
          `${p.nome}: só ${arred(24 - hoje.saida + amanha.entrada)}h de descanso entre ${NOMES_DIA[d]} e ${NOMES_DIA[(d + 1) % 7]} (mínimo ${INTERJORNADA}h).`,
          { matricula: p.matricula, dia: d },
        );
    }
    if (p.vaga && meus.length === 0)
      aviso('vaga-sem-turnos', `${p.nome} (${p.funcao}) não tem turnos: custa e não cobre nada.`, {
        matricula: p.matricula,
      });
    return { matricula: p.matricula, horas, dias: diasTrab.size, limiteH: arred(limite) };
  });

  // Cobertura por dia aberto e função, no pior momento de cada hora.
  const funcoes = [
    ...new Set([
      ...Object.keys(minimos).filter((f) => (minimos[f] ?? 0) > 0),
      ...quadro.map((p) => p.funcao).filter((f): f is string => !!f),
    ]),
  ];
  const funcaoDe = new Map(quadro.map((p) => [p.matricula, p.funcao]));
  const cobertura: Record<number, CoberturaDia> = {};

  for (const d of dias) {
    const doDia = turnos.filter((t) => t.dia === d.dia);
    const horas: number[] = [];
    for (let h = Math.floor(d.abre); h < Math.ceil(d.fecha - EPS); h++) horas.push(h);
    cobertura[d.dia] = funcoes.map((funcao) => {
      const minimo = minimos[funcao] ?? 0;
      const meus = doDia.filter((t) => funcaoDe.get(t.matricula) === funcao);
      const porHora = horas.map((hora) => {
        const pessoas = meus.filter((t) => presente(t, hora)).length;
        return { hora, pessoas, ok: pessoas >= minimo };
      });
      const faltas = porHora.filter((c) => !c.ok).map((c) => c.hora);
      if (faltas.length)
        erro(
          funcao === 'Farmacêutico' ? 'farmaceutico' : 'cobertura',
          funcao === 'Farmacêutico'
            ? `Sem farmacêutico em ${NOMES_DIA[d.dia]} ${faixas(faltas)}: a lei exige farmacêutico em todo o horário de funcionamento.`
            : `${funcao} abaixo do mínimo (${minimo}) em ${NOMES_DIA[d.dia]} ${faixas(faltas)}.`,
          { dia: d.dia },
        );
      if (minimo === 1 && meus.length === 1) {
        const t = meus[0]!;
        if (t.saida - t.entrada > 6 + EPS)
          aviso(
            'intervalo-descoberto',
            `${funcao} sozinho por mais de 6h em ${NOMES_DIA[d.dia]}: o intervalo de 1h fica descoberto.`,
            { dia: d.dia },
          );
      }
      return { funcao, minimo, porHora };
    });
  }

  const erros = achados.filter((x) => x.tipo === 'erro');
  return {
    erros,
    avisos: achados.filter((x) => x.tipo === 'aviso'),
    podeGravar: erros.length === 0,
    porPessoa,
    cobertura,
  };
};
