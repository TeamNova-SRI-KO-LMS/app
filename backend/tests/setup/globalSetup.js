const { MongoMemoryServer } = require('mongodb-memory-server-core');

// Starts one in-memory MongoDB for the whole run. Workers read its URI from the
// environment and each use their own database (see env.js). When TEST_MONGO_URI is
// already set (the CI pipeline provides a MongoDB service container), that server is
// used instead and nothing is downloaded.
module.exports = async () => {
  if (process.env.TEST_MONGO_URI) {
    return;
  }

  const server = await MongoMemoryServer.create({
    binary: { version: process.env.MONGOMS_VERSION || '7.0.24' },
  });

  globalThis.__MONGO_SERVER__ = server;
  process.env.TEST_MONGO_URI = server.getUri();
};
