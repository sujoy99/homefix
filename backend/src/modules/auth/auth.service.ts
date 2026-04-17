import bcrypt from 'bcrypt';
import { User as U, UserResgistrationRequest, UserRole, UserStatus } from '@modules/users/user.types';
import { LoginDTO, RegisterDTO, UserLoginDTO, UserRegistrationDTO } from './auth.dto';
import { AuthRepository } from './auth.repository';
import { DuplicateError, UnauthorizedError } from '@errors/http-errors';
import {
  accessTokenGeneration,
  decodeRefreshToken,
  generateAccessToken,
  generateJwtPayload,
  generateRefreshToken,
  jwtPayloadGeneration,
  refreshTokenGeneration,
  sanitizeUser,
  verifyRefreshToken,
} from '@modules/auth/auth.jwt';
import { RefreshTokenStore } from '@modules/auth/token.store';
import { UserStore } from '@modules/users/user.store';
import { ErrorCode } from '@errors/error-code';
import { User } from '@modules/users/user.model';
import { AuthMethod, JwtPayloadVal, JwtPayload, RefreshTokenPayload, ClientInfo } from './auth.types';
import { mapToUserRegistrationResponse } from './auth.mapper';
import { UserRepository } from '@modules/users/user.repository';
import { RefreshTokenService } from './refresh_token.service';
import { transaction } from 'objection';
import { RefreshToken } from './refresh_token.model';
import { AuthAccount } from './auth.model';
import { logger } from '@logger/logger';

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
    const user: U = await AuthRepository.create({
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
   * Register New User
   * ============================
   * Flow:
   * 1. Check if user already exists
   * 2. Hash password
   * 3. Persist user
   * 4. Generate tokens
   */
  static async registerUser(data: UserRegistrationDTO) {
    // const { name, email, password, role } = data;
    const {
      full_name,
      mobile,
      nid,
      latitude,
      longitude,
      role,
      email,
      password,
      auth_method = AuthMethod.PASSWORD,
      photo_url,
      nid_photo_url,
    } = data;

    let hashedPassword = undefined;
  
    /**
     * 1. Check for existing user
     * - Prevent duplicate accounts
     * - Mobile is unique identifier
     */
    const existingUser = await AuthRepository.findByMobile(mobile);
    if (existingUser) {
      throw new DuplicateError(
        ErrorCode.ALREADY_EXISTS,
        'User already exists with this mobile number'
      );
    }

     /**
     * 2. Determine status
     */
    const status =
      role === UserRole.PROVIDER ? UserStatus.PENDING : UserStatus.ACTIVE;

    /**
     * 2. Hash password
     * - Never store plain text password
     * - Cost factor 12 is production safe
     */
    if(password !== undefined){
      hashedPassword = await this.hashPassword(password);
      // provider = AuthMethod.PASSWORD;
    }
    

    /**
     * 3. Create user in DB
     * - Repository abstracts DB/ORM logic
     * - Service remains framework-agnostic
     */
    const payload: UserResgistrationRequest = {
      full_name,
      mobile,
      nid,
      role,
      latitude,
      longitude,
      ...(email !== undefined && { email }),
      ...(hashedPassword !== undefined && { hashedPassword }),
      auth_method,
      status,
      ...(photo_url !== undefined && { photo_url }),
      ...(nid_photo_url !== undefined && { nid_photo_url }),
    };

    const result = await AuthRepository.createUser(payload);

    return mapToUserRegistrationResponse(result.user, result.auth);
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
    const jwtPayload = jwtPayloadGeneration(user, deviceId);
    const accessToken = accessTokenGeneration(jwtPayload);
    const { token: refreshToken, tokenId } = refreshTokenGeneration(user.id);

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
   * Login User
   * ============================
   * Flow:
   * 1. Find user by mobile/email with auth
   * 2. Compare password
   * 3. Generate tokens
   */
  static async loginUser(data: UserLoginDTO, clientInfo?: ClientInfo) {
    const { method, deviceId } = data;

    /**
     * ============================
     * 1. Resolve identifier
     * ============================
     */
    let identifier =
      'mobile' in data ? data.mobile : data.email;
    
    if (!identifier) {
      throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS,'Invalid mobile/email or password');
    }

    /**
     * ============================
     * 2. Fetch user + auth account
     * ============================
     */
    const user = await UserRepository.findUserWithAuth(identifier, method);
    if (!user) {
      throw new UnauthorizedError(ErrorCode.INVALID_CREDENTIALS,'Invalid mobile/email or password');
    }

    /**
     * ============================
     * 3. Check user status
     * ============================
     */
    this.ensureUserIsActive(user);

    /**
     * ============================
     * 4. Extract auth account safely
     * ============================
     */
    const authAccount = user.authAccounts?.find(
      (a) => a.auth_method === method
    );

     if (!authAccount) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_METHOD_NOT_AVAILABLE,
        `${method} login not enabled`
      );
    }

     /**
     * ============================
     * 5. PASSWORD FLOW
     * ============================
     */
    if (method === AuthMethod.PASSWORD) {
      const { password } = data;

      const now = new Date();

      /**
       * Check account lock
       */
      if (
        authAccount.lock_until &&
        new Date(authAccount.lock_until) > now
      ) {
        throw new UnauthorizedError(
          ErrorCode.ACCOUNT_LOCKED,
          'Account locked'
        );
      }

      /**
       * Compare password (bcrypt safe)
       */
      const isPasswordValid = await this.comparePassword(
        password,
        authAccount.password_hash!
      );

      if (!isPasswordValid) {
        await this.handleFailedLogin(authAccount) // increament failed login
        throw new UnauthorizedError(
          ErrorCode.INVALID_CREDENTIALS,
          'Invalid credentials'
        );
      }
    }

    /**
     * OTP FLOW (future)
     */
    if (method === 'otp') {
      throw new UnauthorizedError(
        ErrorCode.NOT_IMPLEMENTED,
        'Use OTP verify API'
      );
    }

    /**
     * GOOGLE FLOW (future)
     */
    if (method === 'google') {
      throw new UnauthorizedError(
        ErrorCode.NOT_IMPLEMENTED,
        'Use Google OAuth API'
      );
    }

    /**
     * ============================
     * 8. NEW DEVICE DETECTION
     * (only AFTER successful authentication)
     * ============================
     */
    const isNewDevice = await this.isNewDevice(
      user.id,
      deviceId,
      clientInfo?.userAgent
    );

    if (isNewDevice) {
      logger.info('New device login detected', {
        userId: user.id,
        deviceId,
        ip: clientInfo?.ip,
        userAgent: clientInfo?.userAgent,
      });

      /**
       * Future:
       * - send email alert
       * - require OTP
       */
    } 

    /**
     * ============================
     * 9. TRANSACTION
     * Ensures consistency:
     * - mark login success
     * - store refresh token
     * ============================
     */

    const { accessToken, refreshToken } = await transaction(
      AuthAccount.knex(),
      async (trx) => {
        /**
         * Reset failed attempts + update last login
         */
        await AuthRepository.markLoginSuccess(authAccount.id, trx);

        /**
         * Build JWT payload
         */
        const jwtPayload: JwtPayload = {
          sub: user.id,
          mobile: user.mobile,
          role: user.role,
          status: user.status,
          tokenVersion: authAccount.refresh_token_version,
          ...(deviceId !== undefined && { deviceId }),
        };

        /**
         * Generate access token
         */
        const accessToken = generateAccessToken(jwtPayload);

        /**
         * Generate refresh token
         */
        const { token: refreshToken, tokenId } =
          generateRefreshToken(user.id, authAccount, deviceId);

        /**
         * Store refresh token in DB
         */
        await RefreshTokenService.storeToken(
          {
            tokenId,
            userId: user.id,
            authAccountId: authAccount.id,
            deviceId,
            refreshTokenVersion: authAccount.refresh_token_version,

            /**
             * IMPORTANT:
             * Only include fields if defined
             */
            ...(clientInfo?.ip !== undefined && {
              ipAddress: clientInfo.ip,
            }),
            ...(clientInfo?.userAgent !== undefined && {
              userAgent: clientInfo.userAgent,
            }),
          },
          trx
        );

        return { accessToken, refreshToken };
      }
    );

    return {
      user: user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  private static async handleFailedLogin(authAccount: AuthAccount) {
    const attempts = (authAccount.failed_attempts ?? 0) + 1;

    let lockUntil: Date | null = null;

    if (attempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    }

    await AuthRepository.updateFailedAttempts(
      authAccount.id,
      attempts,
      lockUntil
    );
  }

  private static ensureUserIsActive(user: any) {
    if (user.status === 'pending') {
      throw new UnauthorizedError(
        ErrorCode.ACCOUNT_NOT_APPROVED,
        'Pending admin approval'
      );
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError(
        ErrorCode.ACCOUNT_INACTIVE,
        'Account inactive'
      );
    }
  }

  /**
   * ============================
   * Refresh Token (ROTATION)
   * ============================
   */
  static async refreshVal(refreshToken: string) {
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

    const { token: newRefreshToken, tokenId } = refreshTokenGeneration(
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
    const accessToken = accessTokenGeneration({
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

  static async refresh(refreshToken: string, clientInfo?: ClientInfo) {
    /**
     * ============================
     * 1. Verify JWT
     * ============================
     */
    const payload = verifyRefreshToken(refreshToken);

    const { tokenId, sub: userId, tokenVersion, deviceId } = payload;

    /**
     * ============================
     * 2. Fetch token from DB
     * ============================
     */
    const storedToken = await RefreshTokenService.findToken(tokenId);

    if (!storedToken) {
      throw new UnauthorizedError(
        ErrorCode.REFRESH_TOKEN_INVALID,
        'Invalid refresh token'
      );
    }

    /**
     * ============================
     * 3. User consistency check
     * ============================
     */
    if (storedToken.user_id !== userId) {
      throw new UnauthorizedError(
        ErrorCode.REFRESH_TOKEN_INVALID,
        'Token user mismatch'
      );
    }

    /**
     * ============================
     * 4. Reuse detection
     * ============================
     */
    if (storedToken.is_revoked) {
      await AuthRepository.invalidateAllUserSessions(userId);

      throw new UnauthorizedError(
        ErrorCode.REFRESH_TOKEN_REUSED,
        'Refresh token reuse detected'
      );
    }

     /**
     * ============================
     * 5. Expiry check
     * ============================
     */
    const now = new Date();
    if (storedToken.expires_at < now) {
      throw new UnauthorizedError(
        ErrorCode.REFRESH_TOKEN_EXPIRED,
        'Refresh token expired'
      );
    }

    /**
     * ============================
     * 6. Load related entities
     * ============================
     */
    const user = storedToken.user;
    const authAccount = storedToken.authAccount;

    if (!user || !authAccount) {
      throw new UnauthorizedError(
        ErrorCode.AUTH_ACCOUNT_NOT_FOUND,
        'Auth account not found'
      );
    }

    /**
     * ============================
     * 7. Version check
     * ============================
     */
    if (tokenVersion !== authAccount.refresh_token_version) {
      throw new UnauthorizedError(
        ErrorCode.REFRESH_TOKEN_INVALID,
        'Token version mismatch'
      );
    }

    /**
     * ============================
     * 8. Suspicious Activity Detection
     * ============================
     */
    const ipChanged =
      clientInfo?.ip &&
      storedToken.ip_address &&
      clientInfo.ip !== storedToken.ip_address;

    const uaChanged =
      clientInfo?.userAgent &&
      storedToken.user_agent &&
      clientInfo.userAgent !== storedToken.user_agent;

    if (ipChanged || uaChanged) {
      logger.warn('Suspicious refresh attempt', {
        userId,
        tokenId,
        oldIp: storedToken.ip_address,
        newIp: clientInfo?.ip,
        oldUA: storedToken.user_agent,
        newUA: clientInfo?.userAgent,
      });

      /**
       * Phase 1:
       * - Only log (do NOT block)
       *
       * Future:
       * - mark suspicious
       * - notify user
       * - risk scoring
       */
    }

    /**
     * ============================
     * 9. Rotate Refresh Token (Atomic)
     * ============================
     */
    const { newRefreshToken } = await transaction(
      RefreshToken.knex(),
      async (trx) => {
        await RefreshTokenService.revokeToken(tokenId, trx);

        const { token, tokenId: newTokenId } =
          generateRefreshToken(userId, authAccount, deviceId);

        await RefreshTokenService.storeToken(
          {
            tokenId: newTokenId,
            userId,
            authAccountId: authAccount.id,
            ...(deviceId && { deviceId }),
            refreshTokenVersion: authAccount.refresh_token_version,
          },
          trx
        );

        return { newRefreshToken: token };
      }
    );

    /**
     * ============================
     * 10. Generate Access Token
     * ============================
     */
    const jwtPayload: JwtPayload = {
      sub: userId,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      tokenVersion: tokenVersion,
      ...(deviceId !== undefined && { deviceId }),
    };

    const accessToken = generateAccessToken(jwtPayload);

     /**
     * ============================
     * 11. Return Tokens
     * ============================
     */
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * ============================
   * Logout (Revoke Refresh Token) (Single Device)
   * ============================
   */
  static async logoutVal(refreshToken: string) {
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

  static async logout(refreshToken: string) {
    let payload: RefreshTokenPayload | null = null;

    /**
     * 1. Verify token (but tolerate expired)
     */
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err: any) {
      // If expired → still decode safely
      payload = decodeRefreshToken(refreshToken);

      if (!payload?.tokenId) {
        return; // idempotent
      }
    }

    const { tokenId } = payload;

    /**
     * 2. Fetch from DB
     */
    const storedToken = await RefreshTokenService.findToken(tokenId);

    if (!storedToken) {
      return; // idempotent logout
    }

    /**
     * 3. Revoke token (safe even if already revoked)
     */
    await RefreshTokenService.revokeToken(tokenId);
  }

  /**
   * ============================
   * Logout all devices
   * ============================
   */
  static async logoutAllVal(userId: string) {
    // 1. Revoke all refresh token
    RefreshTokenStore.revokeAll(userId);

    // 2. Increment tokenVersion
    UserStore.incrementTokenVersion(userId);
  }

  static async logoutAll(userId: string) {
    await transaction(RefreshToken.knex(), async (trx) => {
      await Promise.all([
        /**
         * 1. Revoke all refresh tokens
         */
        RefreshToken.query(trx)
          .patch({ is_revoked: true })
          .where('user_id', userId),

        /**
         * 2. Rotate version
         */
        AuthAccount.query(trx)
          .patch({
            refresh_token_version: AuthAccount.knex().raw('gen_random_uuid()'),
          })
          .where('user_id', userId),
      ]);
    });
  }

  /**
   * ============================
   * New Device Detection Helpers
   * ============================
   */

  static async isNewDevice(
    userId: string,
    deviceId?: string,
    userAgent?: string
  ): Promise<boolean> {
    if (!deviceId && !userAgent) return false;

    const existing = await RefreshToken.query()
      .where('user_id', userId)
      .where((builder) => {
        if (deviceId) builder.where('device_id', deviceId);
        if (userAgent) builder.orWhere('user_agent', userAgent);
      })
      .first();

    return !existing;
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
