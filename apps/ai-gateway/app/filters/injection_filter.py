# ponytail: Prompt Injection filter — pattern-based
import re

# pola injection umum
ATTACK_PATTERNS: list[tuple[str, str]] = [
    ("ignore_previous", r"(?i)(ignore|disregard|forget|skip)\s+(all\s+)?(previous|above|prior).{0,30}(instruction|prompt|directions?)"),
    ("role_switch", r"(?i)(now\s+)?(act\s+as|you\s+are\s+now|pretend\s+to\s+be|from\s+now\s+on)\s+(a\s+)?(human|assistant|admin|system|developer|user|hacker|criminal|jailbreak)"),
    ("delimiter_bypass", r"(?i)(forget|ignore)\s+(all\s+)?(rules|guidelines|policies|restrictions|boundaries)"),
    ("prompt_leak", r"(?i)(what\s+is\s+(your|the)\s+(system|initial|original|base)\s+prompt|show\s+(me\s+)?(your|the)\s+(system\s+)?prompt|print\s+(your\s+)?(system\s+)?prompt)"),
    ("code_exec", r"(?i)(run|execute|eval)\s+(this\s+)?(code|command|script|shell|bash|exec|system)"),
    ("dan_teman_teman", r"(?i)(ignore semua|kamu adalah|sekarang kamu|dari sekarang|lupakan semua|abaikan semua|perintah sebelumnya)"),  # Indonesian patterns
]


def scan_injection(text: str) -> list[dict]:
    found = []
    for label, pattern in ATTACK_PATTERNS:
        for m in re.finditer(pattern, text):
            found.append({"type": label, "start": m.start(), "end": m.end(), "value": m.group().strip()})
    return found


def filter_injection(text: str, user_role: str) -> tuple[str, list[dict], bool]:
    """Return (text, findings, is_blocked)."""
    found = scan_injection(text)
    # SD-SMA: 1 pattern cukup untuk block
    if user_role in ("SD", "SMP", "SMA") and found:
        return text, found, True
    # S1+: butuh 2+ pattern berbeda untuk block
    if len({f["type"] for f in found}) >= 2:
        return text, found, True
    # 1 pattern -> flag (tidak di-block, tapi di-log)
    return text, found, False
