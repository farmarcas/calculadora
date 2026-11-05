// Regras do gráfico "Venda por hora" da Simulação (spec 025), puras e sem React.
import { horasDoDia, paraMinutos } from "./horario/horario-regras.js";

const MENOS = "−"; // U+2212
const mil = (v) => (v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Hora de início da barra aberta na simulação: a hora inteira cabe no horário.
const abertaNaHora = (dia, h) => {
  if (!dia?.aberta) return false;
  const a = paraMinutos(dia.abre);
  const f = paraMinutos(dia.fecha);
  return a !== null && f !== null && h * 60 >= a && (h + 1) * 60 <= f;
};

// Horas mostradas (as mesmas em todos os dias, para o gráfico não mudar de largura): de 06h a 21h e, se preciso, mais cedo
// ou mais tarde para cobrir qualquer hora aberta (no Cadastro ou na simulação) e qualquer hora com venda na base.
export const horasDoGrafico = (cadastro, dias, venda) => {
  let de = 6;
  let ate = 22; // exclusivo: a última barra é a de 21h
  for (const d of [...cadastro, ...dias]) {
    if (!d?.aberta) continue;
    const a = paraMinutos(d.abre);
    const f = paraMinutos(d.fecha);
    if (a === null || f === null) continue;
    de = Math.min(de, Math.floor(a / 60));
    ate = Math.max(ate, Math.ceil(f / 60));
  }
  if (venda)
    for (const linha of venda)
      linha.forEach((v, h) => {
        if (v > 0) {
          de = Math.min(de, h);
          ate = Math.max(ate, h + 1);
        }
      });
  return Array.from({ length: Math.max(1, ate - de) }, (_, k) => de + k);
};

// Estado de cada barra do dia: "nova" (fechada no Cadastro e aberta na simulação), "fechada" (aberta no Cadastro e fechada na
// simulação, ou fora do horário e fechada nos dois: as duas listradas), "pico" (a de maior valor entre as abertas) e "aberta".
export const estadosDoDia = ({ dia, horas, resultado, serie }) => {
  const novas = resultado.vendaPorHora.novas?.[dia] ?? [];
  const estados = horas.map((h) => {
    if (novas[h]) return "nova";
    if (abertaNaHora(resultado.horario.dias[dia], h)) return "aberta";
    return "fechada";
  });
  let maior = 0;
  let indice = -1;
  estados.forEach((e, i) => {
    if (e === "aberta" && (serie[horas[i]] ?? 0) > maior) {
      maior = serie[horas[i]];
      indice = i;
    }
  });
  if (indice >= 0) estados[indice] = "pico";
  return estados;
};

// Rótulo da barra: R$ mil com uma casa ("1,3"); hora nova com "+" ("+0,3"). Em clientes, número inteiro.
export const rotuloDaBarra = (valor, { metrica = "venda", nova = false } = {}) => {
  if (metrica !== "venda") return String(Math.round(valor));
  return `${nova ? "+" : ""}${mil(valor)}`;
};

const soma = (xs) => xs.reduce((s, v) => s + (v ?? 0), 0);
const reais = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Os resumos do dia abaixo do gráfico. Valores em reais (média de um dia) só quando `venda` existe (o dono).
export const resumoDoDia = ({ dia, resultado }) => {
  const sim = resultado.horario.dias[dia];
  const cad = resultado.horario.cadastro[dia];
  const horas = sim?.aberta ? horasDoDia(sim.abre, sim.fecha) : 0;
  const antes = cad?.aberta ? horasDoDia(cad.abre, cad.fecha) : 0;
  const v = resultado.vendaPorHora;
  const novas = v.novas?.[dia] ?? [];
  const temNova = novas.some(Boolean);
  const venda = v.venda?.[dia] ?? null;
  const fechadas = v.fechadas?.[dia] ?? [];
  const estimada = v.estimada?.[dia] ?? null;
  const vendaAberta = venda ? soma(venda.map((x, h) => (!fechadas[h] && !novas[h] && abertaNaHora(sim, h) ? x : 0))) : null;
  const perdida = venda ? soma(venda.map((x, h) => (fechadas[h] ? x : 0))) : null;
  const novaEstimada = estimada ? soma(estimada) : null;
  return {
    horasAbertas: { valor: horas, apoio: horas === antes ? "sem alteração" : `antes ${antes}h` },
    temNova,
    vendaEstimadaNoDia: vendaAberta === null ? null : { texto: reais(vendaAberta) },
    vendaQueDeixaDeEntrar: perdida === null ? null : { texto: reais(perdida), tom: perdida > 0 ? "perigo" : "neutro", apoio: "nas horas fechadas" },
    vendaEstimadaNasHorasNovas: novaEstimada === null ? null : { texto: `+${reais(novaEstimada)}`, apoio: "por abrir mais neste dia" },
  };
};

// Itens da legenda; "Hora nova · venda estimada" só aparece quando o dia tem hora nova.
export const legenda = ({ temNova }) => [
  ["pico", "Pico"],
  ["aberta", "Demais horas"],
  ...(temNova ? [["nova", "Hora nova · venda estimada"]] : []),
  ["fechada", "Fechada na simulação"],
];

export const apoioDoGrafico = ({ temNova, metrica = "venda" }) =>
  `${metrica === "venda" ? "Venda por hora, em R$ mil" : "Clientes por hora"} · dados do sistema de vendas${temNova ? " · horas novas em verde, com venda estimada" : ""}`;

export { MENOS };
