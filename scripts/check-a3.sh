#!/usr/bin/env bash
# ponytail: A3 runnable check
PASS=0; FAIL=0
check() { if eval "$2" 2>/dev/null; then echo "  ✓ $1"; ((PASS++)); else echo "  ✗ $1"; ((FAIL++)); fi }

echo "A3 — Chat Core Checks"
echo "--------------------"

check "/api/chat POST route"       'test -f apps/web/src/app/api/chat/route.ts'
check "/api/chat/[sessionId] route" 'test -f "apps/web/src/app/api/chat/[sessionId]/route.ts"'
check "/api/sessions GET route"    'test -f apps/web/src/app/api/sessions/route.ts'
check "chat page exists"           'test -f apps/web/src/app/\(dashboard\)/chat/page.tsx'
check "ai-gateway client lib"      'test -f apps/web/src/lib/ai-gateway.ts'
check "FastAPI /v1/chat endpoint"  'grep -q "/v1/chat" apps/ai-gateway/app/main.py'
check "FastAPI health endpoint"    'grep -q "/health" apps/ai-gateway/app/main.py'

echo ""
echo "Results: $PASS passed, $FAIL failed"
exit $FAIL
