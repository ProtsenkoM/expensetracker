import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RegisterHandler, LoginHandler } from './auth.handlers.js';
import {
  CreateUserCommand,
  VerifyUserCredentialsQuery,
} from '../users/contracts/users.contracts.js';

const user = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('registration creates a user through CQRS and returns a bearer token without a password hash', async () => {
  let sent: unknown;
  const handler = new RegisterHandler(
    {
      execute: async (command: unknown) => {
        sent = command;
        return user;
      },
    } as never,
    { signAsync: async (payload: unknown) => JSON.stringify(payload) } as never,
  );
  const result = await handler.execute({
    name: 'Ada',
    email: 'ada@example.com',
    password: 'long-password',
  } as never);
  assert.ok(sent instanceof CreateUserCommand);
  assert.deepEqual(result.user, user);
  assert.equal(result.tokenType, 'Bearer');
  assert.equal(result.expiresIn, 900);
  assert.equal('passwordHash' in result.user, false);
});

test('login verifies credentials through CQRS and returns a bearer token', async () => {
  let sent: unknown;
  const handler = new LoginHandler(
    {
      execute: async (query: unknown) => {
        sent = query;
        return user;
      },
    } as never,
    { signAsync: async () => 'signed-token' } as never,
  );
  const result = await handler.execute({
    email: user.email,
    password: 'long-password',
  } as never);
  assert.ok(sent instanceof VerifyUserCredentialsQuery);
  assert.equal(result.accessToken, 'signed-token');
  assert.equal(result.user, user);
});

test('login rejects invalid credentials', async () => {
  const handler = new LoginHandler(
    { execute: async () => null } as never,
    { signAsync: async () => 'unused' } as never,
  );
  await assert.rejects(
    handler.execute({ email: user.email, password: 'wrong-pass' } as never),
    { status: 401 },
  );
});
