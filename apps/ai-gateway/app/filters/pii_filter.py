# ponytail: PII filter — regex-based, tanpa Presidio/dependency berat
import re
from typing import Optional

# pola dasar PII
PATTERNS: list[tuple[str, str]] = [
    ("email", r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),
    ("phone", r"\b(\+?62|0)[0-9]{8,13}\b"),
    ("nik", r"\b[0-9]{16}\b"),
    ("ip_address", r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"),
    ("credit_card", r"\b(?:\d[ -]*?){13,16}\b"),
    ("nama_lengkap", r"\b[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+\b"),  # minimal 3 kata kapital
    ("student_id", r"\b\d{10}\b"),  # NIM/NISN: 10 digit
]


def scan_pii(text: str) -> list[dict]:
    found = []
    for label, pattern in PATTERNS:
        for m in re.finditer(pattern, text):
            found.append({"type": label, "start": m.start(), "end": m.end(), "value": m.group()})
    return found


def redact_pii(text: str, deny_types: Optional[set[str]] = None) -> str:
    deny = deny_types or {"nik", "credit_card", "phone"}
    for label, pattern in PATTERNS:
        if label in deny:
            text = re.sub(pattern, f"[REDACTED:{label}]", text)
    return text


def filter_pii(text: str, user_role: str) -> tuple[str, list[dict], bool]:
    """Return (redacted_text, findings, is_blocked)."""
    found = scan_pii(text)

    # SD-SMP: semua PII diblokir + redact
    if user_role in ("SD", "SMP") and found:
        return redact_pii(text), found, True

    # NIK & credit card selalu diblokir
    critical = [f for f in found if f["type"] in ("nik", "credit_card")]
    if critical:
        return redact_pii(text), found, True

    # student_id + phone redact untuk student roles
    if user_role in ("SD", "SMP", "SMA", "S1", "S2", "S3"):
        return redact_pii(text, deny_types={"nik", "credit_card", "phone", "student_id"}), found, False

    return text, found, False
