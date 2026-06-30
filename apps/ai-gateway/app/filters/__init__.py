# ponytail: filter pipeline — loop over all filters
from . import pii_filter, injection_filter, policy_filter

FILTERS = [
    ("pii", pii_filter.filter_pii),
    ("injection", injection_filter.filter_injection),
]

async def run_pipeline(text: str, user_role: str, subject_id: str | None = None) -> dict:
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

    # policy check via OPA (async)
    pol_text, pol_findings, pol_blocked = await policy_filter.filter_policy(
        result["redacted"], user_role, subject_id
    )
    result["filters"]["policy"] = {"findings": pol_findings, "blocked": pol_blocked}
    if pol_blocked:
        result["blocked"] = True

    return result
