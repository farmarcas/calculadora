# Alvo `dev`: usado pelo Compose local (Vite com hot reload, código por bind mount).
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && cat package.json package-lock.json | md5sum | cut -d' ' -f1 > node_modules/.deps-hash
COPY . .
EXPOSE 3000
CMD ["sh", "docker/dev-entrypoint.sh"]

# Estágios abaixo: imagem de produção (último estágio = padrão de `docker build`).
# APP_BASE: subpath do build. '/' para Docker/Coolify; '/escala/' para o Radar.
FROM node:22-alpine AS build
ARG APP_BASE=/
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --base="$APP_BASE"

# NGINX_RUNTIME: 'docker' (padrão, Coolify) ou 'k8s' (cluster do Radar, serve sob /escala).
FROM nginx:1.27-alpine AS runtime
ARG NGINX_RUNTIME=docker
ENV API_UPSTREAM=http://api:4000
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/nginx.k8s.conf.template /tmp/nginx.k8s.conf.template
RUN if [ "$NGINX_RUNTIME" = "k8s" ]; then \
      cp /tmp/nginx.k8s.conf.template /etc/nginx/templates/default.conf.template; \
    fi; rm -f /tmp/nginx.k8s.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
