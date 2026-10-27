const fs = require('fs');
const path = require('path');

const BACKEND = path.join(__dirname, '..', '..');

// Reads app.js for the router mount points, then every router file for its route
// declarations, so the security suites always test the endpoints that exist.
const readMounts = () => {
  const app = fs.readFileSync(path.join(BACKEND, 'app.js'), 'utf8');
  const variables = Object.fromEntries(
    [...app.matchAll(/const (\w+) = require\('\.\/routes\/(\w+)'\)/g)].map(([, name, file]) => [name, file]),
  );
  return [...app.matchAll(/app\.use\('([^']+)',[^)]*?(\w+Routes)\)/g)]
    .map(([, mount, variable]) => ({ mount, file: variables[variable] }));
};

const endpointInventory = () => readMounts().flatMap(({ mount, file }) => {
  const source = fs.readFileSync(path.join(BACKEND, 'routes', `${file}.js`), 'utf8');
  return [...source.matchAll(/router\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)].map(([, method, route]) => ({
    method: method.toUpperCase(),
    path: `${mount}${route === '/' ? '' : route}`,
    file,
  }));
});

module.exports = { endpointInventory };
