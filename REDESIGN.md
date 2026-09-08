# Redesign Plan — apply the navy + orange design to all pages

**Goal:** restyle the entire app to match the design in `DESIGN.md` (Reset HR — deep navy + orange
on white, light/dark toggle, Poppins headings). Work through the steps below **in order**.

Read `DESIGN.md` first — it is the visual source of truth (colors, tokens, per-page patterns).
This file is the execution plan and the rules.

---

## Hard rules (apply to every step)

1. **Visual only.** Do NOT change data fetching, hooks, queries, routing logic, auth, or RLS.
   Only change styling, layout, class names, tokens, and presentational markup.
2. **Tokens, not hardcoded colors.** Use the CSS-variable tokens from `DESIGN.md`, each with a light
   and a dark value. Nothing hardcoded — this is what makes the theme toggle work.
3. **Both modes always.** Every screen must be readable and correct in light AND dark. No low-contrast
   text, no card left white in dark mode, no vanished borders or focus rings.
4. **Orange is one accent per screen** — active nav, primary button, in-progress marker, own chat bubble.
   Never a page/large-area fill. Navy = structure, neutrals = everything else.
5. **One step at a time.** Show a short plan for each step, apply it, stop, and report what changed.
   Do not run ahead to later steps.

---

## Step 0 — Foundation (do this first, then PAUSE for review)

- Set up the **theme system**: CSS variables (or Tailwind CSS-variable tokens) for every color in
  `DESIGN.md`, with light + dark values.
- Add a **light/dark toggle** in the header (moon/sun icon). Persist the choice; default to light.
- Load **Poppins** (headings) and **Inter** (body) from Google Fonts; wire into the type scale.
- Restyle the **sidebar + app shell/header** to match `DESIGN.md`: navy sidebar, orange active item,
  navy header with the toggle.
- **Then stop and report.** Do not restyle feature pages yet — wait for confirmation that the
  foundation and dark mode look right.

**Definition of done:** app runs, sidebar/header match the design in both modes, toggle works, fonts
load, no functional behavior changed.

---

## Then restyle pages — one step per page, in this order

For each page: apply the matching pattern from `DESIGN.md`, keep all existing data/logic, handle
loading/empty/error states, verify light + dark, then stop and report before the next page.

1. **Dashboard** — header + stat cards (Interns / Submitted / Open tasks) + "Recent activity" list with
   the orange left-border on the newest row. (Keep role-aware content as built.)
2. **Daily Progress** — form card (summary, tasks, learnings, blockers, hours) + orange Save button +
   past-entries list below.
3. **Tasks** — three columns (To do / In progress / Done); cards with title + meta; orange left-border on
   the in-progress card; "Assign task" primary button (keep the existing role gating).
4. **Weekly Reports** — same form-card pattern as Daily Progress.
5. **Diary** — same form-card pattern.
6. **Messages** — chat list (left) + thread (right); own bubbles orange, others white; active chat has
   orange-tint background in the list.
7. **Team** — grid of member cards (initials avatar + name + role). Keep the existing role logic.
8. **Activity Log** — full-page version of the dashboard "Recent activity" list.
9. **Sign in / Sign up** — centered white card, "reset tracker" wordmark (orange "reset"), labeled
   fields, orange primary button, "Forgot password?" link.

---

## Definition of done (every page)

- Matches the corresponding pattern in `DESIGN.md`.
- Correct and readable in **both light and dark** mode.
- Loading / empty / error states styled, not blank.
- **No functional change** — same data, same behavior as before the restyle.
- Runs with no console errors.

---

## Notes for the human running this

- Do this on the **`ui-redesign` branch** (not main).
- After Step 0, actually look at the dashboard/shell in **dark mode** before letting it continue —
  dark mode is where contrast bugs hide.
- Commit after each page that looks right (e.g. `redesign: tasks`) so any single page can be rolled back.
- If a page comes out wrong, fix that one page before moving on — don't let it compound.
