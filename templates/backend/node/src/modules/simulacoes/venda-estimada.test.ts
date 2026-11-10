import { describe, expect, it } from 'vitest';
import { ganhoDasHorasNovas } from '../escala/ajustes-fim-de-semana.js';
import { SEMANAS_NO_MES } from '../escala/cenarios-dias.js';
import type { VendaDiaHora } from '../escala/vendas.js';
import type { DiaAberto } from '../regras/capacidade.js';
import { horasNovas, vendaEstimadaDasHorasNovas } from './venda-estimada.js';

const dia = (d: number, abre: number, fecha: number): DiaAberto => ({ dia: d, abre, fecha });
// Segunda: 08–20. Venda de 100 por hora nas horas 8 a 19 (uma de 300 às 19h) e 0 fora.
const tabela = (): VendaDiaHora => {
  const venda = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  for (let h = 8; h < 20; h++) venda[0]![h] = 100;
  venda[0]![19] = 300;
  venda[6]![10] = 40; // domingo (fechado no Cadastro) com uma hora de venda registrada
  return { venda, dias: 10 };
};
const CAD = [dia(0, 8, 20)];

describe('horas novas', () => {
  it('só a hora aberta na simulação e fechada no Cadastro', () => {
    const n = horasNovas(CAD, [dia(0, 6, 22)]);
    expect(n[0]!.map((v, h) => (v ? h : -1)).filter((h) => h >= 0)).toEqual([6, 7, 20, 21]);
  });
  it('reduzir ou manter não cria hora nova', () => {
    expect(
      horasNovas(CAD, [dia(0, 9, 18)])
        .flat()
        .some(Boolean),
    ).toBe(false);
    expect(horasNovas(CAD, CAD).flat().some(Boolean)).toBe(false);
  });
});

describe('venda estimada das horas novas', () => {
  it('sem venda registrada vale 50% da hora de borda do Cadastro (a primeira antes, a última depois)', () => {
    const r = vendaEstimadaDasHorasNovas(CAD, [dia(0, 6, 22)], tabela())!;
    // antes: 50% da hora de abertura (8h = 100) = 50 em 6h e 7h; depois: 50% da última hora (19h = 300) = 150 em 20h e 21h
    expect(r.porHora[0]![6]).toBe(50);
    expect(r.porHora[0]![7]).toBe(50);
    expect(r.porHora[0]![20]).toBe(150);
    expect(r.porHora[0]![21]).toBe(150);
    expect(r.vendaMes).toBeCloseTo((50 + 50 + 150 + 150) * SEMANAS_NO_MES, 1);
  });
  it('hora com venda registrada vale o registrado', () => {
    const t = tabela();
    t.venda[0]![20] = 80;
    const r = vendaEstimadaDasHorasNovas(CAD, [dia(0, 8, 21)], t)!;
    expect(r.porHora[0]![20]).toBe(80);
  });
  it('dia fechado no Cadastro e aberto na simulação: a venda registrada vale; o resto é 50% da média dos dias abertos', () => {
    const r = vendaEstimadaDasHorasNovas(CAD, [dia(0, 8, 20), dia(6, 9, 12)], tabela())!;
    expect(r.porHora[6]![10]).toBe(40); // registrada
    expect(r.porHora[6]![9]).toBe(50); // 50% de 100 (única segunda aberta nessa hora)
    expect(r.porHora[6]![11]).toBe(50);
  });
  it('dia fechado: a média considera só os dias abertos naquela hora', () => {
    const t = tabela();
    for (let h = 8; h < 20; h++) t.venda[1]![h] = 300;
    // segunda (100) e terça (300) abertas às 9h → média 200 → 50% = 100; às 7h nenhuma abre → 0
    const cad = [dia(0, 8, 20), dia(1, 8, 20)];
    const r = vendaEstimadaDasHorasNovas(cad, [...cad, dia(5, 7, 10)], t)!;
    expect(r.porHora[5]![9]).toBe(100);
    expect(r.porHora[5]![7]).toBe(0);
  });
  it('nenhum horário aumenta = 0 por mês', () => {
    expect(vendaEstimadaDasHorasNovas(CAD, [dia(0, 9, 18)], tabela())!.vendaMes).toBe(0);
    expect(vendaEstimadaDasHorasNovas(CAD, CAD, tabela())!.vendaMes).toBe(0);
  });
  it('sem a tabela de venda por hora não há estimativa', () => {
    expect(vendaEstimadaDasHorasNovas(CAD, [dia(0, 6, 22)], null)).toBeNull();
  });
  it('fator diferente de 50%', () => {
    const r = vendaEstimadaDasHorasNovas(CAD, [dia(0, 7, 20)], tabela(), 1)!;
    expect(r.porHora[0]![7]).toBe(100);
  });

  it('o mesmo resultado dos cenários para sábado e domingo (mesma regra)', () => {
    const t = tabela();
    for (let h = 8; h < 20; h++) {
      t.venda[5]![h] = 100 + h;
      t.venda[6]![h] = 50 + h;
    }
    const cad = [dia(5, 8, 20), dia(6, 8, 20)];
    const sim = [dia(5, 8, 23), dia(6, 6, 20)];
    const nosCenarios = ganhoDasHorasNovas(cad, sim, t);
    expect(vendaEstimadaDasHorasNovas(cad, sim, t)!.vendaMes).toBeCloseTo(nosCenarios.vendaMes, 1);
  });
});
