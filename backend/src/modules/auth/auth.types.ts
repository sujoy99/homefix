import { Request } from 'express';
import { UserRole } from '@modules/users/user.types';
import { User } from '@modules/users/user.model';

/**
 * Supported auth method in the system
 */
export enum AuthMethod {
  PASSWORD = 'password',
  OTP = 'otp',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

export type CreateUserRepoResult = {
  user: Pick<
    User,
    'id' | 'short_code' | 'full_name' | 'mobile' | 'role' | 'status'
  >;
  auth: {
    id: string;
    auth_method: string;
  };
};

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  deviceId: string;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    tokenVersion: number;
  };
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface StoredRefreshToken {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  deviceId: string;
  revoked: boolean;
}
