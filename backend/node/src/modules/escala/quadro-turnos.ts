import type { DiaAberto } from '../regras/capacidade.js';
import { requisitos, type Minimos } from '../regras/requisitos.js';
import { hhmm, pedacosDe, type TurnosLoja } from '../regras/turnos.js';
import type { cobertura } from './cobertura.js';

export type CelulaQuadro = {
  turno: string;
  // Pessoas presentes na pior hora do turno (no pior dia); nulo se a loja não abre nesse turno.
  presentes: number | null;
  exigido: number;
  falta: boolean;
};
export type QuadroTurnos = {
  turnos: { nome: string; inicio: string; fim: string }[];
  cargos: { cargo: string; turnos: CelulaQuadro[] }[];
  foraDaConta: { nome: string; motivo: string }[];
};

// Por cargo e turno: quantas pessoas a loja tem na pior hora do turno × o que o turno exige.
// Sem turnos definidos, um único turno "Dia todo" com o horário de funcionamento.
export const montarQuadroTurnos = (a: {
  dias: DiaAberto[];
  turnosLoja: TurnosLoja | null | undefined;
  exigencias: Minimos;
  cob: ReturnType<typeof cobertura>;
  fora: { nome: string; motivo: string }[];
}): QuadroTurnos => {
  const req = requisitos(a.exigencias);
  const abre = a.dias.length ? Math.min(...a.dias.map((d) => d.abre)) : 0;
  const fecha = a.dias.length ? Math.max(...a.dias.map((d) => d.fecha)) : 0;
  const lista = a.turnosLoja?.turnos.length
    ? a.turnosLoja.turnos.map((t) => ({
        nome: t.nome,
        inicio: t.inicio,
        fim: t.fim,
        pedacos: pedacosDe(t),
      }))
    : [
        {
          nome: 'Dia todo',
          inicio: hhmm(abre),
          fim: hhmm(fecha),
          pedacos: [{ de: abre, ate: fecha }],
        },
      ];

  const cargos = a.cob.funcoes.map((f) => ({
    cargo: f.funcao,
    turnos: lista.map((t): CelulaQuadro => {
      const horas = t.pedacos.flatMap((p) =>
        Array.from(
          { length: Math.max(0, Math.ceil(p.ate) - Math.floor(p.de)) },
          (_, i) => Math.floor(p.de) + i,
        ),
      );
      const celulas = f.porHora.filter((c) => horas.includes(c.hora) && c.pessoas !== null);
      const exigidoDe = (h: number) => req.emHora(f.funcao, 0, h);
      const exigido = Math.max(0, ...celulas.map((c) => exigidoDe(c.hora)));
      return {
        turno: t.nome,
        presentes: celulas.length ? Math.min(...celulas.map((c) => c.pessoas!)) : null,
        exigido,
        falta: celulas.some((c) => c.pessoas! < exigidoDe(c.hora)),
      };
    }),
  }));
  return {
    turnos: lista.map(({ nome, inicio, fim }) => ({ nome, inicio, fim })),
    // Cargo que ninguém exige e ninguém ocupa não entra no quadro.
    cargos: cargos.filter((c) => c.turnos.some((t) => t.exigido > 0 || (t.presentes ?? 0) > 0)),
    foraDaConta: a.fora,
  };
};
