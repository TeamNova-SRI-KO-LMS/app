const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./socket/socketManager');

// Long-running server for local development and traditional hosting: adds the
// HTTP listener and Socket.IO (real-time notifications) on top of the Express
// app. On Vercel the app is served as a function instead (see app.js), so the
// listener only starts when this file is run directly (`npm start`/`npm run dev`).
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);

  // Initialize Socket.IO with HTTP server
  initSocket(server);

  // Keep retrying in the background so the API recovers by itself when the network
  // or DNS comes back (API requests also retry through requireDatabase).
  const connectWithRetry = (attempt = 1) => {
    connectDB().catch((err) => {
      const delaySeconds = Math.min(30, attempt * 5);
      console.error(`MongoDB connection error (attempt ${attempt}): ${err.message}`);
      if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEOUT|querySrv/.test(err.message)) {
        console.error('  The database host could not be reached. Check your internet connection or DNS.');
      }
      console.error(`  Retrying in ${delaySeconds}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), delaySeconds * 1000);
    });
  };
  connectWithRetry();

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
