import {
  CommandHandler,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  CreateUserCommand,
  GetUserByIdQuery,
  VerifyUserCredentialsQuery,
} from '../contracts/users.contracts.js';
import { UsersService } from '../users.service.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly users: UsersService) {}
  execute(command: CreateUserCommand) {
    return this.users.create(command.name, command.email, command.password);
  }
}
@QueryHandler(VerifyUserCredentialsQuery)
export class VerifyUserCredentialsHandler implements IQueryHandler<VerifyUserCredentialsQuery> {
  constructor(private readonly users: UsersService) {}
  execute(query: VerifyUserCredentialsQuery) {
    return this.users.verify(query.email, query.password);
  }
}
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly users: UsersService) {}
  execute(query: GetUserByIdQuery) {
    return this.users.findById(query.id);
  }
}
