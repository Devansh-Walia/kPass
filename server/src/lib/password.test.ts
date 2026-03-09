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
