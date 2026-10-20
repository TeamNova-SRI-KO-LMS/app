const DEFAULT_ORIGIN = 'http://localhost:5173';

// "https://sri-ko-*.vercel.app" -> /^https:\/\/sri-ko-[a-z0-9-]*\.vercel\.app$/i
// so Vercel preview deployments can be allowed without listing each URL.
const toOriginMatcher = (origin) => {
  if (!origin.includes('*')) {
    return origin;
  }

  const pattern = origin
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[a-z0-9-]*');

  return new RegExp(`^${pattern}$`, 'i');
};

// Browser origins allowed to call the API and open Socket.IO connections.
// FRONTEND_URL / CORS_ORIGIN accept a comma-separated list.
const parseAllowedOrigins = () => {
  const origins = [process.env.FRONTEND_URL, process.env.CORS_ORIGIN]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (origins.length === 0) {
    return [DEFAULT_ORIGIN];
  }

  return [...new Set(origins)].map(toOriginMatcher);
};

module.exports = { parseAllowedOrigins };
