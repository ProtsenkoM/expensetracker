import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LoginCommand, RegisterCommand } from './auth.contracts.js';
import { GetUserByIdQuery } from '../users/contracts/users.contracts.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}
  register(name: string, email: string, password: string) {
    return this.commands.execute(new RegisterCommand(name, email, password));
  }
  login(email: string, password: string) {
    return this.commands.execute(new LoginCommand(email, password));
  }
  getUser(id: string) {
    return this.queries.execute(new GetUserByIdQuery(id));
  }
}
