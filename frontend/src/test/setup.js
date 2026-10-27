import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// apiConfig logs the resolved API URL on import; keep test output readable.
vi.spyOn(console, 'log').mockImplementation(() => {});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
