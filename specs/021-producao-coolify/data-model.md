# Data Model: Ambiente de produção no Coolify

Esta funcionalidade não cria nem altera tabelas. Os dados de negócio continuam no schema atual do Prisma.

- **Volume persistente do banco** (`postgres_data` de produção): guarda todos os dados; precisa sobreviver a reinícios e novas versões. Nunca é recriado pela publicação.
- **Variáveis de produção**: ver [contracts/variaveis-de-ambiente.md](contracts/variaveis-de-ambiente.md).
