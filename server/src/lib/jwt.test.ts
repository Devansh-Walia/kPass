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
