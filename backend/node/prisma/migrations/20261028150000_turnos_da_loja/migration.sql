-- Turnos da loja com o mínimo de pessoas por cargo em cada um (spec 008). Nula = mínimo único do dia inteiro.
ALTER TABLE "lojas" ADD COLUMN "turnos" JSONB;
