# kPass — Koshish Family Organization Portal

## Overview

A centralized portal for the Koshish Family organization (~20-100 people). Single login gives users access to assigned apps. Admins manage users, app assignments, and org data from one place.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React (Vite) + React Router + TailwindCSS |
| Backend | Express.js + TypeScript |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| Database | PostgreSQL (Railway) |
| Deploy | Vercel (frontend) + Railway (backend + DB) |

## V1 Scope

- **Portal Dashboard** — login, app launcher, profile management
- **Admin Panel** — user CRUD, app management, app assignment
- **Finance Dashboard** — transactions, categories, reports
- **CRM** — contacts, deal pipeline, activity log

## Data Model

### Core Tables

**Organization**
- id (uuid), name, slug, createdAt

**User**
- id (uuid), email, passwordHash, firstName, lastName, role (ADMIN|MEMBER), orgId (fk), isActive, createdAt, updatedAt

**App**
- id (uuid), name, slug, description, icon, type (FINANCE|CRM|MARKETING|IDEATION|CUSTOM), route, isActive, createdAt

**UserApp** (junction)
- userId (fk), appId (fk), assignedAt, assignedBy (fk)

### Finance Tables

**Transaction**
- id, amount, type (INCOME|EXPENSE), category, description, date, createdBy (fk)

**FinanceCategory**
- id, name, type (INCOME|EXPENSE)

### CRM Tables

**Contact**
- id, name, email, phone, company, tags[], notes, createdBy (fk)

**Deal**
- id, title, value, stage (LEAD|CONTACTED|PROPOSAL|CLOSED), contactId (fk), ownerId (fk), createdAt

**Activity**
- id, contactId (fk), type (CALL|EMAIL|NOTE|MEETING), content, createdBy (fk), createdAt

## Authentication

- JWT access tokens (15 min) in Authorization header
- Refresh tokens (7 days) in httpOnly cookies
- bcrypt password hashing
- Admin-only user creation (no self-signup)
- First-login password change flow
- Middleware: `authenticate`, `requireAdmin`, `requireAppAccess(slug)`

## API Routes

### Auth
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

### Users (admin only)
- GET /api/users
- POST /api/users
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id (soft-delete)

### Apps
- GET /api/apps (admin: all, member: assigned only)
- POST /api/apps (admin)
- PATCH /api/apps/:id (admin)

### App Assignment (admin only)
- POST /api/users/:id/apps
- DELETE /api/users/:id/apps/:appId

### Profile
- GET /api/me
- PATCH /api/me/password

### Finance (requires finance access)
- GET/POST /api/apps/finance/transactions
- GET/POST /api/apps/finance/categories
- GET /api/apps/finance/reports

### CRM (requires CRM access)
- GET/POST /api/apps/crm/contacts
- GET/PATCH /api/apps/crm/contacts/:id
- GET/POST /api/apps/crm/deals
- PATCH /api/apps/crm/deals/:id
- GET/POST /api/apps/crm/activities

## Frontend Structure

### Routing
- /login — public
- /change-password — first-login
- /dashboard — app launcher (cards for assigned apps)
- /admin/* — admin panel
- /apps/finance/* — finance dashboard
- /apps/crm/* — CRM

### Key Patterns
- AuthContext for JWT state + auto-refresh via axios interceptor
- AuthGuard / AdminGuard route wrappers
- React.lazy code-splitting per app module
- TailwindCSS styling

## Project Structure

```
kPass/
├── client/          — React frontend (Vite)
├── server/          — Express backend
│   └── prisma/      — schema, migrations, seed
├── docs/plans/
├── .env.example
└── package.json     — root dev scripts
```

## Seed Data

- Admin: admin@koshishFamily.org (configurable temp password)
- Apps: Finance Dashboard (slug: finance), CRM (slug: crm)

## Deployment

- Frontend → Vercel (auto-deploy from client/)
- Backend → Railway (auto-deploy from server/)
- Database → Railway PostgreSQL add-on
