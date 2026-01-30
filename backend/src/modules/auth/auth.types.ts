import { Request } from 'express';
import { UserRole } from '@modules/users/user.types';

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
