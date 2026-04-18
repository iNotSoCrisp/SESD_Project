import * as bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import type { UserRecord, CreateUserDto } from '../types'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

export interface IAuthRepository {
  findByEmail(email: string): Promise<UserRecord | null>
  findByUsername(username: string): Promise<UserRecord | null>
  create(data: CreateUserDto): Promise<UserRecord>
}

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const r = await prisma.user.findUnique({ where: { email } }); return r ? this.toRecord(r) : null
  }
  async findByUsername(username: string): Promise<UserRecord | null> {
    const r = await prisma.user.findUnique({ where: { username } }); return r ? this.toRecord(r) : null
  }
  async create(data: CreateUserDto): Promise<UserRecord> {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)
    const c = await prisma.user.create({ data: { email: data.email, username: data.username, passwordHash, ...(data.firstName !== undefined && { firstName: data.firstName }), ...(data.lastName !== undefined && { lastName: data.lastName }) } })
    return this.toRecord(c)
  }
  private toRecord(r: { id: string; email: string; username: string; passwordHash: string; firstName: string | null; lastName: string | null; createdAt: Date }): UserRecord {
    return { id: r.id, email: r.email, username: r.username, passwordHash: r.passwordHash, firstName: r.firstName ?? undefined, lastName: r.lastName ?? undefined, createdAt: r.createdAt }
  }
}
