# ponytail: Content Policy filter — komunikasi dengan OPA
import httpx
import os
from typing import Optional

OPA_URL = os.getenv("OPA_URL", "http://localhost:8181")


async def filter_policy(text: str, user_role: str, subject_id: Optional[str] = None) -> tuple[str, list[dict], bool]:
    """Tanyakan ke OPA apakah konten diizinkan untuk role ini."""
    policy_input = {
        "input": {
            "text": text,
            "user_role": user_role,
            "subject_id": subject_id or "",
        }
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{OPA_URL}/v1/data/binus/policy/allow", json=policy_input, timeout=5)
            if res.status_code != 200:
                return text, [{"error": f"OPA returned {res.status_code}"}], True
            result = res.json().get("result", {})
            allow = result.get("allow", True)
            reasons = result.get("reasons", [])
            return text, reasons, not allow
    except httpx.ConnectError:
        # ponytail: OPA offline — fallback ke allow semua, log warning
        return text, [{"warning": "OPA unreachable, policy check skipped"}], False
