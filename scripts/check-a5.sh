#!/usr/bin/env bash
PASS=0; FAIL=0
check() { if eval "$2" 2>/dev/null; then echo "  ✓ $1"; ((PASS++)); else echo "  ✗ $1"; ((FAIL++)); fi }

echo "A5 — Subject Agent Checks"
echo "-----------------------"

check "/api/subjects route"        'test -f apps/web/src/app/api/subjects/route.ts'
check "/api/knowledge route"       'test -f apps/web/src/app/api/knowledge/route.ts'
check "subjects page exists"       'test -f apps/web/src/app/\(dashboard\)/subjects/page.tsx'
check "KnowledgeBase in schema"    'grep -q "model KnowledgeBase" apps/web/prisma/schema.prisma'
check "RAG context in gateway"     'grep -q "/api/knowledge" apps/ai-gateway/app/main.py'
check "Subjects in sidebar"        'grep -q "/dashboard/subjects" apps/web/src/app/\(dashboard\)/layout.tsx'

echo ""
echo "Results: $PASS passed, $FAIL failed"
exit $FAIL
