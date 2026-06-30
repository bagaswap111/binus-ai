#!/usr/bin/env bash
# ponytail: A1 runnable check — verifies project scaffold is complete
PASS=0
FAIL=0

check() {
  if eval "$2" 2>/dev/null; then
    echo "  ✓ $1"
    ((PASS++))
  else
    echo "  ✗ $1"
    ((FAIL++))
  fi
}

echo "A1 — Project Scaffold Checks"
echo "---------------------------"

check "package.json exists"      'test -f package.json'
check "npm workspaces configured" 'grep -q "workspaces" package.json'
check "apps/web exists"          'test -f apps/web/package.json'
check "apps/ai-gateway exists"   'test -f apps/ai-gateway/package.json'
check "packages/shared exists"   'test -f packages/shared/package.json'
check "Prisma schema exists"     'test -f apps/web/prisma/schema.prisma'
check "Prisma generated"         'test -f apps/web/src/generated/prisma/client.ts'
check ".env.template exists"     'test -f .env.template'
check "Docker Compose exists"    'test -f docker/docker-compose.yml'
check "OPA policies dir exists"  'test -d docker/opa/policies'
check "NextAuth config exists"   'test -f apps/web/src/auth.ts'
check "Auth route handler"       'test -f apps/web/src/app/api/auth/\[...nextauth\]/route.ts'
check "Prisma client singleton"  'test -f apps/web/src/lib/prisma.ts'
check "shadcn components"        'test -d apps/web/src/components/ui'

echo ""
echo "Results: $PASS passed, $FAIL failed"
exit $FAIL
