#!/usr/bin/env bash
# ponytail: A2 runnable check — verifies auth & role scaffold
PASS=0; FAIL=0
check() { if eval "$2" 2>/dev/null; then echo "  ✓ $1"; ((PASS++)); else echo "  ✗ $1"; ((FAIL++)); fi }

echo "A2 — Auth & Role Checks"
echo "----------------------"

check "proxy.ts exists"            'test -f apps/web/src/proxy.ts'
check "auth.ts config exists"     'test -f apps/web/src/auth.ts'
check "login page exists"         'test -f apps/web/src/app/\(auth\)/login/page.tsx'
check "register API exists"       'test -f apps/web/src/app/api/register/route.ts'
check "session provider exists"   'test -f apps/web/src/components/auth/session-provider.tsx'
check "dashboard layout exists"   'test -f apps/web/src/app/\(dashboard\)/layout.tsx'
check "dashboard page exists"     'test -f apps/web/src/app/dashboard/page.tsx'
check "seed script exists"        'test -f apps/web/prisma/seed.ts'
check "db:seed script in package.json" 'grep -q "db:seed" apps/web/package.json'
check "User model has password"   'grep -q "password" apps/web/prisma/schema.prisma'

echo ""
echo "Results: $PASS passed, $FAIL failed"
exit $FAIL
