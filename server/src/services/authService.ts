import { prisma } from "../lib/prisma.js";
import { comparePassword } from "../lib/password.js";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt.js";
import type { Role } from "@prisma/client";

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

  async refresh(userId: string, role: Role) {
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
