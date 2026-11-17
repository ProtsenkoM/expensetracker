import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.js';
import { HealthModule } from './health/health.module.js';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    HealthModule,
    CqrsModule.forRoot(),
    UsersModule,
    AuthModule,
    CategoriesModule,
    TransactionsModule,
  ],
})
export class AppModule {}
