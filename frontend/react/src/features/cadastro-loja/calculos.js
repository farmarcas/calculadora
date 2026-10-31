// Contas puras da tela de Cadastro de loja (sem React): horas do dia, soma semanal, mensal e divergência.

export const NOMES_DIA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export const TOLERANCIA_MENSAL = 0.1;
const SEMANAS_NO_MES = 52 / 12;

const arred = (n) => Math.round(n * 100) / 100;
export const minutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// "8:00" → "08:00"; vazio ou inválido → null. "24:00" só vale (e só como fechamento) se `fechamento`.
export const lerHora = (txt, fechamento = false) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec((txt ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 24 || (h === 24 && (min !== 0 || !fechamento))) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

// Fechamento "00:00" é a meia-noite do dia seguinte ("24:00"), exceto quando a abertura também é 00:00 (dia de 24 horas).
export const fimDoDia = (abre, fecha) => (fecha === "00:00" && abre !== "00:00" ? "24:00" : fecha);

// Horas do dia: fecha − abre (00:00 de fechamento = meia-noite); dia 24h = 24; dia fechado ou incompleto = 0.
export const horasDoDia = (d) => {
  if (!d?.aberta) return 0;
  if (d.h24) return 24;
  const a = lerHora(d.abre);
  const f = lerHora(d.fecha, true);
  if (!a || !f) return 0;
  const fim = minutos(fimDoDia(a, f));
  return fim > minutos(a) ? arred((fim - minutos(a)) / 60) : 0;
};
export const horasDaSemana = (horarios) => arred((horarios?.dias ?? []).reduce((s, d) => s + horasDoDia(d), 0));

// Faturamento de uma semana: só os dias abertos entram.
export const faturamentoDaSemana = (horarios, dias) =>
  arred((horarios?.dias ?? []).reduce((s, d, i) => s + (d.aberta ? Number(dias?.[i] ?? 0) : 0), 0));

// Soma dos dias × 52 ÷ 12.
export const mensalDosDias = (semanal) => Math.round(semanal * SEMANAS_NO_MES);

// O mensal informado difere mais de 10% da soma dos dias? (só compara quando os dois existem)
export const divergenciaMensal = (informado, calculado) => {
  if (!informado || !(calculado > 0)) return { diverge: false, direcao: null, pct: 0 };
  const pct = (informado - calculado) / calculado;
  return { diverge: Math.abs(pct) > TOLERANCIA_MENSAL, direcao: pct > 0 ? "acima" : "abaixo", pct };
};

// Erro de um dia aberto (texto), ou null. Dia fechado e dia 24h não têm o que validar.
export const erroDoDia = (d) => {
  if (!d.aberta || d.h24) return null;
  const a = lerHora(d.abre);
  const f = lerHora(d.fecha, true);
  if (!a || !f) return "Use o formato HH:mm (ex.: 08:00).";
  if (minutos(fimDoDia(a, f)) <= minutos(a)) return "O fechamento precisa ser depois da abertura.";
  return null;
};

// Dia como a tela edita (texto livre) → dia como a API grava ("00:00" de fechamento vira "24:00").
export const diaParaApi = (d) => {
  if (!d.aberta) return { aberta: false };
  if (d.h24) return { aberta: true, h24: true, abre: "00:00", fecha: "24:00" };
  const a = lerHora(d.abre);
  const f = lerHora(d.fecha, true);
  return { aberta: true, abre: a ?? d.abre, fecha: f ? fimDoDia(a ?? d.abre, f) : d.fecha };
};
// API → tela: o fechamento de meia-noite aparece como "00:00".
export const diaParaTela = (d) => {
  if (!d?.aberta) return { aberta: false };
  if (d.h24) return { aberta: true, h24: true, abre: "00:00", fecha: "00:00" };
  return { aberta: true, abre: d.abre ?? "", fecha: d.fecha === "24:00" ? "00:00" : (d.fecha ?? "") };
};

// "Copiar horário da segunda": só aberta, 24h, abre e fecha; nunca o faturamento.
export const copiarHorarioDaSegunda = (horarios) => {
  const seg = horarios.dias[0];
  return { ...horarios, dias: horarios.dias.map((_, i) => (i === 0 ? horarios.dias[0] : { ...seg })) };
};
// "Loja 24 horas": os 7 dias abertos e 24h.
export const semana24h = () => ({ versao: 2, dias: Array.from({ length: 7 }, () => ({ aberta: true, h24: true, abre: "00:00", fecha: "00:00" })) });
export const lojaEh24h = (horarios) => !!horarios?.dias?.length && horarios.dias.every((d) => d.aberta && d.h24);

// Faturamento que a tela edita (nunca com valor em dia fechado) → null quando está tudo vazio.
export const faturamentoParaApi = (f, horarios) => {
  if (!f) return null;
  const dias = f.dias.map((v, i) => (horarios.dias[i]?.aberta && v !== "" && v != null ? Number(v) : null));
  const vazio = dias.every((v) => v === null) && (f.mensal === "" || f.mensal == null) && (f.margemPct === "" || f.margemPct == null);
  return vazio ? null : { dias, mensal: f.mensal === "" || f.mensal == null ? null : Number(f.mensal), margemPct: f.margemPct === "" || f.margemPct == null ? null : Number(f.margemPct) };
};

// Erros dos dados da aba, com o campo, para focar o primeiro. `dono` liga as validações de faturamento.
export const errosDaLoja = (l, { dono }) => {
  const erros = [];
  if (!l.nome || l.nome.trim().length < 2) erros.push({ campo: "nome", texto: "Informe o nome da loja (ao menos 2 letras)." });
  (l.horarios?.dias ?? []).forEach((d, i) => {
    const e = erroDoDia(d);
    if (e) erros.push({ campo: `dia-${i}`, texto: `${NOMES_DIA[i]}: ${e}` });
  });
  if (dono && l.faturamento) {
    l.faturamento.dias.forEach((v, i) => {
      if (v !== "" && v != null && !(Number(v) >= 0)) erros.push({ campo: `fat-${i}`, texto: `${NOMES_DIA[i]}: o faturamento precisa ser zero ou maior.` });
    });
    const m = l.faturamento.margemPct;
    if (m !== "" && m != null && !(Number(m) >= 0 && Number(m) <= 100)) erros.push({ campo: "margem", texto: "A margem bruta deve ficar entre 0 e 100%." });
    if (l.faturamento.mensal !== "" && l.faturamento.mensal != null && !(Number(l.faturamento.mensal) >= 0)) erros.push({ campo: "mensal", texto: "O faturamento mensal precisa ser zero ou maior." });
  }
  return erros;
};

// Bloco "loja" da tela → corpo da API (só os campos que mudaram). Texto vazio de UF é omitido; regime vazio vira null.
export const lojaParaApi = (parte, completo) => {
  const out = {};
  for (const [k, v] of Object.entries(parte)) {
    if (k === "horarios") out.horarios = { versao: 2, dias: v.dias.map(diaParaApi) };
    else if (k === "faturamento") out.faturamento = faturamentoParaApi(v, completo.horarios);
    else if (k === "uf") { if (v) out.uf = v; }
    else if (k === "regimeTributario") out.regimeTributario = v || null;
    else if (k === "cnpj") { if (v) out.cnpj = v; }
    else out[k] = typeof v === "string" ? v.trim() : v;
  }
  // Mudou só o horário? O faturamento de dia fechado já foi limpo na tela, mas o servidor recebe o valor atual junto.
  return out;
};
