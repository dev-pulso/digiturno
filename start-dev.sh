#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

cleanup() {
  echo ""
  echo "Deteniendo servicios..."
  kill $API_PID $REVERB_PID $VITE_PID 2>/dev/null
  wait $API_PID $REVERB_PID $VITE_PID 2>/dev/null
  echo "Todos los servicios detenidos."
}
trap cleanup EXIT INT TERM

# Kill any leftover processes from previous runs
for port in 8000 8081 5173; do lsof -ti:$port 2>/dev/null; done | sort -u | xargs kill -9 2>/dev/null || true
sleep 1

echo "=== Iniciando API (Laravel) ==="
cd "$API_DIR/public" && setsid php -d upload_max_filesize=200M -d post_max_size=205M -S 0.0.0.0:8000 ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php > /tmp/laravel.log 2>&1 < /dev/null &
API_PID=$!
cd "$ROOT_DIR"
sleep 2

echo "=== Iniciando WebSocket (Reverb) ==="
cd "$API_DIR" && setsid php artisan reverb:start --port=8081 --host=0.0.0.0 > /tmp/reverb.log 2>&1 < /dev/null &
REVERB_PID=$!
cd "$ROOT_DIR"
sleep 2

echo "=== Iniciando Frontend (Vite) ==="
cd "$FRONTEND_DIR" && setsid npm run dev -- --host 0.0.0.0 > /tmp/vite.log 2>&1 < /dev/null &
VITE_PID=$!
cd "$ROOT_DIR"

echo ""
echo "═══ Servicios iniciados ═══"
echo "  API:       http://localhost:8000"
echo "  WebSocket: ws://localhost:8081"
echo "  Frontend:  http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener todos los servicios."

wait
