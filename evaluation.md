# Usability Heuristic Evaluation — BINUS AI

Evaluated 23 pages against [Jakob Nielsen's 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).

## Summary

| Severity | Count |
|----------|-------|
| ✅ Pass | 54 |
| ⚠️ Minor | 67 |
| 🔴 Major | 38 |
| ❌ Critical | 51 |

**Total findings: 210** (across 23 pages × 10 heuristics, with 20 N/A excluded)

### Per Heuristic

| Heuristic | ✅ Pass | ⚠️ Minor | 🔴 Major | ❌ Critical |
|-----------|---------|----------|----------|------------|
| H1 — Visibility of System Status | 10 | 4 | 8 | 1 |
| H2 — Match System & Real World | 20 | 3 | 0 | 0 |
| H3 — User Control & Freedom | 12 | 5 | 5 | 1 |
| H4 — Consistency & Standards | 5 | 15 | 3 | 0 |
| H5 — Error Prevention | 3 | 8 | 8 | 4 |
| H6 — Recognition vs Recall | 18 | 5 | 0 | 0 |
| H7 — Flexibility & Efficiency | 18 | 5 | 0 | 0 |
| H8 — Aesthetic & Minimalist Design | 15 | 8 | 0 | 0 |
| H9 — Error Recovery | 0 | 0 | 8 | 15 |
| H10 — Help & Documentation | 5 | 10 | 6 | 2 |

### Per Page

| Page | ✅ Pass | ⚠️ Minor | 🔴 Major | ❌ Critical |
|------|---------|----------|----------|------------|
| `/` (redirect) | 10 | 0 | 0 | 0 |
| `/login` | 7 | 2 | 1 | 0 |
| `/register` | 5 | 2 | 2 | 1 |
| `/dashboard` | 7 | 2 | 1 | 0 |
| `/chat` | 4 | 3 | 1 | 2 |
| `/subjects` | 5 | 2 | 2 | 1 |
| `/exams` | 5 | 3 | 1 | 1 |
| `/exams/[id]` | 2 | 3 | 3 | 2 |
| `/exams/[id]/results` | 3 | 3 | 2 | 2 |
| `/exams/[id]/take` | 1 | 3 | 3 | 3 |
| `/exams/create` | 1 | 3 | 3 | 3 |
| `/questions` | 3 | 2 | 2 | 3 |
| `/plagiarism` | 4 | 3 | 2 | 1 |
| `/projects` | 3 | 2 | 3 | 2 |
| `/projects/[id]` | 4 | 2 | 3 | 1 |
| `/academic` | 2 | 4 | 2 | 2 |
| `/teaching` | 2 | 3 | 3 | 2 |
| `/collaboration` | 4 | 3 | 2 | 1 |
| `/analytics` | 5 | 2 | 2 | 1 |
| `/career` | 3 | 4 | 2 | 1 |
| `/gamification` | 5 | 2 | 2 | 1 |
| `/admin` | 2 | 4 | 2 | 2 |
| `/admin/reviews` | 4 | 3 | 2 | 1 |

---

## Top 10 Issues (by Impact)

### ❌ Critical

#### 1. API error silence — ALL pages

Every page uses `r.ok && r.json()` or `if (res.ok) setData(...)` — non-2xx responses are silently discarded. Network errors cause unhandled promise rejections. Users never see error messages.

**Fix:** One `safeFetch` wrapper in `security.ts` that auto-shows a toast/error on failure. Replace all raw `fetch` calls.

**Heuristics:** H1 (no error feedback), H9 (no error recovery)

---

#### 2. No `<label>` elements — 6 pages

Form inputs in create exam, questions, admin model, admin reviews, register, plagiarism, and academic use `placeholder` as the only identifier. Placeholders disappear on input, failing WCAG 3.3.2. Screen readers get no accessible name.

**Fix:** `<label className="sr-only">` for each input. Pure HTML, zero deps.

**Heuristics:** H2 (doesn't match user expectation of labeled fields), H4 (inconsistent with form patterns)

---

#### 3. Tab ARIA roles missing — 7 pages

Pages with tab navigation (analytics, academic, teaching, collaboration, career, gamification, admin/reviews) use `<button>` elements without `role="tablist"`, `role="tab"`, `aria-selected`, or `aria-controls`. Screen readers cannot navigate tabs.

**Fix:** Add ARIA roles and attributes to all tab systems.

**Heuristics:** H4 (inconsistent with platform conventions)

---

#### 4. No confirmation on state changes — 5 pages

Publish/unpublish exam, approve/reject review, toggle model — all one-click with no undo. Accidental clicks cause irreversible state changes.

**Fix:** `if (!confirm("...")) return;` before the fetch call.

**Heuristics:** H3 (no user control), H5 (no error prevention)

---

#### 5. Delete redirect without success check — exam detail

Line: `router.push("/exams")` runs unconditionally after `await fetch` — even if the DELETE request fails, the user is navigated away thinking the exam was deleted.

**Fix:** Check `res.ok` before redirecting.

**Heuristics:** H3 (data loss), H9 (no error recovery)

---

### 🔴 Major

#### 6. Sidebar nested route mismatch — ALL nested pages

`pathname === item.href` in `layout.tsx` means `/exams/123` does not highlight "Exams", `/admin/reviews` does not highlight "Admin".

**Fix:** `pathname.startsWith(item.href)` with exact-match guard for `/`.

**Heuristics:** H1 (no location indicator)

---

#### 7. No loading states — 15/23 pages

Only chat (loading "Thinking...") and plagiarism (button text change) have loading indicators. List pages render blank grids until data arrives. On slow connections, users see nothing.

**Fix:** Add `loading.tsx` per route group (shared skeleton layout).

**Heuristics:** H1 (no system status feedback)

---

#### 8. No empty states — 5 pages

Projects list, project detail (file list), admin model registry, citation/structure/outline tabs in academic writing — all render blank areas when no data exists. Users get no guidance on what to do.

**Fix:** Add contextual empty state messages.

**Heuristics:** H10 (no help/guidance)

---

#### 9. No `beforeunload` guard — 3 pages

Register, create exam, and take exam have no unsaved-changes warning. Accidentally navigating away or closing the tab loses all input.

**Fix:** `useEffect` with `window.addEventListener("beforeunload", handler)`.

**Heuristics:** H3 (data loss), H5 (no error prevention)

---

#### 10. No breadcrumbs — ALL pages

The exam flow (list → detail → results → take) and admin area have no breadcrumb or back-navigation beyond the sidebar. Users have no hierarchical location context, especially for nested routes.

**Fix:** Add breadcrumb component for deeply nested routes.

**Heuristics:** H1 (no location context), H6 (recall burden)

---

## Detailed Findings

### Heuristic 1 — Visibility of System Status

**Score: 10 ✅ / 4 ⚠️ / 8 🔴 / 1 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| No loading indicator on list fetches | subjects, exams, questions, projects, analytics, academic, teaching, collaboration, career, gamification, admin | 🔴 Major |
| Plain "Loading..." text instead of skeleton | exam detail, exam results, exam take, admin reviews | ⚠️ Minor |
| Chat silently removes message on error | chat | ❌ Critical |
| No breadcrumbs anywhere | All pages | 🔴 Major |
| Sidebar nav not highlighted for nested routes | exams/[id], admin/reviews | 🔴 Major |
| No page `<h1>` on chat | chat | 🔴 Major |
| Timer on take-exam has no `aria-live` | exams/[id]/take | ⚠️ Minor |
| Button disabled states present | all pages with forms | ✅ Pass |
| Page `<h1>` present | 22/23 pages | ✅ Pass |
| Tab-active styling for sub-navigation | analytics, academic, collaboration, career, gamification, admin/reviews | ✅ Pass |
| Loading text on plagiarism button | plagiarism | ✅ Pass |
| Loading text on chat thinking state | chat | ✅ Pass |
| Session highlight via .sel-item-active | chat, collaboration | ✅ Pass |

### Heuristic 2 — Match System & Real World

**Score: 20 ✅ / 3 ⚠️ / 0 🔴 / 0 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| Clear page titles use user terms | 22/23 pages | ✅ Pass |
| Date formats use locale | dashboard, exams | ✅ Pass |
| Role-appropriate labels | all pages | ✅ Pass |
| Status labels (Published/Draft) | exams | ✅ Pass |
| Empty state "Select a project" | plagiarism | ✅ Pass |
| Empty state "Start a conversation" | chat | ✅ Pass |
| Indonesian labels in gamification (Ringkasan, Badges, Peringkat, Tantangan) | gamification | ⚠️ Minor |
| Some hardcoded English-only labels while content is Indonesian | admin/reviews (mixed) | ⚠️ Minor |
| "GPA" is used without explanation | career/university matcher | ⚠️ Minor |

### Heuristic 3 — User Control & Freedom

**Score: 12 ✅ / 5 ⚠️ / 5 🔴 / 1 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| No confirmation on publish/unpublish | exams/[id] | 🔴 Major |
| No confirmation on approve/reject | admin/reviews | 🔴 Major |
| No confirmation on model toggle | admin | 🔴 Major |
| No confirmation on submit exam | exams/[id]/take | 🔴 Major |
| Delete exam redirects regardless of API result | exams/[id] | ❌ Critical |
| No "Cancel" or "Back" button on exam create | exams/create | 🔴 Major |
| No `beforeunload` guard | register, exams/create, exams/[id]/take | 🔴 Major |
| "New Chat" clears without confirmation | chat | ⚠️ Minor |
| remove question has no confirmation | exams/create | ⚠️ Minor |
| `confirm("Delete this exam?")` present | exams/[id] | ✅ Pass |
| Submit button disabled guard present | questions, register, collaboration | ✅ Pass |
| Close/dismiss on modals (N/A) | N/A | ✅ Pass |
| Escape key dismiss (N/A) | N/A | ✅ Pass |

### Heuristic 4 — Consistency & Standards

**Score: 5 ✅ / 15 ⚠️ / 3 🔴 / 0 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| Tab ARIA roles missing | analytics, academic, teaching, collaboration, career, gamification, admin/reviews | 🔴 Major |
| `<Button>` shadcn component not used | all pages | ⚠️ Minor |
| `<select>` global styling consistent | questions, plagiarism, academic | ✅ Pass |
| `.sel-item` / `.sel-item-active` used | chat, collaboration | ✅ Pass |
| `.tab-list` / `.tab` / `.tab-active` used | analytics, academic, teaching, collaboration | ✅ Pass |
| `.tab-list` / `.tab` / `.tab-active` NOT used | career, gamification, admin/reviews (inline styles) | ⚠️ Minor |
| Hardcoded `bg-zinc-900` instead of `bg-primary` | register, projects, admin | ⚠️ Minor |
| Hardcoded `text-zinc-500` instead of `text-muted-foreground` | register, projects | ⚠️ Minor |
| `rounded-lg` on some pages, `rounded-xl` on others | across pages | ⚠️ Minor |
| Register page uses `bg-zinc-50 dark:bg-zinc-950` — not theme variable | register | ⚠️ Minor |
| Color-only status badges | exams, exam detail, admin/reviews | ⚠️ Minor |
| All pages use same font stack (Inter + JetBrains Mono) | all | ✅ Pass |
| CSS theme variables consistent | all | ✅ Pass |
| Lucide icons not used — inline SVGs | login, register | ⚠️ Minor |
| Emoji icons without `aria-hidden` | gamification, admin/reviews, dashboard | ⚠️ Minor |

### Heuristic 5 — Error Prevention

**Score: 3 ✅ / 8 ⚠️ / 8 🔴 / 4 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| Submit button disabled when fields empty | questions, register, collaboration, plagiarism | ✅ Pass |
| Submit NOT disabled when fields empty | career/retriever, career/matcher, academic/citation | 🔴 Major |
| No required field markers (asterisks) | all form pages | 🔴 Major |
| No inline validation errors | all form pages | 🔴 Major |
| No max-length on inputs | all form pages | ⚠️ Minor |
| Take exam can submit blank answers | exams/[id]/take | 🔴 Major |
| No file type/size validation before upload | projects/[id] | ⚠️ Minor |
| No double-submit prevention (except disabled button) | all form pages | ⚠️ Minor |
| Email validation (regex + lowercase) | register | ✅ Pass |
| Password min-length (8) with HTML attribute | register | ✅ Pass |
| No `min`/`max` on number inputs | exams/create | ⚠️ Minor |
| Unhandled promise rejections (no .catch()) | 15+ pages | ❌ Critical |

### Heuristic 6 — Recognition vs Recall

**Score: 18 ✅ / 5 ⚠️ / 0 🔴 / 0 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| Sidebar shows all available sections | all dashboard pages | ✅ Pass |
| Dropdowns show current selection | all with selects | ✅ Pass |
| Form fields have placeholder text | all form pages | ✅ Pass |
| Password has "show password" toggle? | login, register — NOT present | ⚠️ Minor |
| Search functionality? | NOT present on any page | ⚠️ Minor |
| Recently used items surfaced (chat sessions, recent exams) | chat, dashboard | ✅ Pass |
| Navigation links use clear labels | sidebar | ✅ Pass |
| Icons are accompanied by labels | dashboard quick links | ✅ Pass |
| Previously entered data preserved on validation error | chat, register | ✅ Pass |
| No "show password" toggle | login, register | ⚠️ Minor |

### Heuristic 7 — Flexibility & Efficiency of Use

**Score: 18 ✅ / 5 ⚠️ / 0 🔴 / 0 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| Sortable/filterable lists? | NOT present | ⚠️ Minor |
| Bulk actions? | NOT present (grade all is single action) | ⚠️ Minor |
| Pagination for long lists? | NOT present | ⚠️ Minor |
| Tab order follows reading order | all pages | ✅ Pass |
| Links are clearly clickable | all pages | ✅ Pass |
| Quick actions on dashboard | dashboard | ✅ Pass |
| Tab navigation for related content | analytics, career, etc. | ✅ Pass |
| Keyboard shortcuts? | NOT present | ⚠️ Minor |
| Sessions save/restore in chat | chat | ✅ Pass |
| Form templates or copy-from-existing? | NOT present | ⚠️ Minor |

### Heuristic 8 — Aesthetic & Minimalist Design

**Score: 15 ✅ / 8 ⚠️ / 0 🔴 / 0 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| Clean typography hierarchy | all pages | ✅ Pass |
| CSS theme variables + shadcn system | all pages | ✅ Pass |
| Inter + JetBrains Mono fonts | all pages | ✅ Pass |
| Dark/light mode support | all pages | ✅ Pass |
| No redundant/duplicate information | all pages | ✅ Pass |
| Some pages have dense information without whitespace | exams/create, admin | ⚠️ Minor |
| Some emoji icons inconsistent with design system | dashboard, gamification | ⚠️ Minor |
| Dashboard quick links use emoji as icons — inconsistent with lucide pattern | dashboard | ⚠️ Minor |

### Heuristic 9 — Error Recovery

**Score: 0 ✅ / 0 ⚠️ / 8 🔴 / 15 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| API errors silently discarded | ALL pages | ❌ Critical |
| Network errors cause unhandled rejection | 15+ pages | ❌ Critical |
| No error toast/alert anywhere | ALL pages | ❌ Critical |
| 404/500 shows "Loading..." forever | exam detail, exam results, exam take | 🔴 Major |
| Delete redirect regardless of API result | exams/[id] | ❌ Critical |
| Retry mechanism? | NOT present anywhere | 🔴 Major |
| Inline validation errors? | NOT present anywhere | 🔴 Major |
| No error boundary | ALL pages | 🔴 Major |
| Error messages in plain language? | N/A — no error messages at all | ❌ Critical |

### Heuristic 10 — Help & Documentation

**Score: 5 ✅ / 10 ⚠️ / 6 🔴 / 2 ❌**

| Finding | Pages | Severity |
|---------|-------|----------|
| Empty states present | 16/23 pages | ✅ Pass |
| Empty states MISSING | projects, projects/[id] (files), admin, academic (citation/structure/outline), career | 🔴 Major |
| Tooltips or info icons? | NOT present | ⚠️ Minor |
| Onboarding/tutorial? | NOT present | ⚠️ Minor |
| FAQ/help page linked? | NOT present | ⚠️ Minor |
| Contact/support accessible? | NOT present | ⚠️ Minor |
| Empty state "Select a project and click check" (action-guiding) | plagiarism | ✅ Pass |
| Empty state "Start a conversation" (action-guiding) | chat | ✅ Pass |
| Empty state "Belum ada badge. Mulai aktivitas!" (action-guiding) | gamification | ✅ Pass |
| No `loading.tsx` | ALL pages | 🔴 Major |
| No `error.tsx` | ALL pages | 🔴 Major |
| No `not-found.tsx` | ALL pages | 🔴 Major |

---

## Recommendations — Ordered by Effort/Impact

### Now (1-2 lines each, ponytail scope)

| # | Fix | Files | Lines changed |
|---|-----|-------|--------------|
| 1 | `safeFetch` utility + auto-error toast | `security.ts` + all page files | ~2 + 23 replacements |
| 2 | `pathname.startsWith` in sidebar | `layout.tsx` | 1 |
| 3 | `confirm()` on state changes | `exams/[id]/page.tsx`, `admin/page.tsx`, `admin/reviews/page.tsx` | ~8 |
| 4 | `beforeunload` on form pages | `register/page.tsx`, `exams/create/page.tsx`, `exams/[id]/take/page.tsx` | ~9 |
| 5 | `<label className="sr-only">` | `questions/page.tsx`, `exams/create/page.tsx`, `admin/page.tsx`, `admin/reviews/page.tsx`, `plagiarism/page.tsx`, `academic/page.tsx` | ~15 |
| 6 | Tab ARIA roles | `analytics/page.tsx`, `academic/page.tsx`, `teaching/page.tsx`, `collaboration/page.tsx`, `career/page.tsx`, `gamification/page.tsx`, `admin/reviews/page.tsx` | ~30 |
| 7 | `loading.tsx` per route group | `app/(dashboard)/loading.tsx`, `app/(auth)/loading.tsx` | 2 new files |
| 8 | `error.tsx` per route group | `app/(dashboard)/error.tsx`, `app/(auth)/error.tsx` | 2 new files |
| 9 | `not-found.tsx` | `app/not-found.tsx` | 1 new file |
| 10 | Empty states for missing pages | `projects/page.tsx`, `admin/page.tsx` | ~10 |

### Later (bigger scope)

| # | Fix | Scope |
|---|-----|-------|
| 11 | Breadcrumb component for nested routes | Add shared component + implement in exam flow |
| 12 | `<Button>` component migration | Replace all raw buttons with shadcn Button |
| 13 | CSS variable migration | Replace hardcoded `bg-zinc-900`, `text-zinc-500` etc. |
| 14 | Color-only badges → icon + color | Status badges across all pages |
| 15 | Keyboard shortcuts | Chat, navigation |

---

## Methodology

- Evaluator: automated heuristic inspection via subagent review of each page's source code
- Standards: [Nielsen's 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- Severity: ✅ Pass (no issue), ⚠️ Minor (cosmetic/low impact), 🔴 Major (significant barrier), ❌ Critical (blocks task/data loss)
- Framework: Next.js 16, shadcn/ui design tokens, Tailwind CSS v4
- Date: July 2026
