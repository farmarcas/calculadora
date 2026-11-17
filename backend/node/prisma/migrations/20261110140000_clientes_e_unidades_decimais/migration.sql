-- Clientes e unidades por hora passam a aceitar decimais (spec 036): a base por CNPJ guarda a média de um dia
-- (ex.: 86 tickets em 17 segundas = 5,06). Os valores existentes são inteiros e continuam iguais. Nada é apagado.
ALTER TABLE "vendas_hora"
  ALTER COLUMN "clientes" TYPE double precision,
  ALTER COLUMN "unidades" TYPE double precision;
