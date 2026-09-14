# LyftAdmin

LyftAdmin is a React and Vite operations console for managing users, drivers, verification, trips, safety alerts, payments, hubs, reporting, and administrator access.

## Features

- Clerk authentication with Clerk-managed MFA support
- Supabase-backed driver, hub, and admin profile data
- Operations dashboard with KPIs, alerts, priority queue, and audit activity
- User and driver search, filtering, suspension, archiving, restoration, and review
- Super-admin protected permanent deletion actions
- Admin account role management with archive and restore workflows
- Automatic sign-out after 30 minutes of inactivity
- Driver document expiry detection and go-live protection
- Background-check status display for webhook-updated driver fields
- Reporting trends for trips and verification decisions
- CSV exports for users, verifications, payouts, and trips
- Phone and device identifier ban management in the Users workflow

## Tech stack

- React 18
- Vite
- React Router
- Clerk React
- Supabase JavaScript client
- React Leaflet and Leaflet
- Lucide React icons

## Requirements

- Node.js 18 or newer
- A Clerk application
- A Supabase project with the required tables and policies

## Getting started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
VITE_CLERK_FRONTEND_API=your-clerk-frontend-api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
```

`VITE_SUPABASE_ANON_KEY` can be used instead of `VITE_SUPABASE_PUBLISHABLE_KEY` for projects using the legacy Supabase naming.

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Production build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project structure

```text
src/
  components/   Shared layout and UI primitives
  context/      Shared application data and admin actions
  data/         Development seed data
  lib/          Supabase client configuration
  pages/        Dashboard and feature pages
  App.jsx       Routes and authentication guard
  main.jsx      React, Clerk, and data-provider bootstrap
```

## Authentication and authorization

Clerk handles authentication and the sign-in interface. Enable MFA in the Clerk Dashboard to require a second factor for administrators; the Clerk `SignIn` component will display the MFA challenge automatically.

The Supabase `admin` table links a Clerk account to an application role using `clerk_id`. A signed-in admin record should contain at least:

- `clerk_id`
- `email`
- `full_name`
- `role`
- `created_at`
- `last_login_at`

The application currently loads the signed-in admin profile from Supabase and uses the stored role for admin actions. Keep RLS enabled and use a server-side Edge Function or backend API for privileged writes in production. Do not expose Supabase service-role keys in the frontend.

## Data and security notes

Some workflows currently use local state or browser storage while backend persistence is being completed, including identifier bans and several simulated audit or notification actions. These should be moved to protected Supabase tables or server-side functions before production launch.

Recommended production checks:

1. Configure RLS policies for every table.
2. Move privileged admin creation and moderation writes behind a server-side function.
3. Configure Clerk MFA for all administrator accounts.
4. Connect the background-check provider webhook to update driver status fields.
5. Add real signup timestamps and driver area fields for complete reporting trends.
6. Test archive, restore, deletion, timeout, and role restrictions with non-super-admin accounts.

## Development notes

The project includes development seed data in `src/data/mockData.js`. Supabase drivers and hubs are loaded at runtime, while other feature data still includes simulated development records. Never use real customer data with the seed-data workflow.

## License

This repository is currently private and does not declare a public license.
