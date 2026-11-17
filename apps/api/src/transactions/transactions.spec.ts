import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Prisma } from '../generated/prisma/client.js';
import {
  CreateTransactionDto,
  ListTransactionsDto,
  SummaryTransactionsDto,
  UpdateTransactionDto,
} from './transactions.dto.js';
import { TransactionsService } from './transactions.service.js';

const valid = {
  amount: '0.10',
  type: 'Income',
  date: '2026-01-01T00:00:00Z',
  categoryId: '8b8fd537-4a17-4eb3-a997-020f3e25c5ad',
};
test('transaction validation rejects invalid inputs and accepts nullable description', async () => {
  const check = (data: object) =>
    validate(plainToInstance(CreateTransactionDto, data), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  assert.equal((await check({ ...valid, description: null })).length, 0);
  for (const data of [
    { ...valid, amount: '0' },
    { ...valid, amount: '-1' },
    { ...valid, amount: '1.001' },
    { ...valid, amount: '1e2' },
    { ...valid, amount: 1 },
    { ...valid, type: 'Other' },
    { ...valid, date: '2026-01-01' },
    { ...valid, categoryId: 'bad' },
    { ...valid, userId: 'other' },
  ])
    assert.ok((await check(data)).length);
  assert.equal(
    (
      await validate(
        plainToInstance(UpdateTransactionDto, { description: null }),
      )
    ).length,
    0,
  );
  assert.ok(
    (await validate(plainToInstance(UpdateTransactionDto, { amount: null })))
      .length,
  );
  assert.ok(
    (
      await validate(
        plainToInstance(ListTransactionsDto, { dateFrom: 'invalid' }),
      )
    ).length,
  );
  assert.ok(
    (
      await validate(
        plainToInstance(SummaryTransactionsDto, { month: '13', year: '2026' }),
      )
    ).length,
  );
});
test('summary uses UTC month boundaries and precise decimal arithmetic', async () => {
  let args: unknown[] = [];
  const service = new TransactionsService({
    summary: async (...input: unknown[]) => {
      args = input;
      return [
        { type: 'Income', _sum: { amount: new Prisma.Decimal('0.30') } },
        { type: 'Expense', _sum: { amount: new Prisma.Decimal('0.40') } },
      ];
    },
  } as never);
  assert.deepEqual(await service.summary('owner', 12, 2026), {
    totalIncome: '0.30',
    totalExpense: '0.40',
    balance: '-0.10',
  });
  assert.deepEqual(args, [
    'owner',
    new Date('2026-12-01T00:00:00Z'),
    new Date('2027-01-01T00:00:00Z'),
  ]);
  await assert.rejects(service.update('owner', 'id', {}), { status: 400 });
  await assert.rejects(
    service.list('owner', {
      dateFrom: '2026-02-01T00:00:00Z',
      dateTo: '2026-01-01T00:00:00Z',
    }),
    { status: 400 },
  );
});
