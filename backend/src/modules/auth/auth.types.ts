import { Request } from 'express';
import { UserRole, UserStatus } from '@modules/users/user.types';
import { User } from '@modules/users/user.model';
import { AuthAccount } from './auth.model';

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

export type UserWithAuth = User & {
  authAccounts?: AuthAccount[];
};

export interface JwtPayloadVal {
  sub: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  deviceId: string;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  mobile: string;
  role: UserRole;
  status: UserStatus
  tokenVersion?: string;
  deviceId?: string;
}

export type ClientInfo = {
  ip: string;
  userAgent?: string;
};

export interface AuthenticatedRequest extends Request {
  // user: {
  //   id: string;
  //   email: string;
  //   mobile: string;
  //   role: UserRole;
  //   status: UserStatus;
  //   tokenVersion: string;
  // };
  user: JwtPayload;
  /**
   * Client metadata (from middleware)
   */
  clientInfo?: ClientInfo
}

export interface RefreshTokenPayloadVal {
  sub: string;
  tokenId: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  tokenVersion: string,
  deviceId?: string; 
}

export interface StoredRefreshToken {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  deviceId: string;
  revoked: boolean;
}
