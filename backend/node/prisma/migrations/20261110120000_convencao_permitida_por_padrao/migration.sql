-- Convenção coletiva que permite 8h24 por dia passa a ser permitida por padrão em todas as lojas.
-- 1) Lojas novas nascem com a convenção permitida (o padrão da coluna muda de falso para verdadeiro).
-- 2) As lojas que já existem passam a permitir também. Nada é apagado e a configuração segue editável por loja
--    (Cadastro da loja > Regras e custos > Convenção coletiva).
ALTER TABLE "lojas" ALTER COLUMN "convencao_8h24" SET DEFAULT true;
UPDATE "lojas" SET "convencao_8h24" = true WHERE "convencao_8h24" = false;
