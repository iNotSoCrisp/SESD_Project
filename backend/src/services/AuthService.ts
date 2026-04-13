import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../errors/AppError';
import type { IAuthRepository, UserRecord } from '../repositories/interfaces/IAuthRepository';

export interface AuthResult {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly createdAt: Date;
  };
  readonly token: string;
}

export interface AuthServiceDependencies {
  readonly authRepository: IAuthRepository;
  readonly jwtSecret: string;
}

export class AuthService {
  private readonly authRepository: IAuthRepository;
  private readonly jwtSecret: string;

  constructor(dependencies: AuthServiceDependencies) {
    this.authRepository = dependencies.authRepository;
    this.jwtSecret = dependencies.jwtSecret;
  }

  async register(
    email: string,
    username: string,
    password: string,
  ): Promise<AuthResult> {
    const existing = await this.authRepository.findByEmail(email);
    if (existing !== null) {
      throw new ConflictError('An account with this email already exists.');
    }

    const user = await this.authRepository.create({
      email,
      username,
      password,
    });

    const token = this.signToken(user);

    return {
      user: this.toPublicUser(user),
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.authRepository.findByEmail(email);
    if (user === null) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const token = this.signToken(user);

    return {
      user: this.toPublicUser(user),
      token,
    };
  }

  private signToken(user: UserRecord): string {
    return jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '24h' },
    );
  }

  private toPublicUser(user: UserRecord): AuthResult['user'] {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
