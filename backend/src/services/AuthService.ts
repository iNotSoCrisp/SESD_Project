import * as bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ConflictError, UnauthorizedError } from '../errors'
import type { UserRecord, AuthResult, CreateUserDto } from '../types'
import type { IAuthRepository } from '../repositories/AuthRepository'

export class AuthService {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly jwtSecret: string,
  ) {}

  async register(email: string, username: string, password: string): Promise<AuthResult> {
    const existingEmail = await this.authRepo.findByEmail(email)
    if (existingEmail) throw new ConflictError('An account with this email already exists.')
    const existingUsername = await this.authRepo.findByUsername(username)
    if (existingUsername) throw new ConflictError('An account with this username already exists.')
    const user = await this.authRepo.create({ email, username, password })
    return { user: this.toPublic(user), token: this.sign(user) }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.authRepo.findByEmail(email)
    if (!user) throw new UnauthorizedError('Invalid email or password.')
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedError('Invalid email or password.')
    return { user: this.toPublic(user), token: this.sign(user) }
  }

  private sign(u: UserRecord): string {
    return jwt.sign({ userId: u.id, email: u.email }, this.jwtSecret, { expiresIn: '24h' })
  }
  private toPublic(u: UserRecord): AuthResult['user'] {
    return { id: u.id, email: u.email, username: u.username, createdAt: u.createdAt }
  }
}
