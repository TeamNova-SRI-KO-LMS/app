const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ANONYMOUS_AUTH_CONTEXT,
  createAuthContext,
  getAuthContext,
  runWithAuthContext,
} = require('../src/auth/auth-context');

test('returns anonymous context when no active context exists', () => {
  assert.equal(getAuthContext(), ANONYMOUS_AUTH_CONTEXT);
});

test('creates authenticated context from token claims', () => {
  const authContext = createAuthContext({
    sub: 'user-123',
    roles: ['student', 'admin'],
    permissions: 'course:read,course:write',
  });

  assert.equal(authContext.isAuthenticated, true);
  assert.equal(authContext.userId, 'user-123');
  assert.deepEqual(authContext.roles, ['student', 'admin']);
  assert.deepEqual(authContext.permissions, ['course:read', 'course:write']);
});

test('keeps auth context available through async boundaries', async () => {
  const authContext = createAuthContext({ userId: 'user-456' });

  await runWithAuthContext(authContext, async () => {
    await Promise.resolve();
    assert.equal(getAuthContext().userId, 'user-456');
    assert.equal(getAuthContext().isAuthenticated, true);
  });

  assert.equal(getAuthContext(), ANONYMOUS_AUTH_CONTEXT);
});
