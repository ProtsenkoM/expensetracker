import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';
import {
  CreateUserHandler,
  GetUserByIdHandler,
  VerifyUserCredentialsHandler,
} from './handlers/users.handlers.js';

@Module({
  imports: [PrismaModule],
  providers: [
    UsersRepository,
    UsersService,
    CreateUserHandler,
    GetUserByIdHandler,
    VerifyUserCredentialsHandler,
  ],
})
export class UsersModule {}
