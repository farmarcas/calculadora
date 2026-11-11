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
        const opcoes = dias
          .map((d) => ({ d, sobra: sobraSem(funcao, p.matricula, d), junto: contar(funcao, d) }))
          .sort((a, b) => (b.sobra >= 0) - (a.sobra >= 0) || a.junto - b.junto || b.sobra - a.sobra || a.d - b.d);
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

  return { turnos: atuais, retirados, avisos, domingoSugerido };
};
