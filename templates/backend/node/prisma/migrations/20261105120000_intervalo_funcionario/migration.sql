-- Intervalo do funcionário (spec 026): início e fim, em horas decimais, opcionais. Substitui o que vinha da planilha de escala.
ALTER TABLE "funcionarios" ADD COLUMN "ini_intervalo" DOUBLE PRECISION;
ALTER TABLE "funcionarios" ADD COLUMN "fim_intervalo" DOUBLE PRECISION;
