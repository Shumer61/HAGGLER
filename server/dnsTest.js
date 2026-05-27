const dns = require('dns');

const hostname = '_mongodb._tcp.cluster61.pwrdefm.mongodb.net';

console.log(`Resolving SRV record for ${hostname}...`);

dns.resolveSrv(hostname, (err, addresses) => {
  if (err) {
    console.error('DNS SRV lookup failed:', err);
    return;
  }
  console.log('SRV records:', addresses);
});

// Also try resolving the A record for the SRV hostname
const srvHostname = 'ac-7x9azny-shard-00-01.pwrdefm.mongodb.net';
console.log(`\nResolving A record for ${srvHostname}...`);
dns.resolve4(srvHostname, (err, addresses) => {
  if (err) {
    console.error('DNS A lookup failed:', err);
    return;
  }
  console.log('A records:', addresses);
});