-- Spec 056: a observação que a pessoa escreve ao salvar o cenário e o parecer (o retrato do momento de salvar). Colunas novas, opcionais.
ALTER TABLE "simulacoes" ADD COLUMN "observacao" TEXT,
ADD COLUMN "parecer" JSONB;
