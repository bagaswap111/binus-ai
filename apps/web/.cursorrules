---
name: usability-heuristics
description: "Evaluates UI against Jakob Nielsen's 10 usability heuristics. Spawns page-by-page review, scores each heuristic, and produces a structured report with severity ratings."
---

# Usability Heuristics Evaluation

Evaluates a web application's user interface against [Jakob Nielsen's 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/). The agent visits every page (or route), inspects each heuristic, and produces a scored report.

## When to use

- Before a UI redesign or visual refresh.
- After implementing new features or pages.
- As part of a QA or accessibility audit.
- When you need a structured, repeatable usability evaluation.

## When NOT to use

- For backend-only or API-only code reviews (use `deep-review` or `code-review-and-quality`).
- When you need a full accessibility audit following WCAG 2.2 (use a dedicated a11y tool).
- For content/ copywriting review (use `writing-plans` or a dedicated content review).

## Heuristics

Each heuristic below includes a **definition**, a **checklist** of items the agent must inspect, and a **scoring rule**.

### Scoring

| Score | Meaning |
|-------|---------|
| ✅ Pass | No issues found |
| ⚠️ Minor | Non-critical issue, low user impact |
| 🔴 Major | Significant usability barrier |
| ❌ Critical | Blocks task completion |

Per-page report: each heuristic gets one of the four scores.
Overall report: count of each severity across all pages.

---

### H1 — Visibility of System Status

**Definition:** The system should always keep users informed about what is going on, through appropriate feedback within reasonable time.

**Checklist:**
- [ ] Loading states exist for every async operation (spinner, skeleton, progress bar)
- [ ] Page or section titles clearly indicate current location
- [ ] Breadcrumbs or navigation indicators show where the user is
- [ ] Form submissions show a saving/processing state
- [ ] Button clicks provide visual feedback (hover, active, disabled states)
- [ ] Long operations (>3s) show progress or estimated time
- [ ] Error toasts or banners appear for failed operations
- [ ] Success confirmation appears after create/update/delete actions

**Page-specific notes:**
- Chat: message sending indicator, typing indicator from AI
- Forms: submit button disabled + loading text during submission
- Navigation: active link/ tab is visually distinct
- Data tables: "Loading..." or skeleton rows while fetching

---

### H2 — Match Between System and the Real World

**Definition:** The system should speak the users' language, with words, phrases and concepts familiar to the user, rather than system-oriented terms.

**Checklist:**
- [ ] Labels use familiar terms (not internal/ technical jargon)
- [ ] Icons have text labels or tooltips (no icon-only navigation without context)
- [ ] Date/ time formats match locale conventions
- [ ] Currency, number formats match locale conventions
- [ ] Error messages are in plain language, not codes
- [ ] Navigation labels match user mental model (e.g., "Shopping Cart" not "ItemContainer")
- [ ] Role-appropriate terminology (student terms vs admin terms)

---

### H3 — User Control and Freedom

**Definition:** Users often choose system functions by mistake and will need a clearly marked "emergency exit" to leave the unwanted state.

**Checklist:**
- [ ] Cancel/ back button exists on multi-step flows
- [ ] Confirmation dialog before destructive actions (delete, discard changes)
- [ ] Undo support for reversible actions
- [ ] Close/ dismiss button on modals, dialogs, popovers
- [ ] Browser back button works as expected (no broken history)
- [ ] Escape key dismisses modals and dropdowns
- [ ] "Cancel" returns user to previous state, not a dead end

---

### H4 — Consistency and Standards

**Definition:** Users should not have to wonder whether different words, situations, or actions mean the same thing.

**Checklist:**
- [ ] Same action uses same label/ icon across the app (e.g., always "Delete" not "Delete" vs "Remove" vs "Discard")
- [ ] Same visual component uses same styling (buttons, inputs, selects, tabs)
- [ ] Color coding is consistent (red = error/destructive, green = success, yellow = warning)
- [ ] Layout structure is consistent across pages (sidebar, header, content area)
- [ ] Keyboard shortcuts are consistent (Enter to submit, Escape to cancel)
- [ ] Terminology is consistent (don't mix "Course" and "Subject" for the same concept)
- [ ] External links open in new tabs consistently
- [ ] Form patterns are consistent (same button placement, same validation style)

**Note:** This heuristic pairs with the "UI consistency" theme — check that `<select>`, tab, and list-item styling is unified (as done in previous optimizations).

---

### H5 — Error Prevention

**Definition:** Even better than good error messages is a careful design which prevents a problem from occurring in the first place.

**Checklist:**
- [ ] Required fields are marked (asterisk or label)
- [ ] Input constraints prevent invalid data (min/max length, type validation, range limits)
- [ ] Submit button is disabled until required fields are filled
- [ ] Confirmation for destructive actions (double-check before delete)
- [ ] Form data is preserved on validation errors (no blank form on error)
- [ ] Auto-save for long forms (draft preservation)
- [ ] File uploads validate type and size before uploading
- [ ] Prevent accidental double-submit (button disabled after first click)

---

### H6 — Recognition Rather Than Recall

**Definition:** Minimize the user's memory load by making objects, actions, and options visible.

**Checklist:**
- [ ] Navigation shows all available sections (user doesn't need to remember URLs)
- [ ] Search is available for large content sets
- [ ] Recently used items are surfaced (recent chats, recent projects)
- [ ] Form fields have placeholder text or helper text
- [ ] Dropdowns/ selects show the current selection clearly
- [ ] Icons are accompanied by labels (not icon-only)
- [ ] Password field has a "show password" toggle
- [ ] Previously entered data is pre-filled when appropriate

---

### H7 — Flexibility and Efficiency of Use

**Definition:** Accelerators — unseen by the novice user — may often speed up the interaction for the expert user.

**Checklist:**
- [ ] Keyboard shortcuts exist for frequent actions (if applicable)
- [ ] Bulk actions available (select multiple items, apply action to all)
- [ ] Sortable/ filterable lists and tables
- [ ] Pagination or infinite scroll for long lists (user controls the view)
- [ ] Ability to customize or pin frequently used items
- [ ] Template or copy-from-existing for repetitive tasks
- [ ] Tab order follows logical reading order

---

### H8 — Aesthetic and Minimalist Design

**Definition:** Dialogues should not contain information which is irrelevant or rarely needed.

**Checklist:**
- [ ] No redundant or duplicate information on the page
- [ ] Only essential controls are visible; advanced options are collapsible or in a secondary menu
- [ ] White space is used effectively (not cramped, not wasteful)
- [ ] Typography hierarchy is clear (headings, subheadings, body)
- [ ] Color palette is restrained (no clash, no excessive highlight colors)
- [ ] Icons and images serve a purpose (not decorative clutter)
- [ ] Mobile view is not overcrowded (responsive breakpoints respected)

---

### H9 — Help Users Recognize, Diagnose, and Recover from Errors

**Definition:** Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution.

**Checklist:**
- [ ] Error messages are in plain language (no codes like "ERR-4532")
- [ ] Error message identifies the exact field or problem
- [ ] Error message suggests how to fix it
- [ ] Inline validation shows errors next to the field (not just a top-of-page banner)
- [ ] HTTP 4xx/5xx errors show a user-friendly page, not a raw error
- [ ] 404 page has a way back ("Go to Dashboard" link)
- [ ] Network errors show a retry button
- [ ] Server errors don't leak stack traces or internal details

---

### H10 — Help and Documentation

**Definition:** Even though it is better if the system can be used without documentation, it may be necessary to provide help and documentation.

**Checklist:**
- [ ] Empty states provide guidance ("No items yet. Create your first...")
- [ ] Tooltips or info icons explain unfamiliar concepts
- [ ] Onboarding flow or tutorial exists for first-time users (if complex)
- [ ] FAQ or help page is linked from the UI
- [ ] Error states link to relevant help documentation
- [ ] Contact/ support information is accessible
- [ ] Feature announcements or changelog is available

---

## Execution

1. **Discover all pages/ routes.** Use glob/ read tools to find every page component under `src/app/`. Include auth pages, dashboard pages, admin pages, and any modal/ dialog that renders as a separate route.

2. **For each page**, evaluate all 10 heuristics using the checklists above. Take screenshots or notes for evidence.

3. **Score each heuristic per page** (✅ Pass / ⚠️ Minor / 🔴 Major / ❌ Critical).

4. **Produce a report** with:
   - Summary table: total counts per severity
   - Per-page breakdown: heuristic scores + findings
   - Top 5 issues to fix (highest severity + widest impact)
   - Recommendations organized by heuristic

## Report Format

```
# Usability Heuristic Evaluation — [App Name]

## Summary

| Severity | Count |
|----------|-------|
| ✅ Pass  | XX    |
| ⚠️ Minor | XX    |
| 🔴 Major | XX    |
| ❌ Critical | XX  |

## Per-Page Results

### /page-name
| Heuristic | Score | Finding |
|-----------|-------|---------|
| H1 Visibility | ✅ | Loading states present |
| H2 Real world | ⚠️ | Uses "demerged" instead of "cancel enrollment" |
| ... | | |

## Top 5 Issues

1. **[Page] [H#] [Severity]** — Description → Fix
2. ...

## Recommendations by Heuristic

### H1 — Visibility of System Status
- ...
```

## Evidence Collection

For each finding, collect:
- Page URL or route path
- Heuristic number and name
- Score (pass/minor/major/critical)
- Description of the issue
- Suggested fix
- Optional: element selector or screenshot reference

---

## Input Detection

Automatically detect what the user has provided:

| Provided | How to use |
|---|---|
| Screenshot / image | Analyze visual hierarchy, layout, labeling, control placement |
| Code file (HTML, JSX, TSX, etc.) | Read code to understand interaction logic, states, constraints, accessibility attributes |
| Both code + screenshot | Use both — code is primary for interaction/state analysis, screenshot for visual judgment |
| Figma URL | Parse fileKey and nodeId. Use available MCP tools to retrieve design context. Treat as screenshot + code context. |
| Text-only description | Do NOT produce a formal report. Give brief informal suggestions and request a screenshot, code, or Figma URL. |
| None of the above | Ask: "Can you provide a screenshot, Figma URL, or point me to the HTML/component file?" |

If only one type is provided and the other would significantly improve the evaluation, note it at the end of the report — not at the beginning.

---

## Module Auto-Detection

Before running the evaluation, scan the input for domain-specific patterns and enable relevant modules:

| Module | Auto-detect when | Reference file |
|---|---|---|
| Data Visualization | Charts, graphs, KPIs, dashboards, data tables, status indicators, progress bars, sparklines, gauges, or any data-display layout | [references/data-viz-heuristics.md](references/data-viz-heuristics.md) |
| Accessibility | **ALWAYS enabled** for every evaluation. Default: WCAG AA. Escalate to AAA when the user requests it, or the product targets the general public, healthcare, government, or users with disabilities. | [references/accessibility-heuristics.md](references/accessibility-heuristics.md) |

Multiple modules can be active simultaneously. State which modules are active at the top of the report.

---

## Evaluation Guidelines

- **Be specific**: reference exact controls, labels, or layout areas by name — not generic statements.
- **Cite evidence**: "The date picker has no disabled states when the range changes" is better than "Error prevention could be improved."
- **Acknowledge strengths**: if a heuristic is well-handled, mark it as `Good` with a brief note on what works. Do not manufacture problems.
- **Respect incompleteness**: placeholder text, TODO comments, and stub components are not design flaws. Note them in the finding text and rate based on actual user impact.
- **Screenshot artifacts are not findings**: Transient states captured in a screenshot (tooltips, hover menus, focus rings) are not permanent layout problems. If a transient state reveals a real positioning issue, note it with appropriate context.
- **WCAG level**: Default to Level AA. Escalate to Level AAA when the user explicitly requests it, or when the product context implies it (public-sector, healthcare, assistive-technology products).
- **Use Needs Manual Review honestly**: When you cannot observe or verify a behavior from the provided input, rate it `Needs Manual Review`. Do not assign a severity to something you haven't confirmed.
- **Internal consistency first**: for H4 (Consistency and Standards), always evaluate internal consistency within the page first. Only evaluate external/platform consistency if context was provided.
- **Reference the detailed checklists** in `references/nielsen-10-heuristics.md` for per-heuristic platform-specific guidance.

---

## Rating Scale

Use the full 6-level scale from [references/severity-scale.md](references/severity-scale.md):

| Rating | Label | Definition | Action |
|---|---|---|---|
| ❌ | **Critical** | Prevents task completion or causes serious data misunderstanding | Must fix before release |
| 🔴 | **Major** | Significant friction or confusion; users can work around but will struggle | Should fix — high priority |
| ⚠️ | **Minor** | Noticeable annoyance but users can complete their task | Fix when possible |
| ✅ | **Good** | Heuristic is well-handled; note what works | No action needed |
| 👁️ | **Needs Manual Review** | Cannot verify from provided input | Verify in live product |
| — | **N/A** | Heuristic does not apply to this UI | No action needed |

When `Rating = N/A` or `Rating = Needs Manual Review`, there is no scored severity.

---

## Comparative Mode

Triggered when the user provides two versions (e.g., two screenshots, two Figma URLs, before/after code).

1. Run the standard evaluation on **both** versions
2. Produce a comparison table:

| Heuristic | Version A | Version B | Delta |
|---|---|---|---|
| H1 Visibility of System Status | Minor | Good | Improved |
| ... | ... | ... | ... |

3. Highlight **regressions** (worse in B) and **improvements** (better in B)
4. Executive summary focuses on **what changed**, not a full re-evaluation of both versions
