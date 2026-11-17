import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { QueryBus } from '@nestjs/cqrs';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { GetUserByIdQuery } from '../users/contracts/users.contracts.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly queries: QueryBus,
  ) {}
  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string }; user?: unknown }>();
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        algorithms: ['HS256'],
      });
      if (!payload.sub) throw new UnauthorizedException();
      const user = await this.queries.execute(
        new GetUserByIdQuery(payload.sub),
      );
      if (!user) throw new UnauthorizedException();
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
