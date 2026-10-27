import { afterEach, describe, expect, test, vi } from 'vitest';

const storage = {
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  remove: vi.fn(),
};
const mockClient = { storage: { from: vi.fn(() => storage) } };
let clientAvailable = true;

vi.mock('../../config/supabase', () => ({
  get supabase() {
    return clientAvailable ? mockClient : null;
  },
}));

import { uploadToSupabase, deleteFromSupabase } from '../../services/uploadService';

const file = { name: 'My Photo (1).PNG', type: 'image/png' };

afterEach(() => {
  clientAvailable = true;
  storage.upload.mockReset();
  storage.getPublicUrl.mockReset();
  storage.remove.mockReset();
  mockClient.storage.from.mockClear();
});

describe('uploadToSupabase', () => {
  test('TC-FE-UPL-01 uploads under a unique, sanitized path and returns the public URL [FR-007]', async () => {
    storage.upload.mockResolvedValue({ error: null });
    storage.getPublicUrl.mockImplementation((path) => ({ data: { publicUrl: `https://cdn/${path}` } }));

    const url = await uploadToSupabase(file, 'images', 'avatars');

    const [path, uploaded, options] = storage.upload.mock.calls[0];
    expect(path).toMatch(/^avatars\/\d+-[a-z0-9]+\.png$/);
    expect(uploaded).toBe(file);
    expect(options).toEqual({ upsert: true, contentType: 'image/png' });
    expect(url).toBe(`https://cdn/${path}`);
  });

  test('TC-FE-UPL-02 retries in the other known buckets when the first one fails [FR-007]', async () => {
    storage.upload.mockResolvedValueOnce({ error: { message: 'Bucket not found' } }).mockResolvedValueOnce({ error: null });
    storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/x' } });

    await uploadToSupabase({ name: 'a' });

    expect(mockClient.storage.from.mock.calls.map(([bucket]) => bucket)).toEqual(['courses', 'images', 'images']);
  });

  test('TC-FE-UPL-03 explains missing buckets, denied access and other failures [FR-007]', async () => {
    storage.upload.mockResolvedValue({ error: { message: 'Bucket not found' } });
    await expect(uploadToSupabase(file, 'courses')).rejects.toThrow('Supabase bucket "courses" was not found');

    storage.upload.mockResolvedValue({ error: { statusCode: '403', message: 'row-level security policy' } });
    await expect(uploadToSupabase(file, 'courses')).rejects.toThrow('Supabase storage access denied for bucket "courses"');

    storage.upload.mockResolvedValue({ error: { message: 'timeout' } });
    await expect(uploadToSupabase(file, 'courses')).rejects.toThrow('Supabase upload failed: timeout');
  });

  test('TC-FE-UPL-04 refuses to upload without a file, a client or a public URL [FR-007]', async () => {
    await expect(uploadToSupabase(null)).rejects.toThrow('No file provided for upload.');

    storage.upload.mockResolvedValue({ error: null });
    storage.getPublicUrl.mockReturnValue({ data: {} });
    await expect(uploadToSupabase(file)).rejects.toThrow('Could not retrieve public URL from Supabase Storage.');

    clientAvailable = false;
    await expect(uploadToSupabase(file)).rejects.toThrow('Image uploads are not configured.');
  });
});

describe('deleteFromSupabase', () => {
  test('TC-FE-UPL-05 deletes the object named in a public URL [FR-007]', async () => {
    storage.remove.mockResolvedValue({ error: null });

    await deleteFromSupabase('https://p.supabase.co/storage/v1/object/public/images/avatars/a.png');

    expect(mockClient.storage.from).toHaveBeenCalledWith('images');
    expect(storage.remove).toHaveBeenCalledWith(['avatars/a.png']);
  });

  test('TC-FE-UPL-06 ignores invalid URLs and only warns when deletion fails [FR-007]', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage.remove.mockResolvedValue({ error: { message: 'not found' } });

    await deleteFromSupabase(undefined);
    await deleteFromSupabase('https://elsewhere.example/a.png');
    await deleteFromSupabase('https://p.supabase.co/storage/v1/object/public/courses/x.png');

    expect(storage.remove).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
  });
});
