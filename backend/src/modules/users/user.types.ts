/**
 * ============================
 * User Domain Types
 * ============================
 * - Framework agnostic
 * - No validation libraries
 * - No ORM dependencies
 * - Used across auth, RBAC, JWT, services
 */

import { UserRole, UserStatus } from '@homefix/shared';
import { AuthMethod } from "@modules/auth/auth.types";

export { UserRole, UserStatus };

/**
 * Core User domain model
 */
export type User = {
  id: string;
  short_code: string;
  full_name: string;
  mobile: string;
  nid: string;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  photo_url?: string | null;
  nid_photo_url?: string | null;
  area?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  updated_at: string;
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

  role: UserRole;

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


