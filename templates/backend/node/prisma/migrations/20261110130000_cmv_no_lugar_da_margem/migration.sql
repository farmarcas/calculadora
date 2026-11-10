-- CMV no lugar da margem (spec 034). Só dados e uma coluna: nada além da margem é tocado.
-- 1) A margem por hora das bases comerciais vira o CMV por hora: a coluna é renomeada, passa a aceitar "sem dado" (nulo)
--    e todas as linhas, inclusive as de bases antigas guardadas como histórico, ficam nulas (limpeza). Venda, clientes,
--    unidades, datas e horas não mudam.
-- 2) A "margem bruta média" que algumas lojas tinham guardada no faturamento é removida. O faturamento por dia e o mensal
--    ficam como estavam.
-- Pode rodar mais de uma vez: a segunda vez não muda nada.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'vendas_hora' AND column_name = 'margem'
  ) THEN
    ALTER TABLE "vendas_hora" RENAME COLUMN "margem" TO "cmv";
  END IF;
END $$;

ALTER TABLE "vendas_hora" ALTER COLUMN "cmv" DROP NOT NULL;
UPDATE "vendas_hora" SET "cmv" = NULL WHERE "cmv" IS NOT NULL;

UPDATE "lojas"
SET "faturamento" = "faturamento" - 'margemPct'
WHERE "faturamento" IS NOT NULL AND jsonb_exists("faturamento", 'margemPct');
