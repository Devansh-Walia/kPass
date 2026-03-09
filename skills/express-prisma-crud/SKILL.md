---
name: express-prisma-crud
description: Use when building CRUD API routes with Express, Prisma, and Zod validation in TypeScript
---

# Express + Prisma CRUD Pattern

## Core Pattern

Route → Validator → Service → Prisma. Routes are thin. Services hold logic.

## Response Format

```typescript
// Success: { data: T }
res.status(200).json({ data: users });
// Error: { error: string }
res.status(400).json({ error: "Email already exists" });
```

## Validator (Zod)

```typescript
// server/src/validators/contacts.ts
import { z } from "zod";
export const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;
```

## Service

```typescript
// server/src/services/contactService.ts
import { prisma } from "../lib/prisma";
import { CreateContactInput } from "../validators/contacts";

export const contactService = {
  list: () => prisma.contact.findMany({ orderBy: { createdAt: "desc" } }),
  getById: (id: string) => prisma.contact.findUnique({ where: { id } }),
  create: (data: CreateContactInput, userId: string) =>
    prisma.contact.create({ data: { ...data, createdById: userId } }),
  update: (id: string, data: Partial<CreateContactInput>) =>
    prisma.contact.update({ where: { id }, data }),
  delete: (id: string) => prisma.contact.delete({ where: { id } }),
};
```

## Route

```typescript
// server/src/routes/contacts.ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireAppAccess } from "../middleware/appAccess";
import { contactService } from "../services/contactService";
import { createContactSchema } from "../validators/contacts";

const router = Router();
router.use(authenticate, requireAppAccess("crm"));

router.get("/", async (req, res) => {
  const contacts = await contactService.list();
  res.json({ data: contacts });
});

router.post("/", async (req, res) => {
  const body = createContactSchema.parse(req.body); // throws ZodError → caught by error handler
  const contact = await contactService.create(body, req.user!.id);
  res.status(201).json({ data: contact });
});

router.patch("/:id", async (req, res) => {
  const contact = await contactService.update(req.params.id, req.body);
  res.json({ data: contact });
});

export default router;
```

## Middleware Chain

```
authenticate → requireAdmin (if admin-only) → requireAppAccess(slug) → handler
```

## Error Handler (global)

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

## Mount Pattern

```typescript
// server/src/index.ts
app.use("/api/apps/crm/contacts", contactRoutes);
```
