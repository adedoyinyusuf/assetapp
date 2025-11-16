import { testClient } from './test-client';

export interface TestUserInput {
  email: string;
  permissions?: string[];
  firstName?: string;
  lastName?: string;
}

export async function createTestUser(input: TestUserInput) {
  const { email, permissions = [], firstName = 'Test', lastName = 'User' } = input;
  const user = await testClient.db.user.create({
    data: {
      email,
      firstName,
      lastName,
      isActive: true,
      permissions,
    },
  });
  return user;
}

// Returns headers to be used with testClient.set(headers)
export async function getTestSession(userId: number) {
  return {
    'x-test-user-id': String(userId),
    'x-forwarded-for': '127.0.0.1',
    'user-agent': 'jest-test-client',
    'content-type': 'application/json',
    'accept': 'application/json',
  } as Record<string, string>;
}