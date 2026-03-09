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
    app: { findUnique: vi.fn() },
    userApp: { findUnique: vi.fn() },
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

  it("returns 404 if app not found", async () => {
    vi.mocked(prisma.app.findUnique).mockResolvedValue(null);
    const res = await request(app).get("/finance").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
