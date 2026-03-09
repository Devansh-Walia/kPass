# kPass Portal — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a centralized portal for Koshish Family org with single login, role-based app access, admin panel, finance dashboard, and CRM.

**Architecture:** Monorepo with Express/TypeScript/Prisma backend and React/Vite/Tailwind frontend. JWT auth with access + refresh tokens. Route → Validator → Service → Prisma pattern on backend. AuthContext + route guards on frontend.

**Tech Stack:** React 19, Vite, TailwindCSS 4, React Router 7, Express 5, TypeScript, Prisma, PostgreSQL, Zod, Vitest, Supertest, React Testing Library

**Reference Skills:** @express-prisma-crud, @fullstack-testing-patterns, @react-auth-module

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Server

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`
- Create: `server/src/lib/prisma.ts`
- Create: `server/src/middleware/errorHandler.ts`
- Create: `server/vitest.config.ts`

**Step 1: Initialize server project**

```bash
cd server
npm init -y
npm install express express-async-errors cookie-parser cors bcryptjs jsonwebtoken zod @prisma/client
npm install -D typescript @types/express @types/cookie-parser @types/cors @types/bcryptjs @types/jsonwebtoken prisma vitest supertest @types/supertest tsx
npx tsc --init
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create Prisma client singleton**

```typescript
// server/src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

**Step 4: Create error handler middleware**

Per @express-prisma-crud skill:

```typescript
// server/src/middleware/errorHandler.ts
import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.errors[0].message });
  }
  if (err.message === "Not found") {
    return res.status(404).json({ error: "Not found" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
```

**Step 5: Create Express app (separate from server start per @fullstack-testing-patterns)**

```typescript
// server/src/app.ts
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes will be mounted here

app.use(errorHandler);
```

```typescript
// server/src/index.ts
import { app } from "./app.js";

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**Step 6: Create vitest config**

```typescript
// server/vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

**Step 7: Add scripts to package.json**

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

**Step 8: Commit**

```bash
git add server/
git commit -m "chore: initialize server with Express, TypeScript, Prisma setup"
```

---

### Task 2: Initialize Client

**Files:**
- Create: `client/` (via Vite scaffold)
- Modify: `client/tailwind.config.ts` (if needed)
- Create: `client/src/api/client.ts`

**Step 1: Scaffold React + Vite + TypeScript**

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install react-router-dom axios
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 2: Configure Vite with Tailwind**

```typescript
// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

**Step 3: Create test setup**

```typescript
// client/src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

**Step 4: Add Tailwind to CSS**

```css
/* client/src/index.css */
@import "tailwindcss";
```

**Step 5: Create API client per @react-auth-module**

```typescript
// client/src/api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

apiClient.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(res => res, async err => {
  if (err.response?.status === 401 && !err.config._retry) {
    err.config._retry = true;
    try {
      const res = await apiClient.post("/auth/refresh");
      accessToken = res.data.data.accessToken;
      return apiClient(err.config);
    } catch {
      accessToken = null;
      window.location.href = "/login";
      return Promise.reject(err);
    }
  }
  return Promise.reject(err);
});
```

**Step 6: Commit**

```bash
git add client/
git commit -m "chore: initialize client with React, Vite, Tailwind, testing setup"
```

---

### Task 3: Root Package + Environment

**Files:**
- Create: `package.json` (root)
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Create root package.json**

```json
{
  "name": "kpass",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd server && npm run build && cd ../client && npm run build",
    "test": "cd server && npm test && cd ../client && npm test",
    "db:migrate": "cd server && npm run db:migrate",
    "db:seed": "cd server && npm run db:seed"
  }
}
```

```bash
npm install -D concurrently
```

**Step 2: Create .env.example**

```env
# Server
DATABASE_URL=postgresql://user:pass@localhost:5432/kpass
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CLIENT_URL=http://localhost:5173
PORT=4000

# Client
VITE_API_URL=http://localhost:4000/api
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
```

**Step 4: Commit**

```bash
git add package.json .env.example .gitignore
git commit -m "chore: add root scripts, env template, gitignore"
```

---

## Phase 2: Database

### Task 4: Prisma Schema

**Files:**
- Create: `server/prisma/schema.prisma`

**Step 1: Initialize Prisma**

```bash
cd server && npx prisma init
```

**Step 2: Write complete schema**

```prisma
// server/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  users     User[]
}

enum Role {
  ADMIN
  MEMBER
}

model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  passwordHash       String
  firstName          String
  lastName           String
  role               Role      @default(MEMBER)
  orgId              String
  org                Organization @relation(fields: [orgId], references: [id])
  isActive           Boolean   @default(true)
  mustChangePassword Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  apps               UserApp[]
  assignedApps       UserApp[] @relation("AssignedBy")
  transactions       Transaction[]
  contacts           Contact[]
  ownedDeals         Deal[]
  activities         Activity[]
}

enum AppType {
  FINANCE
  CRM
  MARKETING
  IDEATION
  CUSTOM
}

model App {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  icon        String?
  type        AppType
  route       String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  users       UserApp[]
}

model UserApp {
  userId     String
  appId      String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  app        App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  assignedAt DateTime @default(now())
  assignedById String
  assignedBy User     @relation("AssignedBy", fields: [assignedById], references: [id])

  @@id([userId, appId])
}

// Finance Module
enum TransactionType {
  INCOME
  EXPENSE
}

model FinanceCategory {
  id           String          @id @default(uuid())
  name         String
  type         TransactionType
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(uuid())
  amount      Float
  type        TransactionType
  categoryId  String
  category    FinanceCategory @relation(fields: [categoryId], references: [id])
  description String?
  date        DateTime
  createdById String
  createdBy   User            @relation(fields: [createdById], references: [id])
  createdAt   DateTime        @default(now())
}

// CRM Module
model Contact {
  id          String     @id @default(uuid())
  name        String
  email       String?
  phone       String?
  company     String?
  tags        String[]
  notes       String?
  createdById String
  createdBy   User       @relation(fields: [createdById], references: [id])
  deals       Deal[]
  activities  Activity[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum DealStage {
  LEAD
  CONTACTED
  PROPOSAL
  CLOSED
}

model Deal {
  id        String    @id @default(uuid())
  title     String
  value     Float
  stage     DealStage @default(LEAD)
  contactId String
  contact   Contact   @relation(fields: [contactId], references: [id])
  ownerId   String
  owner     User      @relation(fields: [ownerId], references: [id])
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum ActivityType {
  CALL
  EMAIL
  NOTE
  MEETING
}

model Activity {
  id          String       @id @default(uuid())
  contactId   String
  contact     Contact      @relation(fields: [contactId], references: [id])
  type        ActivityType
  content     String
  createdById String
  createdBy   User         @relation(fields: [createdById], references: [id])
  createdAt   DateTime     @default(now())
}
```

**Step 3: Run migration**

```bash
cd server && npx prisma migrate dev --name init
```
Expected: Migration created and applied.

**Step 4: Commit**

```bash
git add server/prisma/
git commit -m "feat: add complete Prisma schema with all models"
```

---

### Task 5: Seed Script

**Files:**
- Create: `server/prisma/seed.ts`

**Step 1: Write seed script**

```typescript
// server/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: "koshish-family" },
    update: {},
    create: { name: "Koshish Family", slug: "koshish-family" },
  });

  // Create admin user
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await prisma.user.upsert({
    where: { email: "admin@koshishFamily.org" },
    update: {},
    create: {
      email: "admin@koshishFamily.org",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      orgId: org.id,
      mustChangePassword: true,
    },
  });

  // Create apps
  const apps = [
    { name: "Finance Dashboard", slug: "finance", type: "FINANCE" as const, route: "/apps/finance", description: "Track income, expenses, and financial reports" },
    { name: "CRM", slug: "crm", type: "CRM" as const, route: "/apps/crm", description: "Manage contacts, deals, and activities" },
  ];

  for (const appData of apps) {
    await prisma.app.upsert({
      where: { slug: appData.slug },
      update: {},
      create: appData,
    });
  }

  console.log("Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Run seed**

```bash
cd server && npm run db:seed
```
Expected: "Seed complete"

**Step 3: Commit**

```bash
git add server/prisma/seed.ts
git commit -m "feat: add seed script with admin user and default apps"
```

---

## Phase 3: Auth Backend

### Task 6: JWT + Password Helpers

**Files:**
- Create: `server/src/lib/jwt.ts`
- Create: `server/src/lib/password.ts`
- Create: `server/src/lib/jwt.test.ts`
- Create: `server/src/lib/password.test.ts`
- Create: `server/src/config/env.ts`

**Step 1: Create env config**

```typescript
// server/src/config/env.ts
export const env = {
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
};
```

**Step 2: Write failing tests for JWT helpers**

```typescript
// server/src/lib/jwt.test.ts
import { describe, it, expect } from "vitest";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt.js";

describe("JWT helpers", () => {
  const payload = { userId: "test-id", role: "MEMBER" as const };

  it("generates and verifies access token", () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe("test-id");
    expect(decoded.role).toBe("MEMBER");
  });

  it("generates and verifies refresh token", () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe("test-id");
  });

  it("rejects invalid token", () => {
    expect(() => verifyAccessToken("invalid")).toThrow();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd server && npx vitest run src/lib/jwt.test.ts
```
Expected: FAIL — module not found

**Step 4: Implement JWT helpers**

```typescript
// server/src/lib/jwt.ts
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  userId: string;
  role: "ADMIN" | "MEMBER";
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessTokenExpiry });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.refreshTokenExpiry });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
}
```

**Step 5: Run test to verify it passes**

```bash
cd server && npx vitest run src/lib/jwt.test.ts
```
Expected: PASS

**Step 6: Write failing tests for password helpers**

```typescript
// server/src/lib/password.test.ts
import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "./password.js";

describe("password helpers", () => {
  it("hashes and verifies password", async () => {
    const hash = await hashPassword("test123");
    expect(hash).not.toBe("test123");
    expect(await comparePassword("test123", hash)).toBe(true);
    expect(await comparePassword("wrong", hash)).toBe(false);
  });
});
```

**Step 7: Run test to verify it fails**

```bash
cd server && npx vitest run src/lib/password.test.ts
```

**Step 8: Implement password helpers**

```typescript
// server/src/lib/password.ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Step 9: Run all tests**

```bash
cd server && npx vitest run
```
Expected: All PASS

**Step 10: Commit**

```bash
git add server/src/lib/ server/src/config/
git commit -m "feat: add JWT and password helper utilities with tests"
```

---

### Task 7: Auth Middleware

**Files:**
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/auth.test.ts`
- Create: `server/src/types/express.d.ts`

**Step 1: Extend Express Request type**

```typescript
// server/src/types/express.d.ts
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}
```

**Step 2: Write failing test for authenticate middleware**

```typescript
// server/src/middleware/auth.test.ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import "express-async-errors";
import { authenticate, requireAdmin } from "./auth.js";
import { generateAccessToken } from "../lib/jwt.js";
import { errorHandler } from "./errorHandler.js";

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get("/protected", authenticate, (req, res) => {
    res.json({ data: { userId: req.user!.id, role: req.user!.role } });
  });

  app.get("/admin", authenticate, requireAdmin, (req, res) => {
    res.json({ data: "admin content" });
  });

  app.use(errorHandler);
  return app;
}

describe("authenticate middleware", () => {
  const app = createTestApp();

  it("returns 401 without token", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No token provided");
  });

  it("returns 401 with invalid token", async () => {
    const res = await request(app).get("/protected").set("Authorization", "Bearer invalid");
    expect(res.status).toBe(401);
  });

  it("passes with valid token", async () => {
    const token = generateAccessToken({ userId: "user-1", role: "MEMBER" });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe("user-1");
  });
});

describe("requireAdmin middleware", () => {
  const app = createTestApp();

  it("returns 403 for non-admin", async () => {
    const token = generateAccessToken({ userId: "user-1", role: "MEMBER" });
    const res = await request(app).get("/admin").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("passes for admin", async () => {
    const token = generateAccessToken({ userId: "user-1", role: "ADMIN" });
    const res = await request(app).get("/admin").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd server && npx vitest run src/middleware/auth.test.ts
```

**Step 4: Implement auth middleware**

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
```

**Step 5: Run tests**

```bash
cd server && npx vitest run src/middleware/auth.test.ts
```
Expected: All PASS

**Step 6: Commit**

```bash
git add server/src/middleware/auth.ts server/src/middleware/auth.test.ts server/src/types/
git commit -m "feat: add authenticate and requireAdmin middleware with tests"
```

---

### Task 8: App Access Middleware

**Files:**
- Create: `server/src/middleware/appAccess.ts`
- Create: `server/src/middleware/appAccess.test.ts`

**Step 1: Write failing test**

```typescript
// server/src/middleware/appAccess.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import "express-async-errors";
import { requireAppAccess } from "./appAccess.js";
import { authenticate } from "./auth.js";
import { generateAccessToken } from "../lib/jwt.js";
import { errorHandler } from "./errorHandler.js";
import { prisma } from "../lib/prisma.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userApp: { findUnique: vi.fn() },
    app: { findUnique: vi.fn() },
  },
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get("/finance", authenticate, requireAppAccess("finance"), (req, res) => {
    res.json({ data: "finance content" });
  });
  app.use(errorHandler);
  return app;
}

describe("requireAppAccess", () => {
  const app = createTestApp();
  const token = generateAccessToken({ userId: "user-1", role: "MEMBER" });

  beforeEach(() => { vi.clearAllMocks(); });

  it("allows admin without checking assignment", async () => {
    const adminToken = generateAccessToken({ userId: "admin-1", role: "ADMIN" });
    const res = await request(app).get("/finance").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it("returns 403 if user not assigned to app", async () => {
    vi.mocked(prisma.app.findUnique).mockResolvedValue({ id: "app-1", slug: "finance" } as any);
    vi.mocked(prisma.userApp.findUnique).mockResolvedValue(null);
    const res = await request(app).get("/finance").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("allows user assigned to app", async () => {
    vi.mocked(prisma.app.findUnique).mockResolvedValue({ id: "app-1", slug: "finance" } as any);
    vi.mocked(prisma.userApp.findUnique).mockResolvedValue({ userId: "user-1", appId: "app-1" } as any);
    const res = await request(app).get("/finance").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd server && npx vitest run src/middleware/appAccess.test.ts
```

**Step 3: Implement**

```typescript
// server/src/middleware/appAccess.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export function requireAppAccess(appSlug: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Admins have access to all apps
    if (req.user?.role === "ADMIN") return next();

    const app = await prisma.app.findUnique({ where: { slug: appSlug } });
    if (!app) return res.status(404).json({ error: "App not found" });

    const assignment = await prisma.userApp.findUnique({
      where: { userId_appId: { userId: req.user!.id, appId: app.id } },
    });

    if (!assignment) return res.status(403).json({ error: "App access required" });
    next();
  };
}
```

**Step 4: Run tests**

```bash
cd server && npx vitest run src/middleware/appAccess.test.ts
```
Expected: All PASS

**Step 5: Commit**

```bash
git add server/src/middleware/appAccess.ts server/src/middleware/appAccess.test.ts
git commit -m "feat: add requireAppAccess middleware with tests"
```

---

### Task 9: Auth Routes

**Files:**
- Create: `server/src/services/authService.ts`
- Create: `server/src/validators/auth.ts`
- Create: `server/src/routes/auth.ts`
- Create: `server/src/routes/auth.test.ts`

**Step 1: Create Zod validators**

```typescript
// server/src/validators/auth.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
```

**Step 2: Create auth service**

```typescript
// server/src/services/authService.ts
import { prisma } from "../lib/prisma.js";
import { comparePassword, hashPassword } from "../lib/password.js";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt.js";

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new Error("Invalid credentials");

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  },

  async refresh(userId: string, role: "ADMIN" | "MEMBER") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw new Error("Invalid refresh");

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  },
};
```

**Step 3: Create auth routes**

```typescript
// server/src/routes/auth.ts
import { Router } from "express";
import { authService } from "../services/authService.js";
import { loginSchema } from "../validators/auth.js";
import { verifyRefreshToken } from "../lib/jwt.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  try {
    const result = await authService.login(email, password);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({ data: { accessToken: result.accessToken, user: result.user } });
  } catch {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = verifyRefreshToken(token);
    const result = await authService.refresh(payload.userId, payload.role);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ data: { accessToken: result.accessToken, user: result.user } });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken");
  res.json({ data: { message: "Logged out" } });
});

export default router;
```

**Step 4: Mount auth routes in app.ts**

Add to `server/src/app.ts`:
```typescript
import authRoutes from "./routes/auth.js";
// after middleware setup:
app.use("/api/auth", authRoutes);
```

**Step 5: Write integration tests** (per @fullstack-testing-patterns)

```typescript
// server/src/routes/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

describe("Auth routes", () => {
  let orgId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({ data: { name: "Test Org", slug: "test-org" } });
    orgId = org.id;
    await prisma.user.create({
      data: {
        email: "test@test.org",
        passwordHash: await hashPassword("password123"),
        firstName: "Test",
        lastName: "User",
        role: "MEMBER",
        orgId,
        mustChangePassword: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  });

  describe("POST /api/auth/login", () => {
    it("returns 200 + tokens for valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({ email: "test@test.org", password: "password123" });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe("test@test.org");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns 401 for wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({ email: "test@test.org", password: "wrong" });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("returns 400 for missing fields", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("returns new tokens when valid refresh cookie exists", async () => {
      const loginRes = await request(app).post("/api/auth/login").send({ email: "test@test.org", password: "password123" });
      const cookies = loginRes.headers["set-cookie"];

      const res = await request(app).post("/api/auth/refresh").set("Cookie", cookies);
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("returns 401 without cookie", async () => {
      const res = await request(app).post("/api/auth/refresh");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears refresh cookie", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(200);
    });
  });
});
```

**Step 6: Run tests**

```bash
cd server && npx vitest run src/routes/auth.test.ts
```
Expected: All PASS (requires running test DB — if not available, these become integration tests run separately)

**Step 7: Commit**

```bash
git add server/src/services/authService.ts server/src/validators/auth.ts server/src/routes/auth.ts server/src/routes/auth.test.ts server/src/app.ts
git commit -m "feat: add auth routes (login, refresh, logout) with tests"
```

---

## Phase 4: User & App Management Backend

### Task 10: User Service + Routes

**Files:**
- Create: `server/src/validators/users.ts`
- Create: `server/src/services/userService.ts`
- Create: `server/src/routes/users.ts`
- Create: `server/src/routes/users.test.ts`

**Step 1: Create validators**

```typescript
// server/src/validators/users.ts
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  password: z.string().min(8),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  isActive: z.boolean().optional(),
});
```

**Step 2: Create user service**

```typescript
// server/src/services/userService.ts
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { z } from "zod";
import { createUserSchema, updateUserSchema } from "../validators/users.js";

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const userService = {
  list: () =>
    prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),

  getById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true,
        apps: { include: { app: true } },
      },
    }),

  create: async (data: CreateUserInput, orgId: string) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("Email already exists");

    const passwordHash = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        orgId,
        mustChangePassword: true,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
  },

  update: (id: string, data: UpdateUserInput) =>
    prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    }),

  softDelete: (id: string) =>
    prisma.user.update({ where: { id }, data: { isActive: false } }),
};
```

**Step 3: Create user routes**

```typescript
// server/src/routes/users.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/auth.js";
import { userService } from "../services/userService.js";
import { createUserSchema, updateUserSchema } from "../validators/users.js";
import { prisma } from "../lib/prisma.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.get("/", async (req, res) => {
  const users = await userService.list();
  res.json({ data: users });
});

router.get("/:id", async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ data: user });
});

router.post("/", async (req, res) => {
  const body = createUserSchema.parse(req.body);
  // Get admin's orgId
  const admin = await prisma.user.findUnique({ where: { id: req.user!.id } });
  try {
    const user = await userService.create(body, admin!.orgId);
    res.status(201).json({ data: user });
  } catch (err: any) {
    if (err.message === "Email already exists") {
      return res.status(400).json({ error: err.message });
    }
    throw err;
  }
});

router.patch("/:id", async (req, res) => {
  const body = updateUserSchema.parse(req.body);
  const user = await userService.update(req.params.id, body);
  res.json({ data: user });
});

router.delete("/:id", async (req, res) => {
  await userService.softDelete(req.params.id);
  res.json({ data: { message: "User deactivated" } });
});

export default router;
```

**Step 4: Mount in app.ts**

```typescript
import userRoutes from "./routes/users.js";
app.use("/api/users", userRoutes);
```

**Step 5: Write tests**

```typescript
// server/src/routes/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";
import { generateAccessToken } from "../lib/jwt.js";

describe("User routes", () => {
  let orgId: string;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({ data: { name: "Test Org", slug: "test-org-users" } });
    orgId = org.id;
    const admin = await prisma.user.create({
      data: { email: "admin@test.org", passwordHash: await hashPassword("pass"), firstName: "Admin", lastName: "User", role: "ADMIN", orgId },
    });
    const member = await prisma.user.create({
      data: { email: "member@test.org", passwordHash: await hashPassword("pass"), firstName: "Member", lastName: "User", role: "MEMBER", orgId },
    });
    adminToken = generateAccessToken({ userId: admin.id, role: "ADMIN" });
    memberToken = generateAccessToken({ userId: member.id, role: "MEMBER" });
  });

  afterAll(async () => {
    await prisma.userApp.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  });

  it("GET /api/users — admin can list users", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it("GET /api/users — member gets 403", async () => {
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it("POST /api/users — admin can create user", async () => {
    const res = await request(app).post("/api/users").set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "new@test.org", firstName: "New", lastName: "User", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("new@test.org");
  });

  it("POST /api/users — rejects duplicate email", async () => {
    const res = await request(app).post("/api/users").set("Authorization", `Bearer ${adminToken}`)
      .send({ email: "admin@test.org", firstName: "Dup", lastName: "User", password: "password123" });
    expect(res.status).toBe(400);
  });
});
```

**Step 6: Run tests**

```bash
cd server && npx vitest run src/routes/users.test.ts
```

**Step 7: Commit**

```bash
git add server/src/validators/users.ts server/src/services/userService.ts server/src/routes/users.ts server/src/routes/users.test.ts server/src/app.ts
git commit -m "feat: add user CRUD routes (admin only) with tests"
```

---

### Task 11: App Management + Assignment Routes

**Files:**
- Create: `server/src/services/appService.ts`
- Create: `server/src/validators/apps.ts`
- Create: `server/src/routes/apps.ts`
- Create: `server/src/routes/apps.test.ts`

**Step 1: Create validators**

```typescript
// server/src/validators/apps.ts
import { z } from "zod";

export const createAppSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.enum(["FINANCE", "CRM", "MARKETING", "IDEATION", "CUSTOM"]),
  route: z.string().min(1),
});

export const assignAppsSchema = z.object({
  appIds: z.array(z.string().uuid()),
});
```

**Step 2: Create app service**

```typescript
// server/src/services/appService.ts
import { prisma } from "../lib/prisma.js";

export const appService = {
  listAll: () => prisma.app.findMany({ orderBy: { name: "asc" } }),

  listForUser: (userId: string) =>
    prisma.userApp.findMany({
      where: { userId },
      include: { app: true },
    }).then(uas => uas.map(ua => ua.app)),

  create: (data: { name: string; slug: string; description?: string; icon?: string; type: any; route: string }) =>
    prisma.app.create({ data }),

  update: (id: string, data: Partial<{ name: string; description: string; icon: string; isActive: boolean }>) =>
    prisma.app.update({ where: { id }, data }),

  assignApps: (userId: string, appIds: string[], assignedById: string) =>
    prisma.userApp.createMany({
      data: appIds.map(appId => ({ userId, appId, assignedById })),
      skipDuplicates: true,
    }),

  revokeApp: (userId: string, appId: string) =>
    prisma.userApp.delete({ where: { userId_appId: { userId, appId } } }),
};
```

**Step 3: Create routes**

```typescript
// server/src/routes/apps.ts
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { appService } from "../services/appService.js";
import { createAppSchema, assignAppsSchema } from "../validators/apps.js";

const router = Router();

// GET /api/apps — admin gets all, member gets assigned
router.get("/", authenticate, async (req, res) => {
  const apps = req.user!.role === "ADMIN"
    ? await appService.listAll()
    : await appService.listForUser(req.user!.id);
  res.json({ data: apps });
});

// POST /api/apps — admin only
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const body = createAppSchema.parse(req.body);
  const app = await appService.create(body);
  res.status(201).json({ data: app });
});

// PATCH /api/apps/:id — admin only
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const app = await appService.update(req.params.id, req.body);
  res.json({ data: app });
});

// POST /api/users/:id/apps — assign apps to user
router.post("/users/:id/apps", authenticate, requireAdmin, async (req, res) => {
  const { appIds } = assignAppsSchema.parse(req.body);
  await appService.assignApps(req.params.id, appIds, req.user!.id);
  res.status(201).json({ data: { message: "Apps assigned" } });
});

// DELETE /api/users/:id/apps/:appId — revoke app access
router.delete("/users/:id/apps/:appId", authenticate, requireAdmin, async (req, res) => {
  await appService.revokeApp(req.params.id, req.params.appId);
  res.json({ data: { message: "App access revoked" } });
});

export default router;
```

**Step 4: Mount in app.ts**

```typescript
import appRoutes from "./routes/apps.js";
app.use("/api/apps", appRoutes);
// Also mount assignment routes at /api
app.use("/api", appRoutes);
```

Note: The assignment routes (`/users/:id/apps`) are nested in the apps router but mounted at `/api` so they resolve to `/api/users/:id/apps`.

Actually, cleaner approach — separate the assignment routes:

Mount apps at `/api/apps` and have the assignment routes directly in users router or a dedicated mount. For clarity, keep assignment endpoints in the apps router but mount the router at `/api`:

```typescript
app.use("/api", appRoutes); // handles /api/apps/* and /api/users/:id/apps*
```

Update the apps router paths accordingly:
- `router.get("/apps", ...)`
- `router.post("/apps", ...)`
- `router.patch("/apps/:id", ...)`
- `router.post("/users/:id/apps", ...)`
- `router.delete("/users/:id/apps/:appId", ...)`

**Step 5: Write tests and run them**

**Step 6: Commit**

```bash
git add server/src/services/appService.ts server/src/validators/apps.ts server/src/routes/apps.ts server/src/app.ts
git commit -m "feat: add app management and assignment routes"
```

---

### Task 12: Profile Routes (/me)

**Files:**
- Create: `server/src/routes/me.ts`

**Step 1: Create profile routes**

```typescript
// server/src/routes/me.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { changePasswordSchema } from "../validators/auth.js";
import { hashPassword, comparePassword } from "../lib/password.js";

const router = Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true, mustChangePassword: true,
      apps: { include: { app: true } },
    },
  });
  res.json({ data: user });
});

router.patch("/password", async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
  });
  res.json({ data: { message: "Password updated" } });
});

export default router;
```

**Step 2: Mount in app.ts**

```typescript
import meRoutes from "./routes/me.js";
app.use("/api/me", meRoutes);
```

**Step 3: Write tests, run, commit**

```bash
git add server/src/routes/me.ts server/src/app.ts
git commit -m "feat: add profile routes (GET /me, PATCH /me/password)"
```

---

## Phase 5: Finance Backend

### Task 13: Finance Service + Routes

**Files:**
- Create: `server/src/validators/finance.ts`
- Create: `server/src/services/financeService.ts`
- Create: `server/src/routes/finance.ts`
- Create: `server/src/routes/finance.test.ts`

**Step 1: Create validators**

```typescript
// server/src/validators/finance.ts
import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  date: z.string().transform(s => new Date(s)),
});
```

**Step 2: Create finance service**

```typescript
// server/src/services/financeService.ts
import { prisma } from "../lib/prisma.js";

export const financeService = {
  // Categories
  listCategories: () => prisma.financeCategory.findMany({ orderBy: { name: "asc" } }),
  createCategory: (data: { name: string; type: "INCOME" | "EXPENSE" }) =>
    prisma.financeCategory.create({ data }),

  // Transactions
  listTransactions: (filters?: { startDate?: Date; endDate?: Date; type?: "INCOME" | "EXPENSE"; categoryId?: string }) => {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters?.type) where.type = filters.type;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    return prisma.transaction.findMany({
      where,
      include: { category: true, createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
    });
  },

  createTransaction: (data: { amount: number; type: "INCOME" | "EXPENSE"; categoryId: string; description?: string; date: Date }, userId: string) =>
    prisma.transaction.create({
      data: { ...data, createdById: userId },
      include: { category: true },
    }),

  // Reports
  getReport: async (startDate: Date, endDate: Date) => {
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { category: true },
    });
    const income = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, profit: income - expense, transactionCount: transactions.length };
  },
};
```

**Step 3: Create routes**

```typescript
// server/src/routes/finance.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { financeService } from "../services/financeService.js";
import { createCategorySchema, createTransactionSchema } from "../validators/finance.js";

const router = Router();
router.use(authenticate, requireAppAccess("finance"));

// Categories
router.get("/categories", async (_req, res) => {
  const categories = await financeService.listCategories();
  res.json({ data: categories });
});

router.post("/categories", async (req, res) => {
  const body = createCategorySchema.parse(req.body);
  const category = await financeService.createCategory(body);
  res.status(201).json({ data: category });
});

// Transactions
router.get("/transactions", async (req, res) => {
  const { startDate, endDate, type, categoryId } = req.query;
  const transactions = await financeService.listTransactions({
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    type: type as "INCOME" | "EXPENSE" | undefined,
    categoryId: categoryId as string | undefined,
  });
  res.json({ data: transactions });
});

router.post("/transactions", async (req, res) => {
  const body = createTransactionSchema.parse(req.body);
  const transaction = await financeService.createTransaction(body, req.user!.id);
  res.status(201).json({ data: transaction });
});

// Reports
router.get("/reports", async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate required" });
  const report = await financeService.getReport(new Date(startDate as string), new Date(endDate as string));
  res.json({ data: report });
});

export default router;
```

**Step 4: Mount in app.ts**

```typescript
import financeRoutes from "./routes/finance.js";
app.use("/api/apps/finance", financeRoutes);
```

**Step 5: Write tests, run, commit**

```bash
git add server/src/validators/finance.ts server/src/services/financeService.ts server/src/routes/finance.ts server/src/app.ts
git commit -m "feat: add finance module backend (categories, transactions, reports)"
```

---

## Phase 6: CRM Backend

### Task 14: CRM Service + Routes

**Files:**
- Create: `server/src/validators/crm.ts`
- Create: `server/src/services/crmService.ts`
- Create: `server/src/routes/crm.ts`

**Step 1: Create validators**

```typescript
// server/src/validators/crm.ts
import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const createDealSchema = z.object({
  title: z.string().min(1),
  value: z.number().min(0),
  stage: z.enum(["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"]).default("LEAD"),
  contactId: z.string().uuid(),
});

export const updateDealSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.number().min(0).optional(),
  stage: z.enum(["LEAD", "CONTACTED", "PROPOSAL", "CLOSED"]).optional(),
});

export const createActivitySchema = z.object({
  contactId: z.string().uuid(),
  type: z.enum(["CALL", "EMAIL", "NOTE", "MEETING"]),
  content: z.string().min(1),
});
```

**Step 2: Create CRM service**

```typescript
// server/src/services/crmService.ts
import { prisma } from "../lib/prisma.js";

export const crmService = {
  // Contacts
  listContacts: () =>
    prisma.contact.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { deals: true, activities: true } } } }),

  getContact: (id: string) =>
    prisma.contact.findUnique({ where: { id }, include: { deals: true, activities: { orderBy: { createdAt: "desc" } } } }),

  createContact: (data: any, userId: string) =>
    prisma.contact.create({ data: { ...data, createdById: userId } }),

  updateContact: (id: string, data: any) =>
    prisma.contact.update({ where: { id }, data }),

  // Deals
  listDeals: () =>
    prisma.deal.findMany({ include: { contact: { select: { name: true } }, owner: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" } }),

  createDeal: (data: { title: string; value: number; stage?: any; contactId: string }, userId: string) =>
    prisma.deal.create({ data: { ...data, ownerId: userId } }),

  updateDeal: (id: string, data: any) =>
    prisma.deal.update({ where: { id }, data }),

  // Activities
  listActivities: (contactId?: string) => {
    const where = contactId ? { contactId } : {};
    return prisma.activity.findMany({
      where,
      include: { createdBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  createActivity: (data: { contactId: string; type: any; content: string }, userId: string) =>
    prisma.activity.create({ data: { ...data, createdById: userId } }),
};
```

**Step 3: Create CRM routes**

```typescript
// server/src/routes/crm.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAppAccess } from "../middleware/appAccess.js";
import { crmService } from "../services/crmService.js";
import { createContactSchema, createDealSchema, updateDealSchema, createActivitySchema } from "../validators/crm.js";

const router = Router();
router.use(authenticate, requireAppAccess("crm"));

// Contacts
router.get("/contacts", async (_req, res) => {
  const contacts = await crmService.listContacts();
  res.json({ data: contacts });
});

router.get("/contacts/:id", async (req, res) => {
  const contact = await crmService.getContact(req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json({ data: contact });
});

router.post("/contacts", async (req, res) => {
  const body = createContactSchema.parse(req.body);
  const contact = await crmService.createContact(body, req.user!.id);
  res.status(201).json({ data: contact });
});

router.patch("/contacts/:id", async (req, res) => {
  const contact = await crmService.updateContact(req.params.id, req.body);
  res.json({ data: contact });
});

// Deals
router.get("/deals", async (_req, res) => {
  const deals = await crmService.listDeals();
  res.json({ data: deals });
});

router.post("/deals", async (req, res) => {
  const body = createDealSchema.parse(req.body);
  const deal = await crmService.createDeal(body, req.user!.id);
  res.status(201).json({ data: deal });
});

router.patch("/deals/:id", async (req, res) => {
  const body = updateDealSchema.parse(req.body);
  const deal = await crmService.updateDeal(req.params.id, body);
  res.json({ data: deal });
});

// Activities
router.get("/activities", async (req, res) => {
  const activities = await crmService.listActivities(req.query.contactId as string | undefined);
  res.json({ data: activities });
});

router.post("/activities", async (req, res) => {
  const body = createActivitySchema.parse(req.body);
  const activity = await crmService.createActivity(body, req.user!.id);
  res.status(201).json({ data: activity });
});

export default router;
```

**Step 4: Mount in app.ts**

```typescript
import crmRoutes from "./routes/crm.js";
app.use("/api/apps/crm", crmRoutes);
```

**Step 5: Write tests, run, commit**

```bash
git add server/src/validators/crm.ts server/src/services/crmService.ts server/src/routes/crm.ts server/src/app.ts
git commit -m "feat: add CRM module backend (contacts, deals, activities)"
```

---

## Phase 7: Frontend Core

### Task 15: Auth Context + Login Page

**Files:**
- Create: `client/src/contexts/AuthContext.tsx`
- Create: `client/src/api/auth.ts`
- Create: `client/src/pages/Login.tsx`
- Create: `client/src/pages/ChangePassword.tsx`

**Step 1: Create auth API helpers**

```typescript
// client/src/api/auth.ts
import { apiClient, setAccessToken } from "./client";

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },
  refresh: async () => {
    const res = await apiClient.post("/auth/refresh");
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },
  logout: async () => {
    await apiClient.post("/auth/logout");
    setAccessToken(null);
  },
};
```

**Step 2: Create AuthContext per @react-auth-module**

```tsx
// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "../api/auth";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "MEMBER";
  mustChangePassword: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.refresh()
      .then(data => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Step 3: Create Login page**

```tsx
// client/src/pages/Login.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">kPass</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: Create ChangePassword page**

```tsx
// client/src/pages/ChangePassword.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await apiClient.patch("/me/password", { currentPassword, newPassword });
      navigate("/dashboard");
    } catch {
      setError("Failed to change password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
        <p className="text-sm text-gray-600 mb-6">You must change your password before continuing.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
            <input id="currentPassword" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password (min 8 chars)</label>
            <input id="newPassword" type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </div>
          <button type="submit"
            className="w-full py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add client/src/
git commit -m "feat: add auth context, login page, change password page"
```

---

### Task 16: Route Guards + App Shell + Router Setup

**Files:**
- Create: `client/src/components/guards/AuthGuard.tsx`
- Create: `client/src/components/guards/AdminGuard.tsx`
- Create: `client/src/components/layout/AppShell.tsx`
- Create: `client/src/components/layout/Sidebar.tsx`
- Create: `client/src/components/layout/TopBar.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Create guards per @react-auth-module**

```tsx
// client/src/components/guards/AuthGuard.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <Outlet />;
}
```

```tsx
// client/src/components/guards/AdminGuard.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function AdminGuard() {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

**Step 2: Create layout components**

```tsx
// client/src/components/layout/TopBar.tsx
import { useAuth } from "../../contexts/AuthContext";

export function TopBar() {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">kPass</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
      </div>
    </header>
  );
}
```

```tsx
// client/src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-2 rounded-md text-sm ${isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-100"}`;

export function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 space-y-1">
      <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      {user?.role === "ADMIN" && (
        <>
          <div className="pt-4 pb-1 px-4 text-xs font-semibold text-gray-400 uppercase">Admin</div>
          <NavLink to="/admin/overview" className={linkClass}>Overview</NavLink>
          <NavLink to="/admin/users" className={linkClass}>Users</NavLink>
          <NavLink to="/admin/apps" className={linkClass}>Apps</NavLink>
        </>
      )}
    </aside>
  );
}
```

```tsx
// client/src/components/layout/AppShell.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Step 3: Set up App.tsx with router**

```tsx
// client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { AuthGuard } from "./components/guards/AuthGuard";
import { AdminGuard } from "./components/guards/AdminGuard";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminOverview = lazy(() => import("./pages/admin/Overview"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserDetail = lazy(() => import("./pages/admin/UserDetail"));
const AdminApps = lazy(() => import("./pages/admin/Apps"));
const FinanceDashboard = lazy(() => import("./pages/apps/finance/FinanceDashboard"));
const CrmLayout = lazy(() => import("./pages/apps/crm/CrmLayout"));

function Loading() {
  return <div className="flex items-center justify-center p-8">Loading...</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route element={<AdminGuard />}>
                  <Route path="/admin/overview" element={<AdminOverview />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                  <Route path="/admin/apps" element={<AdminApps />} />
                </Route>
                <Route path="/apps/finance/*" element={<FinanceDashboard />} />
                <Route path="/apps/crm/*" element={<CrmLayout />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: add route guards, app shell layout, and router setup"
```

---

### Task 17: Dashboard (App Launcher)

**Files:**
- Create: `client/src/pages/Dashboard.tsx`
- Create: `client/src/api/apps.ts`

**Step 1: Create apps API**

```typescript
// client/src/api/apps.ts
import { apiClient } from "./client";

export const appsApi = {
  list: () => apiClient.get("/apps").then(res => res.data.data),
};
```

**Step 2: Create Dashboard page**

```tsx
// client/src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appsApi } from "../api/apps";

interface App {
  id: string;
  name: string;
  slug: string;
  description: string;
  route: string;
  type: string;
}

const typeIcons: Record<string, string> = {
  FINANCE: "chart-bar",
  CRM: "users",
};

export default function Dashboard() {
  const [apps, setApps] = useState<App[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    appsApi.list().then(setApps);
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Apps</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <button key={app.id} onClick={() => navigate(app.route)}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left">
            <div className="text-lg font-semibold text-gray-900">{app.name}</div>
            <p className="mt-1 text-sm text-gray-500">{app.description}</p>
            <span className="mt-3 inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              {app.type}
            </span>
          </button>
        ))}
        {apps.length === 0 && (
          <p className="text-gray-500 col-span-full">No apps assigned yet. Contact your admin.</p>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/pages/Dashboard.tsx client/src/api/apps.ts
git commit -m "feat: add dashboard app launcher page"
```

---

## Phase 8: Admin Panel Frontend

### Task 18: Admin Pages

**Files:**
- Create: `client/src/api/users.ts`
- Create: `client/src/pages/admin/Overview.tsx`
- Create: `client/src/pages/admin/Users.tsx`
- Create: `client/src/pages/admin/UserDetail.tsx`
- Create: `client/src/pages/admin/Apps.tsx`

These pages implement standard CRUD UIs using the API endpoints from Phase 4. Each page:
- Fetches data on mount
- Renders tables/forms with Tailwind
- Calls API endpoints for mutations
- Shows loading/error states

The admin API helper:

```typescript
// client/src/api/users.ts
import { apiClient } from "./client";

export const usersApi = {
  list: () => apiClient.get("/users").then(res => res.data.data),
  getById: (id: string) => apiClient.get(`/users/${id}`).then(res => res.data.data),
  create: (data: any) => apiClient.post("/users", data).then(res => res.data.data),
  update: (id: string, data: any) => apiClient.patch(`/users/${id}`, data).then(res => res.data.data),
  deactivate: (id: string) => apiClient.delete(`/users/${id}`).then(res => res.data.data),
  assignApps: (userId: string, appIds: string[]) => apiClient.post(`/users/${userId}/apps`, { appIds }),
  revokeApp: (userId: string, appId: string) => apiClient.delete(`/users/${userId}/apps/${appId}`),
};
```

Implementation for each admin page follows standard React patterns — fetch on mount, form submissions, table rendering. Code will be written during execution.

**Commit after each page is complete.**

---

## Phase 9: Finance Frontend

### Task 19: Finance Dashboard Pages

**Files:**
- Create: `client/src/pages/apps/finance/FinanceDashboard.tsx`
- Create: `client/src/api/finance.ts`

Finance frontend has 3 views (tabs or sub-routes):
1. **Overview** — summary cards (income, expense, profit) + simple chart
2. **Transactions** — filterable table with add form
3. **Reports** — date range picker, summary stats

```typescript
// client/src/api/finance.ts
import { apiClient } from "./client";

export const financeApi = {
  getCategories: () => apiClient.get("/apps/finance/categories").then(res => res.data.data),
  createCategory: (data: any) => apiClient.post("/apps/finance/categories", data).then(res => res.data.data),
  getTransactions: (params?: any) => apiClient.get("/apps/finance/transactions", { params }).then(res => res.data.data),
  createTransaction: (data: any) => apiClient.post("/apps/finance/transactions", data).then(res => res.data.data),
  getReport: (startDate: string, endDate: string) =>
    apiClient.get("/apps/finance/reports", { params: { startDate, endDate } }).then(res => res.data.data),
};
```

Implementation during execution. **Commit after complete.**

---

## Phase 10: CRM Frontend

### Task 20: CRM Pages

**Files:**
- Create: `client/src/pages/apps/crm/CrmLayout.tsx`
- Create: `client/src/pages/apps/crm/Contacts.tsx`
- Create: `client/src/pages/apps/crm/Pipeline.tsx`
- Create: `client/src/api/crm.ts`

CRM frontend has:
1. **Contacts** — searchable list, add/edit forms, detail view with activity timeline
2. **Pipeline** — kanban-style columns (Lead → Contacted → Proposal → Closed) showing deals

```typescript
// client/src/api/crm.ts
import { apiClient } from "./client";

export const crmApi = {
  getContacts: () => apiClient.get("/apps/crm/contacts").then(res => res.data.data),
  getContact: (id: string) => apiClient.get(`/apps/crm/contacts/${id}`).then(res => res.data.data),
  createContact: (data: any) => apiClient.post("/apps/crm/contacts", data).then(res => res.data.data),
  updateContact: (id: string, data: any) => apiClient.patch(`/apps/crm/contacts/${id}`, data).then(res => res.data.data),
  getDeals: () => apiClient.get("/apps/crm/deals").then(res => res.data.data),
  createDeal: (data: any) => apiClient.post("/apps/crm/deals", data).then(res => res.data.data),
  updateDeal: (id: string, data: any) => apiClient.patch(`/apps/crm/deals/${id}`, data).then(res => res.data.data),
  getActivities: (contactId?: string) =>
    apiClient.get("/apps/crm/activities", { params: contactId ? { contactId } : {} }).then(res => res.data.data),
  createActivity: (data: any) => apiClient.post("/apps/crm/activities", data).then(res => res.data.data),
};
```

Implementation during execution. **Commit after complete.**

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Project scaffolding (server, client, root) |
| 2 | 4-5 | Database schema + seed |
| 3 | 6-9 | Auth backend (helpers, middleware, routes) |
| 4 | 10-12 | User/app management + profile backend |
| 5 | 13 | Finance backend |
| 6 | 14 | CRM backend |
| 7 | 15-17 | Frontend core (auth, layout, dashboard) |
| 8 | 18 | Admin panel frontend |
| 9 | 19 | Finance frontend |
| 10 | 20 | CRM frontend |

**Total: 20 tasks, ~10 phases**
