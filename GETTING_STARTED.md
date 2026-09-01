# Getting Started — Internship Tracker (zero → running)

Follow this top to bottom. It takes you from nothing to a running app.
You'll set up Supabase (your database + auth), then let the Antigravity agent build the
frontend phase by phase.

**End result:** a React app where interns log daily progress, tasks, weekly reports and a
diary, message their supervisors, and everything is protected by role-based database rules.

> Files in your workspace: this file, `AGENTS.md` (agent rulebook), and
> `internship-tracker-spec.md` (full reference). Keep all three in the project root.

---

## 0. Prerequisites

- **Node.js 18+** installed (`node -v` to check). Get it from nodejs.org if missing.
- A **Supabase** account (free) — supabase.com.
- **Antigravity IDE** installed, signed in, with a **Gemini Pro** model available.
- (Optional) A **GitHub** account if you want to push the repo.

---

## 1. Create the Supabase project

1. Go to supabase.com → **New project**.
2. Name it (e.g. `internship-tracker`), set a **database password** (save it somewhere safe).
3. **Region:** pick the one closest to you. If you're in/near Istanbul, choose
   **Frankfurt (eu-central-1)** — a far region (e.g. Tokyo) makes every request slower.
   > Pick the region now. Changing it later means recreating the project, so get it right
   > while the database is still empty.
4. Wait ~1–2 minutes for it to provision. Status should read **Healthy**.

---

## 2. Create the tables (run this SQL)

Open **SQL Editor** (left sidebar) → **New query**. Paste the block below and click **Run**.
This creates every table and the auto-profile trigger.

```sql
-- ========= Enums =========
create type user_role as enum ('intern', 'supervisor', 'super_supervisor', 'admin');

-- ========= Profiles (extends auth.users) =========
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text,
  role          user_role not null default 'intern',
  supervisor_id uuid references profiles(id),
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ========= Daily progress =========
create table daily_progress (
  id          uuid primary key default gen_random_uuid(),
  intern_id   uuid not null references profiles(id) on delete cascade,
  entry_date  date not null default current_date,
  summary     text,
  tasks_done  text,
  learnings   text,
  blockers    text,
  hours       numeric(4,1),
  status      text not null default 'submitted',
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
  status      text not null default 'todo',
  priority    text not null default 'medium',
  due_date    date,
  created_at  timestamptz not null default now()
);

-- ========= Weekly report (uni) =========
create table weekly_reports (
  id           uuid primary key default gen_random_uuid(),
  intern_id    uuid not null references profiles(id) on delete cascade,
  week_start   date not null,
  content      text,
  status       text not null default 'draft',
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
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index on daily_progress (intern_id, entry_date desc);
create index on tasks (assigned_to, status);
create index on messages (recipient_id, read_at);
create index on activity_logs (created_at desc);
```

---

## 3. Turn on security (run this SQL)

New query again. Paste and **Run**. This enables Row Level Security so each role only sees
what it should. **The app is not safe without this step.**

```sql
-- ===== Helper functions =====
create or replace function auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function can_view_intern(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    target = auth.uid()
    or exists (select 1 from profiles where id = target and supervisor_id = auth.uid())
    or (select role from profiles where id = auth.uid()) in ('super_supervisor','admin');
$$;

-- ===== Enable RLS =====
alter table profiles        enable row level security;
alter table daily_progress  enable row level security;
alter table reviews         enable row level security;
alter table tasks           enable row level security;
alter table weekly_reports  enable row level security;
alter table diary_entries   enable row level security;
alter table messages        enable row level security;
alter table activity_logs   enable row level security;

-- ===== profiles =====
create policy "read profiles" on profiles
  for select to authenticated using (true);
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

-- ===== reviews =====
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
    assigned_to = auth.uid()
    or assigned_by = auth.uid()
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
```

Check **Table Editor** — you should now see all the tables. **Last migration** on the
project home will no longer say "No migrations."

---

## 4. Copy your API keys

Go to **Project Settings → API** and copy two values:

- **Project URL**
- **anon / public** key

> The Project URL and the anon key are meant to be public — RLS is what protects your data.
> **Never** put the `service_role` key in your app.

Keep these for step 7.

---

## 5. Set up the Antigravity workspace

1. Open **Agent Manager** (toggle Editor ↔ Agent Manager with Ctrl/Cmd+E).
2. **Open Workspace → Open New Workspace** → your project folder.
3. Make sure `AGENTS.md`, `internship-tracker-spec.md`, and this file are in the root.
4. In the Agent box, open the model dropdown and select the **Gemini Pro** model
   (not Flash — Flash cuts corners on schema/RLS work). Dismiss any "switch to Flash" popup.
5. In plugins/settings: **Modern Web Guidance** on; **Firebase off** (you use Supabase).

---

## 6. Build phase by phase

Send **one phase per prompt**. Review the plan, approve, test, then do the next.
Start each prompt by pulling in the files with `@`.

**Phase 1 — Scaffold**
> `@AGENTS.md @internship-tracker-spec.md` Read both, then do **Phase 1 only**: scaffold
> Vite + React + Tailwind + router + the supabase client + a sidebar layout with empty routed
> pages. Apply the brand tokens from spec §1a. Show a plan first, and stop when it runs.

Then continue, one at a time:

- **Phase 2** — Auth (sign up / in / out, AuthContext with role, AuthGuard)
- **Phase 3** — Daily progress (CRUD, one per day)
- **Phase 4** — Role-aware dashboard
- **Phase 5** — Tasks (assign + status board)
- **Phase 6** — Reviews (supervisor comments)
- **Phase 7** — Weekly reports + diary
- **Phase 8** — Messages (enable Realtime on the `messages` table first, see §9)
- **Phase 9** — Activity log
- **Phase 10** — Polish (empty/loading/error states, validation, responsive)

Watch the Agent panel: a **blue dot** = a step finished; a **bell** = it needs your approval —
click it and choose **Run**.

Learning tip: after each phase, ask *"explain what you just built and why."*

---

## 7. Add your keys and run

After Phase 1, there's a `.env` file in the project root (the agent creates it, or make it
yourself). Fill in the two values from step 4:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then, in the Antigravity terminal:

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

---

## 8. Test checkpoints

- **After Phase 2:** sign up a user in the app, then in Supabase check
  **Authentication → Users** (new user) and **Table Editor → profiles** (an auto-created row).
- **Set roles for testing** (SQL Editor):
  ```sql
  update profiles set role = 'supervisor'       where email = 'sup@example.com';
  update profiles set role = 'super_supervisor' where email = 'boss@example.com';
  update profiles set role = 'intern', supervisor_id =
    (select id from profiles where email = 'sup@example.com')
    where email = 'intern@example.com';
  ```
- **After each later phase:** create a record, refresh, and confirm it appears in the app and
  in the matching Supabase table.

---

## 9. Before Phase 8 (messages) — enable Realtime

In Supabase: **Table Editor → `messages`** → enable **Realtime** for that table. This lets new
messages appear live without refreshing.

---

## 10. Troubleshooting

- **"relation ... does not exist" / auth fails at Phase 2** → you skipped step 2/3. Run the SQL.
- **Rows won't save, or you see nothing after inserting** → RLS is on but a policy is blocking;
  confirm you're signed in and that step 3 ran fully.
- **App loads but data calls fail** → check `.env` values and restart `npm run dev` (Vite only
  reads `.env` at startup).
- **Everything feels slow** → likely a far Supabase region; see step 1.
- **Agent drifts toward Firebase** → reply "Supabase only, per AGENTS.md."
- **Secrets:** if you ever pasted the `service_role` key into the app, rotate it in
  **Settings → API** and remove it. Only the anon key belongs in the frontend.

---

## 11. (Optional) Push to GitHub

```bash
git init
git add .
git commit -m "Internship tracker: initial build"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Make sure `.env` is listed in `.gitignore` before you push (commit `.env.example` instead).
