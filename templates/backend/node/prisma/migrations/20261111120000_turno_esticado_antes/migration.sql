-- Spec 046: guarda o horário de antes de o turno ser esticado até o limite da regra (colunas novas, opcionais).
ALTER TABLE "simulacao_turnos" ADD COLUMN "antes_entrada" DOUBLE PRECISION,
ADD COLUMN "antes_saida" DOUBLE PRECISION;
