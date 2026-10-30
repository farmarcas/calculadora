import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../database/prisma.js';
import { GE_INICIAL_ID } from '../ge.js';
import { criarGe, limparGes } from './ge.js';

describe('GE: base do banco (migration multiempresário)', () => {
  beforeEach(async () => {
    await prisma.loja.deleteMany({ where: { codigo: { startsWith: 'GEMIG' } } });
    await limparGes();
  });
  afterAll(async () => {
    await prisma.loja.deleteMany({ where: { codigo: { startsWith: 'GEMIG' } } });
    await limparGes();
    await prisma.$disconnect();
  });

  it('o GE inicial existe e está ativo', async () => {
    const ge = await prisma.grupoEconomico.findUnique({ where: { id: GE_INICIAL_ID } });
    expect(ge?.identificacao).toBe('GE-INICIAL');
    expect(ge?.ativo).toBe(true);
  });

  it('o mesmo código de loja convive em GEs diferentes, mas não dentro do mesmo GE', async () => {
    const a = await criarGe('T-A');
    const b = await criarGe('T-B');
    await prisma.loja.create({ data: { geId: a.id, codigo: 'GEMIG1', nome: 'A' } });
    await prisma.loja.create({ data: { geId: b.id, codigo: 'GEMIG1', nome: 'B' } });
    await expect(
      prisma.loja.create({ data: { geId: a.id, codigo: 'GEMIG1', nome: 'A de novo' } }),
    ).rejects.toThrow();
  });

  it('o CNPJ é único no sistema entre lojas ativas, mesmo em GEs diferentes', async () => {
    const a = await criarGe('T-A');
    const b = await criarGe('T-B');
    await prisma.loja.create({
      data: { geId: a.id, codigo: 'GEMIG2', nome: 'A', cnpj: '11222333000181' },
    });
    await expect(
      prisma.loja.create({
        data: { geId: b.id, codigo: 'GEMIG3', nome: 'B', cnpj: '11222333000181' },
      }),
    ).rejects.toThrow();
    await prisma.loja.create({ data: { geId: b.id, codigo: 'GEMIG4', nome: 'sem cnpj' } });
    await prisma.loja.create({ data: { geId: b.id, codigo: 'GEMIG5', nome: 'sem cnpj 2' } });
  });

  it('não dá para apagar um GE que tem lojas', async () => {
    const a = await criarGe('T-A');
    await prisma.loja.create({ data: { geId: a.id, codigo: 'GEMIG6', nome: 'A' } });
    await expect(prisma.grupoEconomico.delete({ where: { id: a.id } })).rejects.toThrow();
  });
});
