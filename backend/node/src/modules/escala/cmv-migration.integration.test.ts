import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../../shared/database/prisma.js';

// A migration da spec 034 roda num esquema de rascunho com o formato ANTIGO das duas tabelas, para provar o que ela muda e
// o que não muda sem mexer nas tabelas de verdade.
const sql = readFileSync(
  new URL(
    '../../../prisma/migrations/20261110130000_cmv_no_lugar_da_margem/migration.sql',
    import.meta.url,
  ),
  'utf8',
);

const rodar = (comando: string) => prisma.$executeRawUnsafe(comando);
const ler = <T>(comando: string) => prisma.$queryRawUnsafe<T[]>(comando);

describe('migration do CMV no lugar da margem (spec 034)', () => {
  afterAll(async () => {
    await rodar('DROP SCHEMA IF EXISTS tmp_cmv CASCADE');
    await prisma.$disconnect();
  });

  const preparar = async () => {
    await rodar('DROP SCHEMA IF EXISTS tmp_cmv CASCADE');
    await rodar('CREATE SCHEMA tmp_cmv');
    await rodar(`CREATE TABLE tmp_cmv.vendas_hora (
      id int PRIMARY KEY, carga_id int NOT NULL, data date NOT NULL, hora int NOT NULL,
      venda double precision NOT NULL, margem double precision NOT NULL, clientes int NOT NULL, unidades int NOT NULL)`);
    await rodar(
      'CREATE TABLE tmp_cmv.lojas (id int PRIMARY KEY, nome text NOT NULL, faturamento jsonb)',
    );
    await rodar(`INSERT INTO tmp_cmv.vendas_hora VALUES
      (1, 10, '2026-09-07', 8, 300, 105, 12, 40),
      (2, 10, '2026-09-07', 9, 340, 0, 14, 44),
      (3, 11, '2026-08-03', 8, 250, 80, 9, 30)`);
    await rodar(`INSERT INTO tmp_cmv.lojas VALUES
      (1, 'Com margem', '{"dias":[1000,1100,900,1200,1500,800,null],"mensal":null,"margemPct":26}'),
      (2, 'Sem margem', '{"dias":[1,2,3,4,5,6,7],"mensal":50000}'),
      (3, 'Sem faturamento', NULL)`);
  };
  const migrar = () =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL search_path TO tmp_cmv');
      await tx.$executeRawUnsafe(sql);
    });

  it('apaga só a margem (por hora e no Cadastro) e não muda mais nada', async () => {
    await preparar();
    await migrar();

    const colunas = await ler<{ column_name: string; is_nullable: string }>(
      "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_schema = 'tmp_cmv' AND table_name = 'vendas_hora'",
    );
    expect(colunas.map((c) => c.column_name)).toContain('cmv');
    expect(colunas.map((c) => c.column_name)).not.toContain('margem');
    expect(colunas.find((c) => c.column_name === 'cmv')?.is_nullable).toBe('YES');

    const horas = await ler<Record<string, unknown>>(
      'SELECT * FROM tmp_cmv.vendas_hora ORDER BY id',
    );
    expect(horas.map((h) => h.cmv)).toEqual([null, null, null]);
    // venda, clientes, unidades, datas e horas ficam exatamente como estavam
    expect(horas.map((h) => [h.carga_id, h.hora, h.venda, h.clientes, h.unidades])).toEqual([
      [10, 8, 300, 12, 40],
      [10, 9, 340, 14, 44],
      [11, 8, 250, 9, 30],
    ]);

    const lojas = await ler<{ nome: string; faturamento: unknown }>(
      'SELECT nome, faturamento FROM tmp_cmv.lojas ORDER BY id',
    );
    expect(lojas[0]!.faturamento).toEqual({
      dias: [1000, 1100, 900, 1200, 1500, 800, null],
      mensal: null,
    });
    expect(lojas[1]!.faturamento).toEqual({ dias: [1, 2, 3, 4, 5, 6, 7], mensal: 50000 });
    expect(lojas[2]!.faturamento).toBeNull();
  });

  it('rodar de novo não muda mais nada', async () => {
    await preparar();
    await migrar();
    const depoisDaPrimeira = await ler('SELECT * FROM tmp_cmv.vendas_hora ORDER BY id');
    const lojasDepois = await ler('SELECT * FROM tmp_cmv.lojas ORDER BY id');
    await migrar();
    expect(await ler('SELECT * FROM tmp_cmv.vendas_hora ORDER BY id')).toEqual(depoisDaPrimeira);
    expect(await ler('SELECT * FROM tmp_cmv.lojas ORDER BY id')).toEqual(lojasDepois);
  });
});
