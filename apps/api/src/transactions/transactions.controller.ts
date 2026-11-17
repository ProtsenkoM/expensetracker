import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { PublicUser } from '../users/contracts/users.contracts.js';
import {
  CreateTransactionDto,
  ListTransactionsDto,
  SummaryTransactionsDto,
  UpdateTransactionDto,
} from './transactions.dto.js';
import { TransactionsService } from './transactions.service.js';
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}
  @Post() create(
    @CurrentUser() user: PublicUser,
    @Body() body: CreateTransactionDto,
  ) {
    return this.transactions.create(user.id, body);
  }
  @Get() list(
    @CurrentUser() user: PublicUser,
    @Query() query: ListTransactionsDto,
  ) {
    return this.transactions.list(user.id, query);
  }
  @Get('summary') summary(
    @CurrentUser() user: PublicUser,
    @Query() query: SummaryTransactionsDto,
  ) {
    return this.transactions.summary(user.id, query.month, query.year);
  }
  @Get(':id') find(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactions.find(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTransactionDto,
  ) {
    return this.transactions.update(user.id, id, body);
  }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactions.remove(user.id, id);
  }
}
