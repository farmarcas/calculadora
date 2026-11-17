CREATE TABLE "sessoes" (
    "id" UUID NOT NULL,
    "radar_usuario_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "operador" BOOLEAN NOT NULL DEFAULT false,
    "grupos" JSONB NOT NULL,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,
    "encerrada_em" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessoes_expira_em_idx" ON "sessoes"("expira_em");

ALTER TABLE "auditoria" ADD COLUMN "usuario_id" TEXT;
ALTER TABLE "auditoria" ADD COLUMN "usuario_nome" TEXT;
