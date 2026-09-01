# Project Handoff — Internship Tracker

> **New agent: read this first, then read `AGENTS.md` and `internship-tracker-spec.md`.**
> This file is the current state of the project. The other files are the rules and full spec.
> Continue the build from "Next steps" below. Ask before changing decisions already made.

---

## What this project is

A web app for an intern to log daily progress, tasks, uni weekly reports, and a personal diary,
message supervisors, and keep an activity log — with role-based access. The builder is an intern
learning JS, React, and Supabase, so explain work in plain terms and build in small reviewable steps.

## Roles

`intern → supervisor → super_supervisor → admin`. Interns write their own progress/diary/weekly
reports; supervisors review their own interns and assign tasks; super_supervisors see everything.
Full permission matrix in spec §2. Authorization is enforced by Supabase RLS, not just the UI.

## Tech stack (do not substitute)

Vite + React 18 (function components + hooks only), Tailwind CSS, react-router-dom v6,
`@supabase/supabase-js` v2, lucide-react, date-fns. **Database is Supabase — NOT Firebase.**
No Next.js, no class components. Data access lives in `src/hooks/*`.

## Brand / design

Mostly white + warm neutrals. Orange (`#F26722` = `brand-500`) is an **accent only** — primary
buttons, active nav, links, focus rings. Never orange page backgrounds. Full tokens +
`tailwind.config.js` in spec §1a; already applied from Phase 1.

---

## Environment (already set up)

- **IDE:** Google Antigravity, plan = **Google AI Pro**, model = **Gemini 3.1 Pro**.
  (Bump reasoning Low→Medium/High for auth/RLS-heavy phases. Claude Sonnet 4.6 is also available
  as a fallback — Gemini and Claude/GPT have **separate quota buckets**.)
- **AI Credit Overages: OFF** (safe — no surprise charges; agent just pauses if quota runs out).
- **Supabase project:** name `AI-Internship-Tracker`, org `Creative Labs` (free tier),
  URL `https://cgeimuppliizvhpofybl.supabase.co`, region `ap-northeast-1` (Tokyo).
  > Region is far from the user (Istanbul) — mild latency cost, kept as-is on purpose.
- **`.env`** in repo root holds the real `VITE_SUPABASE_URL` (the `.supabase.co` address) and
  `VITE_SUPABASE_ANON_KEY` (the **anon/public** key — never service_role). Restart `npm run dev`
  after any `.env` edit; Vite only reads it at startup.
- **GitHub:** repo connected (`AI-Coded-Tracker`). `.env` is gitignored.

## Database (already done)

All 8 tables created and RLS applied via the spec's §6 (schema) and §7 (policies), which are also
inlined in `GETTING_STARTED.md` steps 2–3. Confirmed in Supabase Table Editor: `profiles`,
`daily_progress`, `reviews`, `tasks`, `weekly_reports`, `diary_entries`, `messages`, `activity_logs`,
with RLS policies present. The `handle_new_user` trigger auto-creates a `profiles` row on signup.

## Files in the repo

- `AGENTS.md` — agent rulebook (Antigravity reads it automatically).
- `internship-tracker-spec.md` — full spec: schema §6, RLS §7, design §1a, phases, routes.
- `GETTING_STARTED.md` — zero-to-running runbook with the SQL inlined.
- `README.md` — project readme.
- `HANDOFF.md` — this file.
- Scaffolded app under `src/` (see progress below).

---

## Build progress (one phase per prompt, `@`-mention the md files)

- [x] **Phase 1 — Scaffold** — Vite+React+Tailwind+router, supabase client (`src/lib/supabase.js`),
      sidebar layout, empty routed pages, brand tokens. Accepted.
- [x] **Phase 2 — Auth** — `AuthContext.jsx` (session + profile with role), `AuthGuard.jsx`,
      `LoginForm.jsx`, `SignupForm.jsx` (passes `full_name` metadata for the trigger), sign-out in
      Sidebar + Settings, app wrapped in AuthProvider. Accepted.
- [ ] **Phase 3 — Daily progress** ← NEXT (CRUD, one entry per intern per day)
- [ ] **Phase 4 — Role-aware dashboard**
- [ ] **Phase 5 — Tasks** (assign + status board)
- [ ] **Phase 6 — Reviews** (supervisor comments on progress)
- [ ] **Phase 7 — Weekly reports + diary**
- [ ] **Phase 8 — Messages** (enable Realtime on the `messages` table in Supabase first)
- [ ] **Phase 9 — Activity log**
- [ ] **Phase 10 — Polish** (empty/loading/error states, validation, responsive)

---

## Next steps (do these now)

1. **Verify Phase 2 works end-to-end** (not yet confirmed at handoff):
   - Run `npm run dev`, sign up a test user in the app.
   - Supabase → **Authentication → Users**: the user appears.
   - Supabase → **Table Editor → profiles**: a row auto-created with id, email, `full_name`,
     `role = intern`. If both appear, the full chain (env → auth → DB → trigger → RLS) is proven.
2. **If signup errors**, most likely *"Database error saving new user"* → the `handle_new_user`
   trigger failed, usually because `full_name` wasn't passed (it should be — Phase 2 wired it).
   Report the exact error.
3. **Then Phase 3.** Suggested prompt:
   > `@AGENTS.md @internship-tracker-spec.md` Do **Phase 3 only**: daily progress — list the
   > signed-in intern's own entries, create/edit today's entry (one per day, unique per date),
   > and a detail page. Follow the schema in spec §6 and brand tokens in §1a. Stop when it runs.

## Gotchas already hit (don't repeat)

- **`.env` mixup:** line 1 must be the `https://...supabase.co` URL, line 2 the anon key. Both are
  long — don't paste a key into the URL slot. Restart the dev server after editing.
- **anon vs service_role:** only the **anon/public** key goes in the frontend. service_role never does.
- **Antigravity auto-proceeds** past the implementation plan sometimes. For plan review (esp. RLS
  phases), tell it "show the plan and wait for my approval before executing."
- A **"Failed to fetch (api.supabase.com)"** error in the Supabase Table Editor was a transient
  network blip, not a setup problem — a refresh fixed it.
- After editing `.env`, the dev server was left stopped (`^C`) — remember to re-run `npm run dev`.

## Testing rhythm (every phase)

After each phase: `npm run dev`, click through the new feature, then verify data lands in the right
Supabase table. Ask the agent to "explain what you just built and why" — the builder is learning.
