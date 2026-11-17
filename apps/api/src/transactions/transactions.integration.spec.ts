import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

test(
  'transaction HTTP flow, isolation, totals and category deletion',
  { skip: process.env.TRANSACTIONS_INTEGRATION !== '1' },
  async () => {
    process.env.JWT_SECRET = 'transaction-test-secret-at-least-32-bytes';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.PORT = '3001';
    const { AppModule } = await import(
      pathToFileURL(resolve('dist/app.module.js')).href
    );
    const { PrismaService } = await import(
      pathToFileURL(resolve('dist/prisma/prisma.service.js')).href
    );
    const app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const prisma = app.get(PrismaService);
    const ids: string[] = [];
    try {
      await app.listen(0, '127.0.0.1');
      const base = `${await app.getUrl()}/api`;
      async function req(
        path: string,
        method = 'GET',
        body?: unknown,
        token?: string,
      ) {
        const r = await fetch(base + path, {
          method,
          headers: {
            'content-type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const text = await r.text();
        return { status: r.status, body: text ? JSON.parse(text) : null };
      }
      async function register() {
        const r = await req('/auth/register', 'POST', {
          name: 'Test',
          email: `${randomUUID()}@example.com`,
          password: 'test-password',
        });
        assert.equal(r.status, 201);
        ids.push(r.body.user.id);
        return r.body.accessToken as string;
      }
      const a = await register();
      const b = await register();
      assert.equal((await req('/health')).status, 200);
      assert.equal((await req('/health/db')).status, 200);
      const category = await req(
        '/categories',
        'POST',
        { name: 'Food', color: '#123456', icon: 'cart' },
        a,
      );
      const other = await req(
        '/categories',
        'POST',
        { name: 'Other', color: '#123456', icon: 'cart' },
        b,
      );
      const value = {
        amount: '0.10',
        type: 'Income',
        date: '2026-12-01T00:00:00Z',
        categoryId: category.body.id,
      };
      assert.equal((await req('/transactions')).status, 401);
      assert.equal(
        (
          await req(
            '/transactions',
            'POST',
            { ...value, categoryId: other.body.id },
            a,
          )
        ).status,
        404,
      );
      assert.equal(
        (await req('/transactions', 'POST', { ...value, amount: '0' }, a))
          .status,
        400,
      );
      const one = await req('/transactions', 'POST', value, a);
      assert.equal(one.status, 201);
      assert.equal(one.body.amount, '0.10');
      const two = await req(
        '/transactions',
        'POST',
        { ...value, amount: '0.20' },
        a,
      );
      const filtered = await req(
        `/transactions?type=Income&categoryId=${category.body.id}&dateFrom=2026-12-01T00%3A00%3A00Z&dateTo=2026-12-01T00%3A00%3A00Z`,
        'GET',
        undefined,
        a,
      );
      assert.deepEqual(
        filtered.body.map((row: { id: string }) => row.id),
        [one.body.id, two.body.id].sort().reverse(),
      );
      await req(
        '/transactions',
        'POST',
        {
          ...value,
          amount: '0.40',
          type: 'Expense',
          date: '2026-12-31T23:59:59Z',
        },
        a,
      );
      await req(
        '/transactions',
        'POST',
        { ...value, amount: '99', date: '2027-01-01T00:00:00Z' },
        a,
      );
      assert.deepEqual(
        (
          await req(
            '/transactions/summary?month=12&year=2026',
            'GET',
            undefined,
            a,
          )
        ).body,
        { totalIncome: '0.30', totalExpense: '0.40', balance: '-0.10' },
      );
      assert.deepEqual(
        (
          await req(
            '/transactions/summary?month=1&year=2025',
            'GET',
            undefined,
            a,
          )
        ).body,
        { totalIncome: '0.00', totalExpense: '0.00', balance: '0.00' },
      );
      assert.equal(
        (
          await req(
            '/transactions/summary?month=13&year=2026',
            'GET',
            undefined,
            a,
          )
        ).status,
        400,
      );
      assert.equal(
        (await req(`/transactions/${one.body.id}`, 'GET', undefined, b)).status,
        404,
      );
      assert.equal(
        (await req(`/transactions/${one.body.id}`, 'DELETE', undefined, b))
          .status,
        404,
      );
      assert.equal(
        (await req(`/transactions/${one.body.id}`, 'PATCH', {}, a)).status,
        400,
      );
      assert.equal(
        (
          await req(
            `/transactions/${one.body.id}`,
            'PATCH',
            { categoryId: other.body.id },
            a,
          )
        ).status,
        404,
      );
      assert.equal(
        (await req(`/categories/${category.body.id}`, 'DELETE', undefined, a))
          .status,
        409,
      );
      assert.equal(
        (
          await req(
            `/transactions/${one.body.id}`,
            'PATCH',
            { description: null },
            a,
          )
        ).status,
        200,
      );
      assert.equal(
        (await req(`/transactions/${one.body.id}`, 'DELETE', undefined, a))
          .status,
        204,
      );
      assert.equal(
        (await req(`/transactions/${one.body.id}`, 'GET', undefined, a)).status,
        404,
      );
      assert.equal(
        (await req('/transactions?type=Expense', 'GET', undefined, a)).body
          .length,
        1,
      );
      assert.deepEqual(
        (await req('/transactions', 'GET', undefined, b)).body,
        [],
      );
      assert.deepEqual(
        (await req('/transactions?page=1', 'GET', undefined, b)).body,
        {
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
        },
      );
      for (let count = 4; count <= 21; count++) {
        await req('/transactions', 'POST', value, a);
        if ([10, 11, 21].includes(count)) {
          const page = await req('/transactions?page=1', 'GET', undefined, a);
          assert.equal(page.body.total, count);
          assert.equal(page.body.items.length, 10);
          const last = await req(
            `/transactions?page=${Math.ceil(count / 10)}`,
            'GET',
            undefined,
            a,
          );
          assert.equal(last.body.items.length, count % 10 || 10);
        }
      }
      const first = await req(
        '/transactions?page=1&type=Income',
        'GET',
        undefined,
        a,
      );
      const second = await req(
        '/transactions?page=2&type=Income',
        'GET',
        undefined,
        a,
      );
      assert.equal(first.body.total, 20);
      assert.equal(second.body.total, 20);
      assert.equal(
        new Set(
          [...first.body.items, ...second.body.items].map(
            (row: { id: string }) => row.id,
          ),
        ).size,
        20,
      );
      assert.equal(
        (await req('/transactions?page=0', 'GET', undefined, a)).status,
        400,
      );
      assert.equal(
        (await req('/transactions?page=abc', 'GET', undefined, a)).status,
        400,
      );
      assert.equal(
        (await req('/transactions?page=99', 'GET', undefined, a)).body.items
          .length,
        0,
      );
      assert.equal(
        (await req(`/categories/${other.body.id}`, 'DELETE', undefined, b))
          .status,
        204,
      );
      await prisma.user.delete({ where: { id: ids[0] } });
      assert.equal(
        await prisma.transaction.count({ where: { userId: ids[0] } }),
        0,
      );
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
      await app.close();
    }
  },
);
