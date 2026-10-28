-- Cadastro de loja completo (spec 007): só colunas novas, nada é apagado das tabelas.
ALTER TABLE "lojas"
  ADD COLUMN "cidade" TEXT,
  ADD COLUMN "regime_tributario" TEXT,
  ADD COLUMN "faturamento" JSONB;

ALTER TABLE "funcionarios"
  ADD COLUMN "carga_mensal_h" INTEGER,
  ADD COLUMN "entrada" DOUBLE PRECISION,
  ADD COLUMN "saida" DOUBLE PRECISION,
  ADD COLUMN "dias" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- O regime tributário passa de dentro de "custos" para a própria loja (um só lugar).
UPDATE "lojas"
SET "regime_tributario" = CASE lower("custos"->>'regimeTributario')
    WHEN 'simples nacional' THEN 'simples'
    WHEN 'simples' THEN 'simples'
    WHEN 'lucro presumido' THEN 'presumido'
    WHEN 'lucro real' THEN 'real'
    ELSE NULL
  END,
  "custos" = "custos" - 'regimeTributario'
WHERE "custos" ? 'regimeTributario';
