import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

// Build the API first, then opt in against a local database with DATABASE_URL configured.
test(
  'categories HTTP CRUD, validation and user isolation',
  { skip: process.env.CATEGORIES_INTEGRATION !== '1' },
  async () => {
    process.env.JWT_SECRET = 'category-test-secret-at-least-32-bytes';
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
    const userIds: string[] = [];
    try {
      await app.listen(0, '127.0.0.1');
      const base = `${await app.getUrl()}/api`;
      async function request(
        path: string,
        method = 'GET',
        body?: unknown,
        token?: string,
      ) {
        const response = await fetch(`${base}${path}`, {
          method,
          headers: {
            'content-type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const text = await response.text();
        return {
          status: response.status,
          text,
          body: text ? JSON.parse(text) : null,
        };
      }
      async function register() {
        const response = await request('/auth/register', 'POST', {
          name: 'Test',
          email: `${randomUUID()}@example.com`,
          password: 'test-password',
        });
        assert.equal(response.status, 201);
        userIds.push(response.body.user.id);
        return response.body.accessToken as string;
      }
      const a = await register();
      const b = await register();
      assert.equal((await request('/categories')).status, 401);
      assert.equal((await request('/categories', 'POST', {})).status, 401);
      assert.equal(
        (await request(`/categories/${randomUUID()}`, 'PATCH', {})).status,
        401,
      );
      assert.equal(
        (await request(`/categories/${randomUUID()}`, 'DELETE')).status,
        401,
      );
      assert.equal(
        (await request('/categories', 'GET', undefined, 'invalid')).status,
        401,
      );
      assert.deepEqual(
        (await request('/categories', 'GET', undefined, a)).body,
        [],
      );
      const valid = { name: ' Food ', color: '#12aBcD', icon: ' cart ' };
      for (const invalid of [
        { ...valid, name: '' },
        { ...valid, name: '  ' },
        { ...valid, name: 'a'.repeat(101) },
        { ...valid, icon: ' '.repeat(4) },
        { ...valid, icon: 'a'.repeat(101) },
        { ...valid, color: '#123' },
        { ...valid, name: null },
        { ...valid, icon: null },
        {},
        { name: 'x', color: '#123456' },
        { name: 'x', icon: 'x' },
        { color: '#123456', icon: 'x' },
        { ...valid, color: null },
        { ...valid, userId: userIds[1] },
        { ...valid, id: randomUUID() },
      ])
        assert.equal(
          (await request('/categories', 'POST', invalid, a)).status,
          400,
        );
      const create = await request('/categories', 'POST', valid, a);
      assert.equal(create.status, 201);
      assert.equal(create.body.name, 'Food');
      assert.equal(create.body.icon, 'cart');
      assert.equal(create.body.userId, userIds[0]);
      const second = await request('/categories', 'POST', valid, a);
      assert.equal(second.status, 201);
      const third = await request(
        '/categories',
        'POST',
        { ...valid, name: 'Alpha' },
        a,
      );
      assert.equal(third.status, 201);
      const list = (await request('/categories', 'GET', undefined, a)).body;
      assert.deepEqual(
        list.map((category: { name: string }) => category.name),
        ['Alpha', 'Food', 'Food'],
      );
      assert.deepEqual(
        list.slice(1).map((category: { id: string }) => category.id),
        [create.body.id, second.body.id].sort(),
      );
      assert.deepEqual(
        (await request('/categories', 'GET', undefined, b)).body,
        [],
      );
      const path = `/categories/${create.body.id}`;
      for (const update of [
        {},
        { name: null },
        { color: null },
        { icon: null },
        { color: '#xyzxyz' },
        { userId: userIds[1] },
      ])
        assert.equal((await request(path, 'PATCH', update, a)).status, 400);
      assert.equal(
        (await request('/categories/not-a-uuid', 'PATCH', { name: 'x' }, a))
          .status,
        400,
      );
      assert.equal(
        (await request('/categories/not-a-uuid', 'DELETE', undefined, a))
          .status,
        400,
      );
      assert.equal(
        (await request(path, 'PATCH', { name: 'Stolen' }, b)).status,
        404,
      );
      assert.equal((await request(path, 'DELETE', undefined, b)).status, 404);
      const missing = `/categories/${randomUUID()}`;
      assert.equal(
        (await request(missing, 'PATCH', { name: 'x' }, a)).status,
        404,
      );
      assert.equal(
        (await request(missing, 'DELETE', undefined, a)).status,
        404,
      );
      const updated = await request(path, 'PATCH', { name: ' New ' }, a);
      assert.equal(updated.status, 200);
      assert.equal(updated.body.name, 'New');
      assert.equal(updated.body.color, valid.color);
      const removed = await request(path, 'DELETE', undefined, a);
      assert.equal(removed.status, 204);
      assert.equal(removed.text, '');
      assert.equal((await request(path, 'DELETE', undefined, a)).status, 404);
      await prisma.user.delete({ where: { id: userIds[0] } });
      assert.equal(
        await prisma.category.count({ where: { userId: userIds[0] } }),
        0,
      );
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await app.close();
    }
  },
);
