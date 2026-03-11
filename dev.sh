#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/stokely-frontend"

if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: expected backend/ and stokely-frontend/ directories in project root." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "Error: .env file not found in project root." >&2
  echo "Create one from .env.example first." >&2
  exit 1
fi

if ! command -v go >/dev/null 2>&1; then
  echo "Error: go is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed or not in PATH." >&2
  exit 1
fi

cleanup() {
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

# Load root .env for shared variables like DB_DSN and SESSION_SECRET.
set -a
# shellcheck source=/dev/null
source "$ROOT_DIR/.env"
set +a

# Force local-safe defaults for development.
# Allow both localhost and 127.0.0.1 so either URL works in browser.
export FRONTEND_ORIGIN="${DEV_FRONTEND_ORIGIN:-http://localhost:5173,http://127.0.0.1:5173}"
export COOKIE_SECURE="${DEV_COOKIE_SECURE:-false}"
export PORT="${DEV_BACKEND_PORT:-9090}"

echo "Starting backend on :$PORT..."
(
  cd "$BACKEND_DIR"
  go run .
) &
BACKEND_PID=$!

echo "Starting frontend on :5173..."
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

echo "Local dev running."
echo "Backend:  http://localhost:$PORT"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."

wait -n "$BACKEND_PID" "$FRONTEND_PID"
