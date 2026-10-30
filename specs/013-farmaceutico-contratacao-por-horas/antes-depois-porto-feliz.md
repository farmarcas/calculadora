# Porto Feliz — o "depois" (spec 013, fatia 3)

Mesmo quadro, horário (94 h por semana) e custos do "antes". Perfil dono.

## 44h (regra atual) (atual) — falta
- Resumo: turnos em falta 2, saldo de horas 76, contratar 1
| Cargo | Obrigatório | Meta (h) | Capacidade (h) | Gap (h) | Sugestão |
|---|---|---|---|---|---|
| Farmacêutico | sim | 94 | 88 | 6 | parcial: 0 integral(is) + parcial 6h, ociosas 0h (0%) |
| Atendimento | não | 94 | 176 | 0 | — |
| Apoio | não | 132 | 132 | 0 | — |

## 42h (r42) — falta
- Resumo: turnos em falta 4, saldo de horas 40, contratar 2
| Cargo | Obrigatório | Meta (h) | Capacidade (h) | Gap (h) | Sugestão |
|---|---|---|---|---|---|
| Farmacêutico | sim | 94 | 80 | 14 | parcial: 0 integral(is) + parcial 14h, ociosas 0h (0%) |
| Atendimento | não | 94 | 160 | 0 | — |
| Apoio | não | 132 | 120 | 12 | parcial: 0 integral(is) + parcial 12h, ociosas 0h (0%) |

## 40h (r40) — falta
- Resumo: turnos em falta 4, saldo de horas 40, contratar 2
| Cargo | Obrigatório | Meta (h) | Capacidade (h) | Gap (h) | Sugestão |
|---|---|---|---|---|---|
| Farmacêutico | sim | 94 | 80 | 14 | parcial: 0 integral(is) + parcial 14h, ociosas 0h (0%) |
| Atendimento | não | 94 | 160 | 0 | — |
| Apoio | não | 132 | 120 | 12 | parcial: 0 integral(is) + parcial 12h, ociosas 0h (0%) |

## Cenário 1 (manter horários) — r42
- Farmacêutico (obrigatoria): 0 integral(is), parcial 14, contratadas 14h, ociosidade 0%
- Apoio (meta): 0 integral(is), parcial 12, contratadas 12h, ociosidade 0%
- Custo adicional: R$ 3543.86 por mês; ociosidade 0%
## Cenário 2 — r42: viável=False, não resolve sozinho=True, falta 5h

## Cenário 1 (manter horários) — r40
- Farmacêutico (obrigatoria): 0 integral(is), parcial 14, contratadas 14h, ociosidade 0%
- Apoio (meta): 0 integral(is), parcial 12, contratadas 12h, ociosidade 0%
- Custo adicional: R$ 3721.05 por mês; ociosidade 0%
## Cenário 2 — r40: viável=False, não resolve sozinho=True, falta 5h

## Nota sobre a comparação

O "antes" foi registrado com **1 farmacêutico** no quadro da Porto Feliz. Na conferência de hoje o cadastro local da loja tem **2 farmacêuticos de 44 h** (Bruna e Rafael), então os números acima não são comparáveis linha a linha com o "antes": o gap do farmacêutico caiu de 54 h para 14 h (regras de 42 h e 40 h) porque o quadro tem mais um profissional, não por causa da mudança de lógica.

O caso de 1 farmacêutico está coberto por teste feito à mão (`capacidade.test.ts`): necessidade 94 h, capacidade 40 h, gap 54 h → **1 integral de 40 h + 1 parcial de 14 h**, 0% de ociosidade, custo R$ 10.078,10 por mês (antes: 2 integrais, 10% ociosas, R$ 14.930,51).

Efeitos da nova lógica na loja de hoje: o Atendimento (4 pessoas × 44 h) não gera mais falta; o Apoio ganha 1 parcial de 12 h nas regras de 42 h e 40 h porque a meta é manter o nível de hoje (132 h); o custo adicional do Cenário 1 vem só do farmacêutico (obrigatório) e do Apoio (meta).
