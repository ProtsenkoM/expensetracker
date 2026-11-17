export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
export class CreateUserCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
  ) {}
}
export class VerifyUserCredentialsQuery {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
export class GetUserByIdQuery {
  constructor(public readonly id: string) {}
}
