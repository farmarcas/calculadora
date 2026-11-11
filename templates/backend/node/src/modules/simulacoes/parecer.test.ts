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
const texto = (t: TextoDoParecer) =>
  [
    t.status.texto,
    t.paragrafo,
    ...Object.values(t.cartoes).flatMap((c) => [
      c.titulo,
      c.valor,
      c.chip?.texto ?? '',
      c.apoio ?? '',
    ]),
    ...t.tabela.flatMap((l) => [l.rotulo, l.hoje, l.comOCenario, l.mudanca.texto]),
    ...(t.horarioAMais ?? []),
  ].join('\n');

describe('montarParecer v2 (specs 056 e 057)', () => {
  const comVaga = () => parecer({ quadro: [...quadro, vaga], faturamentoMensalRef: 100000 });

  it('dono, com contratação: chip, parágrafo, três cartões e tabela com os mesmos números', () => {
    const d = comVaga().dono;
    expect(d.status).toEqual({ texto: 'Cobre o horário', tom: 'verde' });
    expect(d.paragrafo).toMatch(
      /^Contratando 1 farmacêutico, 40h por semana, a loja passa a cobrir todo o horário de funcionamento\. /,
    );
    expect(d.paragrafo).toContain(
      'Ninguém é desligado, o horário continua igual ao do Cadastro e todos trabalham todos os dias em que a loja abre',
    );
    expect(d.paragrafo).toMatch(/A venda não muda, mas a folha pesa mais no faturamento\.$/);
    expect(d.cartoes.folha.titulo).toBe('Folha no faturamento');
    expect(d.cartoes.folha.valor).toMatch(/^\d+,\d%$/);
    expect(d.cartoes.folha.chip).toMatchObject({ tom: 'ambar' });
    expect(d.cartoes.folha.chip!.texto).toMatch(/^\+\d+,\d%$/);
    expect(d.cartoes.folha.apoio).toMatch(/^hoje \d+,\d% · R\$ [\d.]+ a mais por mês$/);
    expect(d.cartoes.equipe).toEqual({
      titulo: 'Equipe',
      valor: '3 pessoas',
      chip: { texto: '+1', tom: 'verde' },
      apoio: 'hoje 2',
    });
    // o valor em reais do cartão é o mesmo da tabela
    const reaisDoCartao = /R\$ ([\d.]+) a mais/.exec(d.cartoes.folha.apoio!)![1];
    const folha = d.tabela.find((l) => l.rotulo === 'Folha por mês')!;
    expect(folha.mudanca).toEqual({ texto: `+R$ ${reaisDoCartao}`, tom: 'ambar' });
    expect(d.tabela.map((l) => l.rotulo)).toEqual([
      'Farmacêutico faltando',
      'Venda',
      'Pessoas',
      'Horas contratadas por semana',
      'Folha por mês',
    ]);
    expect(d.tabela.find((l) => l.rotulo === 'Pessoas')).toMatchObject({
      hoje: '2',
      comOCenario: '3',
      mudanca: { texto: '+1', tom: 'verde' },
    });
    expect(d.tabela.find((l) => l.rotulo === 'Horas contratadas por semana')).toMatchObject({
      hoje: '80h',
      comOCenario: '120h',
      mudanca: { texto: '+40h', tom: 'verde' },
    });
  });

  it('o R$ da folha é a diferença dos valores exibidos (depois − hoje)', () => {
    const f = comVaga().dono.tabela.find((l) => l.rotulo === 'Folha por mês')!;
    const n = (t: string) => Number(t.replace(/\D/g, ''));
    expect(n(f.mudanca.texto)).toBe(n(f.comOCenario) - n(f.hoje));
  });

  it('versão pública: Custo de pessoal sem valores, sem a linha da folha e sem R$ nem %', () => {
    const p = comVaga().publico;
    expect(p.cartoes.folha).toEqual({
      titulo: 'Custo de pessoal',
      valor: '—',
      chip: { texto: 'Aumenta', tom: 'ambar' },
      apoio: 'sem valores em reais',
    });
    expect(p.tabela.map((l) => l.rotulo)).not.toContain('Folha por mês');
    expect(p.paragrafo).toMatch(/, mas o custo de pessoal aumenta\.$/);
    expect(texto(p)).not.toMatch(/R\$|%/);
    expect(p.horarioAMais).toBeNull();
  });

  it('sem contratação: folha igual (chip neutro) e "a folha fica igual"', () => {
    const p = parecer({ faturamentoMensalRef: 100000 });
    expect(p.dono.paragrafo).toMatch(
      /^Sem contratar ninguém, a loja segue cobrindo todo o horário de funcionamento\./,
    );
    expect(p.dono.paragrafo).toMatch(/ e a folha fica igual\.$/);
    expect(p.dono.cartoes.folha.chip).toEqual({ texto: 'folha igual', tom: 'neutro' });
    expect(p.publico.cartoes.folha.chip).toEqual({ texto: 'Igual', tom: 'neutro' });
    expect(p.dono.tabela.find((l) => l.rotulo === 'Folha por mês')!.mudanca).toEqual({
      texto: 'igual',
      tom: 'neutro',
    });
  });

  it('desligados: a frase, a folha cai (verde) e a pessoa some da equipe', () => {
    const q: PessoaSim[] = [quadro[0]!, { ...quadro[1]!, desligado: true }];
    const p = parecer({ quadro: q, faturamentoMensalRef: 100000 });
    expect(p.dono.paragrafo).toContain('Desligando 1 farmacêutico, o horário continua igual');
    expect(p.dono.paragrafo).toMatch(/ e a folha pesa menos no faturamento\.$/);
    expect(p.dono.cartoes.folha.chip).toMatchObject({ tom: 'verde' });
    expect(p.dono.cartoes.folha.chip!.texto).toMatch(/^−\d+,\d%$/);
    expect(p.dono.cartoes.folha.apoio).toMatch(/a menos por mês$/);
    expect(p.dono.cartoes.equipe).toMatchObject({
      valor: '1 pessoa',
      chip: { texto: '−1', tom: 'neutro' },
      apoio: 'hoje 2',
    });
    expect(p.publico.paragrafo).toMatch(/ e o custo de pessoal diminui\.$/);
  });

  it('sem salários ou sem faturamento: o cartão diz o que falta e a linha de reais some', () => {
    const semSal = parecer({ quadro: [...quadro, vaga], custos: null });
    expect(semSal.dono.cartoes.folha).toEqual({
      titulo: 'Folha no faturamento',
      valor: '—',
      chip: null,
      apoio: 'Informe os salários para ver o custo de pessoal.',
    });
    expect(semSal.dono.tabela.map((l) => l.rotulo)).not.toContain('Folha por mês');
    expect(semSal.publico.cartoes.folha).toEqual({
      titulo: 'Custo de pessoal',
      valor: '—',
      chip: null,
      apoio: 'Dados do custo ainda não informados.',
    });
    const semFat = parecer({ quadro: [...quadro, vaga], faturamentoMensalRef: null });
    expect(semFat.dono.cartoes.folha.apoio).toBe('Informe o faturamento para ver o peso da folha.');
    expect(semFat.dono.tabela.map((l) => l.rotulo)).toContain('Folha por mês');
  });

  it('farmacêutico faltando: o cartão e a tabela mostram as horas, em âmbar quando ainda faltam', () => {
    const longa: DiaAberto[] = [0, 1, 2, 3, 4, 5].map((dia) => ({ dia, abre: 7, fecha: 22 }));
    const p = parecer({
      quadro: [quadro[0]!],
      dias: longa,
      diasCadastro: longa,
      minimos: { Farmacêutico: 1 },
    });
    expect(p.publico.cartoes.farmaceutico.chip).toEqual({ texto: 'faltam', tom: 'ambar' });
    expect(p.publico.cartoes.farmaceutico.apoio).toMatch(/^hoje faltam [\d,]+ h por semana$/);
    expect(p.publico.paragrafo).toMatch(/ainda faltam [\d,]+h de cobertura por semana\./);
    expect(p.publico.tabela[0]).toMatchObject({ rotulo: 'Farmacêutico faltando' });
  });

  it('só o farmacêutico é obrigatório: as outras contratações aparecem como desejáveis no parágrafo', () => {
    const atendente: PessoaSim = {
      matricula: 'VAGA-2',
      nome: 'Vaga 2',
      funcao: 'Atendimento',
      cargaH: 40,
      vaga: true,
    };
    const p = parecer({ quadro: [...quadro, vaga, atendente] });
    expect(p.dono.paragrafo).toContain(
      'Contratando 1 farmacêutico e 1 atendente (desejável), 40h por semana cada,',
    );
    expect(p.publico.paragrafo).toContain('1 atendente (desejável)');
  });

  it('horário a mais: só o dono lê o resultado, com "Custo da mercadoria"; o chip vira Não recomendado quando não paga', () => {
    const p = parecer({
      dias: [{ dia: 0, abre: 8, fecha: 18 }],
      diasCadastro: pequena,
      quadro: [...quadro, vaga],
    });
    expect(p.dono.horarioAMais![0]).toMatch(
      /^Horário a mais \(segunda até 18h\): venda adicional R\$/,
    );
    expect(p.dono.horarioAMais![0]).toContain('custo da mercadoria');
    expect(p.dono.paragrafo).toContain('o horário muda (segunda das 08h às 18h)');
    expect(
      ['Recomendado.', 'Não recomendado.'].some((t) => p.dono.horarioAMais![0]!.endsWith(t)),
    ).toBe(true);
    expect(p.publico.horarioAMais).toBeNull();
  });

  it('nenhum texto usa jornada cheia, p.p., pontos nem a sigla CMV', () => {
    const p = parecer({ quadro: [...quadro, vaga], dias: [{ dia: 0, abre: 8, fecha: 18 }] });
    for (const t of [texto(p.dono), texto(p.publico)])
      expect(t).not.toMatch(/jornada cheia|p\.p\.|pontos|CMV/);
  });

  it('guarda a versão 2 e a data do retrato', () => {
    const p = parecer();
    expect(p.versao).toBe(2);
    expect(new Date(p.montadoEm).getTime()).toBeGreaterThan(0);
  });
});
