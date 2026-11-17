import {
  CommandHandler,
  ICommandHandler,
  CommandBus,
  QueryBus,
} from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import {
  CreateUserCommand,
  VerifyUserCredentialsQuery,
} from '../users/contracts/users.contracts.js';
import { LoginCommand, RegisterCommand } from './auth.contracts.js';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly commands: CommandBus,
    private readonly jwt: JwtService,
  ) {}
  async execute(command: RegisterCommand) {
    const user = await this.commands.execute(
      new CreateUserCommand(command.name, command.email, command.password),
    );
    return {
      user,
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly queries: QueryBus,
    private readonly jwt: JwtService,
  ) {}
  async execute(command: LoginCommand) {
    const user = await this.queries.execute(
      new VerifyUserCredentialsQuery(command.email, command.password),
    );
    if (!user)
      throw new (await import('@nestjs/common')).UnauthorizedException(
        'Invalid credentials',
      );
    return {
      user,
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
