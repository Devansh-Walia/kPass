# kPass — Project Conventions

## Overview
Centralized portal for Koshish Family org. Single login, role-based app access.

## Tech Stack
- **Frontend:** React (Vite) + React Router + TailwindCSS + TypeScript
- **Backend:** Express.js + TypeScript + Prisma ORM
- **Database:** PostgreSQL
- **Testing:** Vitest + Supertest (backend), Vitest + React Testing Library (frontend)
- **Auth:** JWT access tokens (15min) + httpOnly refresh cookies (7d)

## Project Structure
```
kPass/
├── client/          — React frontend
├── server/          — Express backend
│   └── prisma/      — schema, migrations, seed
├── docs/plans/      — design & implementation docs
└── CLAUDE.md        — this file
```

## Conventions

### Backend
- All routes in `server/src/routes/` — one file per resource
- Business logic in `server/src/services/` — routes call services, services call Prisma
- Middleware in `server/src/middleware/` — auth, admin, appAccess
- All API responses follow: `{ data: T }` for success, `{ error: string }` for errors
- Use `express-async-errors` to avoid try/catch in every route
- HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
- Validate request bodies with Zod schemas in `server/src/validators/`

### Frontend
- Pages in `client/src/pages/` — lazy-loaded per app module
- Shared components in `client/src/components/common/`
- API calls through `client/src/api/client.ts` axios instance (has auth interceptor)
- Auth state in `AuthContext` — never store tokens in localStorage
- Route guards: `AuthGuard` (must be logged in), `AdminGuard` (must be admin)

### Testing
- Backend tests: colocated as `*.test.ts` next to source files
- Frontend tests: colocated as `*.test.tsx` next to components
- Test database: use Prisma with a test database URL from `.env.test`
- Mock Prisma client in unit tests, use real DB for integration tests

### Git
- Commit often, after each logical unit of work
- Conventional commits: `feat:`, `fix:`, `test:`, `chore:`, `refactor:`
- Default admin email: admin@koshishFamily.org
