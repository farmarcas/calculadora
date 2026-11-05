// Regras puras da comparação de simulações: métricas, diferença frente à base, cor pelo efeito no resultado,
// contagem "N de M itens mudaram", "só o que mudou" e troca de base. A base é sempre a primeira simulação.
import { horas, reais, reaisComSinal, VAZIO } from "./formato.js";

// sentido: "maior" = aumento é bom (verde); "menor" = aumento é ruim (vermelho); "neutro" = sem cor.
const num = (un) => ({ tipo: "numero", un });
export const GRUPOS = [
  {
    chave: "resultado", titulo: "Resultado por mês",
    metricas: [
      { chave: "saldo", rotulo: "Saldo", caminho: "saldoMensal", sentido: "maior", dinheiro: true, destaque: true, ...num("reais") },
      { chave: "folha", rotulo: "Folha extra", caminho: "folhaExtra", sentido: "menor", dinheiro: true, ...num("reais") },
      { chave: "venda", rotulo: "Venda estimada", caminho: "vendaEstimada", sentido: "maior", dinheiro: true, ...num("reais") },
      { chave: "vendaSai", rotulo: "Venda que deixa de entrar", caminho: "vendaQueSai", sentido: "menor", dinheiro: true, ...num("reais") },
      { chave: "horasAbertas", rotulo: "Horas abertas por semana", caminho: "horasAbertas", sentido: "neutro", ...num("h") },
    ],
  },
  {
    chave: "conformidade", titulo: "Conformidade",
    metricas: [
      { chave: "erros", rotulo: "Erros nas regras", caminho: "indicadores.erros", sentido: "menor", ...num("n") },
      { chave: "avisos", rotulo: "Avisos", caminho: "indicadores.avisos", sentido: "menor", ...num("n") },
      { chave: "farmaceutico", rotulo: "Farmacêutico em todo o horário", caminho: "indicadores.semFarmaceutico", sentido: "neutro", tipo: "marca" },
    ],
  },
  {
    chave: "atendimento", titulo: "Atendimento",
    metricas: [
      { chave: "cobertura", rotulo: "Cobertura das horas exigidas", caminho: "indicadores.coberturaPct", sentido: "neutro", ...num("%") },
      { chave: "faltam", rotulo: "Horas que faltam", caminho: "indicadores.horasFalta", sentido: "menor", ...num("h") },
      { chave: "sobram", rotulo: "Horas que sobram", caminho: "indicadores.horasSobra", sentido: "neutro", ...num("h") },
    ],
  },
  {
    chave: "pessoas", titulo: "Pessoas",
    metricas: [
      { chave: "pessoas", rotulo: "Pessoas no quadro", caminho: "indicadores.pessoas", sentido: "neutro", ...num("n") },
      { chave: "planejadas", rotulo: "Horas planejadas por semana", caminho: "indicadores.horasPlanejadas", sentido: "neutro", ...num("h") },
      { chave: "contratadas", rotulo: "Horas contratadas por semana", caminho: "indicadores.horasContratadas", sentido: "neutro", ...num("h") },
      { chave: "folgas", rotulo: "Folgas por pessoa na semana", caminho: "indicadores.folgasPorPessoa", sentido: "neutro", ...num("n") },
    ],
  },
];

export const lerCaminho = (sim, caminho) => caminho.split(".").reduce((o, k) => (o == null ? undefined : o[k]), sim);
export const valorDe = (sim, metrica) => lerCaminho(sim, metrica.caminho);

// As métricas em reais só existem quando a API as devolve (só o dono do grupo): as demais ficam de fora.
export const gruposDisponiveis = (simulacoes) => {
  const tem = (m) => !m.dinheiro || simulacoes.some((s) => lerCaminho(s, m.caminho) !== undefined);
  return GRUPOS.map((g) => ({ ...g, metricas: g.metricas.filter(tem) })).filter((g) => g.metricas.length > 0);
};
export const totalDeMetricas = (grupos) => grupos.reduce((s, g) => s + g.metricas.length, 0);

const arred = (n) => Math.round(n * 100) / 100;

// Diferença de um valor frente ao da base: { igual, delta, seta, tom, texto }. Sem valor num dos lados: sem diferença.
export const diferenca = (metrica, valor, valorBase) => {
  if (metrica.tipo === "marca") {
    if (valor == null || valorBase == null) return { igual: true, delta: null, seta: null, tom: "neutro", texto: null };
    const igual = !!valor === !!valorBase;
    return { igual, delta: null, seta: null, tom: igual ? "neutro" : !valor ? "bom" : "ruim", texto: igual ? null : (valor ? "Falta" : "Cobre tudo") };
  }
  if (valor == null || valorBase == null) return { igual: true, delta: null, seta: null, tom: "neutro", texto: null };
  const delta = arred(valor - valorBase);
  if (Math.abs(delta) < 0.005) return { igual: true, delta: 0, seta: null, tom: "neutro", texto: null };
  const subiu = delta > 0;
  const tom = metrica.sentido === "neutro" ? "neutro" : (metrica.sentido === "maior") === subiu ? "bom" : "ruim";
  return { igual: false, delta, seta: subiu ? "▲" : "▼", tom, texto: textoDaDiferenca(metrica, delta) };
};

const textoDaDiferenca = (metrica, delta) => {
  const sinal = delta > 0 ? "+" : "−";
  const abs = Math.abs(delta);
  if (metrica.un === "reais") return reaisComSinal(delta);
  if (metrica.un === "h") return `${sinal}${arred(abs)}h`;
  if (metrica.un === "%") return `${sinal}${arred(abs)}%`;
  return `${sinal}${arred(abs)}`;
};

// Valor de uma métrica como aparece na célula.
export const textoDoValor = (metrica, valor) => {
  if (valor == null) return VAZIO;
  if (metrica.tipo === "marca") return valor ? "Falta" : "Cobre tudo";
  if (metrica.un === "reais") return reais(valor);
  if (metrica.un === "h") return horas(valor);
  if (metrica.un === "%") return `${arred(valor)}%`;
  return String(arred(valor));
};

// A métrica mudou se alguma simulação que não é a base difere da base.
export const mudou = (metrica, simulacoes) => {
  const [base, ...outras] = simulacoes;
  if (!base) return false;
  return outras.some((s) => !diferenca(metrica, valorDe(s, metrica), valorDe(base, metrica)).igual);
};

// "N de M itens mudaram".
export const contarMudancas = (simulacoes, grupos) => {
  const todas = grupos.flatMap((g) => g.metricas);
  return { mudaram: todas.filter((m) => mudou(m, simulacoes)).length, total: todas.length };
};

// Com "Mostrar só o que mudou": esconde as métricas iguais e os grupos que ficarem vazios.
export const gruposVisiveis = (grupos, simulacoes, soOQueMudou) =>
  soOQueMudou
    ? grupos.map((g) => ({ ...g, metricas: g.metricas.filter((m) => mudou(m, simulacoes)) })).filter((g) => g.metricas.length > 0)
    : grupos;

// "Usar como base": a escolhida passa para a frente; as demais mantêm a ordem.
export const trocarBase = (ids, id) => (ids.includes(id) ? [id, ...ids.filter((x) => x !== id)] : ids);
export const remover = (ids, id) => ids.filter((x) => x !== id);
export const MAX_COMPARACAO = 4;
export const MIN_COMPARACAO = 2;
