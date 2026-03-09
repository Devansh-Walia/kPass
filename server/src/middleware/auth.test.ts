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
