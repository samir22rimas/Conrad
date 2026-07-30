# Conrad - AI Socratic Programming Tutor

Learn by Building. Think Before Asking.

## Architecture

Monorepo with Turborepo:
- `apps/frontend` - Next.js 15 application
- `apps/backend` - Express API server

## Quick Start

1. Install dependencies:
```bash
corepack enable
pnpm install --frozen-lockfile
```

2. Set up environment variables in both apps (see .env.example files)

3. Run database migrations:
```bash
pnpm db:migrate
```

4. Start development:
```bash
pnpm dev
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - Secret for JWT signing
- `GROQ_API_KEY` - Groq API key
- `PORT` - Server port (default: 4000)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## Deployment

- Frontend: Vercel
- Backend: Railway / Render
- Database: Supabase PostgreSQL
