export const env = {
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  accessTokenExpiry: "15m" as const,
  refreshTokenExpiry: "7d" as const,
  refreshCookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};
