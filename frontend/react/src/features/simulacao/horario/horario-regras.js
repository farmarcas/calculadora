// Regras do horário da Simulação (spec 025), puras e sem React: o passo de 1 hora, os limites, a validação do que se digita
// e o estado de cada dia. Horários são textos "HH:mm"; 24:00 só vale como fechamento. O cálculo (cobertura, folha e venda)
// trabalha em horas inteiras, por isso o passo é de 1 hora e só se aceita digitar hora cheia (HH:00).

export const PASSO_MIN = 60;
export const MIN_ABERTO = 60; // a loja abre ao menos 1 hora por dia
const FIM_DO_DIA = 24 * 60;
const dois = (n) => String(n).padStart(2, "0");

export const paraMinutos = (t) => (typeof t === "string" && /^\d{2}:\d{2}$/.test(t) ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : null);
export const deMinutos = (m) => `${dois(Math.floor(m / 60))}:${dois(m % 60)}`;

// Lê o que a pessoa digitou ("8:00", "08:00", "24:00"); devolve "HH:mm" ou null se não for um horário válido.
export const lerHorario = (texto, ehFechamento = false) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(texto ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59) return null;
  if (h === 24) return ehFechamento && min === 0 ? "24:00" : null;
  if (h > 23) return null;
  return `${dois(h)}:${dois(min)}`;
};

// Passo de abertura: entre 00:00 e (fechamento − 1 hora). Fora do limite fica onde está.
export const passoDaAbertura = (abre, fecha, delta) => {
  const a = paraMinutos(abre);
  const f = paraMinutos(fecha);
  if (a === null || f === null) return abre;
  return deMinutos(Math.min(f - MIN_ABERTO, Math.max(0, a + delta * PASSO_MIN)));
};

// Passo de fechamento: entre (abertura + 1 hora) e 24:00.
export const passoDoFechamento = (abre, fecha, delta) => {
  const a = paraMinutos(abre);
  const f = paraMinutos(fecha);
  if (a === null || f === null) return fecha;
  return deMinutos(Math.min(FIM_DO_DIA, Math.max(a + MIN_ABERTO, f + delta * PASSO_MIN)));
};

// Confirma o que foi digitado em um dos campos: se é válido e respeita o outro lado, vale; senão volta ao último válido.
export const confirmarCampo = (texto, { ehFechamento, ultimoValido, outroLado }) => {
  const novo = lerHorario(texto, ehFechamento);
  if (novo === null) return ultimoValido;
  // O cálculo trabalha em horas inteiras: só vale hora cheia (o horário que já estava no campo, mesmo quebrado, continua válido).
  if (!novo.endsWith(":00") && novo !== ultimoValido) return ultimoValido;
  const n = paraMinutos(novo);
  const o = paraMinutos(outroLado);
  if (o !== null) {
    if (ehFechamento && n < o + MIN_ABERTO) return ultimoValido;
    if (!ehFechamento && n > o - MIN_ABERTO) return ultimoValido;
  }
  return novo;
};

export const horasDoDia = (abre, fecha) => {
  const a = paraMinutos(abre);
  const f = paraMinutos(fecha);
  return a === null || f === null || f <= a ? 0 : Math.round(((f - a) / 60) * 100) / 100;
};

// Estado de um dia: aberto, alterado (difere do Cadastro), fechado pela simulação ou fechado no Cadastro.
export const estadoDoDia = (simulado, cadastro) => {
  const cadAberto = !!cadastro?.aberta;
  const simAberto = !!simulado?.aberta;
  return {
    aberto: simAberto,
    alterado: simAberto !== cadAberto || (simAberto && (simulado.abre !== cadastro.abre || simulado.fecha !== cadastro.fecha)),
    fechadoNaSimulacao: cadAberto && !simAberto,
    fechadoNoCadastro: !cadAberto && !simAberto,
  };
};

// Horário em que um dia fechado abre ao clicar em "Abrir dia" (a pessoa ajusta com + e −).
export const horarioPadraoAoAbrir = () => ({ abre: "08:00", fecha: "18:00" });

// Totais da semana: horas abertas na simulação e no Cadastro.
export const totaisDaSemana = (dias, cadastro) => ({
  horas: Math.round(dias.reduce((s, d) => s + (d.aberta ? horasDoDia(d.abre, d.fecha) : 0), 0) * 100) / 100,
  antes: Math.round(cadastro.reduce((s, d) => s + (d.aberta ? horasDoDia(d.abre, d.fecha) : 0), 0) * 100) / 100,
});
