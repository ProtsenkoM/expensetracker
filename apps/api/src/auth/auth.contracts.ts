export class RegisterCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
  ) {}
}
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
