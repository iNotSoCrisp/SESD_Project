export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string;
  readonly firstName?: string | undefined;
  readonly lastName?: string | undefined;
  readonly createdAt: Date;
}

export interface CreateUserDto {
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly firstName?: string | undefined;
  readonly lastName?: string | undefined;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: CreateUserDto): Promise<UserRecord>;
}
