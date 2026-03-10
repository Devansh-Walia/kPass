import type { UserRole } from "../constants/userRoles";

/** Base user shape returned by the users API list/detail endpoints. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

/** Authenticated user shape stored in AuthContext. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  mustChangePassword: boolean;
}
