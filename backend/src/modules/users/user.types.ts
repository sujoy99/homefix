/**
 * ============================
 * User Domain Types
 * ============================
 * - Framework agnostic
 * - No validation libraries
 * - No ORM dependencies
 * - Used across auth, RBAC, JWT, services
 */

/**
 * User roles enum
 * - Used in DB
 * - Used in JWT payload
 * - Used in RBAC guards
 */
/**
 * Supported user roles in the system
 * NOTE:
 * - RESIDENT / PROVIDER → public registration
 * - ADMIN → internal / admin panel only
 */
export enum UserRole {
  RESIDENT = 'RESIDENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
}

/**
 * Core User domain model
 */
export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // hashed only
  role: UserRole;
};

/**
 * Input type for creating user
 * (NO id here)
 */
export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole.RESIDENT | UserRole.PROVIDER;
};

