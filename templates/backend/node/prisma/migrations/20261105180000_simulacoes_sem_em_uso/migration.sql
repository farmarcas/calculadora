-- Retirar "Marcar como em uso" da Simulação (spec 030): só dados, sem mudar a estrutura.
-- As simulações que estavam em uso ou substituídas passam a ser gravadas. Nada é apagado: nome, quadro, horários,
-- premissas e resultado não mudam, e as colunas de aprovação (aprovada_por, aprovada_em, vigencia_inicio,
-- substituida_em) continuam guardadas. Os valores em_uso e substituida seguem existindo no tipo, mas ninguém os grava.
UPDATE "simulacoes" SET "status" = 'gravada' WHERE "status" IN ('em_uso', 'substituida');
