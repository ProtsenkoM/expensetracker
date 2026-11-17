import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { RegisterHandler, LoginHandler } from './auth.handlers.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256' as const, expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterHandler,
    LoginHandler,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [JwtModule],
})
export class AuthModule {}
