import { describe, expect, it } from 'vitest';
import {
  gruposACriar,
  gruposInteirosDe,
  juntarGrupos,
  lojasACriar,
  montarGrupos,
  separarLojas,
} from './acesso.js';

const CNPJ_A = '11222333000181';
const CNPJ_B = '11444777000161';

const loja = (over = {}) => ({
  id: '10',
  name: 'Loja 10',
  cnpj: '11.222.333/0001-81',
  status: 2,
  economicGroup: { id: '250', name: 'Grupo 250' },
  ...over,
});

describe('lojas trazidas do Radar', () => {
  it('aproveita loja ativa com grupo e CNPJ válido', () => {
    expect(separarLojas([loja()])).toEqual({
      aproveitaveis: [
        {
          radarId: '10',
          nome: 'Loja 10',
          cnpj: CNPJ_A,
          grupo: { identificacao: '250', nome: 'Grupo 250' },
        },
      ],
      ignoradas: [],
    });
  });

  it('deixa de fora loja desativada, sem registrar', () => {
    expect(separarLojas([loja({ status: 0 })])).toEqual({ aproveitaveis: [], ignoradas: [] });
  });

  it.each([
    ['sem grupo', { economicGroup: null }],
    ['com grupo zerado', { economicGroup: { id: '0', name: null } }],
    ['sem CNPJ', { cnpj: null }],
    ['com CNPJ inválido', { cnpj: '11111111111111' }],
  ])('registra loja %s', (_nome, over) => {
    expect(separarLojas([loja(over)])).toEqual({ aproveitaveis: [], ignoradas: ['10'] });
  });

  it('não repete o mesmo CNPJ', () => {
    expect(separarLojas([loja(), loja({ id: '11' })]).aproveitaveis).toHaveLength(1);
  });

  it('cria só o que nenhum registro conhece e cada grupo uma vez', () => {
    const { aproveitaveis } = separarLojas([loja(), loja({ id: '11', cnpj: CNPJ_B })]);
    const novas = lojasACriar(aproveitaveis, new Set([CNPJ_A]));

    expect(novas.map((l) => l.cnpj)).toEqual([CNPJ_B]);
    expect(gruposACriar(aproveitaveis)).toEqual([{ identificacao: '250', nome: 'Grupo 250' }]);
  });
});

describe('acesso da sessão', () => {
  const lojas = [
    { id: 'a', geId: 'ge1' },
    { id: 'b', geId: 'ge1' },
    { id: 'c', geId: 'ge2' },
  ];

  it('marca acesso total só com todas as lojas ativas do grupo', () => {
    const grupos = montarGrupos(
      lojas,
      new Map([
        ['ge1', 2],
        ['ge2', 5],
      ]),
      'TENANT_ADMIN',
    );

    expect(grupos).toEqual([
      { geId: 'ge1', perfil: 'TENANT_ADMIN', lojaIds: ['a', 'b'], acessoTotal: true },
      { geId: 'ge2', perfil: 'TENANT_ADMIN', lojaIds: ['c'], acessoTotal: false },
    ]);
  });
});

describe('grupos inteiros vindos do Radar', () => {
  it('aproveita só os de acesso inteiro, um por número', () => {
    expect(
      gruposInteirosDe([
        { id: '250', name: ' Rede A ', fullAccess: true },
        { id: '250', name: 'Rede A', fullAccess: true },
        { id: '251', name: 'Rede B', fullAccess: false },
        { id: '252', name: 'Rede C' },
        { id: '0', name: 'Sem grupo', fullAccess: true },
        { id: '253', name: null, fullAccess: true },
      ]),
    ).toEqual([
      { identificacao: '250', nome: 'Rede A' },
      { identificacao: '253', nome: 'Grupo 253' },
    ]);
  });

  it.each([undefined, null, []])('sem lista (%s) não traz nenhum', (lista) => {
    expect(gruposInteirosDe(lista)).toEqual([]);
  });

  const dasLojas = [
    { geId: 'ge1', perfil: 'TENANT_ADMIN' as const, lojaIds: ['a'], acessoTotal: false },
    { geId: 'ge2', perfil: 'TENANT_ADMIN' as const, lojaIds: ['b'], acessoTotal: false },
  ];

  it('só lojas: fica como está', () => {
    expect(juntarGrupos(dasLojas, [], 'TENANT_ADMIN')).toEqual(dasLojas);
  });

  it('só inteiros: acesso total sem lista de lojas', () => {
    expect(juntarGrupos([], ['ge9', 'ge9'], 'TENANT_ADMIN')).toEqual([
      { geId: 'ge9', perfil: 'TENANT_ADMIN', lojaIds: [], acessoTotal: true },
    ]);
  });

  it('grupo nas duas origens vale o acesso inteiro', () => {
    expect(juntarGrupos(dasLojas, ['ge2', 'ge3'], 'TENANT_ADMIN')).toEqual([
      { geId: 'ge2', perfil: 'TENANT_ADMIN', lojaIds: [], acessoTotal: true },
      { geId: 'ge3', perfil: 'TENANT_ADMIN', lojaIds: [], acessoTotal: true },
      dasLojas[0],
    ]);
  });

  it('nenhum dos dois: nenhum grupo', () => {
    expect(juntarGrupos([], [], 'TENANT_ADMIN')).toEqual([]);
  });
});
