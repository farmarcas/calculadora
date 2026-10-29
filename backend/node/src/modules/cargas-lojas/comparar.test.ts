import { describe, expect, it } from 'vitest';
import { aplicarEscolha, planejar, type Estado, type LojaExistente } from './comparar.js';
import type { Leitura, LinhaRelatorio } from './relatorio.js';

const horarios = (abre: string) => ({
  versao: 2 as const,
  dias: Array.from({ length: 7 }, () => ({ aberta: true, abre, fecha: '20:00' })),
});
const linha = (o: Partial<LinhaRelatorio> & { cnpj: string }): LinhaRelatorio => ({
  linha: 2,
  geIdentificacao: '250',
  geResponsavel: 'Beltrano',
  codigo: (o.cnpj ?? 'sem').slice(-3),
  dados: {
    nome: 'Ultra ORLEANS/SC',
    cidade: 'ORLEANS',
    uf: 'SC',
    marca: 'Ultra',
    regimeTributario: 'simples',
    horarios: horarios('07:00'),
  },
  avisos: [],
  ...o,
});
const leitura = (...linhas: LinhaRelatorio[]): Leitura => ({
  total: linhas.length,
  linhas,
  rejeitadas: [],
  ignoradasPorStatus: {},
  ignoradasCnpj: {},
  pendencias: { semRegime: 0, semHorario: 0, horarioAjustado: 0 },
});
const loja = (o: Partial<LojaExistente> & { cnpj: string | null }): LojaExistente => ({
  id: `L-${o.cnpj ?? 'sem'}`,
  geId: 'G1',
  codigo: (o.cnpj ?? 'sem').slice(-3),
  nome: 'Ultra ORLEANS/SC',
  cidade: 'ORLEANS',
  uf: 'SC',
  marca: 'Ultra',
  regimeTributario: 'simples',
  horarios: horarios('07:00'),
  ultimaCarga: null,
  ...o,
});
const estado = (
  lojas: LojaExistente[],
  ges = [{ id: 'G1', identificacao: '250', nome: 'Beltrano', ativo: true }],
): Estado => ({
  ges: new Map(ges.map((g) => [g.identificacao, g])),
  lojasPorCnpj: new Map(lojas.flatMap((l) => (l.cnpj ? [[l.cnpj, l] as const] : []))),
  lojasDoGe: ges.reduce(
    (m, g) =>
      m.set(
        g.id,
        lojas.filter((l) => l.geId === g.id),
      ),
    new Map<string, LojaExistente[]>(),
  ),
});
const sem = estado([], []);

describe('planejar a carga de lojas', () => {
  it('GE e loja novos: cria o GE (nome = responsável) e a loja', () => {
    const p = planejar(leitura(linha({ cnpj: '11222333000181' })), sem);
    expect(p.porGe).toHaveLength(1);
    expect(p.porGe[0]).toMatchObject({ identificacao: '250', nome: 'Beltrano', novo: true });
    expect(p.porGe[0]!.criar).toHaveLength(1);
  });

  it('sem responsável, o GE novo se chama "GE <número>"', () => {
    const p = planejar(leitura(linha({ cnpj: '11222333000181', geResponsavel: undefined })), sem);
    expect(p.porGe[0]!.nome).toBe('GE 250');
  });

  it('reenviar o mesmo arquivo não muda nada (loja já com o retrato da carga)', () => {
    const l = linha({ cnpj: '11222333000181' });
    const ja = loja({
      cnpj: '11222333000181',
      ultimaCarga: {
        nome: l.dados.nome,
        cidade: 'ORLEANS',
        uf: 'SC',
        marca: 'Ultra',
        regimeTributario: 'simples',
        horarios: horarios('07:00'),
      },
    });
    const p = planejar(leitura(l), estado([ja]));
    expect(p.porGe[0]).toMatchObject({ novo: false, semMudanca: 1 });
    expect(p.porGe[0]!.atualizar).toEqual([]);
  });

  it('a plataforma mudou e o empresário não mexeu: atualiza sem conflito', () => {
    const ja = loja({
      cnpj: '11222333000181',
      cidade: 'ORLEANS',
      ultimaCarga: {
        cidade: 'ORLEANS',
        nome: 'Ultra ORLEANS/SC',
        uf: 'SC',
        marca: 'Ultra',
        regimeTributario: 'simples',
        horarios: horarios('07:00'),
      },
    });
    const l = linha({
      cnpj: '11222333000181',
      dados: { ...linha({ cnpj: 'x' }).dados, cidade: 'URUSSANGA' },
    });
    const [a] = planejar(leitura(l), estado([ja])).porGe[0]!.atualizar;
    expect(a!.mudancas).toEqual({ cidade: 'URUSSANGA' });
    expect(a!.conflitos).toEqual([]);
  });

  it('o empresário corrigiu e a plataforma também mudou: conflito, mantém o do empresário por padrão', () => {
    const base = {
      nome: 'Ultra ORLEANS/SC',
      cidade: 'ORLEANS',
      uf: 'SC',
      marca: 'Ultra',
      regimeTributario: 'simples',
      horarios: horarios('07:00'),
    };
    const ja = loja({ cnpj: '11222333000181', cidade: 'LAGUNA', ultimaCarga: base });
    const l = linha({
      cnpj: '11222333000181',
      dados: { ...linha({ cnpj: 'x' }).dados, cidade: 'URUSSANGA' },
    });
    const [a] = planejar(leitura(l), estado([ja])).porGe[0]!.atualizar;
    expect(a!.conflitos).toEqual([
      {
        cnpj: '11222333000181',
        loja: 'Ultra ORLEANS/SC',
        campo: 'cidade',
        atual: 'LAGUNA',
        planilha: 'URUSSANGA',
      },
    ]);
    expect(aplicarEscolha(a!, 'nenhum')).toEqual({});
    expect(aplicarEscolha(a!, 'todos')).toEqual({ cidade: 'URUSSANGA' });
    expect(aplicarEscolha(a!, ['11222333000181'])).toEqual({ cidade: 'URUSSANGA' });
    expect(aplicarEscolha(a!, ['outro'])).toEqual({});
  });

  it('o empresário corrigiu e a plataforma NÃO mudou: nada a fazer (a correção fica)', () => {
    const base = {
      nome: 'Ultra ORLEANS/SC',
      cidade: 'ORLEANS',
      uf: 'SC',
      marca: 'Ultra',
      regimeTributario: 'simples',
      horarios: horarios('07:00'),
    };
    const ja = loja({ cnpj: '11222333000181', cidade: 'LAGUNA', ultimaCarga: base });
    const p = planejar(leitura(linha({ cnpj: '11222333000181' })), estado([ja]));
    expect(p.porGe[0]!.atualizar).toEqual([]);
    expect(p.porGe[0]!.semMudanca).toBe(1);
  });

  it('loja que nunca veio de carga e difere: conflito (não dá para saber quem mexeu)', () => {
    const ja = loja({ cnpj: '11222333000181', cidade: 'LAGUNA', ultimaCarga: null });
    const [a] = planejar(leitura(linha({ cnpj: '11222333000181' })), estado([ja])).porGe[0]!
      .atualizar;
    expect(a!.conflitos.map((c) => c.campo)).toEqual(['cidade']);
  });

  it('relatório sem valor (sem horário ou regime) não apaga o que existe', () => {
    const ja = loja({ cnpj: '11222333000181', ultimaCarga: null });
    const dados = { nome: 'Ultra ORLEANS/SC' };
    const p = planejar(leitura(linha({ cnpj: '11222333000181', dados })), estado([ja]));
    expect(p.porGe[0]!.atualizar[0]?.conflitos ?? []).toEqual([]);
    expect(p.porGe[0]!.atualizar[0]?.mudancas ?? {}).toEqual({});
  });

  it('CNPJ de outro GE é rejeitado e diz qual (o operador vê todos)', () => {
    const outro = loja({ cnpj: '11222333000181', geId: 'G2' });
    const e = estado(
      [outro],
      [
        { id: 'G1', identificacao: '250', nome: 'Beltrano', ativo: true },
        { id: 'G2', identificacao: '300', nome: 'Cicrano', ativo: true },
      ],
    );
    const p = planejar(leitura(linha({ cnpj: '11222333000181' })), e);
    expect(p.rejeitadas[0]!.motivo).toContain('Cicrano');
    expect(p.porGe[0]!.criar).toEqual([]);
  });

  it('GE desativado: todas as linhas dele são rejeitadas', () => {
    const e = estado([], [{ id: 'G1', identificacao: '250', nome: 'Beltrano', ativo: false }]);
    const p = planejar(leitura(linha({ cnpj: '11222333000181' })), e);
    expect(p.porGe).toEqual([]);
    expect(p.rejeitadas[0]!.motivo).toContain('desativado');
  });

  it('código já usado por outra loja do GE (com outro CNPJ) é rejeitado', () => {
    const outra = loja({ cnpj: '06787293000185', codigo: '181' });
    const p = planejar(leitura(linha({ cnpj: '11222333000181', codigo: '181' })), estado([outra]));
    expect(p.rejeitadas[0]!.motivo).toContain('código 181');
  });

  it('avisa lojas do GE fora do arquivo e as que saíram do ativo, sem apagar nada', () => {
    const sai = loja({ cnpj: '06787293000185' });
    const fora = loja({ cnpj: '15839321000313' });
    const antiga = loja({
      cnpj: null,
      id: 'L-ant',
      codigo: 'ant',
      nome: 'Antiga',
    });
    const l = leitura(linha({ cnpj: '11222333000181' }));
    l.ignoradasCnpj['06787293000185'] = 'Desativado';
    const [g] = planejar(l, estado([sai, fora, antiga])).porGe;
    expect(g!.saiuDoAtivo).toEqual([
      { cnpj: '06787293000185', nome: 'Ultra ORLEANS/SC', status: 'Desativado' },
    ]);
    expect(g!.foraDoArquivo.map((x) => x.cnpj)).toEqual(['15839321000313', '']);
  });
});
