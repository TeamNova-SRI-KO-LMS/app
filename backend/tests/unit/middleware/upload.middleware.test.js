const express = require('express');
const multer = require('multer');
const request = require('supertest');
const { uploadSingle, handleUploadError } = require('../../../middleware/upload');

const buildApp = () => {
  const app = express();
  app.post('/avatar', uploadSingle, (req, res) => res.json({ size: req.file.size, type: req.file.mimetype }));
  app.use(handleUploadError);
  app.use((err, req, res, next) => res.status(500).json({ fallthrough: err.message })); // eslint-disable-line no-unused-vars
  return app;
};

const PNG = Buffer.from('89504e470d0a1a0a', 'hex');

describe('Avatar upload middleware', () => {
  test('TC-UNIT-UPL-01 keeps an image upload in memory [FR-012]', async () => {
    const res = await request(buildApp()).post('/avatar').attach('avatar', PNG, { filename: 'me.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ size: PNG.length, type: 'image/png' });
  });

  test('TC-UNIT-UPL-02 rejects a non-image file with 400 [FR-012]', async () => {
    const res = await request(buildApp()).post('/avatar').attach('avatar', Buffer.from('MZ'), { filename: 'tool.exe', contentType: 'application/octet-stream' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Only image files are allowed!' });
  });

  test('TC-UNIT-UPL-03 rejects an image larger than 5 MB with 400 [FR-012]', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
    const res = await request(buildApp()).post('/avatar').attach('avatar', big, { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('File too large. Maximum size is 5MB.');
  });

  test('TC-UNIT-UPL-04 rejects an unexpected field name with 400 [FR-012]', async () => {
    const res = await request(buildApp()).post('/avatar').attach('photo', PNG, { filename: 'me.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Unexpected field name.');
  });

  test('TC-UNIT-UPL-05 passes unrelated errors to the next error handler [NFR-002]', () => {
    const next = jest.fn();
    const error = new multer.MulterError('LIMIT_PART_COUNT');

    handleUploadError(error, {}, {}, next);
    handleUploadError(new Error('boom'), {}, {}, next);

    expect(next).toHaveBeenCalledTimes(2);
  });
});
