// Horário de funcionamento da loja, dia a dia (segunda a domingo). Funções puras, sem banco.
// Formato novo: { versao: 2, dias: [7 × { aberta, h24?, abre?, fecha? }] }, índice 0 = segunda.
// O formato antigo ({ semana?, sabado?, domingo? }) é lido e convertido, então dados antigos continuam valendo.
export type DiaHorario = { aberta: boolean; h24?: boolean; abre?: string; fecha?: string };
export type HorariosSemana = { versao: 2; dias: DiaHorario[] };
type FaixaAntiga = { abre: string; fecha: string };
type HorariosAntigo = { semana?: FaixaAntiga; sabado?: FaixaAntiga; domingo?: FaixaAntiga };

export const NOMES_DIA_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const RE_HORA = /^([01]?\d|2[0-3]):([0-5]\d)$/;

// "8:00" → "08:00"; "24:00" só vale como fechamento.
export const formatarHora = (txt: string | undefined): string | null => {
  if (!txt) return null;
  const t = txt.trim();
  if (t === '24:00') return t;
  const m = RE_HORA.exec(t);
  return m ? `${m[1]!.padStart(2, '0')}:${m[2]}` : null;
};
const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export const DIA_24H: DiaHorario = { aberta: true, h24: true, abre: '00:00', fecha: '24:00' };
export const DIA_FECHADO: DiaHorario = { aberta: false };
export const semana24h = (): HorariosSemana => ({
  versao: 2,
  dias: Array.from({ length: 7 }, () => ({ ...DIA_24H })),
});

const faixaDe = (f: FaixaAntiga | undefined): DiaHorario => {
  if (!f) return { ...DIA_FECHADO };
  const abre = formatarHora(f.abre);
  const fecha = formatarHora(f.fecha);
  if (!abre || !fecha) return { ...DIA_FECHADO };
  return abre === '00:00' && fecha === '24:00' ? { ...DIA_24H } : { aberta: true, abre, fecha };
};

const diaNormalizado = (d: unknown): DiaHorario | null => {
  if (!d || typeof d !== 'object') return null;
  const x = d as Record<string, unknown>;
  if (typeof x['aberta'] !== 'boolean') return null;
  if (!x['aberta']) return { ...DIA_FECHADO };
  if (x['h24'] === true) return { ...DIA_24H };
  const abre = formatarHora(typeof x['abre'] === 'string' ? x['abre'] : undefined);
  const fecha = formatarHora(typeof x['fecha'] === 'string' ? x['fecha'] : undefined);
  // Dia aberto com horário ausente ou ilegível é mantido como veio: a validação aponta o erro.
  return { aberta: true, ...(abre ? { abre } : {}), ...(fecha ? { fecha } : {}) };
};

// Lê qualquer um dos dois formatos e devolve sempre o novo. Nulo quando não há horário nenhum.
export const normalizarHorarios = (raw: unknown): HorariosSemana | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (o['versao'] === 2 && Array.isArray(o['dias'])) {
    if (o['dias'].length !== 7) return null;
    const dias = o['dias'].map(diaNormalizado);
    return dias.every((d): d is DiaHorario => d !== null) ? { versao: 2, dias } : null;
  }
  const antigo = o as HorariosAntigo;
  if (!antigo.semana && !antigo.sabado && !antigo.domingo) return null;
  const sem = faixaDe(antigo.semana);
  return {
    versao: 2,
    dias: [
      sem,
      { ...sem },
      { ...sem },
      { ...sem },
      { ...sem },
      faixaDe(antigo.sabado),
      faixaDe(antigo.domingo),
    ],
  };
};

// Mensagens de erro (em português simples) para dias abertos com horário inválido.
export const validarHorarios = (h: HorariosSemana): string[] => {
  const erros: string[] = [];
  h.dias.forEach((d, i) => {
    if (!d.aberta || d.h24) return;
    const abre = formatarHora(d.abre);
    const fecha = formatarHora(d.fecha);
    if (!abre || !fecha)
      erros.push(
        `${NOMES_DIA_CURTO[i]}: informe a abertura e o fechamento (HH:MM) ou marque 24 horas.`,
      );
    else if (abre === '24:00') erros.push(`${NOMES_DIA_CURTO[i]}: a abertura não pode ser 24:00.`);
    else if (minutos(fecha) <= minutos(abre))
      erros.push(
        `${NOMES_DIA_CURTO[i]}: o fechamento (${fecha}) precisa ser depois da abertura (${abre}).`,
      );
  });
  return erros;
};

// Dia aberto com faixa válida, em horas decimais, para o cálculo.
export const faixasDaSemana = (
  h: HorariosSemana | null,
): { dia: number; abre: number; fecha: number }[] => {
  if (!h) return [];
  return h.dias.flatMap((d, dia) => {
    if (!d.aberta) return [];
    const abre = formatarHora(d.abre);
    const fecha = formatarHora(d.fecha);
    if (!abre || !fecha) return [];
    const a = minutos(abre) / 60;
    const f = minutos(fecha) / 60;
    return f > a ? [{ dia, abre: a, fecha: f }] : [];
  });
};

export const horasAbertasNaSemana = (h: HorariosSemana | null) =>
  faixasDaSemana(h).reduce((s, d) => s + (d.fecha - d.abre), 0);

const rotuloDia = (d: DiaHorario) =>
  !d.aberta ? 'fechada' : d.h24 ? '24h' : `${d.abre}–${d.fecha}`;

// "Seg a sáb 08:00–22:00 · Dom fechada" | "Todos os dias 24h": agrupa dias seguidos com o mesmo horário.
export const resumoHorarios = (h: HorariosSemana | null): string => {
  if (!h) return 'Não cadastrado';
  const grupos: { de: number; ate: number; texto: string }[] = [];
  h.dias.forEach((d, i) => {
    const texto = rotuloDia(d);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.texto === texto) ultimo.ate = i;
    else grupos.push({ de: i, ate: i, texto });
  });
  if (grupos.length === 1) {
    const g = grupos[0]!;
    return g.texto === 'fechada' ? 'Fechada todos os dias' : `Todos os dias ${g.texto}`;
  }
  const nome = (i: number) => (i === 0 ? NOMES_DIA_CURTO[i] : NOMES_DIA_CURTO[i]!.toLowerCase())!;
  return grupos
    .map((g) => {
      const dias =
        g.de === g.ate ? NOMES_DIA_CURTO[g.de]! : `${NOMES_DIA_CURTO[g.de]} a ${nome(g.ate)}`;
      return `${dias} ${g.texto}`;
    })
    .join(' · ');
};
