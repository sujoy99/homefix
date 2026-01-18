import bcrypt from 'bcrypt';
import { User } from '@modules/users/user.types';
import { AppError } from '@errors/app-error';
import { LoginDTO, RegisterDTO } from './auth.dto';
import { AuthRepository } from './auth.repository';
import { UnauthorizedError } from '@errors/http-errors';
import { generateAccessToken, generateJwtPayload, generateRefreshToken, sanitizeUser, }
  from '@modules/auth/auth.jwt';

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
      throw new AppError('User already exists with this email', 409);
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
    const jwtPayload = generateJwtPayload(user);
    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    /**
     * 5. Return safe response
     * - Never expose password
     */
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
   * 1. Find user by email
   * 2. Compare password
   * 3. Generate tokens
   */
  static async login(data: LoginDTO) {
    const { email, password } = data;

    /**
     * 1. Find user
     */
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    /**
     * 2. Compare password
     * - bcrypt handles timing-safe comparison
     */
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    /**
     * 3. Generate tokens
     */
    const jwtPayload = generateJwtPayload(user);
    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

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
