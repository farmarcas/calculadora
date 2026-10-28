-- Parâmetros legais por fase, com versões e data de início da vigência (spec 008).
CREATE TABLE "parametros_legais" (
    "id" UUID NOT NULL,
    "fase" TEXT NOT NULL,
    "jornada_semanal_h" DOUBLE PRECISION NOT NULL,
    "horas_dia_max" DOUBLE PRECISION NOT NULL,
    "horas_dia_max_convencao" DOUBLE PRECISION,
    "dias_trabalho" INTEGER NOT NULL,
    "divisor" DOUBLE PRECISION NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "criado_por" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parametros_legais_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "parametros_legais_fase_vigencia_inicio_idx" ON "parametros_legais"("fase", "vigencia_inicio");

-- Versão inicial: os valores que estavam fixos no código (EC 141/2026, documento M4 v2.2).
INSERT INTO "parametros_legais"
  ("id", "fase", "jornada_semanal_h", "horas_dia_max", "horas_dia_max_convencao", "dias_trabalho", "divisor", "vigencia_inicio", "criado_por")
VALUES
  (gen_random_uuid(), 'atual', 44, 8, NULL, 6, 220, '2000-01-01', 'sistema'),
  (gen_random_uuid(), 'r42', 42, 8, 8.4, 5, 210, '2026-12-16', 'sistema'),
  (gen_random_uuid(), 'r40', 40, 8, NULL, 5, 200, '2027-12-01', 'sistema');
