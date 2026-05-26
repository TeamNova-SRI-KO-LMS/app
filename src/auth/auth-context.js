const { AsyncLocalStorage } = require('node:async_hooks');

const authContextStorage = new AsyncLocalStorage();

const ANONYMOUS_AUTH_CONTEXT = Object.freeze({
  isAuthenticated: false,
  userId: null,
  roles: Object.freeze([]),
  permissions: Object.freeze([]),
});

function normalizeArrayClaim(claim) {
  if (Array.isArray(claim)) {
    return claim.filter((item) => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof claim === 'string' && claim.trim().length > 0) {
    return claim
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function createAuthContext(claims = {}) {
  const userId =
    typeof claims.sub === 'string' && claims.sub.trim().length > 0
      ? claims.sub
      : typeof claims.userId === 'string' && claims.userId.trim().length > 0
      ? claims.userId
      : null;

  const context = {
    isAuthenticated: userId !== null,
    userId,
    roles: Object.freeze(normalizeArrayClaim(claims.roles)),
    permissions: Object.freeze(normalizeArrayClaim(claims.permissions)),
  };

  return Object.freeze(context);
}

function getAuthContext() {
  return authContextStorage.getStore() || ANONYMOUS_AUTH_CONTEXT;
}

function runWithAuthContext(context, callback) {
  const safeContext = context && typeof context === 'object' ? Object.freeze({ ...context }) : ANONYMOUS_AUTH_CONTEXT;
  return authContextStorage.run(safeContext, callback);
}

module.exports = {
  ANONYMOUS_AUTH_CONTEXT,
  createAuthContext,
  getAuthContext,
  runWithAuthContext,
};
