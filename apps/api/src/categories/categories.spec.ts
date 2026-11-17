import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto.js';
import { CategoriesService } from './categories.service.js';

test('category DTOs trim fields and reject invalid values and extra properties', async () => {
  const dto = plainToInstance(CreateCategoryDto, {
    name: ' Food ',
    color: '#123abc',
    icon: ' cart ',
  });
  assert.equal(
    (await validate(dto, { whitelist: true, forbidNonWhitelisted: true }))
      .length,
    0,
  );
  assert.equal(dto.name, 'Food');
  assert.equal(dto.icon, 'cart');
  for (const data of [
    { name: '   ', color: '#123abc', icon: 'x' },
    { name: 'x', color: '#123', icon: 'x' },
    { name: 'x'.repeat(101), color: '#123abc', icon: 'x' },
    { name: 'x', color: '#123abc', icon: 'x', userId: 'other' },
  ]) {
    assert.ok(
      (
        await validate(plainToInstance(CreateCategoryDto, data), {
          whitelist: true,
          forbidNonWhitelisted: true,
        })
      ).length,
    );
  }
  assert.ok(
    (await validate(plainToInstance(UpdateCategoryDto, { name: null }))).length,
  );
});

test('updates and deletes use owner scope and reject missing categories', async () => {
  const calls: unknown[][] = [];
  const service = new CategoriesService({
    update: async (...args: unknown[]) => {
      calls.push(args);
      return [];
    },
    remove: async (...args: unknown[]) => {
      calls.push(args);
      return { count: 0 };
    },
  } as never);
  await assert.rejects(service.update('owner', 'id', {}), { status: 400 });
  await assert.rejects(service.update('owner', 'id', { name: 'x' }), {
    status: 404,
  });
  await assert.rejects(service.remove('owner', 'id'), { status: 404 });
  assert.deepEqual(
    calls.map((call) => call.slice(0, 2)),
    [
      ['owner', 'id'],
      ['owner', 'id'],
    ],
  );
});
