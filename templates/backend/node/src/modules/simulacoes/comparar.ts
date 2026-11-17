import type { CoberturaDia, PessoaSim, TurnoSim } from './avaliar.js';
import { ativos, horasLiquidas } from './avaliar.js';

export type Indicadores = {
  erros: number;
  avisos: number;
  semFarmaceutico: boolean;
  coberturaPct: number; // horas-função cobertas ÷ horas-função exigidas
  horasFalta: number; // pessoa-horas abaixo do mínimo
  horasSobra: number; // pessoa-horas acima do mínimo
  pessoas: number;
  horasPlanejadas: number;
  horasContratadas: number;
  domingosTrabalhados: number;
  folgasPorPessoa: number;
};

const arred = (n: number) => Math.round(n * 100) / 100;

export const calcularIndicadores = (a: {
  quadro: PessoaSim[];
  turnos: TurnoSim[];
  erros: { regra: string }[];
  avisos: unknown[];
  cobertura: Record<number, CoberturaDia>;
}): Indicadores => {
  const { quadro, turnos } = ativos(a.quadro, a.turnos);
  let total = 0;
  let ok = 0;
  let falta = 0;
  let sobra = 0;
  for (const dia of Object.values(a.cobertura))
    for (const f of dia) {
      if (f.minimo <= 0) continue;
      for (const c of f.porHora) {
        total++;
        if (c.ok) ok++;
        falta += Math.max(0, f.minimo - c.pessoas);
        sobra += Math.max(0, c.pessoas - f.minimo);
      }
    }
  const diasPorPessoa = quadro.map(
    (p) => new Set(turnos.filter((t) => t.matricula === p.matricula).map((t) => t.dia)).size,
  );
  return {
    erros: a.erros.length,
    avisos: a.avisos.length,
    semFarmaceutico: a.erros.some((e) => e.regra === 'farmaceutico'),
    coberturaPct: total ? arred((ok / total) * 100) : 100,
    horasFalta: arred(falta),
    horasSobra: arred(sobra),
    pessoas: quadro.length,
    horasPlanejadas: arred(turnos.reduce((s, t) => s + horasLiquidas(t), 0)),
    horasContratadas: arred(quadro.reduce((s, p) => s + p.cargaH, 0)),
    domingosTrabalhados: turnos.filter((t) => t.dia === 6).length,
    folgasPorPessoa: quadro.length
      ? arred(diasPorPessoa.reduce((s, d) => s + (7 - d), 0) / quadro.length)
      : 0,
  };
};

// Parágrafo curto: o que a simulação faz, só com os próprios números (cobertura, horas, vagas e o que falta).
export const sintese = (nome: string, i: Indicadores, extra: { vagas?: number } = {}): string => {
  const partes: string[] = [];
  if (i.erros > 0) partes.push(`tem ${i.erros} erro(s) nas regras`);
  if (i.semFarmaceutico) partes.push('deixa horário sem farmacêutico');
  partes.push(`cobre ${i.coberturaPct}% das horas exigidas`);
  if (extra.vagas) partes.push(`exige contratar ${extra.vagas} vaga(s)`);
  if (i.horasFalta > 0) partes.push(`faltam ${i.horasFalta}h-pessoa por semana`);
  return `${nome} ${partes.join('; ')}.`;
};
