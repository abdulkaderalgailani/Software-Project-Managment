# Reset Tracker (Internship Tracker)

A comprehensive web application for interns, supervisors, and administrators to
track daily progress, manage tasks, submit weekly reports, log diary entries, and
communicate in real time — with access controlled at the database level.

> **About this project:** Reset Tracker was originally built during an internship
> at Reset HR Consulting. For **SEN4100 — Software Project Management**, our team has
> adopted, extended, and collaboratively managed it, applying project-management
> practices (WBS, scheduling, risk and configuration management) across the project
> lifecycle.

## Live URL
[software-project-managment.vercel.app](https://software-project-managment.vercel.app/)

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, react-router-dom v6
- **Backend & Database**: Supabase (PostgreSQL, Auth, Row Level Security, Realtime)
- **Icons & Utils**: lucide-react, date-fns, @dnd-kit (drag-and-drop)
- **Hosting**: Vercel  ·  **Version control**: Git / GitHub

## Key Features
- **Role-Based Access Control**: Interns, Supervisors, Super Supervisors, and Admins.
- **Admin Approval**: New signups require admin approval before full access.
- **Role-Aware Dashboards**: Tailored views and summaries depending on user role.
- **Daily Progress**: Log daily activities and blockers.
- **Task Management (Kanban)**: Assign tasks, drag-and-drop status updates, priority
  pills, and due-date urgency color-coding.
- **Weekly Reports & Diary**: Interns submit weekly summaries and personal diaries.
- **Reviews & Comments**: Supervisors and admins can edit and comment on submissions.
- **Realtime Messaging**: Instant communication via Supabase Realtime.
- **Activity Log**: App-wide tracking of user actions and changes.
- **Team Directory**: View team members, roles, and supervisor assignments.
- **Internship Tracking**: Track start and end dates with urgency indicators.

## Security Model
Access is enforced by **PostgreSQL Row Level Security (RLS)** in Supabase — not just
hidden in the UI. Each role can only read and modify the data it is permitted to, even
at the API level. Only the **anon** (public) key is used in the frontend; the
service-role key is never exposed. A database trigger prevents users from escalating
their own role or approval status.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase project

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdulkaderalgailani/Software-Project-Managment.git
   cd Software-Project-Managment
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory with your Supabase keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   > `.env` is gitignored — never commit it. Each contributor sets their own.
   > Never put the service-role key in the frontend.

4. **Set up the database:**
   In the Supabase SQL Editor, run the project setup script to create the schema,
   RLS policies, functions, and triggers, then seed the user accounts.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Deployment
Configured for deployment on Vercel:
1. Connect your repository to Vercel.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel dashboard
   (Project → Settings → Environment Variables), then **redeploy** so the build picks
   them up (Vite reads env vars at build time).
3. A `vercel.json` SPA rewrite is included so client-side routes work on refresh.
4. In Supabase → Auth → URL Configuration, set the Site URL to the deployed domain.

## Contributing (Team Workflow)
1. `main` stays stable and deployable.
2. Each feature or fix gets its own branch: `feature/<name>` or `fix/<name>`.
3. Open a pull request and have a teammate review before merging.
4. Write clear, descriptive commit messages.

## Team
Team project for **SEN4100 — Software Project Management**, [University / term].
- [Member 1 :Abdulkader ALGAILANI]
- [Member 2 :Cheıck Ould NEMA]
- [Member 3 :Mohammed Amıne SAKRI]

## License
For academic use as part of SEN4100 coursework.
