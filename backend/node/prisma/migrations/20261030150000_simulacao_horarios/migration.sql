-- Simulação em 3 passos (spec 016): horário simulado (nulo = igual ao Cadastro) e número do cenário ao gravar.
ALTER TABLE "simulacoes" ADD COLUMN "horarios" JSONB;
ALTER TABLE "simulacoes" ADD COLUMN "numero_cenario" INTEGER;
