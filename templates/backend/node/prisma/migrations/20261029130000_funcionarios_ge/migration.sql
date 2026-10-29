-- A matrícula passa a ser única dentro do GE (antes era única no sistema todo). Para o banco garantir isso,
-- o funcionário guarda o GE da sua loja (copiado da loja; a loja não troca de GE).
ALTER TABLE "funcionarios" ADD COLUMN "ge_id" UUID;
UPDATE "funcionarios" f SET "ge_id" = l."ge_id" FROM "lojas" l WHERE l."id" = f."loja_id";
ALTER TABLE "funcionarios" ALTER COLUMN "ge_id" SET NOT NULL;
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_ge_id_fkey" FOREIGN KEY ("ge_id") REFERENCES "grupos_economicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "funcionarios_matricula_active_uidx";
CREATE UNIQUE INDEX "funcionarios_ge_matricula_active_uidx" ON "funcionarios"("ge_id", "matricula") WHERE "deleted_at" IS NULL;
CREATE INDEX "funcionarios_ge_id_idx" ON "funcionarios"("ge_id");
