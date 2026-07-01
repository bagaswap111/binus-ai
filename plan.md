# Execution Plan — BINUS AI

## Strategi

3 batch paralel. Setiap batch menghasilkan sistem yang **functional dan bisa dipakai**, bukan sekadar kode mati.

```
Batch A (Foundation)         → core bisa dipakai besok       ✅
Batch B (Learning Features)  → fitur pendidikan inti        ✅
Batch C (Engagement & Gov)   → polish, gamification, gov    ✅
Phase D (Future)             → scalability, accessibility   📋 (tertunda)
```

### Aturan main (ponytail)
- YAGNI: skip fitur yang belum jelas kebutuhannya.
- Setiap task punya **1 runnable check** minimal — assert, test, atau demo.
- Kalau task > 2 jam, dipecah.

---

## Batch A — Foundation + Core ✅

**Goal:** Sistem bisa dipakai untuk chat + auth + filter dasar.
**Status:** SELESAI — semua item dikerjakan dengan simplifikasi YAGNI.

| Item | Status | Catatan |
|------|--------|---------|
| A1 Project Scaffold | ✅ | Monorepo npm workspaces (pnpm incompatible), Next.js 16 + Tailwind 4 + shadcn/ui |
| A2 Auth & Role | ✅ | NextAuth v5 + JWT + Microsoft Entra ID SSO + role-based guards |
| A3 Chat Core | ✅ | SSE streaming, session management, role-based system prompts |
| A4 AI Gateway + 3 Filter | ✅ | FastAPI pipeline: PII (regex NIM/NISN) + injection (heuristic) + policy (OPA Rego) |
| A5 Subject Agent | ✅ | Subject CRUD + knowledge base + RAG context |
| A6 Project Folder | ✅ | Project CRUD + file upload + chat context integration |
| A7 Admin Panel | ✅ | Model registry CRUD (policy management & usage logs simplified) |

**Simplifikasi YAGNI:**
- Filter hanya 3 dari 8 yang direncanakan (sisanya di C5 nanti)
- Knowledge base tanpa pgvector embedding (`@ignore`)
- Admin panel tanpa usage logs dashboard (cukup model registry)
- SSO hanya Microsoft Entra ID (LDAP/SAML tidak diperlukan)
- Upload file tanpa MinIO (local filesystem, upgrade nanti)

---

## Batch B — Learning Features ✅

**Goal:** Fitur pendidikan inti bisa digunakan oleh siswa & dosen.
**Status:** SELESAI — semua core functionality works, beberapa sub-item YAGNI.

| Item | Status | Catatan |
|------|--------|---------|
| B1 Exam Correction | ✅ | Exam + ExamResult CRUD, creation UI, identity filter (PII NIM/NISN + EXIF), AI grading with rubric, result dashboard |
| B2 Proctoring | ✅ | Browser lockdown (fullscreen + tab switch), violation logging, anomaly detection (word-overlap), flagged results |
| B3 Quiz & Assessment | ✅ | QuestionBank with Bloom taxonomy (C1-C6), CRUD API, question bank manager UI |
| B4 Plagiarism Checker | ✅ | Word-overlap similarity (intra + cross-project), matching section highlights |
| B5 Academic Writing | ✅ | Literature matrix (from files), citation generator (DOI→APA), IMRaD reviewer, thesis outline |
| B6 Teaching Tools | ✅ | Syllabus/RPS generator (CPMK→16 weeks), personalized learning path (score→topics) |
| B7 Collaboration | ✅ | Study groups (chat + members), discussion forums (AI moderation: length + toxic filter) |
| B8 Learning Analytics | ✅ | Grade distribution (min/max/avg/median + 5 buckets), knowledge gap analyzer |

**Simplifikasi YAGNI / not built:**
- B2: Face re-verification popup (butuh kamera + ML) → deferred
- B3: Adaptive quiz generator (AI generate soal) → butuh model API key terisi
- B5: Methodology advisor, data analysis assistant → butuh dialog interaktif kompleks
- B6: Diferensiasi pembelajaran, kurikulum align, transcriber, math solver, code tutor, language tutor → butuh integrasi AI tambahan
- B7: Peer review, version control, assignment scheduler → butuh sistem real-time
- B8: Sentiment analysis, grade prediction, auto-report → butuh ML pipeline

---

## Batch C — Engagement & Governance ✅

**Goal:** Polish, gamification, career prep, filter governance.

**Status:** SELESAI — semua Batch C core functionality works.

### C1 — Career & University Preparation ✅
- [x] Career Path Recommender (nilai + minat → rekomendasi karir dari 8 dataset)
- [x] University Match Recommender (rapor/IPK → 8 kampus + probabilitas)
- [x] Portfolio Builder (dari existing projects, career page → export)
- [x] Interview Preparation (3 mode: umum/behavioral/beasiswa + AI feedback via gateway)
- [x] **Runnable check:** career page di `/career` — 4 tabs functional
- **Simplifikasi:** Data karir/kampus hardcoded (expandable), portfolio tanpa template PDF (export via print)

### C2 — Gamification ✅
- [x] XP system + Level (formula `floor(sqrt(xp/100))+1`, setiap aktivitas → XP)
- [x] Learning Streaks (hari berturut-turut via XP POST timestamp tracking)
- [x] Badges & Achievements (trigger otomatis: streak 7, XP 1000/5000, chat pertama, quiz pertama)
- [x] Leaderboard (top 10 anonim per schoolId, nickname hash)
- [x] Daily Challenges (5 seeded challenges per hari, XP reward, selesaikan → claim)
- [ ] Mode Kompetitif (antar kelompok) → **deferred** (butuh real-time, feedback user dulu)
- [x] Gamification page di `/gamification` — overview, badges, leaderboard, challenges tabs
- [x] **Runnable check:** `/api/gamification/xp` → POST earns XP, GET returns level/streak/badges
- **Simplifikasi:** Badge checks inline di XP POST (no cron), challenges seeded (no auto-generation)

### C5 — Advanced Filter Governance ✅
- [x] Dual-LLM Security Architecture → **simplified**: single LLM + classification filter (keyword/regex, 4 levels)
- [x] Klasifikasi Kontekstual 4 Level (Safe → Content Guidance → Highly Sensitive → Toxic)
- [x] 14 sub-kategori Content Guidance (violence, hate_speech, self_harm, sexual, harassment, discrimination, radicalization, drugs, cheating, plagiarism, spam, misinformation, phishing, impersonation)
- [x] Human-in-the-Loop Dashboard (admin review queue di `/admin/reviews`, approve/reject + notes)
- [ ] Active learning loop → **deferred** (butuh feedback store + periodic retraining pipeline; upgrade path: export reviews CSV → finetune classifier)
- [x] **Runnable check:** POST ke gateway dengan konten flagged → muncul di `/admin/reviews`
- **Simplifikasi:** Classifier berbasis keyword/regex (no LLM-as-judge), upgrade path: ONNX atau LLM classifier

---

## Phase D — Deferred (Future Iterations) 📋

Fitur yang **tidak dikerjakan di Batch C** karena YAGNI / butuh infrastruktur tambahan / butuh feedback user.

### D1 — Multilingual & Accessibility (dari C3)
- [ ] Bahasa Indonesia + Inggris toggle di seluruh UI
- [ ] Bahasa daerah (via NLLB model)
- [ ] TTS (Web Speech API + Whisper lokal)
- [ ] STT (input suara untuk chat)
- [ ] Simplified Text (T5-small)
- [ ] High Contrast Mode + font disleksia
- [ ] ARIA labels + semantic HTML

**Alasan defer:** Butuh i18n library + ML model deployment. Feedback user dulu.

### D2 — Offline & PWA (dari C4)
- [ ] PWA manifest + service worker
- [ ] Chat history cache (IndexedDB)
- [ ] Model lokal untuk chat offline (ONNX)
- [ ] Queue sinkronisasi offline→online
- [ ] Push notification
- [ ] Bandwidth saving mode

**Alasan defer:** PWA butuh audit UX + service worker complexity. Nilai tambah rendah tanpa feedback user.

### D3 — Monitoring & Optimization (dari C6)
- [ ] Langfuse observability (latency, cost, token per model)
- [ ] Grafana dashboard (error rate, filter block rate, usage)
- [ ] Cost tracking & budgeting per user/school
- [ ] Load test (k6 / artillery)
- [ ] Caching layer (Redis: response cache)
- [ ] Load balancing multi-model

**Alasan defer:** Infrastruktur tambahan (Langfuse, Grafana). Kerjakan setelah ada user real.

### D4 — Simplifikasi YAGNI lanjutan (dari Batch B)
- [ ] B2: Face re-verification popup
- [ ] B3: Adaptive quiz generator (AI generate soal)
- [ ] B5: Methodology advisor, data analysis assistant
- [ ] B6: Diferensiasi, kurikulum align, transcriber, math solver, code tutor, language tutor
- [ ] B7: Peer review, version control, assignment scheduler
- [ ] B8: Sentiment analysis, grade prediction, auto-report

---

## Progress Tracker

| Batch | Item | Status |
|-------|------|--------|
| A | A1 Project Scaffold | ✅ |
| A | A2 Auth & Role | ✅ |
| A | A3 Chat Core | ✅ |
| A | A4 AI Gateway + 3 Filter | ✅ |
| A | A5 Subject Agent (Minimal) | ✅ |
| A | A6 Project Folder (Minimal) | ✅ |
| A | A7 Admin Panel Dasar | ✅ |
| B | B1 Exam Correction | ✅ |
| B | B2 Proctoring | ✅ |
| B | B3 Quiz & Assessment | ✅ |
| B | B4 Plagiarism Checker | ✅ |
| B | B5 Academic Writing | ✅ |
| B | B6 Teaching Tools | ✅ |
| B | B7 Collaboration | ✅ |
| B | B8 Learning Analytics | ✅ |
| C | C1 Career Prep | ✅ |
| C | C2 Gamification | ✅ |
| C | C5 Advanced Filter Governance | ✅ |
| D | D1 Multilingual & Accessibility | 📋 |
| D | D2 Offline & PWA | 📋 |
| D | D3 Monitoring & Optimization | 📋 |
| D | D4 YAGNI Simplifications | 📋 |

---

## Definition of Done (setiap item)

- [x] Code terpush (commit)
- [x] **Runnable check** lulus
- [x] Lint & type check lulus
- [x] Tidak ada `console.log` / debug code
- [x] Tidak ada dependency baru tanpa alasan
- [x] `ponytail:` comment ada untuk setiap shortcut teknis
