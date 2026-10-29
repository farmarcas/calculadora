# Quickstart: verificar o multiempresário

1. Ambiente de pé: `docker compose ps` com os três serviços saudáveis; `http://localhost:3000`.
2. Antes da migration, anotar: nº de lojas, de funcionários, de simulações e o diagnóstico da loja 001.
3. Aplicar a migration; conferir que os números do passo 2 continuam iguais e que tudo está no "Grupo inicial".
4. Como **operador**: criar o GE "Empresário A" e enviar o Excel modelo com 5 CNPJs; conferir a tela de conferência; confirmar; ver as 5 lojas.
5. Criar o GE "Empresário B" com outras lojas; trocar o GE e ver que nada do A aparece, nem pelo endereço direto de uma loja do A (404).
6. Como **dono do GE A**: corrigir a cidade de uma loja; cadastrar 3 funcionários; ver o diagnóstico.
7. Como operador, reenviar o mesmo Excel: a loja corrigida aparece em "conflitos" e fica mantida por padrão; substituir uma e conferir.
8. CNPJ repetido em outro GE e CNPJ inválido: rejeitados com linha e motivo.
9. Rodar `npm test`, `npm run test:integration`, lint, tsc e `scripts/check-repo.sh`.
