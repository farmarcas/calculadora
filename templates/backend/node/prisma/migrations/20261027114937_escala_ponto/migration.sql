-- CreateEnum
CREATE TYPE "importacao_ponto_status" AS ENUM ('processado', 'com_pendencias', 'rejeitado');

-- CreateEnum
CREATE TYPE "batida_situacao" AS ENUM ('ok', 'pendente', 'vinculada', 'ignorada');

-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "alertas" JSONB;

-- CreateTable
CREATE TABLE "importacoes_ponto" (
    "id" UUID NOT NULL,
    "loja_id" UUID NOT NULL,
    "arquivo" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "cnpj" TEXT,
    "periodo_inicio" DATE,
    "periodo_fim" DATE,
    "batidas_aceitas" INTEGER NOT NULL DEFAULT 0,
    "batidas_repetidas" INTEGER NOT NULL DEFAULT 0,
    "batidas_pendentes" INTEGER NOT NULL DEFAULT 0,
    "status" "importacao_ponto_status" NOT NULL,
    "motivo_rejeicao" TEXT,
    "autor" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importacoes_ponto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batidas" (
    "id" UUID NOT NULL,
    "loja_id" UUID NOT NULL,
    "importacao_id" UUID NOT NULL,
    "cpf" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "minuto" INTEGER NOT NULL,
    "nsr" INTEGER NOT NULL,
    "situacao" "batida_situacao" NOT NULL DEFAULT 'ok',
    "motivo_pendencia" TEXT,
    "matricula" TEXT,
    "resolvida_por" TEXT,
    "resolvida_em" TIMESTAMPTZ(3),
    "motivo_ignorar" TEXT,

    CONSTRAINT "batidas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "importacoes_ponto_loja_id_criado_em_idx" ON "importacoes_ponto"("loja_id", "criado_em");

-- CreateIndex
CREATE INDEX "batidas_loja_id_data_idx" ON "batidas"("loja_id", "data");

-- CreateIndex
CREATE INDEX "batidas_loja_id_situacao_idx" ON "batidas"("loja_id", "situacao");

-- CreateIndex
CREATE UNIQUE INDEX "batidas_loja_id_cpf_data_minuto_key" ON "batidas"("loja_id", "cpf", "data", "minuto");

-- AddForeignKey
ALTER TABLE "importacoes_ponto" ADD CONSTRAINT "importacoes_ponto_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batidas" ADD CONSTRAINT "batidas_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batidas" ADD CONSTRAINT "batidas_importacao_id_fkey" FOREIGN KEY ("importacao_id") REFERENCES "importacoes_ponto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
