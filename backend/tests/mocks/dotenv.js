// Replaces dotenv during tests so backend/.env (which may hold production credentials)
// is never loaded. tests/setup/env.js defines the only configuration the suites see.
module.exports = {
  config: () => ({ parsed: {} }),
};
