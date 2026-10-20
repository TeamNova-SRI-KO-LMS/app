const dns = require('dns');

// Some local networks (phone hotspots, certain ISP routers) intermittently fail to
// resolve MongoDB Atlas hosts, which shows up as SRV "ECONNREFUSED" or host
// "getaddrinfo ENOTFOUND" errors. Locally, both lookups go through public resolvers
// instead. Vercel's own resolver is reliable, so it is left untouched there.
const PUBLIC_DNS_SERVERS = ['8.8.8.8', '8.8.4.4', '1.1.1.1'];
const usePublicDns = !process.env.VERCEL;

// Atlas SRV/TXT records: the MongoDB driver resolves these with dns.resolve*,
// which honours dns.setServers.
if (usePublicDns) {
  try {
    dns.setServers(PUBLIC_DNS_SERVERS);
  } catch (e) {
    console.warn('Could not set custom DNS servers:', e.message);
  }
}

// Atlas shard hosts: sockets resolve these with the operating system's resolver
// (getaddrinfo), which ignores dns.setServers, so the driver gets this lookup instead.
const resolver = new dns.Resolver({ timeout: 2500, tries: 2 });
if (usePublicDns) {
  resolver.setServers(PUBLIC_DNS_SERVERS);
}

/**
 * Socket `lookup` for the MongoDB driver: resolve through the public resolvers above
 * and fall back to the operating system's resolver if they can't answer.
 * Same signature as dns.lookup(hostname, options, callback).
 */
const publicDnsLookup = (hostname, options, callback) => {
  resolver.resolve4(hostname, (error, addresses) => {
    if (error || addresses.length === 0) {
      dns.lookup(hostname, options, callback);
      return;
    }

    if (options.all) {
      callback(null, addresses.map((address) => ({ address, family: 4 })));
    } else {
      callback(null, addresses[0], 4);
    }
  });
};

module.exports = {
  databaseLookup: usePublicDns ? publicDnsLookup : undefined,
};
