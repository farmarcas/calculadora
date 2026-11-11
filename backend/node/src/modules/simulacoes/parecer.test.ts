import { describe, expect, it } from 'vitest';
import type { DiaAberto } from '../regras/capacidade.js';
import { regraPara } from '../regras/perfis.js';
import type { VendaLinha } from '../escala/vendas.js';
import type { PessoaSim, TurnoSim } from './avaliar.js';
import { montarParecer, type TextoDoParecer } from './parecer.js';
import { calcularResultado } from './resultado.js';

const regra = regraPara('r40', false);
const regraAtual = regraPara('atual', false);
const custos = { salarioMedio: { Farmacêutico: 6000, Atendimento: 2000 }, encargosPct: 40 };
const quadro: PessoaSim[] = [
  { matricula: 'A', nome: 'Ana', funcao: 'Farmacêutico', cargaH: 40 },
  { matricula: 'B', nome: 'Bia', funcao: 'Farmacêutico', cargaH: 40 },
];
const vaga: PessoaSim = {
  matricula: 'VAGA-1',
  nome: 'Vaga 1',
  funcao: 'Farmacêutico',
  cargaH: 40,
  vaga: true,
};
const venda = (hora: number, v: number): VendaLinha => ({
  data: '2026-01-05',
  hora,
  venda: v,
  margem: null,
  clientes: 0,
  unidades: 0,
});
const pequena: DiaAberto[] = [{ dia: 0, abre: 8, fecha: 16 }];
const turnos = (q: PessoaSim[]): TurnoSim[] =>
  q
    .filter((p) => !p.vaga)
    .flatMap((p) =>
      [0, 1, 2, 3, 4].map((dia) => ({
        matricula: p.matricula,
        dia,
        entrada: 8,
        saida: 16,
        iniIntervalo: null,
        fimIntervalo: null,
      })),
    );

const resultado = (over: Partial<Parameters<typeof calcularResultado>[0]> = {}) =>
  calcularResultado({
    regraId: 'r40',
    regra,
    regraAtual,
    dias: pequena,
    diasCadastro: pequena,
    minimos: {},
    quadro,
    vendas: [venda(10, 1000), venda(12, 1000)],
    custos,
    faturamentoMensalRef: 100000,
    cmvMedioPct: 60,
    dono: true,
    ...over,
  });
const parecer = (over: Partial<Parameters<typeof calcularResultado>[0]> = {}) => {
  const q = (over.quadro as PessoaSim[] | undefined) ?? quadro;
  return montarParecer({ quadro: q, turnos: turnos(q), resultado: resultado(over) });
};
const textoTodo = (t: TextoDoParecer) =>
  [
    ...t.resumo,
    ...t.decisoes.flatMap((s) => [s.titulo, ...s.itens]),
    ...t.efeitos.flatMap((s) => [s.titulo, ...s.itens]),
  ].join('\n');

describe('montarParecer (spec 056)', () => {
  it('com contratação: o dono lê pesos e reais; resumo em 3 frases', () => {
    const p = parecer({ quadro: [...quadro, vaga] });
    expect(p.dono.resumo).toHaveLength(3);
    expect(p.dono.resumo[0]).toContain('contrata 1 farmacêutico');
    expect(p.dono.resumo[2]).toMatch(
      /^A folha sobe de \d+,\d% para \d+,\d% do faturamento \(R\$ [\d.]+ por mês\)\.$/,
    );
    const t = textoTodo(p.dono);
    expect(t).toContain('1 farmacêutico, 40 h por semana (jornada cheia).');
    expect(t).toMatch(/Folha por mês: de R\$ [\d.]+ para R\$ [\d.]+\./);
    expect(t).toContain('Pessoas: de 2 para 3.');
    expect(t).toContain('Nenhum desligamento.');
    expect(t).toContain('Horário igual ao do Cadastro.');
  });

  it('versão pública: mesma estrutura, só o sentido (sem R$ nem %)', () => {
    const p = parecer({ quadro: [...quadro, vaga] });
    const t = textoTodo(p.publico);
    expect(p.publico.resumo[2]).toBe('A folha de pessoal aumenta em relação a hoje.');
    expect(t).not.toMatch(/R\$|%/);
    expect(p.publico.decisoes).toEqual(p.dono.decisoes);
    expect(p.publico.efeitos.map((s) => s.titulo)).toEqual([
      'Cobertura',
      'Venda',
      'Equipe',
      'Custo',
    ]);
    expect(p.publico.efeitos[3]!.itens).toEqual(['A folha de pessoal aumenta em relação a hoje.']);
  });

  it('sem contratação: não contrata ninguém e a folha não muda', () => {
    const p = parecer();
    expect(p.dono.resumo[0]).toBe('Este cenário não contrata ninguém.');
    expect(textoTodo(p.dono)).toContain('Nenhuma contratação.');
    expect(p.publico.resumo[2]).toBe('A folha de pessoal não muda em relação a hoje.');
  });

  it('desligados entram nas decisões e a folha diminui', () => {
    const q: PessoaSim[] = [quadro[0]!, { ...quadro[1]!, desligado: true }];
    const p = parecer({ quadro: q });
    expect(textoTodo(p.dono)).toContain('Bia (farmacêutico).');
    expect(p.dono.resumo[0]).toContain('desliga 1 pessoa');
    expect(p.dono.resumo[2]).toMatch(/^A folha cai de/);
    expect(p.publico.resumo[2]).toBe('A folha de pessoal diminui em relação a hoje.');
  });

  it('sem salários: diz o que falta e não inventa número', () => {
    const p = parecer({ quadro: [...quadro, vaga], custos: null });
    expect(textoTodo(p.dono)).toContain('Informe os salários para ver o custo de pessoal.');
    expect(p.dono.resumo[2]).toBe('Informe os salários para ver o custo de pessoal.');
    expect(p.publico.resumo[2]).toBe('Dados do custo ainda não informados.');
    expect(textoTodo(p.dono)).not.toMatch(/R\$/);
  });

  it('sem faturamento: mostra a folha por mês e pede o faturamento', () => {
    const p = parecer({ quadro: [...quadro, vaga], faturamentoMensalRef: null });
    expect(textoTodo(p.dono)).toContain('Informe o faturamento para ver o peso da folha.');
    expect(textoTodo(p.dono)).toMatch(/Folha por mês: de R\$/);
  });

  it('horário a mais: só o dono lê o resultado, com "Custo da mercadoria" e Recomendado ou Não recomendado', () => {
    const estendido: DiaAberto[] = [{ dia: 0, abre: 8, fecha: 18 }];
    const p = parecer({ dias: estendido, diasCadastro: pequena, quadro: [...quadro, vaga] });
    const dono = textoTodo(p.dono);
    expect(dono).toMatch(/Horário a mais \(segunda até 18h\): venda adicional R\$/);
    expect(dono).toContain('custo da mercadoria');
    expect(dono).toMatch(/Recomendado\.|Não recomendado\./);
    expect(textoTodo(p.publico)).not.toMatch(/Horário a mais|custo da mercadoria/);
    expect(textoTodo(p.dono)).toContain('Segunda: abre das 08h às 18h (hoje 08h às 16h).');
  });

  it('cobertura: horas que faltam por função e o resumo diz que ainda falta', () => {
    const sozinho: PessoaSim[] = [quadro[0]!];
    const longa: DiaAberto[] = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 7, fecha: 22 }));
    const p = parecer({
      quadro: sozinho,
      dias: longa,
      diasCadastro: longa,
      minimos: { Farmacêutico: 1 },
    });
    expect(textoTodo(p.publico)).toMatch(
      /Farmacêutico: hoje faltam [\d,]+ h por semana; neste cenário ainda faltam/,
    );
    expect(p.publico.resumo[1]).toMatch(
      /^Mesmo assim, ainda faltam [\d,]+ h de cobertura por semana\.$/,
    );
  });

  it('nenhum texto usa p.p., pontos nem a sigla CMV', () => {
    const p = parecer({ quadro: [...quadro, vaga], dias: [{ dia: 0, abre: 8, fecha: 18 }] });
    for (const t of [textoTodo(p.dono), textoTodo(p.publico)]) {
      expect(t).not.toMatch(/p\.p\.|pontos|CMV/);
    }
  });

  it('guarda a versão e a data do retrato', () => {
    const p = parecer();
    expect(p.versao).toBe(1);
    expect(new Date(p.montadoEm).getTime()).toBeGreaterThan(0);
  });
});
