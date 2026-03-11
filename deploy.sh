#!/usr/bin/env bash
set -euo pipefail

# Load variables from .env
if [ ! -f .env ]; then
  echo "Error: .env file not found" >&2
  exit 1
fi
export $(grep -E '^(DOCKER_USERNAME|SERVER_SSH)=' .env | xargs)

if [ -z "${DOCKER_USERNAME:-}" ]; then
  echo "Error: DOCKER_USERNAME not set in .env" >&2
  exit 1
fi

echo "==> Building backend..."
docker build -t "$DOCKER_USERNAME/stokely-backend:latest" ./backend

echo "==> Building frontend..."
docker build -t "$DOCKER_USERNAME/stokely-frontend:latest" ./stokely-frontend

echo "==> Pushing images..."
docker push "$DOCKER_USERNAME/stokely-backend:latest"
docker push "$DOCKER_USERNAME/stokely-frontend:latest"

echo "==> Images pushed."

if [ -z "${SERVER_SSH:-}" ]; then
  echo ""
  echo "Tip: set SERVER_SSH=user@host in .env to auto-deploy to the server."
  echo "On the server, run:"
  echo "  docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"
  exit 0
fi

echo "==> Deploying to $SERVER_SSH..."
ssh "$SERVER_SSH" "cd ~/kuhabit && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"

echo "==> Deploy complete."
