# Contrato: variáveis de produção

Preenchidas no Coolify (aba de variáveis do projeto). Nenhuma vai para o repositório.

| Variável | Obrigatória | Exemplo | Observação |
|---|---|---|---|
| `POSTGRES_USER` | sim | `calculadora` | usuário do banco |
| `POSTGRES_PASSWORD` | sim | (gerada) | só letras e números; forte e única |
| `POSTGRES_DB` | sim | `calculadora` | nome do banco |

O endereço público (domínio) é configurado no Coolify, no serviço `web`, não em variável.

Portas internas fixas: API 4000, tela 80. Nenhuma é publicada no servidor.

## Verificações (contrato de saúde)

- `web`: `GET /` responde 200.
- `api`: `GET /health/ready` responde 200 quando o banco está acessível (já existente).
- Pela tela: `GET /health/ready` e `/api/v1/...` chegam à API via proxy.
