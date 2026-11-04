# Alvo `dev`: usado pelo Compose local (hot reload, código por bind mount).
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci && cat package.json package-lock.json | md5sum | cut -d' ' -f1 > node_modules/.deps-hash
COPY . .
EXPOSE 4000
CMD ["sh", "docker/dev-entrypoint.sh"]

# Estágios abaixo: imagem de produção (último estágio = padrão de `docker build`).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json ./
RUN npm ci
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev && npx prisma generate
COPY --from=build /app/dist ./dist
COPY docker/prod-entrypoint.sh ./docker/prod-entrypoint.sh
USER node
EXPOSE 4000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:${PORT:-4000}/health/ready || exit 1
CMD ["sh", "docker/prod-entrypoint.sh"]
