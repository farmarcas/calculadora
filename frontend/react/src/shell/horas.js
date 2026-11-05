// Horas de funcionamento por semana a partir do horário da loja ({ versao: 2, dias: [7 × { aberta, abre, fecha }] }).
const minutos = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

export const horasDeFuncionamento = (horarios) => {
  const dias = horarios?.dias;
  if (!Array.isArray(dias) || dias.length === 0) return null;
  let total = 0;
  let algum = false;
  for (const d of dias) {
    if (!d?.aberta) continue;
    const a = minutos(d.abre);
    const f = minutos(d.fecha);
    if (a === null || f === null || f <= a) continue;
    total += f - a;
    algum = true;
  }
  return algum ? Math.round((total / 60) * 10) / 10 : null;
};

// "77h" ou "77,5h".
export const textoDeHoras = (h) => `${String(h).replace(".", ",")}h`;
