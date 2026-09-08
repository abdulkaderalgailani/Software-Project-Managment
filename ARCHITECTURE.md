# System Architecture

The Reset HR Internship Tracker is built with a clear separation of concerns, ensuring maintainability, scalability, and strict alignment with the design specifications.

## Folder Structure

The `src/` directory is logically organized by feature and function:

```
src/
├── components/       # Reusable, stateless UI components
│   ├── layout/       # Structural components (Sidebar, Layout wrapper)
│   └── ui/           # Generic interface elements (Modal, ThemeToggle)
├── context/          # Global state contexts (AuthContext, ThemeContext)
├── features/         # Feature-specific domains
│   ├── auth/         # Login, Signup, AuthGuard wrappers
│   └── dashboard/    # Role-specific dashboard views (Admin, Supervisor, Intern)
├── hooks/            # Custom React hooks containing Supabase logic (Data fetching, Realtime)
├── lib/              # Third-party library initializations (supabase.js)
├── pages/            # Top-level route components representing full screens
├── index.css         # Global stylesheet containing Tailwind base layers and design tokens
└── main.jsx          # Application entry point
```

## State Management & Data Flow

- **Authentication State**: Managed globally via `AuthContext.jsx`. It listens to Supabase auth state changes and exposes the current user, their profile, and their specific role (`intern`, `supervisor`, `super_supervisor`, `admin`).
- **Theme State**: Managed globally via `ThemeContext.jsx`. It toggles the `.dark` class on the document root and persists the user's preference to `localStorage`.
- **Data Fetching (Hooks)**: Data fetching logic is completely decoupled from UI components. Custom hooks in `src/hooks/` (e.g., `useProgress.js`, `useDashboard.js`, `useTasks.js`) interact directly with the Supabase client (`lib/supabase.js`). This guarantees that components remain focused on presentation and rely entirely on these hooks for asynchronous state (loading, data, error).
- **Realtime Updates**: Specific hooks (like `useMessages.js`) utilize Supabase's Realtime capabilities via `supabase.channel()` to subscribe to database inserts for instant UI updates.

## Routing

The application uses `react-router-dom` v6 for client-side routing. Navigation is primarily role-gated using the `<AuthGuard>` wrapper.

### Core Routes:
- `/` - Redirects to `/dashboard`
- `/login`, `/signup` - Unauthenticated authentication flows.
- `/dashboard` - Resolves to the role-specific dashboard (`AdminDashboard`, `SupervisorDashboard`, or `InternDashboard`).
- `/progress` - The Daily Progress entry list and form.
- `/progress/:id` - Detailed view of a specific progress entry, housing the Supervisor Reviews section.
- `/tasks` - Kanban-style task management (To Do, In Progress, Done).
- `/reports` - Weekly reports submission and review.
- `/diary` - Personal, private diary entries.
- `/messages` - Realtime chat interface.
- `/team` - Member directory (filtered by role constraints).
- `/logs` - Global activity feed.
- `/settings` - User settings and preferences.

## Styling Convention

The application uses **Tailwind CSS** strictly adhering to the Reset HR brand guidelines defined in `DESIGN.md`.

- **Semantic Tokens**: `index.css` defines root CSS variables for light and dark modes (e.g., `--brand`, `--navy`, `--surface`, `--text-muted`). 
- **Tailwind Config**: These custom variables are meticulously mapped into `tailwind.config.js` to create functional Tailwind utility classes (e.g., `bg-surface`, `text-on-navy-muted`).
- **Dark Mode Strategy**: We utilize the `class` dark mode strategy in Tailwind. All custom color variables explicitly flip values when the `.dark` class is applied to the root element. We strictly avoid hardcoding generic colors (like `bg-white` or `text-black`), relying entirely on our semantic tokens (e.g., `bg-surface text-text`) except where explicit overrides are necessary (like the global input dark mode fix).
- **Global Input Overrides**: To prevent invisible text bugs in inputs and textareas, a global script actively enforces explicit light/dark background and text classes (`bg-white dark:bg-[#111C40] text-slate-900 dark:text-white`) on all `<input>` and `<textarea>` elements across the `.jsx` files.
