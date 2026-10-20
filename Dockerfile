# Сборка фронтенда и отдача статики через nginx (он же терминирует TLS
# и проксирует /api/ в бэкенд стенда).
FROM node:24-alpine AS build

WORKDIR /app

# HUSKY=0 - в контейнере нет .git, хуки ставить не нужно и не во что.
ENV HUSKY=0 \
    NODE_OPTIONS=--max-old-space-size=2048

COPY package.json package-lock.json ./
# Keep downloaded packages even if a build fails. Print network requests and
# the npm debug log so a failed deploy can be diagnosed from Actions logs.
RUN --mount=type=cache,id=psycho-help-npm,target=/root/.npm,sharing=locked \
    npm ci \
        --prefer-offline \
        --no-audit \
        --no-fund \
        --loglevel=verbose \
        --fetch-timeout=60000 \
        --fetch-retries=2 \
        --fetch-retry-mintimeout=1000 \
        --fetch-retry-maxtimeout=10000 \
        --logs-dir=/tmp/npm-logs \
    || { npm_ci_status=$?; \
         tail -n 200 /tmp/npm-logs/*-debug-0.log || true; \
         exit "$npm_ci_status"; }

COPY . .

# Один и тот же образ подходит обоим стендам: API живёт на том же origin,
# что и фронт, поэтому адрес относительный и ничего не зашивается намертво.
ARG VITE_REACT_APP_PUBLIC_URL=/
ARG VITE_REACT_APP_API_URL=/api/
ARG VITE_REACT_APP_IMAGE_URL=/api/image/

RUN printf 'VITE_REACT_APP_PUBLIC_URL=%s\nVITE_REACT_APP_API_URL=%s\nVITE_REACT_APP_IMAGE_URL=%s\n' \
        "$VITE_REACT_APP_PUBLIC_URL" \
        "$VITE_REACT_APP_API_URL" \
        "$VITE_REACT_APP_IMAGE_URL" \
        > .env.production \
    && npm run build


FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html

# Штатный энтрипоинт nginx прогоняет шаблоны через envsubst и кладёт
# результат в /etc/nginx/conf.d/, перекрывая дефолтный конфиг.
COPY nginx/stand.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80 443
