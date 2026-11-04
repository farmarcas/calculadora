#!/bin/sh
# Entrada do container de produção da API.
# Aplica as migrations que faltam (idempotente, nunca apaga dados) e só então inicia o servidor.
# Se a migration falhar, o container para: a publicação aparece como falha em vez de subir com banco errado.
set -e

node_modules/.bin/prisma migrate deploy
exec node dist/server.js
