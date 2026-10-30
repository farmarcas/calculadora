-- AlterTable
ALTER TABLE "simulacoes" ADD COLUMN     "aprovada_em" TIMESTAMPTZ(3),
ADD COLUMN     "aprovada_por" TEXT,
ADD COLUMN     "substituida_em" TIMESTAMPTZ(3),
ADD COLUMN     "vigencia_inicio" DATE;

-- Uma simulação em uso por loja.
CREATE UNIQUE INDEX "simulacoes_loja_em_uso_uidx" ON "simulacoes"("loja_id") WHERE "status" = 'em_uso';
