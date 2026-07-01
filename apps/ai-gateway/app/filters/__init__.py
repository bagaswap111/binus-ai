# ponytail: filter pipeline — loop over all filters + contextual classification
import os
import httpx
from . import pii_filter, injection_filter, policy_filter, classification_filter

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")
GATEWAY_API_KEY = os.getenv("GATEWAY_API_KEY", "")

FILTERS = [
    ("pii", pii_filter.filter_pii),
    ("injection", injection_filter.filter_injection),
]


async def _submit_review(text: str, classification: dict, user_id: str | None = None):
    """Submit flagged content to the HITL review queue (best-effort)."""
    if classification["level"] < 2:
        return
    try:
        headers = {"X-API-Key": GATEWAY_API_KEY} if GATEWAY_API_KEY else {}
        async with httpx.AsyncClient() as c:
            await c.post(f"{NEXTJS_URL}/api/admin/reviews", json={
                "inputText": text,
                "classification": classification["label"],
                "category": classification["category"],
                "confidence": classification["confidence"],
                "userId": user_id,
            }, headers=headers, timeout=3)
    except Exception:
        pass  # ponytail: review queue offline bukan error fatal


async def run_pipeline(text: str, user_role: str, subject_id: str | None = None,
                       user_id: str | None = None) -> dict:
    result = {
        "original": text,
        "redacted": text,
        "blocked": False,
        "filters": {},
    }

    for name, fn in FILTERS:
        redacted, findings, blocked = fn(result["redacted"], user_role)
        result["redacted"] = redacted
        result["filters"][name] = {"findings": findings, "blocked": blocked}
        if blocked:
            result["blocked"] = True

    # contextual classification (C5)
    cls = classification_filter.classify(result["redacted"])
    result["filters"]["classification"] = cls

    # Level 4 → block, Level 3 → block + review, Level 2 → review only
    if cls["level"] >= 4:
        result["blocked"] = True
    if cls["level"] >= 2:
        await _submit_review(result["redacted"], cls, user_id)
        if cls["level"] >= 3:
            result["blocked"] = True

    # policy check via OPA (async)
    pol_text, pol_findings, pol_blocked = await policy_filter.filter_policy(
        result["redacted"], user_role, subject_id
    )
    result["filters"]["policy"] = {"findings": pol_findings, "blocked": pol_blocked}
    if pol_blocked:
        result["blocked"] = True

    return result
