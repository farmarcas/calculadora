# Contrato: Simulações

## Sai
- `POST /api/v1/simulacoes/:id/aprovar` (e seu corpo `{ vigenciaInicio }`): a rota deixa de existir (404).
- Nas respostas de simulação: os estados `em_uso` e `substituida`; os campos `desatualizada` e `motivosDesatualizada`.
- Em `POST /lojas/:id/simulacoes/comparar`: `referenciaId`, e em cada simulação `referencia`, `podeAprovar` e `custo.diferencaMensalFrenteEmUso`.
- Erro `SIMULACAO_EM_USO` ao descartar: deixa de existir.

## Fica
- Estados de simulação: `rascunho`, `gravada`, `descartada`.
- Criar, editar, gravar, clonar, descartar, exportar e listar: iguais.
- Comparar 2 a 3 simulações da mesma loja: devolve `simulacoes[]` com `id`, `nome`, `status`, `regra`, `indicadores`, `vagas`, `sintese` e (dono) `custo`; só as escolhidas, sem simulação extra.
- A síntese descreve a própria simulação.
