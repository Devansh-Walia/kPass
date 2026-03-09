---
name: fullstack-testing-patterns
description: Use when writing tests for Express + Prisma APIs or React components with Vitest, Supertest, and React Testing Library
---

# Fullstack Testing Patterns

## Backend: API Route Tests (Vitest + Supertest)

```typescript
// server/src/routes/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../app"; // Express app (no .listen())
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: { email: "test@koshishFamily.org", passwordHash: await bcrypt.hash("pass123", 10),
        firstName: "Test", lastName: "User", role: "MEMBER", orgId: "test-org-id", isActive: true },
    });
  });
  afterAll(async () => { await prisma.user.deleteMany(); });

  it("returns 200 + tokens for valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "test@koshishFamily.org", password: "pass123" });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "test@koshishFamily.org", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });
});
```

## Backend: Service Unit Test (Mock Prisma)

```typescript
// server/src/services/contactService.test.ts
import { describe, it, expect, vi } from "vitest";
import { contactService } from "./contactService";
import { prisma } from "../lib/prisma";

vi.mock("../lib/prisma", () => ({ prisma: { contact: { findMany: vi.fn(), create: vi.fn() } } }));

it("list returns contacts", async () => {
  const mock = [{ id: "1", name: "Test" }];
  vi.mocked(prisma.contact.findMany).mockResolvedValue(mock as any);
  const result = await contactService.list();
  expect(result).toEqual(mock);
});
```

## Backend: Test App Setup

```typescript
// server/src/app.ts — export app separately from server start
import express from "express";
import "express-async-errors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler";
// ... routes
export const app = express();
app.use(express.json());
app.use(cookieParser());
// mount routes...
app.use(errorHandler);

// server/src/index.ts
import { app } from "./app";
app.listen(process.env.PORT || 4000);
```

## Frontend: Component Test

```tsx
// client/src/pages/Login.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Login from "./Login";

function renderWithProviders(ui: React.ReactElement) {
  return render(<BrowserRouter><AuthProvider>{ui}</AuthProvider></BrowserRouter>);
}

it("shows error on failed login", async () => {
  renderWithProviders(<Login />);
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "bad@test.com" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
  fireEvent.click(screen.getByRole("button", { name: /login/i }));
  await waitFor(() => expect(screen.getByText(/invalid/i)).toBeInTheDocument());
});
```

## Quick Reference

| What | Tool | Pattern |
|------|------|---------|
| API route test | supertest | `request(app).post(url).send(body)` |
| Mock Prisma | vi.mock | `vi.mock("../lib/prisma")` |
| Render with context | RTL | Wrap in Router + AuthProvider |
| Async assertions | waitFor | `await waitFor(() => expect(...))` |
| Auth header | supertest | `.set("Authorization", "Bearer " + token)` |
