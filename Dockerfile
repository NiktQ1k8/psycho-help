# Сборка фронтенда и отдача статики через nginx (он же терминирует TLS
# и проксирует /api/ в бэкенд стенда).
FROM node:20-alpine AS build

WORKDIR /app

# HUSKY=0 - в контейнере нет .git, хуки ставить не нужно и не во что.
ENV HUSKY=0 \
    NODE_OPTIONS=--max-old-space-size=2048

COPY package.json package-lock.json ./
RUN npm ci

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
