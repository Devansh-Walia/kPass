import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "@prisma/client";

interface TokenPayload {
  userId: string;
  role: Role;
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
