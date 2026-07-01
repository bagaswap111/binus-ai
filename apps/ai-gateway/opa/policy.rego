package binus.policy

import future.keywords.in

categories := {
    "violence":   {"bunuh", "membunuh", "senjata", "bom", "teroris", "kill", "bomb", "weapon", "murder"},
    "hate_speech": {"bodoh", "benci", "rasis", "sara", "anjing", "babi", "idiot"},
    "sexual":     {"seks", "sex", "porn", "telanjang", "nude", "nsfw", "xxx"},
    "self_harm":  {"bunuh diri", "self-harm", "suicide", "selfharm", "cutting"},
}

blocked_for_role := {
    "SD":     {"sexual", "self_harm", "violence", "hate_speech"},
    "SMP":    {"sexual", "self_harm"},
    "SMA":    {"sexual", "self_harm", "hate_speech"},
    "S1":     {"self_harm"},
    "S2":     {"self_harm"},
    "S3":     {"self_harm"},
}

subject_exemptions := {
    "biology": {"sexual"},
    "ppkn":    {"hate_speech"},
    "sejarah": {"violence"},
    "ipa":     {"sexual"},
}

# ponytail: unknown roles → most restrictive (SD). Case normalized in Python.
role := input.user_role {
    input.user_role in {"SD", "SMP", "SMA", "S1", "S2", "S3"}
} else := "SD"

default allow := true

# ponytail: multi-word phrases use contains (less false-positive risk than single words)
found_keywords[cat] contains word {
    some cat
    some word in categories[cat]
    contains(word, " ")
    contains(input.text, word)
}

# ponytail: single words use word-boundary regex to avoid substring false positives
found_keywords[cat] contains word {
    some cat
    some word in categories[cat]
    not contains(word, " ")
    re_match(sprintf("\\b%s\\b", [word]), input.text)
}

blocked_categories[cat] {
    some cat
    cat in blocked_for_role[role]
}

allow := false {
    some cat
    blocked_categories[cat]
    found_keywords[cat]
    not subject_exemptions[input.subject_id][cat]
}

reasons := ["Content blocked: inappropriate for role"] {
    not allow
}
