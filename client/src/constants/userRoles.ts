export const UserRole = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Badge colors keyed by user role. */
export const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  MEMBER: "bg-gray-100 text-gray-700",
};
