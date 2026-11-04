# Research: Ambiente de produção no Coolify

## 1. Como o Coolify publica
- **Decision**: um único Docker Compose (`docker-compose.prod.yml`), com o domínio ligado ao serviço `web`.
- **Rationale**: o Coolify lê Compose direto do repositório, cria o proxy com HTTPS e injeta as variáveis. Mantém banco, API e tela juntos.
- **Alternatives**: três aplicações separadas no Coolify (permite troca sem interrupção, mas exige configurar rede e variáveis em três lugares); rejeitado pelo custo para quem não é técnico.

## 2. Servir a tela
- **Decision**: build do Vite num estágio e nginx alpine servindo `dist`, com fallback para `index.html` e proxy de `/api` e `/health` para a API.
- **Rationale**: o cliente da tela chama `/api/v1/...` por caminho relativo; com o proxy no mesmo endereço não há problema de acesso entre endereços e nada de variável de build.
- **Alternatives**: servir a tela pela própria API (mistura responsabilidades); Vite preview (não é para produção).
- **Detalhe**: o nginx resolve o endereço da API a cada chamada (resolver do Docker) para não cair se a API reiniciar; limite de envio de 20 MB por causa dos uploads de planilha.

## 3. Migrations
- **Decision**: `prisma migrate deploy` no entrypoint da API antes de `node dist/server.js`.
- **Rationale**: o Prisma CLI já está nas dependências de produção; o comando é idempotente e só aplica o que falta. É o mesmo padrão do local.
- **Alternatives**: serviço separado só para migrar (mais peças); passo manual (contra a spec).

## 4. Banco
- **Decision**: `postgres:16-alpine`, volume nomeado, sem `ports`, rede interna do Compose.
- **Rationale**: FR-006 e FR-007. Variáveis `:?` fazem a publicação falhar sem senha (FR-004).

## 5. Dados de exemplo
- **Decision**: o seed não entra na imagem de produção nem roda no entrypoint.
- **Rationale**: FR-009. O "Grupo inicial" e os parâmetros legais já nascem por migration.

## 6. Backup
- **Decision**: sem guia; backup fica a cargo do recurso de backup agendado do próprio Coolify.
- **Rationale**: sem código novo.

## 7. Verificação sem Coolify
- **Decision**: subir o Compose de produção localmente com `-p calculadora-prod` (volumes e rede próprios) e testar por dentro dos contêineres, sem publicar portas.
- **Rationale**: valida imagens, migrations e proxy sem tocar nos dados locais (princípio V).
