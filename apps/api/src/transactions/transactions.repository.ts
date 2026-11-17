import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  CreateTransactionDto,
  ListTransactionsDto,
  UpdateTransactionDto,
} from './transactions.dto.js';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}
  private async lockCategory(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId: string,
  ) {
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "Category" WHERE id = ${categoryId}::uuid AND "userId" = ${userId}::uuid FOR KEY SHARE`;
    if (!rows.length) throw new NotFoundException();
  }
  create(userId: string, data: CreateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.lockCategory(tx, userId, data.categoryId);
      return tx.transaction.create({
        data: { ...data, date: new Date(data.date), userId },
      });
    });
  }
  list(userId: string, filters: ListTransactionsDto) {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        type: filters.type,
        categoryId: filters.categoryId,
        date: {
          gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
        },
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }
  find(userId: string, id: string) {
    return this.prisma.transaction.findFirst({ where: { id, userId } });
  }
  update(userId: string, id: string, data: UpdateTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "Transaction" WHERE id = ${id}::uuid AND "userId" = ${userId}::uuid FOR UPDATE`;
      if (!rows.length) throw new NotFoundException();
      if (data.categoryId) await this.lockCategory(tx, userId, data.categoryId);
      return tx.transaction.update({
        where: { id },
        data: { ...data, date: data.date ? new Date(data.date) : undefined },
      });
    });
  }
  remove(userId: string, id: string) {
    return this.prisma.transaction.deleteMany({ where: { id, userId } });
  }
  summary(userId: string, start: Date, end: Date) {
    return this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: start, lt: end } },
      _sum: { amount: true },
    });
  }
}
