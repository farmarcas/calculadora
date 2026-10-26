-- CreateEnum
CREATE TYPE "importacao_status" AS ENUM ('aguardando_confirmacao', 'confirmada');

-- CreateTable
CREATE TABLE "lojas" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "uf" TEXT,
    "marca" TEXT,
    "horarios" JSONB,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lojas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" UUID NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "loja_id" UUID NOT NULL,
    "cargo" TEXT,
    "funcao_escala" TEXT,
    "carga_semanal_h" INTEGER,
    "regime" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importacoes_cadastro" (
    "id" UUID NOT NULL,
    "arquivo" TEXT NOT NULL,
    "status" "importacao_status" NOT NULL DEFAULT 'aguardando_confirmacao',
    "abas" JSONB NOT NULL,
    "mapeamento" JSONB,
    "resumo" JSONB,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmado_em" TIMESTAMPTZ(3),

    CONSTRAINT "importacoes_cadastro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "alvo_tipo" TEXT NOT NULL,
    "alvo_id" TEXT,
    "detalhe" JSONB,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funcionarios_loja_id_idx" ON "funcionarios"("loja_id");

-- CreateIndex
CREATE INDEX "auditoria_alvo_tipo_alvo_id_idx" ON "auditoria"("alvo_tipo", "alvo_id");

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Código da loja e matrícula são únicos só entre registros ativos (exclusão lógica).
CREATE UNIQUE INDEX "lojas_codigo_active_uidx" ON "lojas"("codigo") WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "funcionarios_matricula_active_uidx" ON "funcionarios"("matricula") WHERE "deleted_at" IS NULL;
