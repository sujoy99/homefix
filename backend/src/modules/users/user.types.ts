/**
 * ============================
 * User Domain Types
 * ============================
 * - Framework agnostic
 * - No validation libraries
 * - No ORM dependencies
 * - Used across auth, RBAC, JWT, services
 */

import { AuthMethod } from "@modules/auth/auth.types";

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
  RESIDENT = 'resident',
  PROVIDER = 'provider',
  ADMIN = 'admin',
}

/**
 * Supported user status in the system
 * NOTE:
 * - ACTIVE → resident users
 * - PENDING → provider initial status when registration
 */
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
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
  tokenVersion: number;
};

/**
 * ============================
 * User Domain Model (V2)
 * ============================
 * Business-aligned (Mobile + NID)
 */
export type UserResgistration = {
  id: string;
  full_name: string;
  mobile: string;
  nid: string;
  email: string;
  password: string; // hashed only

  role: UserRole;

  status: UserStatus;

  area?: {
    latitude: number;
    longitude: number;
  };

  photo_url?: string;
  nid_photo_url?: string;

  created_at?: string;
  updated_at?: string;
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

/**
 * ============================
 * User Registration Request (V2)
 * ============================
 */
export type UserResgistrationRequest = {
  full_name: string;
  mobile: string;
  nid: string;

  role: UserRole.RESIDENT | UserRole.PROVIDER;

  latitude: number;
  longitude: number;

  email?: string,
  hashedPassword?: string,

  auth_method: AuthMethod,

  photo_url?: string; 
  nid_photo_url?: string;

  status: UserStatus.PENDING | UserStatus.ACTIVE;
};

export type UserRegistrationResponse = {
    id: string;
    short_code: string;
    full_name: string;
    mobile: string;
    role: string;
    status: string;
    auth_method: string;
};


