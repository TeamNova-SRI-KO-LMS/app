# app

## Backend AuthContext Architecture

The backend AuthContext is implemented in `/src/auth/auth-context.js`.

### Exposed API

- `createAuthContext(claims)` - builds a normalized, immutable auth context from token claims.
- `runWithAuthContext(context, callback)` - attaches context to an async execution flow.
- `getAuthContext()` - reads current context from async storage, defaulting to anonymous.
- `ANONYMOUS_AUTH_CONTEXT` - immutable fallback context for unauthenticated flows.

### Validation

Run the focused backend tests with:

```bash
npm test
```
