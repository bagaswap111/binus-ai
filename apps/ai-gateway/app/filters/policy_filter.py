# ponytail: Content Policy filter — komunikasi dengan OPA
import httpx
import os
from typing import Optional

OPA_URL = os.getenv("OPA_URL", "http://localhost:8181")


async def filter_policy(text: str, user_role: str, subject_id: Optional[str] = None) -> tuple[str, list[dict], bool]:
    if not OPA_URL.startswith("http"):
        return text, [{"error": "invalid OPA_URL"}], True
    policy_input = {
        "input": {
            "text": text.lower(),
            "user_role": user_role,
            "subject_id": (subject_id or "").lower(),
        }
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{OPA_URL}/v1/data/binus/policy/allow", json=policy_input, timeout=5)
            if res.status_code != 200:
                # ponytail: OPA error → fail closed
                return text, [{"error": "policy unavailable"}], True
            result = res.json().get("result", {})
            allow = result.get("allow", False)
            reasons = result.get("reasons", [])
            # ponytail: OPA unreachable or error → fail closed (block)
            return text, reasons, not allow
    except httpx.ConnectError:
        # ponytail: OPA offline → fail closed
        return text, [{"error": "OPA unreachable"}], True
