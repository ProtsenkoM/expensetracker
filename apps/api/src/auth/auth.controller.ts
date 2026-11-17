import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { Public } from './public.decorator.js';

class RegisterDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string;
  @IsEmail() @MaxLength(320) email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}
class LoginDto {
  @IsEmail() @MaxLength(320) email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @Post('register') register(@Body() body: RegisterDto) {
    return this.auth.register(body.name, body.email, body.password);
  }
  @Public() @Post('login') @HttpCode(HttpStatus.OK) login(
    @Body() body: LoginDto,
  ) {
    return this.auth.login(body.email, body.password);
  }
  @Get('me') me(@CurrentUser() user: unknown) {
    return user;
  }
}
