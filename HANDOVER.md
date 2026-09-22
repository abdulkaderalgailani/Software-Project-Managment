# Project Handover

## Current Status
**Shipped and Complete.** The MVP feature set for Reset Tracker is fully implemented and deployed. The foundational architecture (Vite + React + Supabase) is stable, and all core user workflows are functional, including role-based access, task Kanban boards with drag-and-drop, daily progress logging, and real-time messaging.

## Known Limitations & Deferred Items
- **Guest Mode**: Initially scoped in some UI logic but currently parked/deprioritized.
- **Forgot Password**: The standard password reset flow has not been built out in the UI. Users must currently rely on Admins if a hard reset is needed, or the generic Supabase backend defaults.
- **Supabase Region**: The database is currently hosted in the Tokyo region, which may introduce minor latency for users in other global regions.
- **Email/Push Notifications**: Currently missing; users only see updates when actively checking the dashboard or activity logs.

## Prioritized Next Steps
If you are picking up this project, here is the recommended priority list:
1. **Implement Forgot Password**: Build the UI and connect it to Supabase's `resetPasswordForEmail` API so users can self-serve password recovery.
2. **Notification System**: Integrate Supabase Webhooks or Edge Functions (e.g., via Resend) to email users when they are assigned a task or receive a new comment on their report.
3. **Data Export**: Add a feature for Admins to export activity logs and reports as CSV/PDF for compliance and review.
4. **Pagination**: Implement cursor-based pagination for Activity Logs and Messages to optimize performance as the dataset grows exceptionally large.
5. **Mobile Polish**: While the app is fundamentally responsive, the Kanban drag-and-drop and complex tables could benefit from mobile-specific UX optimizations.
