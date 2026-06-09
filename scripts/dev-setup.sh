#!/usr/bin/env bash
#
# СИНОНИМ — одношаговая подготовка локального окружения.
#
# Что делает:
#   1. Проверяет node/npm/psql.
#   2. Ставит зависимости (npm install), если нужно.
#   3. Создаёт apps/backend/.env из шаблона (если нет) и БД Postgres.
#   4. Прогоняет миграции + сид (регион RUB, товары, категории).
#   5. Достаёт publishable-ключ и прописывает apps/storefront/.env.local.
#
# Использование:
#   DATABASE_URL=postgres://user:pass@localhost:5432/synonim ./scripts/dev-setup.sh
#   (DATABASE_URL можно не задавать — будет значение по умолчанию ниже)
#
# После завершения:  npm run dev   →  http://localhost:8000/ru
#
set -euo pipefail

# ── Пути ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_ENV="$ROOT_DIR/apps/backend/.env"
STOREFRONT_ENV="$ROOT_DIR/apps/storefront/.env.local"

cd "$ROOT_DIR"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
die()  { printf "  \033[31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

# ── 1. Проверка инструментов ────────────────────────────────────────────────
bold "1/5 · Проверка окружения"
command -v node >/dev/null || die "Не найден node (нужен ≥ 20)."
command -v npm  >/dev/null || die "Не найден npm."
command -v psql >/dev/null || die "Не найден psql (клиент PostgreSQL)."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Нужен Node ≥ 20, сейчас $(node -v)."
ok "node $(node -v), npm $(npm -v), psql есть"

# ── 2. Зависимости ───────────────────────────────────────────────────────────
bold "2/5 · Зависимости"
if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "  Устанавливаю (npm install)…"
  npm install
  ok "Зависимости установлены"
else
  ok "node_modules уже на месте (пропускаю npm install)"
fi

# ── 3. Backend .env + база ──────────────────────────────────────────────────
bold "3/5 · Backend .env и база данных"
DEFAULT_DB_URL="postgres://postgres:postgres@localhost:5432/synonim"

if [ ! -f "$BACKEND_ENV" ]; then
  cp "$ROOT_DIR/apps/backend/.env.template" "$BACKEND_ENV"
  DB_URL="${DATABASE_URL:-$DEFAULT_DB_URL}"
  # Прописываем DATABASE_URL в свежий .env
  if grep -q '^DATABASE_URL=' "$BACKEND_ENV"; then
    sed -i.bak "s#^DATABASE_URL=.*#DATABASE_URL=$DB_URL#" "$BACKEND_ENV" && rm -f "$BACKEND_ENV.bak"
  else
    printf "\nDATABASE_URL=%s\n" "$DB_URL" >> "$BACKEND_ENV"
  fi
  ok "Создан apps/backend/.env (DATABASE_URL=$DB_URL)"
else
  DB_URL="$(grep -E '^DATABASE_URL=' "$BACKEND_ENV" | head -1 | cut -d= -f2-)"
  DB_URL="${DB_URL:-${DATABASE_URL:-$DEFAULT_DB_URL}}"
  ok "apps/backend/.env уже есть (DATABASE_URL=$DB_URL)"
fi

# Имя БД и «обслуживающий» URL (для CREATE DATABASE подключаемся к postgres)
DB_NAME="$(printf '%s' "$DB_URL" | sed -E 's#.*/([^/?]+).*#\1#')"
MAINT_URL="$(printf '%s' "$DB_URL" | sed -E "s#/[^/?]+(\?|$)#/postgres\1#")"

if psql "$MAINT_URL" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1; then
  ok "База '$DB_NAME' уже существует"
else
  if psql "$MAINT_URL" -c "CREATE DATABASE \"$DB_NAME\"" >/dev/null 2>&1; then
    ok "База '$DB_NAME' создана"
  else
    warn "Не удалось создать базу автоматически. Создайте вручную: createdb $DB_NAME"
  fi
fi

# ── 4. Миграции + сид ────────────────────────────────────────────────────────
bold "4/5 · Миграции и сид (регион RUB, товары, категории)"
( cd "$ROOT_DIR/apps/backend" && npx medusa db:migrate )
ok "Миграции выполнены"

# ── 5. Publishable-ключ → storefront .env.local ─────────────────────────────
bold "5/5 · Publishable-ключ и storefront .env.local"
PUB_KEY="$(psql "$DB_URL" -tAc \
  "SELECT token FROM api_key WHERE type='publishable' AND revoked_at IS NULL AND deleted_at IS NULL ORDER BY created_at LIMIT 1" \
  2>/dev/null | tr -d '[:space:]')"

[ -n "$PUB_KEY" ] || die "Не удалось получить publishable-ключ из БД. Проверьте, что сид отработал."
ok "Ключ получен: ${PUB_KEY:0:12}…"

cat > "$STOREFRONT_ENV" <<EOF
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$PUB_KEY
NEXT_PUBLIC_DEFAULT_REGION=ru
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NODE_ENV=development
EOF
ok "Записан apps/storefront/.env.local"

echo
bold "Готово ✅  Запуск:"
echo "    npm run dev"
echo
echo "  Витрина:  http://localhost:8000/ru"
echo "  Admin:    http://localhost:9000/app"
