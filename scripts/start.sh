#!/usr/bin/env bash
# start.sh — jalanin semua service development
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()  { echo -e "${GREEN}  OK${NC} $1"; }
info(){ echo -e "${YELLOW}  ->${NC} $1"; }
fail(){ echo -e "${RED} FAIL${NC} $1"; exit 1; }

cleanup() {
  echo ""
  info "Shutting down..."
  kill "${GATEWAY_PID:-}" 2>/dev/null || true
  kill "${NEXT_PID:-}" 2>/dev/null || true
  info "Done."
}
trap cleanup EXIT INT TERM

# ── 1. Docker ──
info "Starting Docker (postgres)..."
docker compose -f "$ROOT/docker/docker-compose.yml" up -d postgres 2>&1
if [ $? -ne 0 ]; then
  info "Docker not available — make sure postgres is running on localhost:5432"
fi

# wait for postgres
info "Waiting for postgres..."
for i in $(seq 1 15); do
  sleep 1
  pg_isready -h localhost -p 5432 -U binus 2>/dev/null && break
done
pg_isready -h localhost -p 5432 -U binus 2>/dev/null && ok "Postgres ready" || info "Could not verify postgres (proceeding anyway)"

# ── 2. Database Push + Seed ──
cd "$ROOT/apps/web"

info "Pushing schema to database..."
npx prisma db push --accept-data-loss 2>&1 && ok "Schema pushed" || fail "Schema push failed"

info "Generating Prisma client..."
npx prisma generate 2>&1 && ok "Prisma generated"

info "Seeding database..."
npx tsx prisma/seed.ts 2>&1 && ok "Seed done: admin@binus.edu / admin123" || fail "Seed failed"

# ── 3. Gateway ──
info "Starting AI Gateway (:8000)..."
cd "$ROOT/apps/ai-gateway"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  source .venv/bin/activate && pip install -q -r requirements.txt
fi
source .venv/bin/activate
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
nohup python3 -m uvicorn app.main:app --port 8000 --log-level warning > /tmp/gateway.log 2>&1 &
GATEWAY_PID=$!
sleep 2
curl -sf localhost:8000/health > /dev/null 2>&1 && ok "Gateway running" || fail "Gateway failed to start"

# ── 4. Next.js ──
info "Starting Next.js (:3000)..."
cd "$ROOT/apps/web"
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
npx next dev -p 3000 &
NEXT_PID=$!

info "Waiting for Next.js..."
for i in $(seq 1 30); do
  sleep 1
  curl -sf http://localhost:3000 > /dev/null 2>&1 && break
done
curl -sf http://localhost:3000 > /dev/null 2>&1 && ok "Next.js running" || fail "Next.js failed to start"

# ── Summary ──
echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}  All services running!${NC}"
echo ""
echo "  App:     http://localhost:3000"
echo "  Gateway: http://localhost:8000"
echo "  Login:   admin@binus.edu / admin123"
echo ""
echo "  Chat:    http://localhost:3000/chat"
echo "  Admin:   http://localhost:3000/admin"
echo "  Health:  curl localhost:8000/health"
echo "═══════════════════════════════════════"
echo ""
info "Press Ctrl+C to stop all services"

wait
