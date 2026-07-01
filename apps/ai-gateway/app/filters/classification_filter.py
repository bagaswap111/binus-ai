# ponytail: 4-level contextual classifier — keyword + regex based, no LLM needed
import re

# ponytail ceiling: keyword-based = no semantic understanding; upgrade path: replace with
# onnx classifier (e.g. distilbert multilabel) or LLM-as-judge

LEVELS = {
    4: {"label": "toxic", "emoji": "🔴"},
    3: {"label": "highly_sensitive", "emoji": "🟠"},
    2: {"label": "content_guidance", "emoji": "🟡"},
    1: {"label": "safe", "emoji": "🟢"},
}

# Level 4 — Toxic (blocked immediately)
TOXIC_PATTERNS = [
    (r"\b(jancok|bangsat|kontol|memek|pantek|anjing|goblok)\b", "toxic_slur"),
    (r"\b(bunuh\s+(kau|kamu|lu|dirimu?|mereka)|mampus|kepalau|mati\s+aja)\b", "toxic_threat"),
    (r"\b(setubuhi|perkosa|pencabulan|sodomi|pedofil)\b", "toxic_sexual_violence"),
    (r"\b(teror|bom|bakar|tembak)\s+(sekolah|masjid|gereja)\b", "toxic_terrorism"),
]

# Level 3 — Highly Sensitive (blocked + flagged for review)
HIGHLY_SENSITIVE_PATTERNS = [
    (r"\bseks?\b", "sexual_content"),
    (r"\btelanjang\b", "nudity"),
    (r"\bmasturbasi\b", "masturbation"),
    (r"\b(porn|nude|xxx)\b", "pornography"),
    (r"\bkekerasan\s+(seksual|fisik)\b", "sexual_violence"),
    (r"\bmenggorok\b|\bpotong\s+(leher|tangan)\b", "graphic_violence"),
    (r"\bradikalisasi\b|\brekrut\s+teroris\b", "radicalization"),
    (r"\b(eksekusi|hukuman\s+mati)\s+(dengan|secara)\s+(kejam|sadis)\b", "execution"),
]

# Level 2 — Content Guidance (not blocked, flagged for educator review)
CONTENT_GUIDANCE_PATTERNS = [
    (r"\b(kekerasan|brutal|berdarah|tawuran)\b", "violence"),
    (r"\b(diskriminasi|rasis|rasial)\b", "discrimination"),
    (r"\b(narkoba|narkotika|ekstasi|ganja|sabu|shabu|psikotropika)\b", "drugs"),
    (r"\b(mencontek|nyontek|contek)\b", "cheating"),
    (r"\b(plagiat|plagiarisme|jiplak)\b", "plagiarism"),
    (r"\bspam\b", "spam"),
    (r"\b(hatespeech|ujaran\s+kebencian|hate\s+speech)\b", "hate_speech"),
    (r"\b(bullying|perundungan|buly)\b", "bullying"),
    (r"\b(hoax|hoaks|misinformasi|disinformasi)\b", "misinformation"),
    (r"\b(phishing|penipuan|scam|social\s+engineering)\b", "phishing"),
    (r"\b(impersonasi|menyamar|akun\s+palsu)\b", "impersonation"),
    (r"\b(judol|judi\s+online|slot|togel)\b", "gambling"),
    (r"\b(selfharm|self-harm|menyakiti\s+diri|bunuh\s+diri)\b", "self_harm"),
    (r"\b(pembajakan|bajakan|crack|keygen)\b", "piracy"),
]


def classify(text: str) -> dict:
    text_lower = text.lower().strip()

    if not text_lower:
        return {"level": 1, "category": None, "label": "safe", "confidence": 1.0}

    # check level 4 (highest priority)
    for pattern, category in TOXIC_PATTERNS:
        if re.search(pattern, text_lower):
            return {"level": 4, "category": category, "label": "toxic", "confidence": 0.95}

    # check level 3
    for pattern, category in HIGHLY_SENSITIVE_PATTERNS:
        if re.search(pattern, text_lower):
            return {"level": 3, "category": category, "label": "highly_sensitive", "confidence": 0.9}

    # check level 2
    for pattern, category in CONTENT_GUIDANCE_PATTERNS:
        if re.search(pattern, text_lower):
            return {"level": 2, "category": category, "label": "content_guidance", "confidence": 0.85}

    return {"level": 1, "category": None, "label": "safe", "confidence": 1.0}
