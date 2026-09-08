# Reset HR Consulting - Internship Tracker

The Reset HR Internship Tracker is a comprehensive platform designed to streamline the internship experience. It provides a centralized hub for interns to log their daily progress, track tasks, write weekly reports, and maintain a personal diary. Concurrently, it empowers supervisors and administrators to monitor progress, assign tasks, provide feedback, and oversee the entire internship program across the organization.

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (with custom brand tokens and dark mode support)
- **Routing**: React Router v6 (`react-router-dom`)
- **Backend & Database**: Supabase (PostgreSQL, Authentication, Realtime Subscriptions)
- **Icons**: Lucide React
- **Date Utility**: date-fns

## Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites

- Node.js (v18 or higher recommended)
- A Supabase account and project

### 2. Installation

Clone the repository and install the dependencies:

```bash
# Install dependencies
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory and add your Supabase project credentials. You can use `.env.example` as a reference if available.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*Note: Never expose the Supabase service-role key in the frontend code. Authorization is handled securely via Row Level Security (RLS) in the Supabase database.*

### 4. Database Setup

Before running the application, ensure that you have executed the required SQL schemas and RLS policies in your Supabase SQL Editor. The schema definitions can be found in `internship-tracker-spec.md` (Sections 6 and 7).

### 5. Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application will typically be available at `http://localhost:5173`.

## Scripts

- `npm run dev`: Starts the local development server with hot-module replacement (HMR).
- `npm run build`: Compiles the application for production and outputs the optimized bundle to the `dist` directory.
- `npm run preview`: Serves the production build locally for testing before deployment.
- `npm run lint`: Runs ESLint to catch syntax and styling issues.
