# SnapHire Frontend

## Getting Started

Copy `.env.example` to `.env.local` and fill in the required values.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by `app/lib/supabase.ts`
- `NEXT_PUBLIC_API_URL` is used by `app/lib/api.ts` and should point to the backend host, for example `http://localhost:8000`
- The shared API helper adds the `/api` prefix automatically

## Project Structure

- `app/` - Next.js app router pages and components
- `app/lib/` - API and session helpers
- `public/` - Static assets

## Build

```bash
npm run build
```

## Tech Stack

- **Next.js** - React framework
- **TypeScript** - Type safety
- **Supabase** - Authentication and data access
- **Tailwind CSS** - Styling

