# Reset Tracker (Internship Tracker)

A comprehensive web application for interns, supervisors, and administrators to track daily progress, manage tasks, submit weekly reports, log diary entries, and facilitate clear communication.

## Live URL
[ai-coded-tracker.vercel.app](https://ai-coded-tracker.vercel.app/)

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, react-router-dom v6
- **Backend & Database**: Supabase (PostgreSQL, Auth, RLS, Realtime)
- **Icons & Utils**: lucide-react, date-fns, @dnd-kit (for drag-and-drop)

## Key Features
- **Role-Based Access Control**: Interns, Supervisors, Super Supervisors, and Admins.
- **Admin Approval**: New signups require admin approval before full access.
- **Role-Aware Dashboards**: Tailored views and summaries depending on user role.
- **Daily Progress**: Log daily activities and blockers.
- **Task Management (Kanban)**: Assign tasks, drag-and-drop status updates, priority pills, and due-date urgency color-coding.
- **Weekly Reports & Diary**: Interns submit weekly summaries and personal diaries.
- **Reviews & Comments**: Supervisors and admins can edit and comment on intern submissions.
- **Realtime Messaging**: Chat channels for instant communication via Supabase.
- **Activity Log**: App-wide tracking of user actions and changes.
- **Team Directory**: View team members, roles, and supervisor assignments.
- **Internship Tracking**: Track start and end dates with urgency indicators.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd AI-Internship-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add the following keys from your Supabase project:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *(Note: Never commit the service-role key to the frontend).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## Deployment
This project is configured for seamless deployment on Vercel:
1. Connect your repository to Vercel.
2. Set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in the Vercel dashboard.
3. Deploy! (Vercel automatically detects the Vite build commands).
