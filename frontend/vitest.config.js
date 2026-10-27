import { defineConfig } from 'vitest/config';

// Unit tests cover the frontend's logic layer: the API services, configuration,
// utilities, the route guard and shared components. Pages are exercised end to
// end by the Playwright suite (e2e/), so they are outside this coverage scope.
export default defineConfig({
  // Load no .env file: tests must not depend on a developer's local API keys or
  // production URLs, and must behave the same on a CI runner.
  envDir: './src/test',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/services/**/*.js',
        'src/config/**/*.js',
        'src/utils/**/*.js',
        'src/context/SocketProvider.jsx',
        'src/context/AuthContext.js',
        'src/context/useAuth.js',
        'src/components/ProtectedRoute.jsx',
        'src/components/UserAvatar.jsx',
        'src/components/ConfirmDialog.jsx',
        'src/components/LoadingSpinner.jsx',
        'src/components/ScrollToTop.jsx',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
});
