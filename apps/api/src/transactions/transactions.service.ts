import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import {
  CreateTransactionDto,
  ListTransactionsDto,
  UpdateTransactionDto,
} from './transactions.dto.js';
import { TransactionsRepository } from './transactions.repository.js';

function serialize<T extends { amount: Prisma.Decimal }>(row: T) {
  return { ...row, amount: row.amount.toFixed(2) };
}
@Injectable()
export class TransactionsService {
  constructor(private readonly repository: TransactionsRepository) {}
  async create(userId: string, data: CreateTransactionDto) {
    return serialize(await this.repository.create(userId, data));
  }
  async list(userId: string, filters: ListTransactionsDto) {
    if (
      filters.dateFrom &&
      filters.dateTo &&
      new Date(filters.dateFrom) > new Date(filters.dateTo)
    )
      throw new BadRequestException('Invalid date range');
    const result = await this.repository.list(userId, filters);
    if (filters.page) {
      const [items, total] = result as [
        Awaited<ReturnType<TransactionsRepository['find']>>[],
        number,
      ];
      return {
        items: items.map((item) => serialize(item!)),
        total,
        page: filters.page,
        pageSize: 10,
      };
    }
    return (
      result as NonNullable<
        Awaited<ReturnType<TransactionsRepository['find']>>
      >[]
    ).map(serialize);
  }
  async find(userId: string, id: string) {
    const row = await this.repository.find(userId, id);
    if (!row) throw new NotFoundException();
    return serialize(row);
  }
  async update(userId: string, id: string, data: UpdateTransactionDto) {
    if (!Object.values(data).some((value) => value !== undefined))
      throw new BadRequestException('Update must include a field');
    return serialize(await this.repository.update(userId, id, data));
  }
  async remove(userId: string, id: string) {
    if (!(await this.repository.remove(userId, id)).count)
      throw new NotFoundException();
  }
  async summary(userId: string, month: number, year: number) {
    const start = new Date(0);
    start.setUTCFullYear(year, month - 1, 1);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    const groups = await this.repository.summary(userId, start, end);
    const income =
      groups.find((row) => row.type === 'Income')?._sum.amount ??
      new Prisma.Decimal(0);
    const expense =
      groups.find((row) => row.type === 'Expense')?._sum.amount ??
      new Prisma.Decimal(0);
    return {
      totalIncome: income.toFixed(2),
      totalExpense: expense.toFixed(2),
      balance: income.minus(expense).toFixed(2),
    };
  }
}
