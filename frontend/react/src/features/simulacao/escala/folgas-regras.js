// Folgas sugeridas (spec 042), puras e sem React: tira turnos de quem passa do limite de dias da regra, nos dias em que a função
// menos precisa da pessoa, e espalha o domingo (ao menos 1 em cada 3 pessoas por função na semana). Só a Simulação muda.
import { faltasDaFuncao, recalcularCobertura } from "./escala-regras.js";

const DOMINGO = 6;
const NOMES_DO_DIA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const horaCurta = (h) => `${h}h`;
const faixaTxt = (f) => (f.de === f.ate ? `às ${horaCurta(f.de)}` : `das ${horaCurta(f.de)} às ${horaCurta(f.ate)}`);

const diasDe = (turnos, matricula) => new Set(turnos.filter((t) => t.matricula === matricula).map((t) => t.dia));
const ativos = (quadro) => quadro.filter((p) => !p.desligado && !p.vaga && p.funcao);

// Quem passa do limite de dias da regra, com quantas folgas faltam dar.
export const pessoasParaFolgar = ({ quadro = [], turnos = [], limiteDias }) =>
  ativos(quadro)
    .map((p) => ({ matricula: p.matricula, funcao: p.funcao, folgas: diasDe(turnos, p.matricula).size - limiteDias }))
    .filter((x) => x.folgas > 0);

// A frase do rodízio de domingo, mostrada no card depois de sugerir.
export const textoDoRodizio = () =>
  "Domingo: ao menos 1 em cada 3 pessoas de cada função folga no domingo desta semana; repetindo o rodízio, cada pessoa folga um domingo a cada 3 semanas. São regras de referência: o jurídico da Farmarcas confirma os detalhes.";


const EPS = 1e-9;
const liquidaDe = (t) => t.saida - t.entrada - (t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0);
const quarto = (h) => Math.ceil(h * 4 - EPS) / 4;
const cortaFim = (t, corte) => {
  const saida = Math.max(t.entrada + 1, t.saida - corte);
  const fora = t.fimIntervalo != null && t.fimIntervalo > saida - EPS;
  return { ...t, saida, iniIntervalo: fora ? null : t.iniIntervalo, fimIntervalo: fora ? null : t.fimIntervalo };
};

// Cada pessoa da equipe cabe na regra: até o máximo de horas por dia e até o teto da semana (e a carga contratada). O que
// passa sai do fim do turno, igual em todos os dias da pessoa, em quartos de hora. Vagas simuladas ficam como estão.
export const ajustarJornada = (turnos, quadro, regra) => {
  if (!regra?.maxDia) return turnos;
  const teto = Math.min(regra.teto ?? Infinity, (regra.dias ?? 7) * regra.maxDia);
  const pessoas = new Map(quadro.map((p) => [p.matricula, p]));
  const porPessoa = new Map();
  for (const t of turnos) porPessoa.set(t.matricula, [...(porPessoa.get(t.matricula) ?? []), t]);
  const saida = [];
  for (const [m, ts] of porPessoa) {
    if (pessoas.get(m)?.vaga) {
      saida.push(...ts);
      continue;
    }
    let lista = ts.map((t) => (liquidaDe(t) > regra.maxDia + EPS ? cortaFim(t, quarto(liquidaDe(t) - regra.maxDia)) : t));
    const semana = lista.reduce((s, t) => s + liquidaDe(t), 0);
    const limite = Math.min(pessoas.get(m)?.cargaH ?? teto, teto);
    if (semana > limite + EPS && lista.length) {
      const corte = quarto((semana - limite) / lista.length);
      lista = lista.map((t) => cortaFim(t, corte));
    }
    saida.push(...lista);
  }
  return saida;
};


// ---- Esticar os turnos até o limite (spec 046) ------------------------------------------------------------------------

const INTERJORNADA_H = 11;

// Aumenta os turnos de quem trabalha menos que o limite (o menor entre a carga e o teto da regra), só onde a função ainda está
// sem cobertura: hora inteira a hora inteira, no fim do turno e, se não couber, no começo. Respeita o máximo de horas por dia,
// o horário da loja (`abas`) e as 11 h de descanso entre os dias. Vagas simuladas não entram. Mesmo critério do servidor
// (escala/semana-com-folgas.ts). O horário de antes fica em `antes`.
export const esticarTurnos = ({ turnos, quadro, cobertura, abas, regra }) => {
  if (!regra?.maxDia) return turnos;
  const teto = Math.min(regra.teto ?? Infinity, (regra.dias ?? 7) * regra.maxDia);
  // A jornada cheia de um dia (spec 047): 8h24 com a convenção, 8h sem ela, 7h20 na regra de 44h. Nenhum dia passa disso.
  const jornadaDia = Math.min(regra.maxDia, teto / (regra.dias ?? 7));
  const funcaoDe = new Map(quadro.filter((p) => !p.desligado && p.funcao).map((p) => [p.matricula, p.funcao]));
  const atuais = turnos.map((t) => ({ ...t }));
  const semanaDe = (m) => atuais.filter((t) => t.matricula === m).reduce((s, t) => s + liquidaDe(t), 0);
  const descansoOk = (m, dia, entrada, saida) => {
    const doDia = (d) => atuais.find((t) => t.matricula === m && t.dia === (d + 7) % 7);
    const prox = doDia(dia + 1);
    const ant = doDia(dia - 1);
    return (!prox || 24 - saida + prox.entrada >= INTERJORNADA_H - EPS) && (!ant || 24 - ant.saida + entrada >= INTERJORNADA_H - EPS);
  };
  const funcoes = [...new Set(Object.values(cobertura ?? {}).flat().map((c) => c.funcao))];
  for (const funcao of funcoes) {
    const gente = quadro
      .filter((p) => p.funcao === funcao && !p.vaga && !p.desligado && atuais.some((t) => t.matricula === p.matricula))
      .map((p) => ({ p, limite: Math.min(p.cargaH, teto) }))
      .sort((x, y) => y.limite - semanaDe(y.p.matricula) - (x.limite - semanaDe(x.p.matricula)) || String(x.p.matricula).localeCompare(String(y.p.matricula)));
    for (const { p, limite } of gente) {
      for (let volta = 0; volta < 40; volta++) {
        if (semanaDe(p.matricula) >= limite - EPS) break;
        let melhor = null;
        for (let idx = 0; idx < atuais.length; idx++) {
          const t = atuais[idx];
          if (t.matricula !== p.matricula) continue;
          const aba = abas.find((a) => a.dia === t.dia);
          const base = cobertura?.[t.dia]?.find((c) => c.funcao === funcao);
          if (!aba || !base) continue;
          const cob = recalcularCobertura(base, atuais.filter((x) => x.dia === t.dia && funcaoDe.get(x.matricula) === funcao)).porHora;
          const falta = cob.filter((c) => c.pessoas < c.exigido).length;
          const curta = (hora) => cob.some((c) => c.hora === hora && c.pessoas < c.exigido);
          const folgaDia = jornadaDia - liquidaDe(t);
          const folgaSemana = limite - semanaDe(p.matricula);
          const passo = (n) => n <= folgaDia + EPS && n <= folgaSemana + EPS;
          const horaFim = Math.floor(t.saida + EPS);
          const passoFim = horaFim + 1 - t.saida;
          if (curta(horaFim) && t.saida + passoFim <= aba.fecha + EPS && passo(passoFim) && descansoOk(p.matricula, t.dia, t.entrada, t.saida + passoFim) && (!melhor || falta > melhor.falta)) melhor = { idx, lado: "fim", falta };
          else {
            const horaIni = Math.ceil(t.entrada - EPS) - 1;
            const passoIni = t.entrada - horaIni;
            if (horaIni >= aba.abre - EPS && curta(horaIni) && passo(passoIni) && descansoOk(p.matricula, t.dia, t.entrada - passoIni, t.saida) && (!melhor || falta > melhor.falta)) melhor = { idx, lado: "inicio", falta };
          }
        }
        if (!melhor) break;
        const t = atuais[melhor.idx];
        const novo = { ...t, antes: t.antes ?? { entrada: t.entrada, saida: t.saida } };
        if (melhor.lado === "fim") novo.saida = Math.floor(t.saida + EPS) + 1;
        else novo.entrada = Math.ceil(t.entrada - EPS) - 1;
        if (novo.iniIntervalo == null && novo.saida - novo.entrada > 6 + EPS) {
          const meio = novo.entrada + Math.floor((novo.saida - novo.entrada) / 2);
          novo.iniIntervalo = meio;
          novo.fimIntervalo = meio + 1;
        }
        if (liquidaDe(novo) > jornadaDia + EPS) break;
        atuais[melhor.idx] = novo;
      }
    }
  }
  // Fase 2 (spec 047): todos trabalham a jornada cheia em cada dia que já trabalham, mesmo sem falta (mesmo critério do servidor).
  const minuto = (h) => Math.floor(h * 60 + 1e-6) / 60;
  const gente2 = quadro.filter((p) => !p.vaga && !p.desligado && atuais.some((t) => t.matricula === p.matricula)).sort((x, y) => String(x.matricula).localeCompare(String(y.matricula)));
  for (const p of gente2) {
    const limite = Math.min(p.cargaH, teto);
    const idxs = atuais.map((t, i) => ({ t, i })).filter((x) => x.t.matricula === p.matricula).sort((x, y) => x.t.dia - y.t.dia);
    for (const { i } of idxs) {
      const t = atuais[i];
      const aba = abas.find((a) => a.dia === t.dia);
      const faltaSemana = limite - semanaDe(p.matricula);
      const net = liquidaDe(t);
      if (!aba || net >= jornadaDia - EPS || faltaSemana <= EPS) continue;
      const alvo = Math.min(jornadaDia, net + faltaSemana);
      const iv = t.iniIntervalo != null && t.fimIntervalo != null ? t.fimIntervalo - t.iniIntervalo : 0;
      const grossAlvo = alvo + (iv > 0 ? iv : alvo > 6 + EPS ? 1 : 0);
      let preciso = minuto(grossAlvo - (t.saida - t.entrada));
      if (preciso <= EPS) continue;
      const prox = atuais.find((x) => x.matricula === p.matricula && x.dia === (t.dia + 1) % 7);
      const ant = atuais.find((x) => x.matricula === p.matricula && x.dia === (t.dia + 6) % 7);
      const limiteFim = Math.min(aba.fecha, prox ? 24 + prox.entrada - INTERJORNADA_H : 24);
      const limiteIni = Math.max(aba.abre, ant ? ant.saida - 24 + INTERJORNADA_H : 0);
      const noFim = minuto(Math.max(0, Math.min(preciso, limiteFim - t.saida)));
      preciso -= noFim;
      const noIni = minuto(Math.max(0, Math.min(preciso, t.entrada - limiteIni)));
      if (noFim + noIni <= EPS) continue;
      const novo = { ...t, antes: t.antes ?? { entrada: t.entrada, saida: t.saida }, entrada: t.entrada - noIni, saida: t.saida + noFim };
      if (novo.iniIntervalo == null && novo.saida - novo.entrada > 6 + EPS) {
        const meio = novo.entrada + Math.floor((novo.saida - novo.entrada) / 2);
        novo.iniIntervalo = meio;
        novo.fimIntervalo = meio + 1;
      }
      if (liquidaDe(novo) > jornadaDia + EPS) continue;
      atuais[i] = novo;
    }
  }
  return atuais;
};


// Sugere as folgas. `cobertura` é a cobertura por dia e função ({ [dia]: [{ funcao, porHora }] }) e `abas` os dias abertos.
export const sugerirFolgas = ({ quadro = [], turnos = [], cobertura = {}, abas = [], regra }) => {
  const limite = regra?.dias ?? 7;
  const diasAbertos = new Set(abas.map((a) => a.dia));
  let atuais = [...turnos];
  const retirados = [];
  const avisos = [];
  let domingoSugerido = false;
  const funcaoDe = new Map(quadro.map((p) => [p.matricula, p.funcao]));

  // A folga de cada função em cada dia, para espalhar (quantas pessoas já folgam ali).
  const folgasNoDia = new Map();
  const chave = (f, d) => `${f}|${d}`;
  const contar = (f, d) => folgasNoDia.get(chave(f, d)) ?? 0;

  // Quanto sobra de cobertura (no pior momento do dia) se a pessoa sair deste dia: negativo = abre falta.
  const sobraSem = (funcao, matricula, dia) => {
    const base = cobertura?.[dia]?.find((c) => c.funcao === funcao);
    if (!base) return Infinity;
    const resto = atuais.filter((t) => t.dia === dia && funcaoDe.get(t.matricula) === funcao && t.matricula !== matricula);
    const nova = recalcularCobertura(base, resto);
    return Math.min(...nova.porHora.map((c) => c.pessoas - c.exigido));
  };
  // Quantas horas de falta a saída da pessoa abre neste dia (0 quando a função tem sobra em todas as horas dela).
  const faltaNova = (funcao, matricula, dia) => {
    const base = cobertura?.[dia]?.find((c) => c.funcao === funcao);
    if (!base) return 0;
    const doDia = atuais.filter((t) => t.dia === dia && funcaoDe.get(t.matricula) === funcao);
    const falta = (ts) => recalcularCobertura(base, ts).porHora.reduce((s, c) => s + Math.max(0, c.exigido - c.pessoas), 0);
    return falta(doDia.filter((t) => t.matricula !== matricula)) - falta(doDia);
  };
  const retirar = (p, dia) => {
    atuais = atuais.filter((t) => !(t.matricula === p.matricula && t.dia === dia));
    retirados.push({ matricula: p.matricula, dia });
    folgasNoDia.set(chave(p.funcao, dia), contar(p.funcao, dia) + 1);
  };

  const falta = new Map(pessoasParaFolgar({ quadro, turnos, limiteDias: limite }).map((x) => [x.matricula, x.folgas]));
  const funcoes = [...new Set(ativos(quadro).map((p) => p.funcao))];

  for (const funcao of funcoes) {
    const doGrupo = ativos(quadro).filter((p) => p.funcao === funcao);

    // 1) Domingo: ao menos 1 em cada 3 pessoas da função folga no domingo (as que já folgam contam).
    if (diasAbertos.has(DOMINGO)) {
      const alvo = Math.ceil(doGrupo.length / 3);
      let jaFolgam = doGrupo.filter((p) => !diasDe(atuais, p.matricula).has(DOMINGO)).length;
      while (jaFolgam < alvo) {
        const candidatas = doGrupo
          .filter((p) => (falta.get(p.matricula) ?? 0) > 0 && diasDe(atuais, p.matricula).has(DOMINGO))
          .map((p) => ({ p, sobra: sobraSem(funcao, p.matricula, DOMINGO) }))
          .sort((a, b) => b.sobra - a.sobra);
        const melhor = candidatas[0];
        if (!melhor || melhor.sobra < 0) {
          avisos.push(`Domingo: não deu para dar folga a 1 em cada 3 ${funcao.toLowerCase()}s sem faltar gente; confira o rodízio de domingo dessa função.`);
          break;
        }
        retirar(melhor.p, DOMINGO);
        falta.set(melhor.p.matricula, falta.get(melhor.p.matricula) - 1);
        jaFolgam += 1;
        domingoSugerido = true;
      }
    }

    // 2) As demais folgas: nos dias de maior sobra, espalhando entre as pessoas da função.
    const pendentes = doGrupo.filter((p) => (falta.get(p.matricula) ?? 0) > 0).sort((a, b) => (falta.get(b.matricula) ?? 0) - (falta.get(a.matricula) ?? 0));
    for (const p of pendentes) {
      while ((falta.get(p.matricula) ?? 0) > 0) {
        const dias = [...diasDe(atuais, p.matricula)].filter((d) => diasAbertos.has(d));
        if (!dias.length) break;
        // Escolhe o dia que abre menos falta nova (zero quando sobra gente); depois espalha entre as pessoas da função.
        const opcoes = dias
          .map((d) => ({ d, novaFalta: faltaNova(funcao, p.matricula, d), sobra: sobraSem(funcao, p.matricula, d), junto: contar(funcao, d) }))
          .sort((a, b) => a.novaFalta - b.novaFalta || a.junto - b.junto || b.sobra - a.sobra || a.d - b.d);
        retirar(p, opcoes[0].d);
        falta.set(p.matricula, falta.get(p.matricula) - 1);
      }
    }
  }

  // Avisos: horas que passam a ficar abaixo do mínimo por causa das folgas.
  for (const dia of [...diasAbertos].sort((a, b) => a - b)) {
    for (const base of cobertura?.[dia] ?? []) {
      const antes = recalcularCobertura(base, turnos.filter((t) => t.dia === dia && funcaoDe.get(t.matricula) === base.funcao));
      const depois = recalcularCobertura(base, atuais.filter((t) => t.dia === dia && funcaoDe.get(t.matricula) === base.funcao));
      const novas = depois.porHora.filter((c, i) => !c.ok && antes.porHora[i].ok).map((c) => ({ ...c }));
      if (!novas.length) continue;
      const so = faltasDaFuncao({ porHora: depois.porHora.map((c) => ({ ...c, ok: !novas.some((n) => n.hora === c.hora) })) });
      avisos.push(`${NOMES_DO_DIA[dia]}: vai faltar ${base.funcao.toLowerCase()} ${so.map(faixaTxt).join(" e ")}.`);
    }
  }

  atuais = ajustarJornada(atuais, quadro, regra);
  atuais = esticarTurnos({ turnos: atuais, quadro, cobertura, abas, regra });
  return { turnos: atuais, retirados, avisos, domingoSugerido };
};
