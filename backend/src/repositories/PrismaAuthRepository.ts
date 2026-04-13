import * as bcrypt from 'bcrypt';
import type { CreateUserDto, IAuthRepository, UserRecord } from './interfaces/IAuthRepository';
import { prisma } from './prisma';

const SALT_ROUNDS = 12;

export class PrismaAuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const record = await prisma.user.findUnique({
      where: { email },
    });

    if (record === null) {
      return null;
    }

    return this.toUserRecord(record);
  }

  async create(data: CreateUserDto): Promise<UserRecord> {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const created = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
      },
    });

    return this.toUserRecord(created);
  }

  private toUserRecord(record: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
  }): UserRecord {
    return {
      id: record.id,
      email: record.email,
      username: record.username,
      passwordHash: record.passwordHash,
      firstName: record.firstName ?? undefined,
      lastName: record.lastName ?? undefined,
      createdAt: record.createdAt,
    };
  }
}
