import { afterEach, describe, expect, test, vi } from 'vitest';
import { resizeImageFile } from '../../utils/resizeImage';

const makeFile = (type, size, name = 'photo.png') => new File([new Uint8Array(size)], name, { type });

const stubCanvas = (blob) => {
  const context = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' };
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob: (callback) => callback(blob) };
  const original = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => (tag === 'canvas' ? canvas : original(tag)));
  return canvas;
};

afterEach(() => {
  delete globalThis.createImageBitmap;
});

describe('resizeImageFile', () => {
  test('TC-FE-IMG-01 returns non-raster files unchanged [FR-012]', async () => {
    const pdf = makeFile('application/pdf', 10, 'cv.pdf');
    const gif = makeFile('image/gif', 10, 'a.gif');
    const svg = makeFile('image/svg+xml', 10, 'a.svg');

    expect(await resizeImageFile(pdf)).toBe(pdf);
    expect(await resizeImageFile(gif)).toBe(gif);
    expect(await resizeImageFile(svg)).toBe(svg);
    expect(await resizeImageFile(undefined)).toBeUndefined();
  });

  test('TC-FE-IMG-02 returns the original when the browser cannot decode it [FR-012]', async () => {
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('decode'));
    const file = makeFile('image/png', 100);

    expect(await resizeImageFile(file)).toBe(file);
  });

  test('TC-FE-IMG-03 keeps small images that already fit [FR-012]', async () => {
    const close = vi.fn();
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({ width: 300, height: 200, close });
    const file = makeFile('image/png', 1000);

    expect(await resizeImageFile(file)).toBe(file);
    expect(close).toHaveBeenCalled();
  });

  test('TC-FE-IMG-04 downscales a large photo to a JPEG whose longest edge is 512px [FR-012]', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({ width: 2048, height: 1024, close: vi.fn() });
    const canvas = stubCanvas(new Blob([new Uint8Array(1000)], { type: 'image/jpeg' }));
    const file = makeFile('image/png', 900 * 1024, 'holiday.png');

    const result = await resizeImageFile(file);

    expect(canvas.width).toBe(512);
    expect(canvas.height).toBe(256);
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('holiday.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  test('TC-FE-IMG-05 keeps the original when re-encoding would not make it smaller [FR-012]', async () => {
    globalThis.createImageBitmap = vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() });
    stubCanvas(new Blob([new Uint8Array(5000)]));
    const file = makeFile('image/jpeg', 4000, 'tiny-but-wide.jpg');

    expect(await resizeImageFile(file, { maxSize: 100 })).toBe(file);
  });
});
