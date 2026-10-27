import { vi } from 'vitest';
import { apiClient } from '../services/apiService';

// Replaces the HTTP transport of the shared axios client. Every request is recorded
// and answered with { data: { ok: true, url } } unless a test supplies a response.
export const mockApi = (respond = (config) => ({ ok: true, url: config.url })) => {
  const requests = [];
  const adapter = vi.fn(async (config) => {
    requests.push(config);
    const result = await respond(config);
    if (result instanceof Error) {
      throw result;
    }
    return { data: result, status: 200, statusText: 'OK', headers: {}, config };
  });
  apiClient.defaults.adapter = adapter;
  const last = () => requests[requests.length - 1];
  return { requests, adapter, last };
};

export const bodyOf = (config) => (typeof config.data === 'string' ? JSON.parse(config.data) : config.data);
