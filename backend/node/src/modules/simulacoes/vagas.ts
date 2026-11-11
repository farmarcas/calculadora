import { ValidationError } from '../../shared/errors/validation-error.js';
import { verificarRegra, type DiaAberto } from '../regras/capacidade.js';
import { tetoEfetivo, type Regra } from '../regras/perfis.js';
import type { Minimos } from '../regras/requisitos.js';
import type { PessoaSim, TurnoSim } from './avaliar.js';

export type TurnoDeVaga = {
  dia: number;
  entrada: number;
  saida: number;
  iniIntervalo?: number | null;
  fimIntervalo?: number | null;
};
export type VagaEntrada = {
  matricula?: string;
  funcao: string;
  cargaH: number;
  // Só para vaga nova: ganham a matrícula que o servidor atribui à vaga.
  turnos?: TurnoDeVaga[];
};

const MAX_VAGAS = 20;
const numeroDa = (m: string) => Number(m.replace('VAGA-', ''));

// Monta o quadro com as vagas e os desligamentos pedidos. Vaga nunca existe no cadastro.
export const aplicarVagasEDesligados = (
  quadro: PessoaSim[],
  turnos: TurnoSim[],
  vagas?: VagaEntrada[],
  desligados?: string[],
) => {
  let novo = quadro;
  const antes = new Set(quadro.filter((p) => p.vaga).map((p) => p.matricula));
  // Turnos das vagas criadas agora (a matrícula só existe depois de atribuída).
  const turnosNovos: TurnoSim[] = [];

  if (vagas) {
    if (vagas.length > MAX_VAGAS)
      throw new ValidationError(`No máximo ${MAX_VAGAS} vagas por simulação`);
    const doQuadro = quadro.filter((p) => !p.vaga);
    let proximo = Math.max(0, ...[...antes].map(numeroDa)) + 1;
    const mantidas = new Set<string>();
    const lista: PessoaSim[] = vagas.map((v) => {
      if (v.matricula) {
        if (!antes.has(v.matricula))
          throw new ValidationError(`A vaga ${v.matricula} não existe nesta simulação`);
        if (mantidas.has(v.matricula))
          throw new ValidationError(`A vaga ${v.matricula} veio duas vezes`);
        mantidas.add(v.matricula);
        return {
          matricula: v.matricula,
          nome: `Vaga ${numeroDa(v.matricula)}`,
          funcao: v.funcao,
          cargaH: v.cargaH,
          vaga: true,
        };
      }
      const n = proximo++;
      for (const t of v.turnos ?? [])
        turnosNovos.push({
          matricula: `VAGA-${n}`,
          dia: t.dia,
          entrada: t.entrada,
          saida: t.saida,
          iniIntervalo: t.iniIntervalo ?? null,
          fimIntervalo: t.fimIntervalo ?? null,
        });
      return {
        matricula: `VAGA-${n}`,
        nome: `Vaga ${n}`,
        funcao: v.funcao,
        cargaH: v.cargaH,
        vaga: true,
      };
    });
    novo = [...doQuadro, ...lista];
  }

  if (desligados) {
    const conhecidas = new Map(novo.map((p) => [p.matricula, p]));
    for (const m of desligados) {
      const p = conhecidas.get(m);
      if (!p) throw new ValidationError(`Pessoa ${m} não faz parte desta simulação`);
      if (p.vaga)
        throw new ValidationError(
          `${p.nome} é uma vaga simulada: remova a vaga em vez de desligar`,
        );
    }
    const fora = new Set(desligados);
    novo = novo.map((p) => (p.vaga ? p : { ...p, desligado: fora.has(p.matricula) || undefined }));
  }

  const existentes = new Set(novo.map((p) => p.matricula));
  const turnosFinais = [...turnos.filter((t) => existentes.has(t.matricula)), ...turnosNovos];
  const depois = new Set(novo.filter((p) => p.vaga).map((p) => p.matricula));
  return {
    quadro: novo,
    turnos: turnosFinais,
    adicionadas: [...depois].filter((m) => !antes.has(m)),
    removidas: [...antes].filter((m) => !depois.has(m)),
  };
};

// Contratações que o diagnóstico sugere na regra: integrais, parcial de até 30 h, ou integrais mais um parcial.
export const vagasSugeridas = (
  regra: Regra,
  dias: DiaAberto[],
  minimos: Minimos,
  quadro: PessoaSim[],
): VagaEntrada[] => {
  const pessoas = quadro
    .filter((p) => p.funcao && !p.desligado)
    .map((p) => ({ funcao: p.funcao!, cargaH: p.cargaH }));
  const cheia = Math.min(44, Math.floor(tetoEfetivo(regra)));
  return verificarRegra(regra, dias, minimos, pessoas)
    .filter((l) => l.contratar > 0)
    .flatMap((l) => [
      ...Array.from({ length: l.contratarInteiras }, () => ({ funcao: l.funcao, cargaH: cheia })),
      ...(l.parcialH ? [{ funcao: l.funcao, cargaH: Math.min(44, l.parcialH) }] : []),
    ]);
};

// O Cadastro pode ter horários com minutos fora dos quartos de hora (14h38); a simulação só guarda de 15 em 15 minutos. Cada
// hora vai para o quarto mais perto, sem deixar a saída antes da entrada.
const emQuarto = (h: number) => Math.round(h * 4) / 4;
export const emQuartosDeHora = (turnos: TurnoSim[]): TurnoSim[] =>
  turnos.map((t) => {
    const entrada = emQuarto(t.entrada);
    return {
      ...t,
      entrada,
      saida: Math.max(emQuarto(t.saida), entrada + 0.25),
      iniIntervalo: t.iniIntervalo == null ? null : emQuarto(t.iniIntervalo),
      fimIntervalo: t.fimIntervalo == null ? null : emQuarto(t.fimIntervalo),
    };
  });

// A jornada cheia de uma contratação na regra (spec 044: só se contrata integral): a mesma que a sugestão dos cenários usa.
export const jornadaCheiaH = (regra: Regra) => Math.min(44, Math.floor(tetoEfetivo(regra)));

// Vaga nova (sem matrícula) só vale integral; vaga que já existe numa simulação salva segue como estava.
export const exigirVagasIntegrais = (vagas: VagaEntrada[] | undefined, regra: Regra) => {
  const cheia = jornadaCheiaH(regra);
  for (const v of vagas ?? [])
    if (!v.matricula && v.cargaH !== cheia)
      throw new ValidationError(`A contratação é integral: ${cheia} horas por semana nesta regra.`);
};
