import { ValidationError } from '../../shared/errors/validation-error.js';
import { verificarRegra, type DiaAberto } from '../regras/capacidade.js';
import { tetoEfetivo, type Regra } from '../regras/perfis.js';
import type { PessoaSim, TurnoSim } from './avaliar.js';

export type VagaEntrada = { matricula?: string; funcao: string; cargaH: number };

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
  const turnosFinais = turnos.filter((t) => existentes.has(t.matricula));
  const depois = new Set(novo.filter((p) => p.vaga).map((p) => p.matricula));
  return {
    quadro: novo,
    turnos: turnosFinais,
    adicionadas: [...depois].filter((m) => !antes.has(m)),
    removidas: [...antes].filter((m) => !depois.has(m)),
  };
};

// Contratações que o diagnóstico sugere na regra: vaga parcial quando basta uma, senão vagas de jornada cheia.
export const vagasSugeridas = (
  regra: Regra,
  dias: DiaAberto[],
  minimos: Record<string, number>,
  quadro: PessoaSim[],
): VagaEntrada[] => {
  const pessoas = quadro
    .filter((p) => p.funcao && !p.desligado)
    .map((p) => ({ funcao: p.funcao!, cargaH: p.cargaH }));
  const cheia = Math.min(44, Math.floor(tetoEfetivo(regra)));
  return verificarRegra(regra, dias, minimos, pessoas)
    .filter((l) => l.contratar > 0)
    .flatMap((l) =>
      l.contratar === 1 && l.parcialH
        ? [{ funcao: l.funcao, cargaH: Math.min(44, Math.floor(l.parcialH)) }]
        : Array.from({ length: l.contratar }, () => ({ funcao: l.funcao, cargaH: cheia })),
    );
};
