import { describe, expect, it } from 'vitest';
import { conferenciaDa } from './guarda-de-lojas.js';

describe('tabela da guarda de lojas', () => {
  it.each([
    ['GET', '/lojas/abc/painel'],
    ['PUT', '/lojas/abc/painel'],
    ['GET', '/lojas/abc/custos'],
    ['PUT', '/lojas/abc/custos'],
    ['GET', '/lojas/abc/diagnostico'],
    ['GET', '/lojas/abc/cargas'],
    ['PUT', '/lojas/abc/configuracao'],
    ['GET', '/lojas/abc/simulacoes'],
    ['POST', '/lojas/abc/simulacoes'],
    ['GET', '/lojas/abc/simulacoes/comparar'],
    ['PATCH', '/lojas/abc'],
  ])('%s %s confere a loja', (metodo, caminho) => {
    expect(conferenciaDa(metodo, caminho)).toEqual({ tipo: 'loja', id: 'abc' });
  });

  it.each([
    ['GET', '/simulacoes/abc'],
    ['PUT', '/simulacoes/abc'],
    ['GET', '/simulacoes/abc/exportar.xlsx'],
    ['POST', '/simulacoes/abc/gravar'],
    ['POST', '/simulacoes/abc/descartar'],
    ['POST', '/simulacoes/abc/clonar'],
  ])('%s %s confere a simulação', (metodo, caminho) => {
    expect(conferenciaDa(metodo, caminho)).toEqual({ tipo: 'simulacao', id: 'abc' });
  });

  it.each([
    ['PATCH', '/funcionarios/abc'],
    ['DELETE', '/funcionarios/abc'],
  ])('%s %s confere o funcionário', (metodo, caminho) => {
    expect(conferenciaDa(metodo, caminho)).toEqual({ tipo: 'funcionario', id: 'abc' });
  });

  it('confere a loja do filtro e a do corpo em funcionários', () => {
    expect(conferenciaDa('GET', '/funcionarios')).toEqual({ tipo: 'loja-no-filtro' });
    expect(conferenciaDa('POST', '/funcionarios')).toEqual({ tipo: 'loja-no-corpo' });
  });

  it.each([
    ['GET', '/lojas'],
    ['GET', '/planilha-modelo'],
    ['GET', '/planilha-modelo-base'],
  ])('%s %s fica livre', (metodo, caminho) => {
    expect(conferenciaDa(metodo, caminho)).toEqual({ tipo: 'livre' });
  });

  it.each([
    ['POST', '/importacoes/cadastro'],
    ['POST', '/importacoes/cadastro/abc/revisar'],
    ['POST', '/importacoes/cadastro/abc/confirmar'],
    ['POST', '/cargas/base'],
    ['POST', '/cargas/base/revisar'],
    ['POST', '/lojas'],
    ['DELETE', '/lojas/abc'],
    ['GET', '/rota-nova'],
    ['GET', '/LOJAS/abc/painel'],
    ['GET', '/lojas/abc/painel/'],
  ])('%s %s é negada', (metodo, caminho) => {
    expect(conferenciaDa(metodo, caminho)).toBeNull();
  });
});
