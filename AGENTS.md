# AGENTS.md — Internship Tracker

You are the coding agent for this project. Follow these rules on every task.

## How you must work (read this first)

- The **full build spec** is in `internship-tracker-spec.md` in this workspace. **Open and read it completely before doing anything.** It is the source of truth for stack, schema, RLS, design, and phases.
- **Build in phases. Do exactly ONE phase per request** (see the build order below). Stop after each phase and let me review. Never jump ahead or combine phases unless I explicitly say so.
- Use **Planning mode** for anything non-trivial: show me the plan and wait for approval before writing code.
- The database is **Supabase — not Firebase.** Do not add Firebase, Firestore, or any other backend. If a plugin or suggestion pushes Firebase, ignore it.
- **Never invent the database schema.** Use §6 (schema) and §7 (RLS policies) from the spec exactly as written.
- **No secrets in code.** Use a gitignored `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; commit a `.env.example`. Only the anon key goes in the frontend — never the service-role key.
- **Authorization is enforced by Supabase RLS, not the UI.** UI role-gating is for UX only; never rely on it for security.
- After each phase, **explain in plain terms what you built and why.** I'm an intern learning JS, React, and Supabase — teach as you go.

## Stack (do not substitute)

Vite + React 18 (function components + hooks only), Tailwind CSS, react-router-dom v6, `@supabase/supabase-js` v2, lucide-react, date-fns. No Next.js. No class components. Data access lives in `src/hooks/*`, not inside components.

## Roles

`intern → supervisor → super_supervisor → admin`. Interns write their own daily progress, diary, and weekly reports; supervisors review their own interns and assign tasks; super_supervisors see everything. Full permission matrix is in spec §2.

## Brand / design (spec §1a)

Mostly **white + warm neutrals**. Orange (`#F26722` = `brand-500`) is an **accent only** — primary buttons, active nav item, links, focus rings. **Never** use orange as a page or large-area background. Full color tokens + `tailwind.config.js` are in spec §1a; apply them from Phase 1.

## Build order (one phase per request)

1. Scaffold (Vite + React + Tailwind + router + supabase client + sidebar layout)
2. Auth (sign up / in / out, AuthContext with role, AuthGuard)
3. Daily progress (CRUD, one per day)
4. Role-aware dashboard
5. Tasks (assign + status board)
6. Reviews (supervisor comments on progress)
7. Weekly reports + diary
8. Messages (realtime via Supabase channels)
9. Activity log
10. Polish (empty/loading/error states, validation, responsive)

**Before Phase 2:** I will have run the spec's §6 + §7 SQL in the Supabase SQL editor. If the tables don't exist when you reach auth, remind me to run it.

## Definition of done (every phase)

Runs with `npm run dev`, no console errors, handles **loading / empty / error** states, and matches the brand tokens. Keep components small — one feature per folder under `src/features`.
