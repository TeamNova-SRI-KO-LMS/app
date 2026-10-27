// Runs before every test file, before any application module is loaded.

// Credentials for external services are removed so no test can reach Stripe,
// Google Drive, Google OAuth or an SMTP server. Suites that exercise those
// integrations mock the client libraries instead.
[
  'VERCEL',
  'CORS_ORIGIN',
  'STRIPE_SECRET_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GDRIVE_FOLDER_THUMBNAILS',
  'GDRIVE_FOLDER_VIDEOS',
  'GDRIVE_FOLDER_PDFS',
  'GDRIVE_FOLDER_IMAGES',
  'GDRIVE_FOLDER_ASSIGNMENTS',
  'BACKEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
].forEach((key) => {
  delete process.env[key];
});

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-0f6c1e9b';
process.env.JWT_EXPIRE = '1h';
process.env.FRONTEND_URL = 'http://localhost:5173';

// One database per Jest worker, so parallel test files never share data.
const baseUri = process.env.TEST_MONGO_URI;
if (!baseUri) {
  throw new Error('TEST_MONGO_URI is not set: run the suite through Jest (npm test).');
}
process.env.MONGODB_URI = `${baseUri.replace(/\/?$/, '/')}sriko_test_${process.env.JEST_WORKER_ID || '1'}`;
