# Modelo de dados — Escala

| Tabela | Campos principais | Observações |
|---|---|---|
| lojas | id, codigo (único), nome, cnpj, uf, marca, deletedAt | horário em `lojas_horarios` |
| lojas_horarios | lojaId, tipoDia (seg-sex, sab, dom, feriado), abre, fecha | horário de funcionamento |
| funcionarios | id, lojaId (lotação), nome, cpf?, cargo, funcaoEscala, cargaSemanalH, regime, ativo, deletedAt | função: Farmacêutico, Atendimento, Caixa, Apoio, Perfumaria |
| importacoes_cadastro | id, arquivo, hash, status, mapeamento (json), resumo (json), criadoEm | aceitas/rejeitadas por linha em `importacoes_linhas` |
| importacoes_linhas | importacaoId, aba, linha, status, motivo | |
| cargas_escala | id, lojaId, arquivo, recebidaEm, substituidaPor? | histórico de cargas |
| turnos_atuais | cargaId, funcionarioId, dia, entrada, iniIntervalo, fimIntervalo, saida | escala atual importada |
| base_comercial | lojaId, data, hora, itens, cupons, valor | vendas por hora |
| regras_perfis | id, nome (atual/42h/40h), vigenciaInicio, parametros (json) | versionado |
| simulacoes | id, lojaId, nome, status, origemId?, premissas (json congelado), resultado (json), autor, criadaEm, aprovadaPor?, aprovadaEm?, vigenciaInicio? | no máximo 1 `em_uso` por loja (índice único parcial) |
| simulacao_turnos | simulacaoId, funcionarioId (ou vagaId), dia, entrada, iniIntervalo, fimIntervalo, saida | |
| auditoria | id, acao, perfil, alvoTipo, alvoId, detalhe (json), em | |

**Estados da simulação**: rascunho → gravada → em_uso → substituída; rascunho/gravada → descartada.
**Regras de validação**: loja única por código; funcionário com loja existente; horários coerentes (entrada < saída); aprovar exige zero erros objetivos e farmacêutico em todo horário aberto.
