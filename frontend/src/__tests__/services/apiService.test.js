import { describe, expect, test } from 'vitest';
import { AxiosError } from 'axios';
import apiService, { apiClient, getAuthToken } from '../../services/apiService';
import { mockApi, bodyOf } from '../../test/mockApi';

describe('apiService', () => {
  test('TC-FE-API-01 prefers the administrator token over the user token [FR-002]', () => {
    expect(getAuthToken()).toBeNull();
    localStorage.setItem('token', 'user-token');
    expect(getAuthToken()).toBe('user-token');
    localStorage.setItem('adminToken', 'admin-token');
    expect(getAuthToken()).toBe('admin-token');
  });

  test('TC-FE-API-02 attaches the bearer token to every request [FR-002]', async () => {
    const api = mockApi();
    localStorage.setItem('token', 'abc.def.ghi');

    await apiService.get('/courses');

    expect(api.last().headers.Authorization).toBe('Bearer abc.def.ghi');
    expect(api.last().baseURL).toBe('http://localhost:5000/api');
  });

  test('TC-FE-API-03 sends no Authorization header for guests [FR-003]', async () => {
    const api = mockApi();

    await apiService.get('/courses');

    expect(api.last().headers.Authorization).toBeUndefined();
  });

  test('TC-FE-API-04 removes the JSON content type for FormData so the browser sets the multipart boundary [FR-012]', () => {
    const [{ fulfilled: beforeRequest }] = apiClient.interceptors.request.handlers;
    const form = new FormData();
    form.append('avatar', new Blob(['x']), 'a.png');

    const multipart = beforeRequest({ data: form, headers: { 'Content-Type': 'application/json' } });
    const json = beforeRequest({ data: { a: 1 }, headers: { 'Content-Type': 'application/json' } });

    expect(multipart.headers['Content-Type']).toBeUndefined();
    expect(json.headers['Content-Type']).toBe('application/json');
  });

  test('TC-FE-API-05 clears the stored session when the API answers 401 [FR-002]', async () => {
    ['token', 'adminToken', 'user', 'adminUser', 'auth-session'].forEach((key) => localStorage.setItem(key, 'x'));
    mockApi((config) => new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, data: {}, headers: {}, config }));

    await expect(apiService.get('/auth/me')).rejects.toThrow('Unauthorized');

    expect(localStorage.length).toBe(0);
  });

  test('TC-FE-API-06 keeps the session for other errors [FR-002]', async () => {
    localStorage.setItem('token', 'keep-me');
    mockApi((config) => new AxiosError('Server error', 'ERR_BAD_RESPONSE', config, null, { status: 500, data: {}, headers: {}, config }));

    await expect(apiService.get('/courses')).rejects.toThrow();

    expect(localStorage.getItem('token')).toBe('keep-me');
  });

  test('TC-FE-API-07 login, register and current-user helpers call the auth endpoints [FR-001][FR-002]', async () => {
    const api = mockApi((config) => ({ endpoint: config.url }));

    expect(await apiService.login({ email: 'a@b.lk', password: 'x' })).toEqual({ endpoint: '/auth/login' });
    expect(await apiService.register({ name: 'A' })).toEqual({ endpoint: '/auth/register' });
    expect(await apiService.getCurrentUser()).toEqual({ endpoint: '/auth/me' });
    expect(bodyOf(api.requests[0])).toEqual({ email: 'a@b.lk', password: 'x' });
    expect(api.requests.map((r) => r.method)).toEqual(['post', 'post', 'get']);
  });

  test('TC-FE-API-08 exposes put, patch and delete helpers on the shared client [NFR-006]', async () => {
    const api = mockApi();

    await apiService.put('/a', { x: 1 });
    await apiService.patch('/b', { y: 2 });
    await apiService.delete('/c');

    expect(api.requests.map((r) => `${r.method} ${r.url}`)).toEqual(['put /a', 'patch /b', 'delete /c']);
    expect(apiService.client).toBe(apiClient);
  });
});
