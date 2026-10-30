-- Encargos da folha por regime tributário (spec 015): uma versão nova a cada alteração, com data de início de vigência.
-- Os valores padrão vivem no código; a tabela só guarda o que o dono alterou.
CREATE TABLE "parametros_encargos" (
    "id" UUID NOT NULL,
    "regime" TEXT NOT NULL,
    "inss_patronal_pct" DOUBLE PRECISION NOT NULL,
    "rat_pct" DOUBLE PRECISION NOT NULL,
    "fap" DOUBLE PRECISION NOT NULL,
    "terceiros_pct" DOUBLE PRECISION NOT NULL,
    "fgts_pct" DOUBLE PRECISION NOT NULL,
    "decimo_terceiro_pct" DOUBLE PRECISION NOT NULL,
    "ferias_pct" DOUBLE PRECISION NOT NULL,
    "rescisao_pct" DOUBLE PRECISION NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "criado_por" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parametros_encargos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "parametros_encargos_regime_vigencia_inicio_idx" ON "parametros_encargos"("regime", "vigencia_inicio");
