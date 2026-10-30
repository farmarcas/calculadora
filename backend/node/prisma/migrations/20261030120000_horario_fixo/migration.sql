-- Marca opcional do funcionário: horário fixo = não entra na redistribuição da escala (spec 013). Padrão: falso.
ALTER TABLE "funcionarios" ADD COLUMN "horario_fixo" BOOLEAN NOT NULL DEFAULT false;
