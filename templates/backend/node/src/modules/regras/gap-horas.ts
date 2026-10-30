import type { DiaAberto } from './capacidade.js';
import { tetoEfetivo, type Regra } from './perfis.js';

// Gap em horas semanais por cargo. O farmacêutico é o único cargo obrigatório: precisa estar presente em todas as
// horas de funcionamento. Os demais não têm mínimo: a meta é manter o nível de hoje (as horas que o cargo cumpre
// hoje) ou a meta que o dono informou. Funções puras, sem banco.
export const FARMACEUTICO = 'Farmacêutico';

export type PessoaHoras = { funcao: string; cargaH: number };

export type EntradaGap = {
  // Regra analisada e a regra atual (o teto de hoje, que define o "nível de hoje").
  regra: Regra;
  regraAtual: Regra;
  // Horário do cenário; com `horasAbertasHoje` a meta dos demais cargos acompanha as horas abertas.
  dias: DiaAberto[];
  horasAbertasHoje?: number;
  pessoas: PessoaHoras[];
  // Meta do dono: pessoas por cargo (o "mínimo por função" de antes). Maior que zero vale no lugar do nível de hoje.
  metasDono?: Record<string, number>;
};

export type GapCargo = {
  funcao: string;
  obrigatorio: boolean;
  pessoas: number;
  // Horas que o cargo precisa (farmacêutico: horas abertas) ou deseja (demais: a meta), na semana.
  necessidadeH: number;
  capacidadeH: number;
  saldoH: number;
  gapH: number;
  // De onde veio a meta dos demais cargos.
  origemMeta: 'lei' | 'nivel_de_hoje' | 'dono' | 'nenhuma';
};

const arred = (n: number) => Math.round(n * 100) / 100;

export const horasAbertasNaSemana = (dias: DiaAberto[]) =>
  dias.reduce((s, d) => s + (d.fecha - d.abre), 0);

// Meta padrão de um cargo sem mínimo: as horas que ele cumpre hoje (cada pessoa até a jornada atual), na proporção
// das horas abertas do cenário.
export const metaNivelDeHoje = (pessoas: PessoaHoras[], tetoHojeH: number, escala = 1) =>
  pessoas.reduce((s, p) => s + Math.min(p.cargaH, tetoHojeH), 0) * escala;

export const gapPorCargo = (e: EntradaGap): GapCargo[] => {
  const abertas = horasAbertasNaSemana(e.dias);
  const hoje = e.horasAbertasHoje ?? abertas;
  const escala = hoje > 0 ? abertas / hoje : 1;
  const tetoHoje = tetoEfetivo(e.regraAtual);
  const teto = tetoEfetivo(e.regra);
  const cargos = [
    ...new Set([
      FARMACEUTICO,
      ...e.pessoas.map((p) => p.funcao),
      ...Object.keys(e.metasDono ?? {}),
    ]),
  ];

  return cargos.map((funcao): GapCargo => {
    const quadro = e.pessoas.filter((p) => p.funcao === funcao);
    const capacidadeH = quadro.reduce((s, p) => s + Math.min(p.cargaH, teto), 0);
    const obrigatorio = funcao === FARMACEUTICO;
    let necessidadeH: number;
    let origemMeta: GapCargo['origemMeta'];
    if (obrigatorio) {
      // Ao menos 1 farmacêutico em todas as horas; o dono pode pedir mais.
      necessidadeH = abertas * Math.max(1, e.metasDono?.[FARMACEUTICO] ?? 1);
      origemMeta = 'lei';
    } else if ((e.metasDono?.[funcao] ?? 0) > 0) {
      necessidadeH = abertas * e.metasDono![funcao]!;
      origemMeta = 'dono';
    } else {
      const hojeH = metaNivelDeHoje(quadro, tetoHoje);
      necessidadeH = hojeH * escala;
      origemMeta = hojeH > 0 ? 'nivel_de_hoje' : 'nenhuma';
    }
    const saldoH = arred(capacidadeH - necessidadeH);
    return {
      funcao,
      obrigatorio,
      pessoas: quadro.length,
      necessidadeH: arred(necessidadeH),
      capacidadeH: arred(capacidadeH),
      saldoH,
      gapH: Math.max(0, -saldoH),
      origemMeta,
    };
  });
};
