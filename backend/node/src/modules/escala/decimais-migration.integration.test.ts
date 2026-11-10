import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';

// A migration da spec 036 roda num esquema de rascunho com o formato ANTIGO (inteiros), sem mexer nas tabelas de verdade.
const sql = readFileSync(
  new URL('../../../prisma/migrations/20261110140000_clientes_e_unidades_decimais/migration.sql', import.meta.url),
  'utf8',
);
const rodar = (comando: string) => prisma.$executeRawUnsafe(comando);
const ler = <T>(comando: string) => prisma.$queryRawUnsafe<T[]>(comando);

describe('migration de clientes e unidades decimais (spec 036)', () => {
  afterAll(async () => {
    await rodar('DROP SCHEMA IF EXISTS tmp_dec CASCADE');
    await prisma.$disconnect();
  });

  it('mantém os inteiros que já existem e passa a guardar decimais', async () => {
    await rodar('DROP SCHEMA IF EXISTS tmp_dec CASCADE');
    await rodar('CREATE SCHEMA tmp_dec');
    await rodar(`CREATE TABLE tmp_dec.vendas_hora (id int PRIMARY KEY, venda double precision NOT NULL, clientes int NOT NULL, unidades int NOT NULL)`);
    await rodar('INSERT INTO tmp_dec.vendas_hora VALUES (1, 300, 12, 40), (2, 340, 0, 0)');

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL search_path TO tmp_dec');
      await tx.$executeRawUnsafe(sql);
    });

    const antes = await ler<{ clientes: number; unidades: number; venda: number }>('SELECT * FROM tmp_dec.vendas_hora ORDER BY id');
    expect(antes.map((h) => [h.venda, h.clientes, h.unidades])).toEqual([[300, 12, 40], [340, 0, 0]]);

    await rodar('INSERT INTO tmp_dec.vendas_hora VALUES (3, 100, 5.0588, 18.5)');
    const [novo] = await ler<{ clientes: number; unidades: number }>('SELECT * FROM tmp_dec.vendas_hora WHERE id = 3');
    expect(novo).toMatchObject({ clientes: 5.0588, unidades: 18.5 });
  });
});
