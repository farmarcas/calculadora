# Modelo de dados — vagas e custo

| Onde | Campo | Observação |
|---|---|---|
| `lojas` (migration) | `custos` JSON nulo | `{ salarioMedio: { "Farmacêutico": 8000, ... }, encargosPct: 70, regimeTributario: "Simples" }`; sem padrão |
| `simulacoes.quadro` (JSON existente) | por pessoa: `vaga?: true`, `desligado?: true` | vaga: matrícula `VAGA-1`, nome "Vaga 1", função e `cargaH`; nunca vira funcionário |
| `simulacoes.premissas` (JSON existente) | `custos` | snapshot dos custos da loja ao gravar |

**Regras**: carga de vaga inteira de 4 a 44h; no máximo 20 vagas por simulação; desligamento só de pessoa do cadastro (não de vaga: remova a vaga); só rascunho edita.
**Auditoria**: `simulacao.vaga-adicionada`, `simulacao.vaga-removida`, `simulacao.desligamento`, `loja.custos` (sem valores no detalhe).
