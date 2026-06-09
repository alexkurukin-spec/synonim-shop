# Production-образ Medusa backend (Фаза 4/5).
# Контекст сборки — каталог apps/backend (на Railway/Render: Root Directory = apps/backend).
# Multi-stage: собираем .medusa/server, затем гоним только его с прод-зависимостями.

# ---- build ----
FROM node:22-slim AS build
WORKDIR /app

# системные зависимости для нативных модулей (pg и пр.)
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build      # medusa build → /app/.medusa/server

# ---- runtime ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# самодостаточный собранный сервер (со своим package.json)
COPY --from=build /app/.medusa/server ./
RUN npm install --omit=dev

EXPOSE 9000

# При старте прогоняем миграции (идемпотентно: схема + сид один раз), затем сервер.
# Слушаем порт из $PORT (Railway/Render инжектят его), по умолчанию 9000.
# Хочешь отделить миграции — убери первую часть и запускай отдельной командой.
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start -p ${PORT:-9000}"]
