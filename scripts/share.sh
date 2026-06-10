#!/usr/bin/env bash
#
# СИНОНИМ — поднять сайт локально и открыть публичную ссылку через cloudflared.
#
# Запускает backend (:9000) + витрину (:8000) и туннель Cloudflare, который
# выдаёт временный https://<...>.trycloudflare.com — открывай в браузере или
# отправляй коллеге. Стек и туннель глушатся по Ctrl+C.
#
# Требования: Node ≥ 20, PostgreSQL, cloudflared.
# Использование:  ./scripts/share.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
die()  { printf "  \033[31m✗ %s\033[0m\n" "$1" >&2; exit 1; }

# ── Проверка cloudflared ─────────────────────────────────────────────────────
if ! command -v cloudflared >/dev/null 2>&1; then
  bold "cloudflared не установлен. Установка:"
  echo "  macOS:        brew install cloudflared"
  echo "  Linux (deb):  https://pkg.cloudflare.com/  (или бинарь с GitHub releases)"
  echo "  Windows:      winget install --id Cloudflare.cloudflared"
  echo "  Бинарь:       https://github.com/cloudflare/cloudflared/releases/latest"
  die "Установите cloudflared и запустите скрипт снова."
fi

# ── Подготовка окружения (БД, миграции, сид, ключ) ───────────────────────────
if [ ! -f "$ROOT_DIR/apps/storefront/.env.local" ] ||
   ! grep -q "pk_" "$ROOT_DIR/apps/storefront/.env.local" 2>/dev/null; then
  bold "Готовлю окружение (dev-setup.sh)…"
  "$SCRIPT_DIR/dev-setup.sh"
else
  ok "Окружение уже настроено (.env.local с ключом найден)"
fi

# ── Запуск стека ─────────────────────────────────────────────────────────────
LOG_DIR="$(mktemp -d)"
PIDS=()

cleanup() {
  echo
  bold "Останавливаю стек и туннель…"
  for pid in "${PIDS[@]:-}"; do
    [ -n "${pid:-}" ] && kill "$pid" 2>/dev/null || true
  done
  # turbo/next порождают дочерние процессы — добиваем по портам/имени
  pkill -P $$ 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait_port() {
  local url="$1" name="$2" tries=60
  printf "  Жду %s" "$name"
  while [ $tries -gt 0 ]; do
    if curl -s -o /dev/null "$url" 2>/dev/null; then echo " — готово"; return 0; fi
    printf "."; sleep 2; tries=$((tries - 1))
  done
  echo; die "$name не поднялся вовремя. Лог: $LOG_DIR"
}

bold "Запускаю стек (backend :9000 + витрина :8000)…"
( cd "$ROOT_DIR" && npm run dev ) > "$LOG_DIR/stack.log" 2>&1 &
PIDS+=($!)

wait_port "http://localhost:9000/health" "backend (:9000)"
wait_port "http://localhost:8000" "витрину (:8000)"
ok "Стек поднят. Логи: $LOG_DIR/stack.log"

# ── Туннель ──────────────────────────────────────────────────────────────────
echo
bold "Поднимаю публичный туннель Cloudflare…"
echo "  Публичная ссылка появится ниже (строка trycloudflare.com)."
echo "  Останови всё по Ctrl+C."
echo
cloudflared tunnel --url http://localhost:8000 --no-autoupdate
