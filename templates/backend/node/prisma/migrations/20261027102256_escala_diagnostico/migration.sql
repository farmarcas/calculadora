-- CreateEnum
CREATE TYPE "carga_tipo" AS ENUM ('escala', 'base');

-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "convencao_8h24" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minimos" JSONB;

-- CreateTable
CREATE TABLE "cargas" (
    "id" UUID NOT NULL,
    "loja_id" UUID NOT NULL,
    "tipo" "carga_tipo" NOT NULL,
    "arquivo" TEXT NOT NULL,
    "recebida_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linhas_aceitas" INTEGER NOT NULL,
    "linhas_rejeitadas" INTEGER NOT NULL,
    "periodo_inicio" DATE,
    "periodo_fim" DATE,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cargas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos_atuais" (
    "id" UUID NOT NULL,
    "carga_id" UUID NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT,
    "tipo_escala" TEXT,
    "dias" INTEGER[],
    "entrada" DOUBLE PRECISION NOT NULL,
    "ini_intervalo" DOUBLE PRECISION,
    "fim_intervalo" DOUBLE PRECISION,
    "saida" DOUBLE PRECISION NOT NULL,
    "carga_h" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "motivo" TEXT,
    "cadastrado" BOOLEAN NOT NULL,

    CONSTRAINT "turnos_atuais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas_hora" (
    "id" UUID NOT NULL,
    "carga_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "hora" INTEGER NOT NULL,
    "venda" DOUBLE PRECISION NOT NULL,
    "margem" DOUBLE PRECISION NOT NULL,
    "clientes" INTEGER NOT NULL,
    "unidades" INTEGER NOT NULL,

    CONSTRAINT "vendas_hora_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cargas_loja_id_tipo_ativa_idx" ON "cargas"("loja_id", "tipo", "ativa");

-- CreateIndex
CREATE INDEX "turnos_atuais_carga_id_idx" ON "turnos_atuais"("carga_id");

-- CreateIndex
CREATE INDEX "vendas_hora_carga_id_idx" ON "vendas_hora"("carga_id");

-- AddForeignKey
ALTER TABLE "cargas" ADD CONSTRAINT "cargas_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos_atuais" ADD CONSTRAINT "turnos_atuais_carga_id_fkey" FOREIGN KEY ("carga_id") REFERENCES "cargas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_hora" ADD CONSTRAINT "vendas_hora_carga_id_fkey" FOREIGN KEY ("carga_id") REFERENCES "cargas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Uma carga ativa por loja e tipo.
CREATE UNIQUE INDEX "cargas_loja_tipo_ativa_uidx" ON "cargas"("loja_id", "tipo") WHERE "ativa";
