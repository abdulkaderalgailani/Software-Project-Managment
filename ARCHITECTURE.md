# Architecture Overview

## Folder Structure
```text
/src
  /components
    /layout       # Shared layout components (Sidebar, Topbar, Layout wrapper, AuthGuard)
    /ui           # Reusable UI components (Modal, InternProgress, EntryComments, etc.)
  /context        # React Contexts (AuthContext, ThemeContext)
  /features       # Feature-specific components (auth forms, role-aware dashboards)
  /hooks          # Custom React hooks containing Supabase data fetching and mutation logic
  /lib            # Utility functions (supabase client, dateUtils, cn)
  /pages          # Top-level page components (routed views)
```

## Contexts
- **AuthContext**: Manages the global authentication state. Fetches the current session, queries the `users` table to determine the user's role and status, and provides global context (e.g., `user`, `profile`, `isAdmin`, `isSupervisor`).
- **ThemeContext**: Handles light/dark mode toggling, persisting preferences in `localStorage`, and applying the `dark` class to the HTML root.

## Data Layer & Supabase Hooks
All database interactions are abstracted into custom hooks inside `src/hooks/` (e.g., `useTasks`, `useDiary`, `useReports`). 
Components never execute raw Supabase queries directly. Instead, they consume hooks that return states (`data`, `loading`, `error`) and mutation functions.

## Routing Map (`App.jsx`)
- `/login`, `/signup` (Public authentication pages)
- Protected routes wrapped by `<AuthGuard>` and `<Layout>`:
  - `/dashboard` (Role-aware dashboard)
  - `/progress`, `/progress/:id` (Daily progress tracking)
  - `/tasks` (Kanban task board)
  - `/reports` (Weekly reports)
  - `/diary` (Personal diary)
  - `/messages` (Realtime chat)
  - `/team` (Team directory and supervisor assignments)
  - `/logs` (App-wide activity logs)
  - `/settings` (User settings)

## Security & Row Level Security (RLS)
The database heavily relies on PostgreSQL Row Level Security (RLS) policies to enforce access control at the database level.
- **Roles**: Intern, Supervisor, Super Supervisor, Admin.
- **can_view_intern(intern_id, viewer_id)**: A database function that verifies if a viewer has permissions to access a specific intern's data (Admins see all; Supervisors see their assigned interns).
- **Escalation Guard**: A Postgres trigger prevents standard users from elevating their own roles to admin.
- **Security Definer RPCs**: Certain operations that require bypassing standard RLS or strict logic (e.g., `update_intern_dates`, `edit_weekly_report`, `edit_diary_entry`) are executed via stored procedures (`SECURITY DEFINER`) to strictly control how data is mutated.

## Styling & Token Conventions
- **Tailwind CSS** is used for all styling.
- **Brand Identity**: The primary brand color is Orange (`#F26722`, `var(--brand)`), used sparingly for primary buttons, active links, and focus rings.
- **Custom Tokens**: Defined in `tailwind.config.js` and `index.css` (e.g., `brand`, `surface`, `danger`, `success`, `muted`).
- **Dark Mode**: Configured via the `dark:` variant and native CSS variable swapping in `index.css`.
