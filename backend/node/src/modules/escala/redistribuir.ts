import type { DiaAberto } from '../regras/capacidade.js';
import { tetoEfetivo, type Regra } from '../regras/perfis.js';
import type { TurnoPessoa } from './cobertura.js';

export type PessoaRedistribuir = {
  matricula: string;
  nome: string;
  funcao: string;
  cargaH: number;
  // Horário fixo: não é remanejado; o turno de hoje entra como está.
  fixo: boolean;
  turno?: TurnoPessoa;
};

export type FaixaDescoberta = { dia: number; de: string; ate: string; horas: number };
export type DescobertoCargo = { funcao: string; horas: number; faixas: FaixaDescoberta[] };
export type Redistribuicao = {
  // Escala montada: uma entrada por pessoa e dia (a janela pode mudar de um dia para o outro).
  turnos: (TurnoPessoa & { matricula: string })[];
  descoberto: DescobertoCargo[];
  avisos: string[];
  // Pessoas remanejadas (os de horário fixo ficam de fora).
  remanejados: number;
};

const EPS = 1e-9;
const DOMINGO = 6;
const arred = (n: number) => Math.round(n * 100) / 100;
const hhmm = (h: number) => {
  const total = Math.round(h * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

type Celula = { dia: number; ini: number; len: number; falta: number };

// Monta, para cada cargo com exigência (pessoas por hora), uma escala semanal que respeita a regra: até `regra.dias`
// dias por pessoa, até `regra.maxDia` h por dia e o teto semanal. É uma montagem gulosa: cada pessoa, da maior carga para
// a menor, fica nos dias e janelas que cobrem mais horas ainda descobertas; o domingo só entra se ajudar mais que os outros
// dias (folga dominical preferencial). Quem tem horário fixo mantém o turno de hoje.
export const redistribuir = (
  regra: Regra,
  dias: DiaAberto[],
  pessoas: PessoaRedistribuir[],
  exigidos: Record<string, number>,
): Redistribuicao => {
  const turnos: Redistribuicao['turnos'] = [];
  const descoberto: DescobertoCargo[] = [];
  const avisos: string[] = [];
  let remanejados = 0;
  const teto = tetoEfetivo(regra);

  for (const [funcao, exigido] of Object.entries(exigidos)) {
    if (exigido <= 0) continue;
    const celulas: Celula[] = dias.flatMap((d) => {
      const lista: Celula[] = [];
      for (let ini = d.abre; ini < d.fecha - EPS; ini += 1)
        lista.push({ dia: d.dia, ini, len: Math.min(1, d.fecha - ini), falta: exigido });
      return lista;
    });
    const aplica = (dia: number, de: number, ate: number) => {
      for (const c of celulas)
        if (c.dia === dia && c.ini >= de - EPS && c.ini + c.len <= ate + EPS && c.falta > 0)
          c.falta -= 1;
    };

    const doCargo = pessoas.filter((p) => p.funcao === funcao);
    for (const p of doCargo.filter((x) => x.fixo)) {
      avisos.push(`${p.nome} (${funcao}) tem horário fixo: não foi remanejado(a).`);
      if (p.turno) {
        for (const dia of p.turno.dias) {
          turnos.push({ ...p.turno, matricula: p.matricula, dias: [dia] });
          aplica(dia, p.turno.entrada, p.turno.saida);
        }
      }
    }

    const flexiveis = doCargo
      .filter((x) => !x.fixo)
      .sort((a, b) => b.cargaH - a.cargaH || a.nome.localeCompare(b.nome));
    for (const p of flexiveis) {
      remanejados++;
      const horas = Math.min(p.cargaH, teto);
      const nDias = Math.min(
        regra.dias,
        dias.length,
        Math.max(1, Math.ceil(horas / regra.maxDia - EPS)),
      );
      const porDia = Math.min(regra.maxDia, horas / nDias);
      const usados = new Set<number>();
      for (let k = 0; k < nDias; k++) {
        let melhor: { dia: number; ini: number; fim: number; nota: number } | null = null;
        for (const d of dias) {
          if (usados.has(d.dia)) continue;
          const len = Math.min(porDia, d.fecha - d.abre);
          const inicios = new Set<number>();
          for (let s = d.abre; s + len <= d.fecha + EPS; s += 1) inicios.add(s);
          inicios.add(d.fecha - len);
          for (const s of inicios) {
            const ganho = celulas
              .filter(
                (c) =>
                  c.dia === d.dia &&
                  c.falta > 0 &&
                  c.ini >= s - EPS &&
                  c.ini + c.len <= s + len + EPS,
              )
              .reduce((t, c) => t + c.len, 0);
            const nota = ganho - (d.dia === DOMINGO ? 0.01 : 0);
            if (!melhor || nota > melhor.nota + EPS)
              melhor = { dia: d.dia, ini: s, fim: s + len, nota };
          }
        }
        if (!melhor) break;
        usados.add(melhor.dia);
        aplica(melhor.dia, melhor.ini, melhor.fim);
        turnos.push({
          funcao,
          matricula: p.matricula,
          dias: [melhor.dia],
          entrada: melhor.ini,
          saida: melhor.fim,
          iniIntervalo: null,
          fimIntervalo: null,
        });
      }
    }

    const faixas: { dia: number; ini: number; fim: number }[] = [];
    for (const c of celulas) {
      if (c.falta <= 0) continue;
      const ultima = faixas[faixas.length - 1];
      if (ultima && ultima.dia === c.dia && Math.abs(ultima.fim - c.ini) < EPS)
        ultima.fim = c.ini + c.len;
      else faixas.push({ dia: c.dia, ini: c.ini, fim: c.ini + c.len });
    }
    const final: FaixaDescoberta[] = faixas.map((f) => ({
      dia: f.dia,
      de: hhmm(f.ini),
      ate: hhmm(f.fim),
      horas: arred(f.fim - f.ini),
    }));
    descoberto.push({
      funcao,
      horas: arred(final.reduce((t, f) => t + f.horas, 0)),
      faixas: final,
    });
  }

  return { turnos, descoberto, avisos, remanejados };
};
