const escapeRegex = require('../../../utils/escapeRegex');

describe('escapeRegex', () => {
  test('TC-UNIT-CFG-01 escapes every regular-expression metacharacter [OWASP-A03]', () => {
    const input = 'c++ (beginner) [1] {2} ^$.*?|\\';
    const pattern = new RegExp(escapeRegex(input));

    expect(pattern.test(input)).toBe(true);
    expect(escapeRegex('a.b')).toBe('a\\.b');
  });

  test('TC-UNIT-CFG-02 treats missing input as an empty string [OWASP-A03]', () => {
    expect(escapeRegex()).toBe('');
    expect(escapeRegex(42)).toBe('42');
  });
});

describe('parseAllowedOrigins', () => {
  const saved = { FRONTEND_URL: process.env.FRONTEND_URL, CORS_ORIGIN: process.env.CORS_ORIGIN };

  const load = () => {
    let parse;
    jest.isolateModules(() => {
      ({ parseAllowedOrigins: parse } = require('../../../config/cors'));
    });
    return parse();
  };

  afterEach(() => {
    process.env.FRONTEND_URL = saved.FRONTEND_URL;
    if (saved.CORS_ORIGIN === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = saved.CORS_ORIGIN;
  });

  test('TC-UNIT-CFG-03 falls back to the local Vite origin when nothing is configured [NFR-004]', () => {
    delete process.env.FRONTEND_URL;
    delete process.env.CORS_ORIGIN;

    expect(load()).toEqual(['http://localhost:5173']);
  });

  test('TC-UNIT-CFG-04 merges FRONTEND_URL and CORS_ORIGIN, trims slashes and removes duplicates [NFR-004]', () => {
    process.env.FRONTEND_URL = 'https://app.example.com/, https://admin.example.com';
    process.env.CORS_ORIGIN = 'https://app.example.com';

    expect(load()).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  test('TC-UNIT-CFG-05 turns a wildcard into a pattern that matches preview deployments only [NFR-004]', () => {
    process.env.FRONTEND_URL = 'https://sri-ko-*.vercel.app';
    delete process.env.CORS_ORIGIN;

    const [matcher] = load();

    expect(matcher).toBeInstanceOf(RegExp);
    expect(matcher.test('https://sri-ko-git-feature-1.vercel.app')).toBe(true);
    expect(matcher.test('https://sri-ko-x.vercel.app.evil.com')).toBe(false);
    expect(matcher.test('https://evil.com/sri-ko-x.vercel.app')).toBe(false);
  });
});

describe('Database connection helpers', () => {
  test('TC-UNIT-CFG-06 connectDB rejects when MONGODB_URI is missing [NFR-002]', async () => {
    const original = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    let isolated;
    jest.isolateModules(() => {
      isolated = require('../../../config/db');
    });

    await expect(isolated.connectDB()).rejects.toThrow('MONGODB_URI is not configured');
    expect(isolated.getDatabaseStatus()).toBe('disconnected');
    process.env.MONGODB_URI = original;
  });

  test('TC-UNIT-CFG-07 connectDB reuses the open connection [NFR-005]', async () => {
    const { connectDB, getDatabaseStatus } = require('../../../config/db');

    const first = await connectDB();
    const second = await connectDB();

    expect(second).toBe(first);
    expect(getDatabaseStatus()).toBe('connected');
  });

  test('TC-UNIT-CFG-08 concurrent cold-start requests share a single connection attempt [NFR-005]', async () => {
    const original = process.env.MONGODB_URI;
    let isolated;
    let isolatedMongoose;
    jest.isolateModules(() => {
      isolatedMongoose = require('mongoose');
      isolated = require('../../../config/db');
    });
    const connect = jest.spyOn(isolatedMongoose, 'connect');

    const [a, b] = await Promise.all([isolated.connectDB(), isolated.connectDB()]);

    expect(a).toBe(b);
    expect(connect).toHaveBeenCalledTimes(1);
    await isolatedMongoose.disconnect();
    process.env.MONGODB_URI = original;
  });
});

describe('Public DNS lookup for MongoDB Atlas', () => {
  const loadDns = (resolve4Impl, { vercel = false } = {}) => {
    const setServers = jest.fn();
    const lookup = jest.fn((host, options, callback) => callback(null, '10.0.0.1', 4));
    let dnsModule;
    if (vercel) process.env.VERCEL = '1';
    jest.isolateModules(() => {
      jest.doMock('dns', () => ({
        setServers,
        lookup,
        Resolver: jest.fn().mockImplementation(() => ({ setServers: jest.fn(), resolve4: resolve4Impl })),
      }));
      dnsModule = require('../../../config/dns');
    });
    jest.dontMock('dns');
    delete process.env.VERCEL;
    return { dnsModule, setServers, lookup };
  };

  test('TC-UNIT-CFG-09 is disabled on Vercel, where the platform resolver is reliable [NFR-002]', () => {
    const { dnsModule, setServers } = loadDns(jest.fn(), { vercel: true });

    expect(dnsModule.databaseLookup).toBeUndefined();
    expect(setServers).not.toHaveBeenCalled();
  });

  test('TC-UNIT-CFG-10 resolves hosts through public resolvers and supports the "all" option [NFR-002]', () => {
    const { dnsModule, setServers } = loadDns((host, cb) => cb(null, ['1.2.3.4', '5.6.7.8']));
    const single = jest.fn();
    const all = jest.fn();

    dnsModule.databaseLookup('cluster.example.net', {}, single);
    dnsModule.databaseLookup('cluster.example.net', { all: true }, all);

    expect(setServers).toHaveBeenCalledWith(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    expect(single).toHaveBeenCalledWith(null, '1.2.3.4', 4);
    expect(all).toHaveBeenCalledWith(null, [{ address: '1.2.3.4', family: 4 }, { address: '5.6.7.8', family: 4 }]);
  });

  test('TC-UNIT-CFG-11 falls back to the operating-system resolver when public DNS fails [NFR-002]', () => {
    const { dnsModule, lookup } = loadDns((host, cb) => cb(new Error('ETIMEOUT')));
    const callback = jest.fn();

    dnsModule.databaseLookup('cluster.example.net', {}, callback);

    expect(lookup).toHaveBeenCalledWith('cluster.example.net', {}, callback);
    expect(callback).toHaveBeenCalledWith(null, '10.0.0.1', 4);
  });
});
