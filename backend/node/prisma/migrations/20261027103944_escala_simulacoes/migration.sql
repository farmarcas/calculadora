-- CreateEnum
CREATE TYPE "simulacao_status" AS ENUM ('rascunho', 'gravada', 'em_uso', 'substituida', 'descartada');

-- CreateTable
CREATE TABLE "simulacoes" (
    "id" UUID NOT NULL,
    "loja_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "simulacao_status" NOT NULL DEFAULT 'rascunho',
    "regra" TEXT NOT NULL,
    "origem_id" UUID,
    "autor" TEXT NOT NULL,
    "quadro" JSONB NOT NULL,
    "premissas" JSONB,
    "resultado" JSONB,
    "criada_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gravada_em" TIMESTAMPTZ(3),
    "atualizada_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "simulacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulacao_turnos" (
    "id" UUID NOT NULL,
    "simulacao_id" UUID NOT NULL,
    "matricula" TEXT NOT NULL,
    "dia" INTEGER NOT NULL,
    "entrada" DOUBLE PRECISION NOT NULL,
    "saida" DOUBLE PRECISION NOT NULL,
    "ini_intervalo" DOUBLE PRECISION,
    "fim_intervalo" DOUBLE PRECISION,

    CONSTRAINT "simulacao_turnos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "simulacoes_loja_id_status_idx" ON "simulacoes"("loja_id", "status");

-- CreateIndex
CREATE INDEX "simulacao_turnos_simulacao_id_idx" ON "simulacao_turnos"("simulacao_id");

-- AddForeignKey
ALTER TABLE "simulacoes" ADD CONSTRAINT "simulacoes_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulacao_turnos" ADD CONSTRAINT "simulacao_turnos_simulacao_id_fkey" FOREIGN KEY ("simulacao_id") REFERENCES "simulacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
