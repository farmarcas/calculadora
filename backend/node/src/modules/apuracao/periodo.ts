import type { DiaAberto } from '../regras/capacidade.js';
import type { PessoaSim, TurnoSim } from '../simulacoes/avaliar.js';
import {
  apurarDia,
  faixasPlanejadas,
  sobreposicao,
  TOLERANCIA_PADRAO_MIN,
  type DiaApurado,
  type Faixa,
} from './dia.js';

export const ROTULO_GERENCIAL = 'apuração gerencial — não substitui o registro oficial de ponto';

export type EntradaApuracao = {
  de: string; // AAAA-MM-dd, inclusive
  ate: string;
  vigenciaInicio: string;
  quadro: PessoaSim[];
  turnos: TurnoSim[]; // semana planejada da simulação em uso
  dias: DiaAberto[];
  minimos: Record<string, number>;
  batidas: { matricula: string; data: string; minuto: number }[];
  // Só se apura o que o ponto importado cobre: sem arquivo para a data, não existe "falta".
  periodosCobertos: { inicio: string; fim: string }[];
  tolerancia?: number;
};

export type DiaDaPessoa = DiaApurado & { data: string; diaSemana: number; batidas: number[] };
export type PessoaApurada = {
  matricula: string;
  nome: string;
  funcao: string | null;
  dias: DiaDaPessoa[];
};

const NOMES_DIA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const arred = (n: number) => Math.round(n * 100) / 100;
const INTERJORNADA_MIN = 11 * 60;

export const diaDaSemana = (data: string) => {
  const [a, m, d] = data.split('-').map(Number) as [number, number, number];
  return (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
};
const somarDias = (data: string, n: number) => {
  const [a, m, d] = data.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
};
export const datas = (de: string, ate: string) => {
  const r: string[] = [];
  for (let d = de; d <= ate && r.length < 400; d = somarDias(d, 1)) r.push(d);
  return r;
};

const horasDo = (faixas: Faixa[], h: number) => sobreposicao(faixas, [[h, h + 1]]) >= 1 - 1e-9;

export const apurarPeriodo = (e: EntradaApuracao) => {
  const tol = e.tolerancia ?? TOLERANCIA_PADRAO_MIN;
  const coberto = (d: string) => e.periodosCobertos.some((p) => d >= p.inicio && d <= p.fim);
  const inicio = e.de > e.vigenciaInicio ? e.de : e.vigenciaInicio;
  const dias = datas(inicio, e.ate).filter(coberto);
  const pessoas = e.quadro.filter((p) => !p.vaga && !p.desligado);

  const batidasDe = new Map<string, number[]>();
  for (const b of e.batidas) {
    const k = `${b.matricula}|${b.data}`;
    batidasDe.set(k, [...(batidasDe.get(k) ?? []), b.minuto]);
  }

  const apuradas: PessoaApurada[] = pessoas.map((p) => {
    const lista: DiaDaPessoa[] = dias.map((data) => {
      const dow = diaDaSemana(data);
      const t = e.turnos.find((x) => x.matricula === p.matricula && x.dia === dow);
      const minutos = (batidasDe.get(`${p.matricula}|${data}`) ?? []).sort((a, b) => a - b);
      return {
        ...apurarDia(
          t
            ? {
                entrada: t.entrada,
                saida: t.saida,
                iniIntervalo: t.iniIntervalo,
                fimIntervalo: t.fimIntervalo,
              }
            : null,
          minutos,
          tol,
        ),
        data,
        diaSemana: dow,
        batidas: minutos,
      };
    });
    // Descanso entre jornadas: do último registro de um dia ao primeiro do seguinte.
    for (let i = 1; i < lista.length; i++) {
      const ontem = lista[i - 1]!;
      const hoje = lista[i]!;
      if (
        ontem.data === somarDias(hoje.data, -1) &&
        ontem.ultima != null &&
        hoje.primeira != null
      ) {
        const descanso = 24 * 60 - ontem.ultima + hoje.primeira;
        if (descanso < INTERJORNADA_MIN)
          hoje.ocorrencias.push({
            tipo: 'descanso_insuficiente',
            minutos: descanso,
            texto: `Só ${arred(descanso / 60)}h de descanso desde o dia anterior (mínimo 11h).`,
          });
      }
    }
    return { matricula: p.matricula, nome: p.nome, funcao: p.funcao, dias: lista };
  });

  // ---- loja × período
  const funcaoDe = new Map(pessoas.map((p) => [p.matricula, p.funcao ?? 'Sem função']));
  const completos = apuradas.flatMap((p) => p.dias.filter((d) => d.situacao !== 'incompleto'));
  const planejadoTotal = completos.reduce((s, d) => s + d.planejadoH, 0);
  let cumpridoTotal = 0;
  const horaExtraPorFuncao: Record<string, number> = {};
  const horaExtraPorDia = Array.from({ length: 7 }, () => 0);
  const contagem = {
    faltas: 0,
    atrasos: 0,
    saidasAntecipadas: 0,
    intervalosReduzidos: 0,
    trabalhoEmFolga: 0,
    batidasIncompletas: 0,
    descansoInsuficiente: 0,
  };
  const causas = { plano: 0, quadro: 0, execucao: 0 };

  // Quem estava planejado em cada hora, por função, para classificar a causa da hora extra.
  const planejadoNaHora = (data: string, funcao: string, h: number) =>
    pessoas.filter(
      (p) =>
        p.funcao === funcao &&
        (() => {
          const t = e.turnos.find(
            (x) => x.matricula === p.matricula && x.dia === diaDaSemana(data),
          );
          return t
            ? horasDo(
                faixasPlanejadas({
                  entrada: t.entrada,
                  saida: t.saida,
                  iniIntervalo: t.iniIntervalo,
                  fimIntervalo: t.fimIntervalo,
                }),
                h,
              )
            : false;
        })(),
    ).length;

  for (const p of apuradas) {
    for (const d of p.dias) {
      const t = e.turnos.find((x) => x.matricula === p.matricula && x.dia === d.diaSemana);
      if (d.situacao !== 'incompleto' && t)
        cumpridoTotal += Math.min(
          d.planejadoH,
          sobreposicao(
            d.trabalho,
            faixasPlanejadas({
              entrada: t.entrada,
              saida: t.saida,
              iniIntervalo: t.iniIntervalo,
              fimIntervalo: t.fimIntervalo,
            }),
          ),
        );
      for (const o of d.ocorrencias) {
        if (o.tipo === 'atraso') contagem.atrasos++;
        else if (o.tipo === 'saida_antecipada') contagem.saidasAntecipadas++;
        else if (o.tipo === 'intervalo_reduzido') contagem.intervalosReduzidos++;
        else if (o.tipo === 'trabalho_em_folga') contagem.trabalhoEmFolga++;
        else if (o.tipo === 'batidas_incompletas') contagem.batidasIncompletas++;
        else if (o.tipo === 'descanso_insuficiente') contagem.descansoInsuficiente++;
      }
      if (d.situacao === 'falta') contagem.faltas++;
      if (d.horaExtraH > 0) {
        const f = funcaoDe.get(p.matricula)!;
        horaExtraPorFuncao[f] = arred((horaExtraPorFuncao[f] ?? 0) + d.horaExtraH);
        horaExtraPorDia[d.diaSemana] = arred(horaExtraPorDia[d.diaSemana]! + d.horaExtraH);

        // Causa provável (sugestão): plano, quadro ou execução.
        const minimo = e.minimos[f] ?? 0;
        const de = t ? Math.floor(t.saida) : Math.floor((d.primeira ?? 0) / 60);
        const ateH = Math.ceil((d.ultima ?? 0) / 60);
        const faixaCoberta = Array.from({ length: Math.max(0, ateH - de) }, (_, i) => de + i);
        const planoFraco =
          minimo > 0 && faixaCoberta.some((h) => planejadoNaHora(d.data, f, h) < minimo);
        const faltouColega = apuradas.some(
          (q) =>
            q.matricula !== p.matricula &&
            funcaoDe.get(q.matricula) === f &&
            q.dias.some((x) => x.data === d.data && x.situacao === 'falta'),
        );
        if (planoFraco) causas.plano++;
        else if (faltouColega) causas.quadro++;
        else causas.execucao++;
      }
    }
  }
  const horaExtraTotal = arred(Object.values(horaExtraPorFuncao).reduce((s, v) => s + v, 0));

  // Cobertura realizada × mínimo, nas datas apuradas em que a loja abre.
  const descobertas: { data: string; funcao: string; de: string; ate: string }[] = [];
  const horasAbaixo: Record<string, number> = {};
  const funcoes = [
    ...new Set([
      ...Object.keys(e.minimos).filter((f) => (e.minimos[f] ?? 0) > 0),
      ...pessoas.map((p) => p.funcao).filter((f): f is string => !!f),
    ]),
  ];
  for (const data of dias) {
    const aberto = e.dias.find((x) => x.dia === diaDaSemana(data));
    if (!aberto) continue;
    for (const f of funcoes) {
      const minimo = e.minimos[f] ?? 0;
      if (minimo <= 0) continue;
      const faltas: number[] = [];
      for (let h = Math.floor(aberto.abre); h < Math.ceil(aberto.fecha); h++) {
        const presentes = apuradas.filter(
          (p) =>
            p.funcao === f &&
            p.dias.some(
              (d) => d.data === data && d.situacao !== 'incompleto' && horasDo(d.trabalho, h),
            ),
        ).length;
        if (presentes < minimo) faltas.push(h);
      }
      horasAbaixo[f] = (horasAbaixo[f] ?? 0) + faltas.length;
      let i = 0;
      while (i < faltas.length) {
        let j = i;
        while (j + 1 < faltas.length && faltas[j + 1] === faltas[j]! + 1) j++;
        descobertas.push({
          data,
          funcao: f,
          de: `${String(faltas[i]).padStart(2, '0')}:00`,
          ate: `${String(faltas[j]! + 1).padStart(2, '0')}:00`,
        });
        i = j + 1;
      }
    }
  }

  return {
    rotulo: ROTULO_GERENCIAL,
    periodo: { de: inicio, ate: e.ate, diasApurados: dias.length },
    pessoas: apuradas,
    loja: {
      aderenciaPct: planejadoTotal > 0 ? arred((cumpridoTotal / planejadoTotal) * 100) : null,
      horasPlanejadas: arred(planejadoTotal),
      horasCumpridas: arred(cumpridoTotal),
      horaExtraH: horaExtraTotal,
      horaExtraPorFuncao,
      horaExtraPorDiaSemana: NOMES_DIA.map((nome, i) => ({
        dia: nome,
        horas: horaExtraPorDia[i]!,
      })),
      ...contagem,
      causaProvavelHoraExtra: { sugestao: true, ...causas },
      cobertura: { horasAbaixoDoMinimo: horasAbaixo, descobertas: descobertas.slice(0, 100) },
    },
  };
};
