const mongoose = require('mongoose');
const { connectDB } = require('../../config/db');

// The application logs every handled error; the assertions already check the
// responses, so the log output is suppressed to keep test reports readable.
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

beforeAll(async () => {
  await connectDB();
  await clearDatabase();
});

afterEach(async () => {
  jest.restoreAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await clearDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});
