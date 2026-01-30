import bcrypt from 'bcrypt';
import { User } from '@modules/users/user.types';
import { LoginDTO, RegisterDTO } from './auth.dto';
import { AuthRepository } from './auth.repository';
import { DuplicateError, UnauthorizedError } from '@errors/http-errors';
import {
  generateAccessToken,
  generateJwtPayload,
  generateRefreshToken,
  sanitizeUser,
  verifyRefreshToken,
} from '@modules/auth/auth.jwt';
import { RefreshTokenStore } from '@modules/auth/token.store';
import { UserStore } from '@modules/users/user.store';
import { ErrorCode } from '@errors/error-code';

/**
 * ============================
 * Auth Service
 * ============================
 * Responsibilities:
 * - Handle authentication business logic
 * - Password hashing & verification
 * - JWT generation
 * - Coordinate with repository layer
 *
 * This layer:
 *  Does NOT know about HTTP
 *  Does NOT return Express responses
 *  Does NOT validate input
 */
export class AuthService {
  /**
   * ============================
   * Register New User
   * ============================
   * Flow:
   * 1. Check if user already exists
   * 2. Hash password
   * 3. Persist user
   * 4. Generate tokens
   */
  static async register(data: RegisterDTO) {
    const { name, email, password, role } = data;

    /**
     * 1. Check for existing user
     * - Prevent duplicate accounts
     * - Email is unique identifier
     */
    const existingUser = await AuthRepository.findByEmail(email);
    if (existingUser) {
      throw new DuplicateError(
        ErrorCode.ALREADY_EXISTS,
        'User already exists with this email'
      );
    }

    /**
     * 2. Hash password
     * - Never store plain text password
     * - Cost factor 12 is production safe
     */
    const hashedPassword = await this.hashPassword(password);

    /**
     * 3. Create user in DB
     * - Repository abstracts DB/ORM logic
     * - Service remains framework-agnostic
     */
    const user: User = await AuthRepository.create({
      name,
      email,
      password: hashedPassword,
      role, // RESIDENT | PROVIDER only
    });

    /**
     * 4. Generate JWT tokens
     * - Access token → short lived
     * - Refresh token → long lived
     */
    // const jwtPayload = generateJwtPayload(user);
    // const accessToken = generateAccessToken(jwtPayload);
    // const refreshToken = generateRefreshToken(jwtPayload);

    /**
     * 5. Return safe response
     * - Never expose password
     */
    return {
      user: sanitizeUser(user),
      // tokens: {
      //   accessToken,
      //   refreshToken,
      // },
    };
  }

  /**
   * ============================
   * Login User
   * ============================
   * Flow:
   * 1. Find user by email
   * 2. Compare password
   * 3. Generate tokens
   */
  static async login(data: LoginDTO) {
    const { email, password, deviceId } = data;

    /**
     * 1. Find user
     */
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS,'Invalid email or password');
    }

    /**
     * 2. Compare password
     * - bcrypt handles timing-safe comparison
     */
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS,'Invalid email or password');
    }

    /**
     * 3. Generate tokens
     */
    const jwtPayload = generateJwtPayload(user, deviceId);
    const accessToken = generateAccessToken(jwtPayload);
    const { token: refreshToken, tokenId } = generateRefreshToken(user.id);

    RefreshTokenStore.save(tokenId, {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      deviceId: deviceId,
    });

    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * ============================
   * Refresh Token (ROTATION)
   * ============================
   */
  static async refresh(refreshToken: string) {
    /**
     * 1. Verify refresh token signature & expiry
     */
    const payload = verifyRefreshToken(refreshToken);

    /**
     * 2. Validate token in store
     */
    const stored = RefreshTokenStore.get(payload.tokenId);
    if (!stored || stored.revoked) {
      throw new UnauthorizedError(ErrorCode.REFRESH_TOKEN_REVOKED,'Refresh token revoked');
    }

    /**
     * 3. Rotate refresh token (CRITICAL)
     */
    RefreshTokenStore.revoke(payload.tokenId);

    const { token: newRefreshToken, tokenId } = generateRefreshToken(
      payload.sub
    );

    RefreshTokenStore.save(tokenId, {
      id: stored.userId,
      email: stored.email,
      role: stored.role,
      tokenVersion: stored.tokenVersion,
      deviceId: stored.deviceId,
    });

    /**
     * 4. Issue new access token
     */
    const accessToken = generateAccessToken({
      sub: stored.userId,
      email: stored.email,
      role: stored.role,
      tokenVersion: stored.tokenVersion,
      deviceId: stored.deviceId,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * ============================
   * Logout (Revoke Refresh Token)
   * ============================
   */
  static async logout(refreshToken: string) {
    /**
     * 1. Verify refresh token signature & expiry
     */
    const payload = verifyRefreshToken(refreshToken);

    /**
     * 2. Validate token in store
     */
    const stored = RefreshTokenStore.get(payload.tokenId);
    if (!stored) {
      // Idempotent logout
      return;
    }

    RefreshTokenStore.revoke(payload.tokenId);
  }

  /**
   * ============================
   * Logout all devices
   * ============================
   */
  static async logoutAll(userId: string) {
    // 1. Revoke all refresh token
    RefreshTokenStore.revokeAll(userId);

    // 2. Increment tokenVersion
    UserStore.incrementTokenVersion(userId);
  }

  /**
   * ============================
   * Password Helpers
   * ============================
   */

  /**
   * Hash password using bcrypt
   */
  private static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compare raw password with hashed password
   */
  private static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
