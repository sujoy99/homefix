import { Request } from 'express';
import { UserRole, UserStatus } from '@modules/users/user.types';
import { User } from '@modules/users/user.model';
import { AuthAccount } from './auth.model';

export { AuthMethod } from '@homefix/shared';

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
  home_lat?: number | null;
  home_lon?: number | null;
};

export interface JwtPayload {
  sub: string;
  email?: string | null | undefined;
  mobile: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: string;
  deviceId?: string | undefined;
}

export type ClientInfo = {
  ip: string;
  userAgent?: string;
};

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  /**
   * Client metadata (from middleware)
   */
  clientInfo?: ClientInfo;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  tokenVersion: string;
  deviceId?: string;
}

