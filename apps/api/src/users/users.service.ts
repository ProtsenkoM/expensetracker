import { ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}
  private publicUser(user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  async create(name: string, email: string, password: string) {
    try {
      return this.publicUser(
        await this.repository.create({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          passwordHash: await argon2.hash(password),
        }),
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('Email already registered');
      throw error;
    }
  }
  async verify(email: string, password: string) {
    const user = await this.repository.findByEmail(email.trim().toLowerCase());
    if (!user || !(await argon2.verify(user.passwordHash, password)))
      return null;
    return this.publicUser(user);
  }
  async findById(id: string) {
    const user = await this.repository.findById(id);
    return user ? this.publicUser(user) : null;
  }
}
