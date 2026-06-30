package binus.policy

# kategori konten sensitif
toxic_keywords := {
    "violence":   {"bunuh", "membunuh", "senjata", "bom", "teroris", "kill", "bomb", "weapon", "murder"},
    "hate_speech": {"bodoh", "benci", "rasis", "sara", "anjing", "babi", "idiot"},
    "sexual":     {"seks", "sex", "porn", "telanjang", "nude", "nsfw", "xxx"},
    "self_harm":  {"bunuh diri", "self-harm", "suicide", "selfharm", "cutting"},
}

# kategori yang diblokir per role
blocked_for_role := {
    "SD":     {"sexual", "self_harm", "violence", "hate_speech"},
    "SMP":    {"sexual", "self_harm"},
    "SMA":    {"sexual", "self_harm", "hate_speech"},
    "S1":     {"self_harm"},
    "S2":     {"self_harm"},
    "S3":     {"self_harm"},
}

# pengecualian per-subject — category dilarang TAPI diizinkan untuk subject tertentu
subject_exemptions := {
    "biology": {"sexual"},
    "ppkn":    {"hate_speech"},
    "sejarah": {"violence"},
    "ipa":     {"sexual"},
}

default allow := true

# found_keywords: semua keyword toxic yang muncul di text
found_keywords[cat] := words {
    some cat, word
    words := {w | w := toxic_keywords[cat][_]; contains(input.text, w)}
    count(words) > 0
}

# blocked_categories: kategori yang harus diblokir (tergantung role)
blocked_categories[cat] {
    cat := blocked_for_role[input.user_role][_]
}

# exemption_applies: apakah ada pengecualian subject untuk keyword ini
exemption_applies[cat] {
    some cat
    blocked_categories[cat]
    exemptions := subject_exemptions[input.subject_id][_]
    exemptions == cat
}

# allow = true jika tidak ada keyword dari kategori yang diblokir (tanpa exemption)
allow := false {
    some cat
    blocked_categories[cat]
    found_keywords[cat]
    not exemption_applies[cat]
}

reasons := ["Content blocked: inappropriate for role"] {
    not allow
}
