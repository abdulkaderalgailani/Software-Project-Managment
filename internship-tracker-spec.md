# Internship Tracker — Build Spec

> A web app for interns to log daily progress, tasks, weekly reports and a personal
> diary, communicate with supervisors, and keep an activity log — with role-based
> access for interns, supervisors, and super-supervisors.

---

## 0. How to use this file

This is the ground-truth spec for a coding agent (GitHub Copilot agent / Claude Code / etc).

- Save it in the repo. You can also copy it to `.github/copilot-instructions.md` or `AGENTS.md`
  so the agent picks it up automatically.
- Build **one phase at a time** (see §8). Don't ask the agent to "build everything" in one shot —
  it produces better, testable code phase by phase.
- The SQL in §6 and §7 is authoritative. Run it in the Supabase SQL editor exactly as written.

---

## 1. Tech stack

| Layer      | Choice                                | Notes                                              |
|------------|---------------------------------------|----------------------------------------------------|
| Build tool | **Vite**                              | `npm create vite@latest -- --template react`       |
| UI         | **React 18** (function components + hooks) | No class components                            |
| Styling    | **Tailwind CSS**                      | Brand tokens in §1a; utility classes; small `components/ui` set |
| Backend    | **Supabase**                          | Auth + Postgres + Realtime + Row Level Security    |
| Routing    | **react-router-dom v6**               |                                                    |
| Data       | **@supabase/supabase-js v2**          | Single client in `src/lib/supabase.js`             |
| Icons      | **lucide-react**                      |                                                    |
| Dates      | **date-fns**                          |                                                    |

**No secrets in code.** Use `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
Add `.env` to `.gitignore`; commit a `.env.example`.

---

## 1a. Design system — brand colors (orange & white)

**Brand:** Reset HR Consulting. **Look:** clean, professional, mostly white with a confident
orange accent. Orange is used *sparingly and intentionally* — primary buttons, the active nav
item, links, key highlights and focus rings. Everything else is white/off-white with warm-neutral
text. Never fill large areas with orange; it's an accent, not a background.

> Only the `--brand-500` value defines the identity. If you get Reset HR's exact brand orange,
> replace that one hex and re-derive the ramp; the rest of the app follows.

### Color tokens

```
Brand (orange ramp)
  --brand-50 : #FFF4ED   tint backgrounds, badges, hover rows
  --brand-100: #FFE6D5
  --brand-200: #FECDAA
  --brand-300: #FDAC74
  --brand-400: #FB8A3C
  --brand-500: #F26722   PRIMARY — buttons, active nav, links, focus ring
  --brand-600: #E14E12   hover / pressed
  --brand-700: #BB3B11
  --brand-800: #952F15
  --brand-900: #782914   text on very light orange tints

Neutrals (warm)
  --white    : #FFFFFF   base background
  --surface  : #FAF9F7   page alt background / subtle cards
  --border   : #ECE9E4   hairlines, dividers, input borders
  --muted    : #78716C   secondary text, placeholders, captions
  --text     : #1C1917   primary text (warm near-black)

Status (muted so orange stays the star — use only where meaning requires)
  --success  : #2E7D5B   task done
  --danger   : #C0392B   errors, high-priority flag
  --info      → use a neutral gray, not blue
  --warning   → reuse --brand-400 / --brand-500
```

### tailwind.config.js

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#FFF4ED',100:'#FFE6D5',200:'#FECDAA',300:'#FDAC74',400:'#FB8A3C',
          500:'#F26722',600:'#E14E12',700:'#BB3B11',800:'#952F15',900:'#782914',
        },
        surface:'#FAF9F7', border:'#ECE9E4', muted:'#78716C', ink:'#1C1917',
        success:'#2E7D5B', danger:'#C0392B',
      },
      borderRadius: { xl:'0.75rem', '2xl':'1rem' },
    },
  },
  plugins: [],
};
```

### Usage rules

- **Backgrounds:** page = `white` (or `surface` for subtle sections); cards = `white` with a
  `border` hairline and soft shadow. No orange page backgrounds.
- **Primary button:** `bg-brand-500 text-white hover:bg-brand-600`, rounded-xl, medium weight.
- **Secondary button:** `bg-white text-ink border border-border hover:bg-surface`.
- **Ghost/link:** `text-brand-600 hover:text-brand-700`.
- **Active nav item (sidebar):** `bg-brand-50 text-brand-700` with a `border-l-2 border-brand-500`;
  inactive items are `text-muted hover:text-ink hover:bg-surface`.
- **Focus ring (accessibility — don't skip):** `focus-visible:ring-2 ring-brand-500 ring-offset-2`.
- **Badges/status pills:** neutral by default (`bg-surface text-muted`); `done` → `bg-success/10 text-success`;
  high priority → `bg-danger/10 text-danger`; anything "active/current" → `bg-brand-50 text-brand-700`.
- **Text:** body `text-ink`, secondary `text-muted`. Aim for AA contrast — orange text only on white/tints, never orange text on orange.
- **Feel:** generous whitespace, one accent color discipline, rounded-xl corners, thin borders over heavy shadows.

Put the token values as CSS variables in `src/index.css` too, so non-Tailwind spots can use them.

---

## 2. Roles & permissions

Four roles, in a hierarchy:

- **intern** — the default. Creates their own progress/diary/weekly reports; sees their own tasks; messages their supervisor.
- **supervisor** — oversees a set of interns (interns whose `supervisor_id` points to them). Reviews their interns' work, assigns tasks, messages them.
- **super_supervisor** — sees everything across all supervisors and interns. Read-only oversight + can comment/assign.
- **admin** — full access (manage users/roles). Optional; can be added later.

### Permission matrix

| Action                                | intern (own) | supervisor (their interns) | super_supervisor | admin |
|---------------------------------------|:---:|:---:|:---:|:---:|
| Create/edit own daily progress        | ✅ | — | — | ✅ |
| View intern's daily progress          | own | ✅ | all | all |
| Comment/review daily progress         | — | ✅ | ✅ | ✅ |
| Create/edit own diary & weekly report | ✅ | — | — | ✅ |
| View diary & weekly report            | own | ✅ | all | all |
| Assign tasks                          | — | ✅ | ✅ | ✅ |
| Update own assigned task status       | ✅ | ✅ | ✅ | ✅ |
| Send/receive messages                 | ✅ | ✅ | ✅ | ✅ |
| View activity logs                    | own | their interns | all | all |
| Manage roles / assign supervisors     | — | — | — | ✅ |

Permissions are enforced **in the database via RLS** (§7), not just in the UI. The UI hides
what a user can't do; RLS guarantees they can't do it even via the API.

---

## 3. Core features

1. **Authentication** — email/password sign up + sign in via Supabase Auth. Protected routes. On first sign-up a `profiles` row is created automatically (trigger in §6).
2. **Dashboard** — role-aware landing page:
   - Intern: today's progress status, open tasks, unread messages, quick "Add today's progress".
   - Supervisor: list of their interns, who has/hasn't submitted today, pending reviews.
   - Super-supervisor: org-wide overview (counts, recent activity).
3. **Daily progress** — end-of-day entry: summary, tasks done, what they learned (JS/React/Supabase), blockers, hours. One entry per intern per day. Supervisors leave reviews/comments.
4. **Tasks** — side tasks/contributions. Assigned by supervisors, worked by interns. Statuses: `todo → in_progress → done`.
5. **Weekly report (uni)** — one per week (`week_start`). Rich text/markdown content, submit workflow.
6. **Daily diary (uni)** — free-form personal daily entry, separate from the shared progress report.
7. **Communication** — direct messages between a user and their supervisor(s)/interns. Realtime updates via Supabase channels. Unread indicator.
8. **Activity log** — append-only record of key actions (progress submitted, task status changed, report submitted, etc.), used for auditing and the "recent activity" feed.

---

## 4. Routes

```
/login                       public
/signup                      public
/                            → redirect to /dashboard
/dashboard                   role-aware home (protected)
/progress                    list + create/edit own daily progress
/progress/:id                view a single entry (+ reviews)
/tasks                       task board / list
/reports                     weekly reports (uni)
/diary                       daily diary (uni)
/messages                    conversations + thread
/team                        supervisors: their interns; super: everyone
/logs                        activity log
/settings                    profile, sign out
```

Wrap protected routes in an `<AuthGuard>` that redirects to `/login` when there's no session.

---

## 5. Folder structure

```
src/
  lib/
    supabase.js              # createClient(...)
  context/
    AuthContext.jsx          # session, profile (with role), loading
  components/
    ui/                      # Button, Card, Input, Badge, Modal...
    layout/                  # Sidebar, Topbar, AuthGuard, RoleGate
  features/
    auth/                    # LoginForm, SignupForm
    dashboard/
    progress/
    tasks/
    reports/
    diary/
    messages/
    logs/
    team/
  hooks/                     # useProgress, useTasks, useMessages, useProfiles...
  pages/                     # route components that compose features
  App.jsx
  main.jsx
```

`RoleGate` renders children only for allowed roles (UI-level convenience; RLS is the real guard).

---

## 6. Database schema (run in Supabase SQL editor)

```sql
-- ========= Enums & Extensions =========
create extension if not exists "pgcrypto";
create type user_role as enum ('intern', 'supervisor', 'super_supervisor', 'admin');

-- ========= Profiles (extends auth.users) =========
create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text not null,
  email                 text,
  role                  user_role not null default 'intern',
  status                text not null default 'active', -- 'active' | 'pending'
  supervisor_id         uuid references profiles(id),   -- who supervises this intern
  internship_start_date date,
  internship_end_date   date,
  created_at            timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'intern',
    'active'
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Guard to prevent non-admins from changing roles
create or replace function prevent_role_escalation()
returns trigger language plpgsql security definer as $$
begin
  if new.role <> old.role and (select role from public.profiles where id = auth.uid()) <> 'admin' then
    raise exception 'Only administrators can change user roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_user_role_change on public.profiles;
create trigger guard_user_role_change
  before update on public.profiles
  for each row execute function prevent_role_escalation();

-- ========= Daily progress =========
create table daily_progress (
  id          uuid primary key default gen_random_uuid(),
  intern_id   uuid not null references profiles(id) on delete cascade,
  entry_date  date not null default current_date,
  summary     text,
  tasks_done  text,
  learnings   text,                 -- JS / React / Supabase notes
  blockers    text,
  hours       numeric(4,1),
  status      text not null default 'submitted',  -- draft | submitted | reviewed
  created_at  timestamptz not null default now(),
  unique (intern_id, entry_date)
);

-- Supervisor reviews/comments on a progress entry
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  progress_id uuid not null references daily_progress(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  comment     text not null,
  created_at  timestamptz not null default now()
);

-- ========= Tasks / contributions =========
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  assigned_to uuid references profiles(id),
  assigned_by uuid references profiles(id),
  status      text not null default 'todo',   -- todo | in_progress | done
  priority    text not null default 'medium', -- low | medium | high
  due_date    date,
  created_at  timestamptz not null default now()
);

-- ========= Weekly report (uni) =========
create table weekly_reports (
  id           uuid primary key default gen_random_uuid(),
  intern_id    uuid not null references profiles(id) on delete cascade,
  week_start   date not null,          -- Monday of the week
  content      text,
  status       text not null default 'draft', -- draft | submitted
  submitted_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (intern_id, week_start)
);

-- ========= Daily diary (uni) =========
create table diary_entries (
  id         uuid primary key default gen_random_uuid(),
  intern_id  uuid not null references profiles(id) on delete cascade,
  entry_date date not null default current_date,
  content    text,
  created_at timestamptz not null default now()
);

-- ========= Entry Comments (Reports & Diary) =========
create table entry_comments (
  id          uuid primary key default gen_random_uuid(),
  entry_type  text not null check (entry_type in ('weekly_report', 'diary')),
  entry_id    uuid not null,
  author_id   uuid not null references profiles(id) on delete cascade,
  comment     text not null,
  created_at  timestamptz not null default now()
);

-- ========= Messages =========
create table messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  content      text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ========= Activity log (append-only) =========
create table activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id),
  action      text not null,        -- e.g. 'progress.submitted', 'task.status_changed'
  entity_type text,                 -- 'daily_progress' | 'task' | ...
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index on daily_progress (intern_id, entry_date desc);
create index on tasks (assigned_to, status);
create index on messages (recipient_id, read_at);
create index on activity_logs (created_at desc);
create index on entry_comments (entry_type, entry_id);
```

---

## 7. Row Level Security (RLS)

> This is the part most people get stuck on. Use the two `security definer` helper functions
> below to avoid infinite recursion in policies that query `profiles`.

```sql
-- ===== Helper functions =====
create or replace function auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

-- true if current user may view this intern's data
create or replace function can_view_intern(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    target = auth.uid()                                                        -- self
    or exists (select 1 from profiles where id = target and supervisor_id = auth.uid()) -- my intern
    or (select role from profiles where id = auth.uid()) in ('super_supervisor','admin');
$$;

-- ===== Enable RLS =====
alter table profiles        enable row level security;
alter table daily_progress  enable row level security;
alter table reviews         enable row level security;
alter table tasks           enable row level security;
alter table weekly_reports  enable row level security;
alter table diary_entries   enable row level security;
alter table entry_comments  enable row level security;
alter table messages        enable row level security;
alter table activity_logs   enable row level security;

-- ===== profiles =====
-- Any authenticated user can read profiles (needed for names/messaging).
create policy "read profiles" on profiles
  for select to authenticated using (true);
-- You may only edit your own profile (admins can edit anyone).
create policy "update own profile" on profiles
  for update to authenticated
  using (id = auth.uid() or auth_role() = 'admin')
  with check (id = auth.uid() or auth_role() = 'admin');

-- ===== daily_progress =====
create policy "view progress" on daily_progress
  for select to authenticated using (can_view_intern(intern_id));
create policy "intern writes own progress" on daily_progress
  for insert to authenticated with check (intern_id = auth.uid());
create policy "intern edits own progress" on daily_progress
  for update to authenticated using (intern_id = auth.uid()) with check (intern_id = auth.uid());
create policy "intern deletes own progress" on daily_progress
  for delete to authenticated using (intern_id = auth.uid());

-- ===== reviews (supervisors comment) =====
create policy "view reviews" on reviews
  for select to authenticated using (
    exists (select 1 from daily_progress p where p.id = progress_id and can_view_intern(p.intern_id))
  );
create policy "supervisors add reviews" on reviews
  for insert to authenticated with check (
    reviewer_id = auth.uid()
    and auth_role() in ('supervisor','super_supervisor','admin')
  );

-- ===== tasks =====
create policy "view tasks" on tasks
  for select to authenticated using (
    assigned_to = auth.uid()
    or assigned_by = auth.uid()
    or (assigned_to is not null and can_view_intern(assigned_to))
    or auth_role() in ('super_supervisor','admin')
  );
create policy "supervisors create tasks" on tasks
  for insert to authenticated with check (
    assigned_by = auth.uid()
    and auth_role() in ('supervisor','super_supervisor','admin')
  );
create policy "update tasks" on tasks
  for update to authenticated using (
    assigned_to = auth.uid()      -- assignee can move status
    or assigned_by = auth.uid()   -- assigner can edit
    or auth_role() in ('super_supervisor','admin')
  );
create policy "delete tasks" on tasks
  for delete to authenticated using (
    assigned_by = auth.uid()
    or auth_role() in ('super_supervisor','admin')
  );

-- ===== weekly_reports & diary_entries =====
create policy "view weekly" on weekly_reports
  for select to authenticated using (can_view_intern(intern_id));
create policy "intern writes weekly" on weekly_reports
  for all to authenticated using (intern_id = auth.uid()) with check (intern_id = auth.uid());

create policy "view diary" on diary_entries
  for select to authenticated using (can_view_intern(intern_id));
create policy "intern writes diary" on diary_entries
  for all to authenticated using (intern_id = auth.uid()) with check (intern_id = auth.uid());

-- ===== entry_comments =====
create policy "view entry comments" on entry_comments
  for select to authenticated using (
    exists (
      select 1 from weekly_reports wr where wr.id = entry_id and can_view_intern(wr.intern_id)
    ) or exists (
      select 1 from diary_entries de where de.id = entry_id and can_view_intern(de.intern_id)
    )
  );
create policy "add entry comments" on entry_comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and auth_role() in ('supervisor', 'super_supervisor', 'admin')
  );

-- ===== messages =====
create policy "view own messages" on messages
  for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "send messages" on messages
  for insert to authenticated with check (sender_id = auth.uid());
create policy "mark read" on messages
  for update to authenticated using (recipient_id = auth.uid());

-- ===== activity_logs =====
create policy "view logs" on activity_logs
  for select to authenticated using (
    actor_id = auth.uid()
    or (actor_id is not null and can_view_intern(actor_id))
    or auth_role() in ('super_supervisor','admin')
  );
create policy "write own logs" on activity_logs
  for insert to authenticated with check (actor_id = auth.uid());

-- ===== RPC Functions (Stored Procedures) =====
create or replace function set_internship_dates(
  target_intern uuid,
  start_date date,
  end_date date
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (
    auth_role() in ('super_supervisor', 'admin')
    or exists (select 1 from profiles where id = target_intern and supervisor_id = auth.uid())
  ) then
    raise exception 'Unauthorized to set internship dates for this intern';
  end if;

  update profiles
  set internship_start_date = start_date,
      internship_end_date = end_date
  where id = target_intern;
end;
$$;

create or replace function edit_weekly_report(
  report_id uuid,
  new_content text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_intern_id uuid;
begin
  select intern_id into v_intern_id from weekly_reports where id = report_id;
  if v_intern_id is null then
    raise exception 'Weekly report not found';
  end if;

  if not (
    auth_role() in ('super_supervisor', 'admin')
    or exists (select 1 from profiles where id = v_intern_id and supervisor_id = auth.uid())
  ) then
    raise exception 'Unauthorized to edit this report';
  end if;

  update weekly_reports
  set content = new_content
  where id = report_id;
end;
$$;

create or replace function edit_diary_entry(
  entry_id uuid,
  new_content text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_intern_id uuid;
begin
  select intern_id into v_intern_id from diary_entries where id = entry_id;
  if v_intern_id is null then
    raise exception 'Diary entry not found';
  end if;

  if not (
    auth_role() in ('super_supervisor', 'admin')
    or exists (select 1 from profiles where id = v_intern_id and supervisor_id = auth.uid())
  ) then
    raise exception 'Unauthorized to edit this diary entry';
  end if;

  update diary_entries
  set content = new_content
  where id = entry_id;
end;
$$;

-- Enable Realtime publication
alter publication supabase_realtime add table messages;
```

> **Note on `weekly_reports`/`diary_entries`:** the `for all` intern-write policy plus the
> broader `select` policy overlap on SELECT; that's fine because Postgres RLS is permissive
> (a row is visible if *any* SELECT policy allows it).

**Realtime:** in the Supabase dashboard, enable Realtime on the `messages` table so the
messages UI can subscribe to new rows.

---

## 8. Build phases (do these in order)

Each phase should end with something runnable and testable.

- **Phase 1 — Scaffold.** Vite + React + Tailwind + router. `src/lib/supabase.js`. `.env.example`. Empty routed pages + sidebar layout. App runs.
- **Phase 2 — Auth.** Run the §6 SQL. Sign up / sign in / sign out. `AuthContext` exposes `session` + `profile` (with role). `AuthGuard` protects routes.
- **Phase 3 — Daily progress.** List own entries; create/edit today's entry (one per day). Detail page. Run + test §7 RLS.
- **Phase 4 — Role-aware dashboard.** Intern vs supervisor vs super-supervisor views. Supervisor sees their interns and who submitted today.
- **Phase 5 — Tasks.** Board/list. Supervisors assign; interns move `todo → in_progress → done`.
- **Phase 6 — Reviews.** Supervisors comment on a progress entry; comments shown on the detail page; entry can be marked `reviewed`.
- **Phase 7 — Weekly reports + diary.** CRUD for both, per-week / per-day uniqueness.
- **Phase 8 — Messages.** Conversation list + thread, send message, realtime subscription, unread badge.
- **Phase 9 — Activity log.** Write log rows on key actions; `/logs` feed + "recent activity" on the dashboard.
- **Phase 10 — Polish.** Empty states, loading skeletons, form validation, error toasts, responsive layout.

---

## 9. Setup steps

```bash
npm create vite@latest internship-tracker -- --template react
cd internship-tracker
npm install @supabase/supabase-js react-router-dom lucide-react date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# configure tailwind content globs + import directives in src/index.css
```

`.env`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Seeding roles for testing:** sign up 3–4 users, then in the SQL editor set roles and link interns to a supervisor, e.g.:
```sql
update profiles set role = 'supervisor'       where email = 'sup@example.com';
update profiles set role = 'super_supervisor' where email = 'boss@example.com';
update profiles set role = 'intern', supervisor_id =
  (select id from profiles where email = 'sup@example.com')
  where email = 'intern@example.com';
```

---

## 10. Conventions for the agent

- Function components + hooks only. Data access lives in `src/hooks/*`, not inside components.
- Never trust the client for authorization — RLS is the source of truth. UI gating is UX only.
- Keep components small; one feature per folder under `src/features`.
- Handle three states everywhere: loading, empty, error.
- No secrets in code. No service-role key in the frontend — only the anon key.
- Prefer clear names over cleverness (this is a learning project).

---

## 11. Stretch ideas (later)

- Export weekly report / diary to PDF for uni submission.
- Email/notification when a supervisor leaves a review.
- Calendar/streak view of submitted days.
- Charts: hours per week, tasks completed over time, learning topics.
- Admin panel to manage users and roles from the UI.
```
