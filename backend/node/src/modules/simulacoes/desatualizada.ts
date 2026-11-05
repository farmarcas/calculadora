import { normalizarHorarios } from '../cadastros/horarios.js';
import { minimosIguais, type Minimos } from '../regras/requisitos.js';
import type { PessoaSim } from './avaliar.js';
import type { Premissas } from './simulacoes.repository.js';

// Uma simulação gravada fica "desatualizada" quando os dados da loja mudaram depois que ela foi gravada
// (RN-E10). Nada é alterado sozinho: só avisa. A regra é pura: recebe o retrato gravado e o que a loja tem hoje,
// já lidos (a lista lê a loja e o quadro uma vez só para todas as simulações).
export type LojaDeHoje = {
  horarios: unknown;
  minimos: Minimos;
  convencao8h24: boolean;
};
export type PessoaDeHoje = { matricula: string; nome: string };
export type SituacaoDaPessoa = { lojaId: string; ativo: boolean };

export const motivosDeDesatualizacao = (a: {
  status: string;
  lojaId: string;
  quadro: PessoaSim[];
  premissas: Premissas | null;
  hoje: LojaDeHoje;
  quadroDeHoje: PessoaDeHoje[];
  situacao: Map<string, SituacaoDaPessoa>;
}): string[] => {
  if (a.status !== 'gravada' || !a.premissas) return [];
  const motivos: string[] = [];
  const noQuadro = new Set(a.quadro.map((p) => p.matricula));
  const novos = a.quadroDeHoje.filter((p) => !noQuadro.has(p.matricula));
  if (novos.length) motivos.push(`Entrou no quadro da loja: ${novos.map((p) => p.nome).join(', ')}.`);
  const sairam = a.quadro.filter((p) => {
    const x = a.situacao.get(p.matricula);
    return x && (!x.ativo || x.lojaId !== a.lojaId);
  });
  if (sairam.length) motivos.push(`Saiu do quadro da loja: ${sairam.map((p) => p.nome).join(', ')}.`);
  // Compara os dois já convertidos: só mudar o formato do cadastro não é mudança de horário.
  if (
    JSON.stringify(normalizarHorarios(a.hoje.horarios)) !==
    JSON.stringify(normalizarHorarios(a.premissas.horarios))
  )
    motivos.push('O horário de funcionamento da loja mudou.');
  if (!minimosIguais(a.hoje.minimos, a.premissas.minimos))
    motivos.push('O mínimo de pessoas por função mudou.');
  if (a.hoje.convencao8h24 !== a.premissas.convencao8h24)
    motivos.push('A convenção coletiva (8h24 por dia) mudou.');
  return motivos;
};
