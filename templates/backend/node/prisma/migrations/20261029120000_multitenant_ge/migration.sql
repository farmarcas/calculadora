-- Multiempresário por GE (spec 011). Só acrescenta e preenche: nada é apagado.
-- Todo o cadastro que já existe passa a pertencer ao "Grupo inicial".

CREATE TABLE "grupos_economicos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "identificacao" TEXT NOT NULL,
    "responsavel" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "grupos_economicos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grupos_economicos_identificacao_key" ON "grupos_economicos"("identificacao");

-- GE inicial com id fixo (os testes e a conferência dependem dele).
INSERT INTO "grupos_economicos" ("id", "nome", "identificacao", "updated_at")
VALUES ('00000000-0000-7000-8000-000000000001', 'Grupo inicial', 'GE-INICIAL', CURRENT_TIMESTAMP);

-- Lojas
ALTER TABLE "lojas" ADD COLUMN "ge_id" UUID;
ALTER TABLE "lojas" ADD COLUMN "ultima_carga" JSONB;
UPDATE "lojas" SET "ge_id" = '00000000-0000-7000-8000-000000000001';
ALTER TABLE "lojas" ALTER COLUMN "ge_id" SET NOT NULL;
ALTER TABLE "lojas" ADD CONSTRAINT "lojas_ge_id_fkey" FOREIGN KEY ("ge_id") REFERENCES "grupos_economicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CNPJ guardado só com os 14 dígitos; vazio vira nulo ("CNPJ pendente").
UPDATE "lojas" SET "cnpj" = NULLIF(regexp_replace("cnpj", '\D', '', 'g'), '') WHERE "cnpj" IS NOT NULL;
-- Se duas lojas ativas repetem o CNPJ, a mais antiga mantém e a outra fica pendente para o operador completar.
UPDATE "lojas" l SET "cnpj" = NULL
FROM (
    SELECT "id", row_number() OVER (PARTITION BY "cnpj" ORDER BY "created_at", "id") AS rn
    FROM "lojas" WHERE "deleted_at" IS NULL AND "cnpj" IS NOT NULL
) d
WHERE l."id" = d."id" AND d.rn > 1;

-- O código passa a ser único dentro do GE (antes era único no sistema todo); o CNPJ, no sistema todo.
DROP INDEX "lojas_codigo_active_uidx";
CREATE UNIQUE INDEX "lojas_ge_codigo_active_uidx" ON "lojas"("ge_id", "codigo") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "lojas_cnpj_active_uidx" ON "lojas"("cnpj") WHERE "deleted_at" IS NULL AND "cnpj" IS NOT NULL;
CREATE INDEX "lojas_ge_id_idx" ON "lojas"("ge_id");

-- Importações de cadastro: as de um GE trazem o GE; a carga de lojas da plataforma não (o arquivo traz vários GEs).
ALTER TABLE "importacoes_cadastro" ADD COLUMN "ge_id" UUID;
ALTER TABLE "importacoes_cadastro" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'cadastro';
UPDATE "importacoes_cadastro" SET "ge_id" = '00000000-0000-7000-8000-000000000001';
ALTER TABLE "importacoes_cadastro" ADD CONSTRAINT "importacoes_cadastro_ge_id_fkey" FOREIGN KEY ("ge_id") REFERENCES "grupos_economicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "importacoes_cadastro_ge_id_idx" ON "importacoes_cadastro"("ge_id");

-- Auditoria: o GE da ação (vazio nas ações da plataforma sem GE).
ALTER TABLE "auditoria" ADD COLUMN "ge_id" UUID;
UPDATE "auditoria" SET "ge_id" = '00000000-0000-7000-8000-000000000001';
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_ge_id_fkey" FOREIGN KEY ("ge_id") REFERENCES "grupos_economicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "auditoria_ge_id_idx" ON "auditoria"("ge_id");
