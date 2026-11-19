// Horário exato de um turno (spec 062), puro e sem React: ler e mostrar "HH:mm", validar o que a pessoa digita na janela do lápis
// e montar o turno com as horas decimais (minutos inteiros, spec 047). Os 15 minutos do arrastar não valem aqui: qualquer minuto.

export const MENSAGEM_HORARIO_INVALIDO = "Informe um horário válido, como 07:32.";

// "07:32" -> 7,5333… (horas decimais). Hora de 0 a 23 (e "24:00"), minuto de 00 a 59. Vazio ou ilegível: nulo.
export const lerHorario = (texto) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(texto ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24 || (h === 24 && min !== 0)) return null;
  return (h * 60 + min) / 60;
};

// 7,5333… -> "07:32" (minutos inteiros).
export const horarioTexto = (horas) => {
  const total = Math.round(horas * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

// Os quatro campos da janela, com o horário de hoje do turno (intervalo vazio quando não há).
export const valoresDoTurno = (t) => ({
  entrada: horarioTexto(t.entrada),
  iniIntervalo: t.iniIntervalo != null && t.fimIntervalo != null ? horarioTexto(t.iniIntervalo) : "",
  fimIntervalo: t.iniIntervalo != null && t.fimIntervalo != null ? horarioTexto(t.fimIntervalo) : "",
  saida: horarioTexto(t.saida),
});

const EPS = 1e-9;

// Valida o que foi digitado. `janela` é o funcionamento do dia ({ abre, fecha }, em horas). Devolve um erro por campo, em
// linguagem simples; sem nenhum, `ok` é verdadeiro. Um campo ilegível não puxa erro dos que dependem dele.
export const validarHorario = (valores, janela) => {
  const erros = {};
  const entrada = lerHorario(valores.entrada);
  const saida = lerHorario(valores.saida);
  const temIni = String(valores.iniIntervalo ?? "").trim() !== "";
  const temFim = String(valores.fimIntervalo ?? "").trim() !== "";
  const ini = temIni ? lerHorario(valores.iniIntervalo) : null;
  const fim = temFim ? lerHorario(valores.fimIntervalo) : null;
  const funcionamento = janela ? `A loja funciona das ${horarioTexto(janela.abre)} às ${horarioTexto(janela.fecha)} neste dia.` : null;

  if (entrada === null) erros.entrada = MENSAGEM_HORARIO_INVALIDO;
  if (saida === null) erros.saida = MENSAGEM_HORARIO_INVALIDO;
  if (entrada !== null && saida !== null && saida <= entrada + EPS) erros.saida = "A saída precisa ser depois da entrada.";
  if (janela && funcionamento) {
    if (entrada !== null && !erros.entrada && (entrada < janela.abre - EPS || entrada > janela.fecha + EPS)) erros.entrada = funcionamento;
    if (saida !== null && !erros.saida && (saida > janela.fecha + EPS || saida < janela.abre - EPS)) erros.saida = funcionamento;
  }

  // Intervalo: os dois campos ou nenhum.
  if (temIni && ini === null) erros.iniIntervalo = MENSAGEM_HORARIO_INVALIDO;
  if (temFim && fim === null) erros.fimIntervalo = MENSAGEM_HORARIO_INVALIDO;
  if (temIni !== temFim) erros[temIni ? "fimIntervalo" : "iniIntervalo"] = "Preencha o início e o fim do intervalo, ou deixe os dois vazios.";
  if (ini !== null && fim !== null) {
    if (fim <= ini + EPS) erros.fimIntervalo = "O início do intervalo precisa ser antes do fim.";
    else if (entrada !== null && saida !== null && !erros.entrada && !erros.saida) {
      if (ini < entrada - EPS) erros.iniIntervalo = "O intervalo precisa ficar dentro do turno.";
      else if (fim > saida + EPS) erros.fimIntervalo = "O intervalo precisa ficar dentro do turno.";
    }
  }
  return { ok: Object.keys(erros).length === 0, erros };
};

// O turno com os valores digitados (já validados). O horário digitado é a escolha da pessoa: some o "ajustado" (`antes`).
export const turnoDeValores = (turno, valores) => {
  const temIntervalo = String(valores.iniIntervalo ?? "").trim() !== "" && String(valores.fimIntervalo ?? "").trim() !== "";
  return {
    ...turno,
    entrada: lerHorario(valores.entrada),
    saida: lerHorario(valores.saida),
    iniIntervalo: temIntervalo ? lerHorario(valores.iniIntervalo) : null,
    fimIntervalo: temIntervalo ? lerHorario(valores.fimIntervalo) : null,
    antes: undefined,
  };
};

// A janela mudou o horário? (Salvar sem mudança só fecha.)
const igual = (a, b) => (a == null && b == null) || (a != null && b != null && Math.abs(a - b) <= EPS);
export const horarioMudou = (turno, novo) => !(igual(turno.entrada, novo.entrada) && igual(turno.saida, novo.saida) && igual(turno.iniIntervalo, novo.iniIntervalo) && igual(turno.fimIntervalo, novo.fimIntervalo));
