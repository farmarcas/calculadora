// A semana com folgas (spec 043): pega a equipe e os horários do Cadastro, aplica as folgas e o rodízio de domingo (as mesmas
// regras da spec 042, na tela), mede a cobertura real hora a hora e posiciona as contratações onde ainda falta gente.
// Puro e sem banco: é a fonte única do cenário (cartão) e da Simulação aberta por Personalizar.
import type { DiaAberto } from '../regras/capacidade.js';
import { sugerirContratacao } from '../regras/contratacao-horas.js';
import { FARMACEUTICO } from '../regras/gap-horas.js';
import { tetoEfetivo, type Regra } from '../regras/perfis.js';
import { requisitos, type Minimos } from '../regras/requisitos.js';
import type { TurnoSim } from '../simulacoes/avaliar.js';
import { intervaloDesconta } from '../regras/intervalo.js';

export type HorarioPessoa = {
  matricula: string;
  funcao: string;
  cargaH: number;
  dias: number[];
  entrada: number;
  saida: number;
  iniIntervalo: number | null;
  fimIntervalo: number | null;
  // Horário fixo no Cadastro: o esticamento (spec 046) não mexe no turno dessa pessoa.
  fixo?: boolean;
  // Só para os avisos (spec 055): "Nome: não deu para afastar as folgas sem faltar gente." Sem nome, o aviso usa a função.
  nome?: string;
};
export type CelulaHora = { hora: number; pessoas: number; exigido: number };
export type CoberturaFuncao = Record<number, CelulaHora[]>;
export type TurnoDeVaga = Omit<TurnoSim, 'matricula'>;
export type VagaComTurnos = { funcao: string; cargaH: number; turnos: TurnoDeVaga[] };
export type ResultadoFuncao = {
  funcao: string;
  necessidadeH: number;
  // Horas exigidas que a equipe, já com as folgas, não cobre (soma das pessoas que faltam em cada hora).
  faltaH: number;
  // As horas que a sugestão de contratação cobre, já conferidas contra a cobertura hora a hora.
  gapParaSugestaoH: number;
  vagas: VagaComTurnos[];
  // Mesmo com as contratações, ainda falta cobertura (o cenário não resolve sozinho).
  resolve: boolean;
};
export type SemanaComFolgas = {
  turnos: TurnoSim[];
  retirados: { matricula: string; dia: number }[];
  avisos: string[];
  domingoSugerido: boolean;
  // Spec 046: os turnos que cresceram até o limite da regra (de, para).
  esticados: { matricula: string; dia: number; de: string; para: string }[];
  funcoes: Record<string, ResultadoFuncao>;
};

const EPS = 1e-9;
const DOMINGO = 6;
const MAX_VAGAS = 20;
const HORAS_SEM_INTERVALO = 6;
const NOMES_DO_DIA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const arred = (n: number) => Math.round(n * 100) / 100;

const presente = (t: TurnoSim, h: number) =>
  t.entrada <= h + EPS &&
  t.saida >= h + 1 - EPS &&
  !(
    intervaloDesconta(t.iniIntervalo, t.fimIntervalo) &&
    t.iniIntervalo! < h + 1 - EPS &&
    t.fimIntervalo! > h + EPS
  );

const horasDoDia = (d: DiaAberto) => {
  const horas: number[] = [];
  for (let h = Math.floor(d.abre); h < Math.ceil(d.fecha - EPS); h++) horas.push(h);
  return horas;
};

export const turnosDosHorarios = (horarios: HorarioPessoa[]): TurnoSim[] =>
  horarios.flatMap((p) =>
    p.dias.map((dia) => ({
      matricula: p.matricula,
      dia,
      entrada: p.entrada,
      saida: p.saida,
      iniIntervalo: p.iniIntervalo,
      fimIntervalo: p.fimIntervalo,
    })),
  );

// A cobertura de uma função: em cada dia aberto e hora, pessoas presentes (intervalo fora) contra o exigido. O farmacêutico
// exige ao menos 1 em todas as horas.
export const coberturaDaFuncao = (
  funcao: string,
  turnosDaFuncao: TurnoSim[],
  dias: DiaAberto[],
  minimos: Minimos,
): CoberturaFuncao => {
  const req = requisitos(minimos);
  return Object.fromEntries(
    dias.map((d) => [
      d.dia,
      horasDoDia(d).map((hora) => {
        const exigido0 = req.emHora(funcao, d.dia, hora);
        return {
          hora,
          exigido: funcao === FARMACEUTICO ? Math.max(1, exigido0) : exigido0,
          pessoas: turnosDaFuncao.filter((t) => t.dia === d.dia && presente(t, hora)).length,
        };
      }),
    ]),
  );
};

export const faltaDaFuncao = (cob: CoberturaFuncao) =>
  arred(
    Object.values(cob)
      .flat()
      .reduce((s, c) => s + Math.max(0, c.exigido - c.pessoas), 0),
  );
const necessidadeDaFuncao = (cob: CoberturaFuncao) =>
  arred(
    Object.values(cob)
      .flat()
      .reduce((s, c) => s + c.exigido, 0),
  );

const faixaTxt = (horas: number[]) => {
  const faixas: { de: number; ate: number }[] = [];
  for (const h of horas) {
    const u = faixas[faixas.length - 1];
    if (u && h === u.ate + 1) u.ate = h;
    else faixas.push({ de: h, ate: h });
  }
  return faixas
    .map((f) => (f.de === f.ate ? `às ${f.de}h` : `das ${f.de}h às ${f.ate}h`))
    .join(' e ');
};

const funcoesComPessoas = (hs: HorarioPessoa[]) => [...new Set(hs.map((h) => h.funcao))];

// Aplica as folgas: quem passa do limite de dias da regra ganha as folgas que faltam, nos dias de maior sobra de cobertura,
// espalhando entre a função; o domingo vira rodízio (ao menos 1 em cada 3 pessoas da função folga no domingo).
export const aplicarFolgas = (a: {
  horarios: HorarioPessoa[];
  dias: DiaAberto[];
  regra: Pick<Regra, 'dias' | 'maxDia' | 'teto'>;
  minimos: Minimos;
}) => {
  const aberto = new Set(a.dias.map((d) => d.dia));
  let atuais = turnosDosHorarios(a.horarios).filter((t) => aberto.has(t.dia));
  const retirados: { matricula: string; dia: number }[] = [];
  const avisos: string[] = [];
  let domingoSugerido = false;
  const funcaoDe = new Map(a.horarios.map((h) => [h.matricula, h.funcao]));
  const diasDe = (m: string) => new Set(atuais.filter((t) => t.matricula === m).map((t) => t.dia));
  const falta = new Map<string, number>(
    a.horarios
      .map((h): [string, number] => [h.matricula, diasDe(h.matricula).size - a.regra.dias])
      .filter(([, n]) => n > 0),
  );
  const folgasNoDia = new Map<string, number>();
  const chave = (f: string, d: number) => `${f}|${d}`;
  const contar = (f: string, d: number) => folgasNoDia.get(chave(f, d)) ?? 0;

  const sobraSem = (funcao: string, matricula: string, dia: number) => {
    const d = a.dias.find((x) => x.dia === dia);
    if (!d) return Infinity;
    const resto = atuais.filter(
      (t) => t.dia === dia && funcaoDe.get(t.matricula) === funcao && t.matricula !== matricula,
    );
    const cob = coberturaDaFuncao(funcao, resto, [d], a.minimos)[dia] ?? [];
    return cob.length ? Math.min(...cob.map((c) => c.pessoas - c.exigido)) : Infinity;
  };
  // Quantas horas de falta a saída da pessoa abre neste dia (0 quando a função tem sobra em todas as horas dela).
  const faltaNova = (funcao: string, matricula: string, dia: number) => {
    const d = a.dias.find((x) => x.dia === dia);
    if (!d) return 0;
    const doDia = atuais.filter((t) => t.dia === dia && funcaoDe.get(t.matricula) === funcao);
    const antes = faltaDaFuncao(coberturaDaFuncao(funcao, doDia, [d], a.minimos));
    const depois = faltaDaFuncao(
      coberturaDaFuncao(
        funcao,
        doDia.filter((t) => t.matricula !== matricula),
        [d],
        a.minimos,
      ),
    );
    return arred(depois - antes);
  };
  const retirar = (m: string, funcao: string, dia: number) => {
    atuais = atuais.filter((t) => !(t.matricula === m && t.dia === dia));
    retirados.push({ matricula: m, dia });
    folgasNoDia.set(chave(funcao, dia), contar(funcao, dia) + 1);
  };

  for (const funcao of funcoesComPessoas(a.horarios)) {
    const doGrupo = a.horarios.filter((h) => h.funcao === funcao);
    if (aberto.has(DOMINGO)) {
      const alvo = Math.ceil(doGrupo.length / 3);
      let jaFolgam = doGrupo.filter((p) => !diasDe(p.matricula).has(DOMINGO)).length;
      while (jaFolgam < alvo) {
        const candidatas = doGrupo
          .filter((p) => (falta.get(p.matricula) ?? 0) > 0 && diasDe(p.matricula).has(DOMINGO))
          .map((p) => ({ p, sobra: sobraSem(funcao, p.matricula, DOMINGO) }))
          .sort((x, y) => y.sobra - x.sobra);
        const melhor = candidatas[0];
        if (!melhor || melhor.sobra < 0) {
          avisos.push(
            `Domingo: não deu para dar folga a 1 em cada 3 ${funcao.toLowerCase()}s sem faltar gente; confira o rodízio de domingo dessa função.`,
          );
          break;
        }
        retirar(melhor.p.matricula, funcao, DOMINGO);
        falta.set(melhor.p.matricula, (falta.get(melhor.p.matricula) ?? 0) - 1);
        jaFolgam += 1;
        domingoSugerido = true;
      }
    }
    const pendentes = doGrupo
      .filter((p) => (falta.get(p.matricula) ?? 0) > 0)
      .sort((x, y) => (falta.get(y.matricula) ?? 0) - (falta.get(x.matricula) ?? 0));
    for (const p of pendentes) {
      const posicao = doGrupo.findIndex((x) => x.matricula === p.matricula);
      // Os dias abertos em que a pessoa não trabalha (as folgas que ela já tem e as que acabam de ser dadas).
      const folgasDe = () => [...aberto].filter((d) => !diasDe(p.matricula).has(d));
      // Spec 055: distância até as outras folgas dela, contando a volta da semana (domingo e segunda são vizinhos).
      const proximidade = (d: number) => {
        const outras = folgasDe();
        if (!outras.length) return 0;
        const dist = Math.min(
          ...outras.map((o) => {
            const x = Math.abs(o - d);
            return Math.min(x, 7 - x);
          }),
        );
        return 3 - Math.min(3, dist);
      };
      while ((falta.get(p.matricula) ?? 0) > 0) {
        const dias = [...diasDe(p.matricula)].filter((d) => aberto.has(d));
        if (!dias.length) break;
        // Cobertura primeiro (menos falta nova); depois afasta da própria folga, espalha a equipe, prefere mais sobra e, no
        // empate, gira o dia pela posição da pessoa (nunca "o menor dia" para todos). Sem sorteio: a mesma entrada dá o mesmo.
        const opcoes = dias
          .map((d) => ({
            d,
            novaFalta: faltaNova(funcao, p.matricula, d),
            perto: proximidade(d),
            sobra: sobraSem(funcao, p.matricula, d),
            junto: contar(funcao, d),
            giro: (((d - posicao) % 7) + 7) % 7,
          }))
          .sort(
            (x, y) =>
              x.novaFalta - y.novaFalta ||
              x.perto - y.perto ||
              x.junto - y.junto ||
              y.sobra - x.sobra ||
              x.giro - y.giro ||
              x.d - y.d,
          );
        retirar(p.matricula, funcao, opcoes[0]!.d);
        falta.set(p.matricula, (falta.get(p.matricula) ?? 0) - 1);
      }
      // Folga nova colada em outra folga dela: a cobertura veio primeiro, e a sugestão diz de quem é.
      const novas = retirados.filter((r) => r.matricula === p.matricula).map((r) => r.dia);
      if (novas.length) {
        const todas = folgasDe();
        const colada = novas.some((d) =>
          todas.some((o) => o !== d && Math.min(Math.abs(o - d), 7 - Math.abs(o - d)) === 1),
        );
        if (colada)
          avisos.push(`${p.nome ?? p.funcao}: não deu para afastar as folgas sem faltar gente.`);
      }
    }
  }

  // Avisos: horas que passam a ficar abaixo do mínimo por causa das folgas.
  const antes = turnosDosHorarios(a.horarios).filter((t) => aberto.has(t.dia));
  for (const d of [...a.dias].sort((x, y) => x.dia - y.dia)) {
    for (const funcao of funcoesComPessoas(a.horarios)) {
      const noDia = (ts: TurnoSim[]) =>
        coberturaDaFuncao(
          funcao,
          ts.filter((t) => funcaoDe.get(t.matricula) === funcao),
          [d],
          a.minimos,
        )[d.dia] ?? [];
      const c0 = noDia(antes);
      const c1 = noDia(atuais);
      const novas = c1
        .filter((c, i) => c.pessoas < c.exigido && c0[i]!.pessoas >= c0[i]!.exigido)
        .map((c) => c.hora);
      if (novas.length)
        avisos.push(
          `${NOMES_DO_DIA[d.dia]}: vai faltar ${funcao.toLowerCase()} ${faixaTxt(novas)}.`,
        );
    }
  }
  return {
    turnos: ajustarJornada(atuais, a.horarios, a.regra),
    retirados,
    avisos,
    domingoSugerido,
  };
};

const liquidaDe = (t: TurnoSim) =>
  t.saida -
  t.entrada -
  (t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0);
const cortaFim = (t: TurnoSim, corte: number): TurnoSim => {
  const saida = Math.max(t.entrada + 1, t.saida - corte);
  const intervaloFora = t.fimIntervalo != null && t.fimIntervalo > saida - EPS;
  return {
    ...t,
    saida,
    iniIntervalo: intervaloFora ? null : t.iniIntervalo,
    fimIntervalo: intervaloFora ? null : t.fimIntervalo,
  };
};

// Cada pessoa cabe na regra: até o máximo de horas por dia e até o teto da semana (e a carga contratada). O que passa sai do
// fim do turno, igual em todos os dias da pessoa, em quartos de hora.
export const ajustarJornada = (
  turnos: TurnoSim[],
  horarios: HorarioPessoa[],
  regra: Pick<Regra, 'dias' | 'maxDia' | 'teto'>,
): TurnoSim[] => {
  const cargaDe = new Map(horarios.map((h) => [h.matricula, h.cargaH]));
  const teto = tetoEfetivo(regra as Regra);
  const quarto = (h: number) => Math.ceil(h * 4 - EPS) / 4;
  const porPessoa = new Map<string, TurnoSim[]>();
  for (const t of turnos) porPessoa.set(t.matricula, [...(porPessoa.get(t.matricula) ?? []), t]);
  const saida: TurnoSim[] = [];
  for (const [m, ts] of porPessoa) {
    let lista = ts.map((t) =>
      liquidaDe(t) > regra.maxDia + EPS ? cortaFim(t, quarto(liquidaDe(t) - regra.maxDia)) : t,
    );
    const semana = lista.reduce((s, t) => s + liquidaDe(t), 0);
    const limite = Math.min(cargaDe.get(m) ?? teto, teto);
    if (semana > limite + EPS && lista.length) {
      const corte = quarto((semana - limite) / lista.length);
      lista = lista.map((t) => cortaFim(t, corte));
    }
    saida.push(...lista);
  }
  return saida;
};

// ---- Esticar os turnos até o limite (spec 046) --------------------------------------------------------------------------

const INTERJORNADA_H = 11;

// Depois das folgas e do corte de jornada, aumenta os turnos de quem trabalha menos que o limite (o menor entre a carga
// contratada e o teto da regra), só onde a função ainda está sem cobertura: hora inteira a hora inteira, no fim do turno e,
// se não couber, no começo. Respeita o máximo de horas por dia, o horário da loja e as 11 h de descanso entre os dias.
// Quem tem horário fixo não entra. A falta só diminui. O horário de antes fica em `antes`.
export const esticarTurnos = (a: {
  turnos: TurnoSim[];
  horarios: HorarioPessoa[];
  dias: DiaAberto[];
  regra: Pick<Regra, 'dias' | 'maxDia' | 'teto'>;
  minimos: Minimos;
}): {
  turnos: TurnoSim[];
  esticados: { matricula: string; dia: number; de: string; para: string }[];
} => {
  const teto = tetoEfetivo(a.regra as Regra);
  // A jornada cheia de um dia (spec 047): 8h24 com a convenção, 8h sem ela, 7h20 na regra de 44h. Nenhum dia passa disso.
  const jornadaDia = Math.min(a.regra.maxDia, teto / a.regra.dias);
  const req = requisitos(a.minimos);
  const exigidas = [...new Set([FARMACEUTICO, ...req.funcoes])];
  const funcaoDe = new Map(a.horarios.map((h) => [h.matricula, h.funcao]));
  const atuais = a.turnos.map((t) => ({ ...t }));
  const esticados: { matricula: string; dia: number; de: string; para: string }[] = [];
  const diaAberto = (dia: number) => a.dias.find((d) => d.dia === dia);
  const hhmm = (h: number) => {
    const m = Math.round(h * 60);
    return `${String(Math.floor(m / 60)).padStart(2, '0')}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
  };
  const semanaDe = (m: string) =>
    atuais.filter((t) => t.matricula === m).reduce((s, t) => s + liquidaDe(t), 0);
  const descansoOk = (m: string, dia: number, entrada: number, saida: number) => {
    const doDia = (d: number) => atuais.find((t) => t.matricula === m && t.dia === (d + 7) % 7);
    const prox = doDia(dia + 1);
    const ant = doDia(dia - 1);
    return (
      (!prox || 24 - saida + prox.entrada >= INTERJORNADA_H - EPS) &&
      (!ant || 24 - ant.saida + entrada >= INTERJORNADA_H - EPS)
    );
  };

  for (const funcao of exigidas) {
    const gente = a.horarios
      .filter((h) => h.funcao === funcao && !h.fixo)
      .map((h) => ({ h, limite: Math.min(h.cargaH, teto) }))
      .filter((x) => atuais.some((t) => t.matricula === x.h.matricula))
      .sort(
        (x, y) =>
          y.limite - semanaDe(y.h.matricula) - (x.limite - semanaDe(x.h.matricula)) ||
          x.h.matricula.localeCompare(y.h.matricula),
      );
    for (const { h, limite } of gente) {
      for (let volta = 0; volta < 40; volta++) {
        if (semanaDe(h.matricula) >= limite - EPS) break;
        // Em cada dia que a pessoa trabalha, vê se a hora logo depois (ou antes) do turno tem falta e cabe.
        let melhor: { idx: number; lado: 'fim' | 'inicio'; falta: number } | null = null;
        for (let idx = 0; idx < atuais.length; idx++) {
          const t = atuais[idx]!;
          if (t.matricula !== h.matricula) continue;
          const d = diaAberto(t.dia);
          if (!d) continue;
          const daFuncaoNoDia = atuais.filter(
            (x) => x.dia === t.dia && funcaoDe.get(x.matricula) === funcao,
          );
          const cob = coberturaDaFuncao(funcao, daFuncaoNoDia, [d], a.minimos)[t.dia] ?? [];
          const falta = cob.filter((c) => c.pessoas < c.exigido).length;
          const curta = (hora: number) => cob.some((c) => c.hora === hora && c.pessoas < c.exigido);
          const folgaDia = jornadaDia - liquidaDe(t);
          const folgaSemana = limite - semanaDe(h.matricula);
          const passo = (n: number) => n <= folgaDia + EPS && n <= folgaSemana + EPS;
          const horaFim = Math.floor(t.saida + EPS);
          const passoFim = horaFim + 1 - t.saida;
          if (
            curta(horaFim) &&
            t.saida + passoFim <= d.fecha + EPS &&
            passo(passoFim) &&
            descansoOk(h.matricula, t.dia, t.entrada, t.saida + passoFim) &&
            (!melhor || falta > melhor.falta)
          )
            melhor = { idx, lado: 'fim', falta };
          else {
            const horaIni = Math.ceil(t.entrada - EPS) - 1;
            const passoIni = t.entrada - horaIni;
            if (
              horaIni >= d.abre - EPS &&
              curta(horaIni) &&
              passo(passoIni) &&
              descansoOk(h.matricula, t.dia, t.entrada - passoIni, t.saida) &&
              (!melhor || falta > melhor.falta)
            )
              melhor = { idx, lado: 'inicio', falta };
          }
        }
        if (!melhor) break;
        const t = atuais[melhor.idx]!;
        const antes = t.antes ?? { entrada: t.entrada, saida: t.saida };
        const novo: TurnoSim = { ...t, antes };
        if (melhor.lado === 'fim') novo.saida = Math.floor(t.saida + EPS) + 1;
        else novo.entrada = Math.ceil(t.entrada - EPS) - 1;
        // Passou de 6 h: entra 1 h de intervalo, sem passar do máximo do dia (a hora de intervalo não conta).
        if (novo.iniIntervalo == null && novo.saida - novo.entrada > HORAS_SEM_INTERVALO + EPS) {
          const iv = intervaloEscolhido(novo.entrada, novo.saida, []);
          novo.iniIntervalo = iv.iniIntervalo;
          novo.fimIntervalo = iv.fimIntervalo;
        }
        if (liquidaDe(novo) > jornadaDia + EPS) break;
        atuais[melhor.idx] = novo;
        const ja = esticados.findIndex((e) => e.matricula === novo.matricula && e.dia === novo.dia);
        const registro = {
          matricula: novo.matricula,
          dia: novo.dia,
          de: `${hhmm(antes.entrada)}–${hhmm(antes.saida)}`,
          para: `${hhmm(novo.entrada)}–${hhmm(novo.saida)}`,
        };
        if (ja >= 0) esticados[ja] = registro;
        else esticados.push(registro);
      }
    }
  }

  // Fase 2 (spec 047): todos trabalham a jornada cheia da regra em cada dia que já trabalham, mesmo sem falta: completa a duração
  // líquida do dia até `min(máximo do dia, teto ÷ dias)` (8h24 com a convenção de 8h24), no fim do turno e, se não couber, no
  // começo, sem passar do limite da pessoa, do horário da loja nem do descanso de 11 h. Em minutos inteiros.
  const minuto = (h: number) => Math.floor(h * 60 + 1e-6) / 60;
  const pessoas2 = a.horarios
    .filter((h) => !h.fixo && atuais.some((t) => t.matricula === h.matricula))
    .sort((x, y) => x.matricula.localeCompare(y.matricula));
  for (const h of pessoas2) {
    const limite = Math.min(h.cargaH, teto);
    const idxs = atuais
      .map((t, i) => ({ t, i }))
      .filter((x) => x.t.matricula === h.matricula)
      .sort((x, y) => x.t.dia - y.t.dia);
    for (const { i } of idxs) {
      const t = atuais[i]!;
      const d = diaAberto(t.dia);
      const faltaSemana = limite - semanaDe(h.matricula);
      const net = liquidaDe(t);
      if (!d || net >= jornadaDia - EPS || faltaSemana <= EPS) continue;
      const alvo = Math.min(jornadaDia, net + faltaSemana);
      const iv =
        t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0;
      const gross = t.saida - t.entrada;
      const grossAlvo = alvo + (iv > 0 ? iv : alvo > HORAS_SEM_INTERVALO + EPS ? 1 : 0);
      let preciso = minuto(grossAlvo - gross);
      if (preciso <= EPS) continue;
      const prox = atuais.find((x) => x.matricula === h.matricula && x.dia === (t.dia + 1) % 7);
      const ant = atuais.find((x) => x.matricula === h.matricula && x.dia === (t.dia + 6) % 7);
      const limiteFim = Math.min(d.fecha, prox ? 24 + prox.entrada - INTERJORNADA_H : 24);
      const limiteIni = Math.max(d.abre, ant ? ant.saida - 24 + INTERJORNADA_H : 0);
      const noFim = minuto(Math.max(0, Math.min(preciso, limiteFim - t.saida)));
      preciso -= noFim;
      const noIni = minuto(Math.max(0, Math.min(preciso, t.entrada - limiteIni)));
      if (noFim + noIni <= EPS) continue;
      const novo: TurnoSim = {
        ...t,
        antes: t.antes ?? { entrada: t.entrada, saida: t.saida },
        entrada: t.entrada - noIni,
        saida: t.saida + noFim,
      };
      if (novo.iniIntervalo == null && novo.saida - novo.entrada > HORAS_SEM_INTERVALO + EPS) {
        const ivNovo = intervaloEscolhido(novo.entrada, novo.saida, []);
        novo.iniIntervalo = ivNovo.iniIntervalo;
        novo.fimIntervalo = ivNovo.fimIntervalo;
      }
      if (liquidaDe(novo) > a.regra.maxDia + EPS) continue;
      atuais[i] = novo;
      const ja = esticados.findIndex((e) => e.matricula === novo.matricula && e.dia === novo.dia);
      const registro = {
        matricula: novo.matricula,
        dia: novo.dia,
        de: `${hhmm(novo.antes!.entrada)}–${hhmm(novo.antes!.saida)}`,
        para: `${hhmm(novo.entrada)}–${hhmm(novo.saida)}`,
      };
      if (ja >= 0) esticados[ja] = registro;
      else esticados.push(registro);
    }
  }
  return { turnos: atuais, esticados };
};

// ---- Contratações ------------------------------------------------------------------------------------------------------

// O intervalo de 1 h no meio do turno longo, escolhido onde não abre falta: a hora de almoço não pode cair onde a função já
// está abaixo do mínimo (senão a pessoa nova deixa buraco no próprio turno). Empate: o mais perto do meio.
const intervaloEscolhido = (entrada: number, saida: number, cobDia: CelulaHora[]) => {
  if (!(saida - entrada > HORAS_SEM_INTERVALO + EPS))
    return { iniIntervalo: null, fimIntervalo: null };
  const meio = entrada + Math.floor((saida - entrada) / 2);
  let melhor = meio;
  let melhorNota = Infinity;
  for (let s = Math.ceil(entrada) + 2; s + 1 <= saida - 2 + EPS; s++) {
    const curta = cobDia.filter((c) => c.hora === s && c.pessoas < c.exigido).length;
    const nota = curta * 100 + Math.abs(s - meio);
    if (nota < melhorNota - EPS) {
      melhorNota = nota;
      melhor = s;
    }
  }
  return { iniIntervalo: melhor, fimIntervalo: melhor + 1 };
};

// Os turnos de UMA vaga, onde mais falta: em cada dia, a maior faixa de horas sem cobertura (até 6 h sem intervalo, até o máximo
// do dia da regra com 1 h de intervalo), começando pelos dias que mais precisam, até gastar as horas do contrato ou os dias da
// regra. Um turno por dia; cada dia pode ter uma janela diferente.
export const turnosParaVaga = (a: {
  cargaH: number;
  cobertura: CoberturaFuncao;
  dias: DiaAberto[];
  regra: Pick<Regra, 'dias' | 'maxDia'>;
  limiteParcialH?: number;
}): TurnoDeVaga[] => {
  const { cargaH, cobertura, dias, regra } = a;
  const integral = cargaH > (a.limiteParcialH ?? 30);
  const maxLiquidaDia = integral ? regra.maxDia : Math.min(regra.maxDia, HORAS_SEM_INTERVALO);
  const faixasDoDia = (d: DiaAberto) => {
    const horas = (cobertura[d.dia] ?? []).filter((c) => c.pessoas < c.exigido).map((c) => c.hora);
    const faixas: { ini: number; fim: number }[] = [];
    for (const h of horas) {
      const u = faixas[faixas.length - 1];
      if (u && h === u.fim) u.fim = h + 1;
      else faixas.push({ ini: h, fim: h + 1 });
    }
    return faixas;
  };
  const total = (fs: { ini: number; fim: number }[]) => fs.reduce((t, f) => t + f.fim - f.ini, 0);
  const porDia = dias
    .map((d) => ({ d, faixas: faixasDoDia(d) }))
    .filter((x) => x.faixas.length)
    .sort((x, y) => total(y.faixas) - total(x.faixas) || x.d.dia - y.d.dia);
  const turnos: TurnoDeVaga[] = [];
  let resta = cargaH;
  for (const x of porDia) {
    if (resta < 1 - EPS || turnos.length >= regra.dias) break;
    const faixa = x.faixas.reduce((m, f) => (f.fim - f.ini > m.fim - m.ini + EPS ? f : m));
    const liquida = Math.min(resta, maxLiquidaDia, faixa.fim - faixa.ini);
    const bruta = liquida + (liquida > HORAS_SEM_INTERVALO + EPS ? 1 : 0);
    let entrada = faixa.ini;
    let saida = entrada + bruta;
    if (saida > x.d.fecha + EPS) {
      saida = x.d.fecha;
      entrada = Math.max(x.d.abre, saida - bruta);
    }
    turnos.push({
      dia: x.d.dia,
      entrada,
      saida,
      ...intervaloEscolhido(entrada, saida, cobertura[x.d.dia] ?? []),
    });
    resta -= liquida;
  }
  if (integral) completarJornadaDaVaga(turnos, a);
  return turnos.sort((x, y) => x.dia - y.dia);
};

// A contratação integral também trabalha a jornada cheia (spec 053, a mesma ideia da spec 047 para quem já está no quadro): depois
// de cobrir onde falta, cada turno cresce até a jornada do dia (8h24 com a convenção, 8h sem ela; `carga ÷ dias da regra`, nunca
// mais que o máximo do dia) e, se ainda sobrarem horas do contrato, entram turnos nos outros dias abertos, até os dias da regra.
// No fim do turno e, se não couber, no começo; sem passar do horário da loja nem das 11 h de descanso entre os dias. Minutos inteiros.
const completarJornadaDaVaga = (
  turnos: TurnoDeVaga[],
  a: { cargaH: number; cobertura: CoberturaFuncao; dias: DiaAberto[]; regra: Pick<Regra, 'dias' | 'maxDia'> },
) => {
  const { cargaH, cobertura, dias, regra } = a;
  const jornadaDia = Math.min(regra.maxDia, cargaH / regra.dias);
  const minuto = (h: number) => Math.floor(h * 60 + 1e-6) / 60;
  const liquida = (t: TurnoDeVaga) =>
    t.saida - t.entrada - (t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0);
  const semana = () => turnos.reduce((s, t) => s + liquida(t), 0);
  const doDia = (dia: number) => turnos.find((t) => t.dia === (dia + 7) % 7);
  const folgaDeDescanso = (dia: number) => {
    const prox = doDia(dia + 1);
    const ant = doDia(dia - 1);
    return {
      fimMax: prox ? 24 + prox.entrada - INTERJORNADA_H : 24,
      iniMin: ant ? ant.saida - 24 + INTERJORNADA_H : 0,
    };
  };
  const comIntervalo = (t: TurnoDeVaga): TurnoDeVaga => {
    if (t.iniIntervalo != null || !(t.saida - t.entrada > HORAS_SEM_INTERVALO + EPS)) return t;
    return { ...t, ...intervaloEscolhido(t.entrada, t.saida, cobertura[t.dia] ?? []) };
  };

  // 1) Cada turno cresce até a jornada do dia.
  for (let i = 0; i < turnos.length; i++) {
    const t = turnos[i]!;
    const d = dias.find((x) => x.dia === t.dia);
    const resta = cargaH - semana();
    const net = liquida(t);
    if (!d || resta <= EPS || net >= jornadaDia - EPS) continue;
    const alvo = Math.min(jornadaDia, net + resta);
    const iv = t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0;
    const grossAlvo = alvo + (iv > 0 ? iv : alvo > HORAS_SEM_INTERVALO + EPS ? 1 : 0);
    let preciso = minuto(grossAlvo - (t.saida - t.entrada));
    if (preciso <= EPS) continue;
    const { fimMax, iniMin } = folgaDeDescanso(t.dia);
    const noFim = minuto(Math.max(0, Math.min(preciso, Math.min(d.fecha, fimMax) - t.saida)));
    preciso -= noFim;
    const noIni = minuto(Math.max(0, Math.min(preciso, t.entrada - Math.max(d.abre, iniMin))));
    if (noFim + noIni <= EPS) continue;
    turnos[i] = comIntervalo({ ...t, entrada: t.entrada - noIni, saida: t.saida + noFim });
  }

  // 2) Sobrou contrato: novos dias, os que mais precisam primeiro (mais horas sem cobertura), depois os demais em ordem.
  const falta = (dia: number) => (cobertura[dia] ?? []).filter((c) => c.pessoas < c.exigido).length;
  const candidatos = dias
    .filter((d) => !doDia(d.dia))
    .sort((x, y) => falta(y.dia) - falta(x.dia) || x.dia - y.dia);
  for (const d of candidatos) {
    const resta = cargaH - semana();
    if (resta < 1 / 60 || turnos.length >= regra.dias) break;
    const { fimMax, iniMin } = folgaDeDescanso(d.dia);
    const ini = Math.max(d.abre, iniMin);
    const fim = Math.min(d.fecha, fimMax);
    let net = Math.min(jornadaDia, resta);
    let gross = net + (net > HORAS_SEM_INTERVALO + EPS ? 1 : 0);
    if (gross > fim - ini + EPS) {
      gross = minuto(fim - ini);
      net = gross - (gross > HORAS_SEM_INTERVALO + EPS ? 1 : 0);
    }
    if (net < 1 - EPS) continue;
    // Onde falta cobertura, começa na primeira hora sem cobertura (sem passar do fim); senão, na abertura.
    const primeira = (cobertura[d.dia] ?? []).find((c) => c.pessoas < c.exigido)?.hora;
    let entrada = primeira !== undefined ? Math.max(ini, Math.min(primeira, fim - gross)) : ini;
    entrada = minuto(entrada);
    turnos.push(comIntervalo({ dia: d.dia, entrada, saida: entrada + gross, iniIntervalo: null, fimIntervalo: null }));
  }
};

// ---- A semana inteira ---------------------------------------------------------------------------------------------------

export const semanaComFolgas = (a: {
  regra: Regra;
  dias: DiaAberto[];
  minimos: Minimos;
  horarios: HorarioPessoa[];
}): SemanaComFolgas => {
  const folgasBase = aplicarFolgas(a);
  // Spec 046: depois das folgas, os turnos de quem trabalha menos que o limite crescem onde falta cobertura.
  const esticado = esticarTurnos({
    turnos: folgasBase.turnos,
    horarios: a.horarios,
    dias: a.dias,
    regra: a.regra,
    minimos: a.minimos,
  });
  const folgas = { ...folgasBase, turnos: esticado.turnos };
  const req = requisitos(a.minimos);
  const exigidas = [...new Set([FARMACEUTICO, ...req.funcoes])];
  const funcaoDe = new Map(a.horarios.map((h) => [h.matricula, h.funcao]));
  const porPessoa = tetoEfetivo(a.regra);
  const cheia = Math.min(44, Math.floor(porPessoa));
  const funcoes: Record<string, ResultadoFuncao> = {};

  for (const funcao of exigidas) {
    const daFuncao = folgas.turnos.filter((t) => funcaoDe.get(t.matricula) === funcao);
    const cob0 = coberturaDaFuncao(funcao, daFuncao, a.dias, a.minimos);
    const faltaH = faltaDaFuncao(cob0);
    const base: ResultadoFuncao = {
      funcao,
      necessidadeH: necessidadeDaFuncao(cob0),
      faltaH,
      gapParaSugestaoH: 0,
      vagas: [],
      resolve: true,
    };
    if (faltaH <= EPS) {
      funcoes[funcao] = base;
      continue;
    }
    // Soma 1 h (parcial) ou 1 turno (integral) até a cobertura fechar. Se por várias voltas seguidas nada melhora (a falta
    // que sobra não cabe em mais horas de contrato, como duas faixas no mesmo dia), fica com a melhor e diz que não fecha.
    let gap = Math.ceil(faltaH - EPS);
    let melhor: { restante: number; gap: number; vagas: VagaComTurnos[] } | null = null;
    let semMelhora = 0;
    let resolve = false;
    let vagas: VagaComTurnos[] = [];
    for (let volta = 0; volta < 200; volta++) {
      const sug = sugerirContratacao({
        gapH: gap,
        jornadaIntegralH: porPessoa,
        divisor: 1,
      })?.principal;
      if (!sug) break;
      const cargas = [
        ...Array.from({ length: sug.inteiras }, () => cheia),
        ...(sug.parcialH ? [Math.min(44, sug.parcialH)] : []),
      ];
      if (cargas.length > MAX_VAGAS) break;
      let turnos = [...daFuncao];
      const tentativa: VagaComTurnos[] = [];
      cargas.forEach((cargaH, i) => {
        const cob = coberturaDaFuncao(funcao, turnos, a.dias, a.minimos);
        const ts = turnosParaVaga({ cargaH, cobertura: cob, dias: a.dias, regra: a.regra });
        tentativa.push({ funcao, cargaH, turnos: ts });
        turnos = [...turnos, ...ts.map((t) => ({ matricula: `V${i}`, ...t }))];
      });
      const restante = faltaDaFuncao(coberturaDaFuncao(funcao, turnos, a.dias, a.minimos));
      if (!melhor || restante < melhor.restante - EPS) {
        melhor = { restante, gap, vagas: tentativa };
        semMelhora = 0;
      } else semMelhora += 1;
      if (restante <= EPS) {
        resolve = true;
        break;
      }
      if (semMelhora >= 12) break;
      gap = arred(gap + 1);
    }
    if (melhor) {
      gap = melhor.gap;
      vagas = melhor.vagas;
    }
    funcoes[funcao] = { ...base, gapParaSugestaoH: gap, vagas, resolve };
  }
  return {
    turnos: folgas.turnos,
    retirados: folgas.retirados,
    avisos: folgas.avisos,
    domingoSugerido: folgas.domingoSugerido,
    esticados: esticado.esticados,
    funcoes,
  };
};
