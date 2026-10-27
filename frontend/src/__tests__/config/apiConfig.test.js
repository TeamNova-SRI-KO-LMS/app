import { afterEach, describe, expect, test, vi } from 'vitest';

const loadConfig = async () => {
  vi.resetModules();
  return import('../../config/apiConfig');
};

afterEach(() => {
  delete window.configs;
});

describe('API URL configuration', () => {
  test('TC-FE-CFG-01 falls back to the local backend when VITE_API_URL is not set [NFR-007]', async () => {
    vi.stubEnv('VITE_API_URL', '');

    const config = await loadConfig();

    expect(config.apiUrl).toBe('http://localhost:5000/api');
    expect(config.baseUrl).toBe('http://localhost:5000');
    expect(config.default).toBe(config.apiUrl);
  });

  test('TC-FE-CFG-02 uses VITE_API_URL and strips trailing slashes [NFR-007]', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.sriko.example/api//');

    const config = await loadConfig();

    expect(config.apiUrl).toBe('https://api.sriko.example/api');
    expect(config.baseUrl).toBe('https://api.sriko.example');
  });

  test('TC-FE-CFG-03 honours a runtime window.configs URL, including Choreo gateways [NFR-007]', async () => {
    window.configs = { apiUrl: 'https://gateway.choreoapis.dev/sriko/api' };
    const choreo = await loadConfig();
    window.configs = { apiUrl: 'https://backend.example.com' };
    const plain = await loadConfig();

    expect(choreo.apiUrl).toBe('https://gateway.choreoapis.dev/sriko/api');
    expect(plain.apiUrl).toBe('https://backend.example.com/api');
  });

  test('TC-FE-CFG-04 testApiConnectivity treats 200 and 404 as reachable and errors as unreachable [NFR-002]', async () => {
    const { testApiConnectivity } = await loadConfig();
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockRejectedValueOnce(new Error('offline'));
    vi.stubGlobal('fetch', fetch);

    expect(await testApiConnectivity('https://a')).toBe(true);
    expect(await testApiConnectivity('https://a')).toBe(true);
    expect(await testApiConnectivity('https://a')).toBe(false);
    expect(await testApiConnectivity('https://a')).toBe(false);
    expect(fetch).toHaveBeenCalledWith('https://a/health', expect.objectContaining({ method: 'HEAD' }));
  });

  test('TC-FE-CFG-05 getWorkingApiUrl returns the first reachable candidate or the configured URL [NFR-002]', async () => {
    vi.stubEnv('VITE_API_URL', 'https://primary.example/api');
    const { getWorkingApiUrl } = await loadConfig();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue({ ok: true, status: 200 }));
    expect(await getWorkingApiUrl()).toBe('https://primary.example/api');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await getWorkingApiUrl()).toBe('https://primary.example/api');
  });
});

describe('Supabase client configuration', () => {
  test('TC-FE-CFG-06 disables uploads instead of crashing when Supabase is not configured [NFR-002]', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.resetModules();

    const { supabase } = await import('../../config/supabase');

    expect(supabase).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  test('TC-FE-CFG-07 creates a client when the URL and key are provided [FR-007]', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    vi.resetModules();

    const { supabase } = await import('../../config/supabase');

    expect(supabase).not.toBeNull();
    expect(typeof supabase.storage.from).toBe('function');
  });
});
