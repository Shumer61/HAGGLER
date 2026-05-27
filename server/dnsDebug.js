const dns = require('dns');
const os = require('os');

console.log('OS:', os.type(), os.release());
console.log('DNS servers from OS:', dns.getServers());

// Test resolution with explicit server
const hostname = '_mongodb._tcp.cluster61.pwrdefm.mongodb.net';
console.log(`\nTrying to resolve ${hostname} with explicit Google DNS...`);

dns.resolveSrv(hostname, { timeout: 5000 }, (err, addresses) => {
  if (err) {
    console.error('Failed with system DNS:', err);
    
    // Try forcing Google DNS
    dns.setServers(['8.8.8.8']);
    console.log('DNS servers after setting to Google:', dns.getServers());
    
    dns.resolveSrv(hostname, { timeout: 5000 }, (err2, addresses2) => {
      if (err2) {
        console.error('Failed with Google DNS:', err2);
      } else {
        console.log('Success with Google DNS:', addresses2);
      }
    });
  } else {
    console.log('Success with system DNS:', addresses);
  }
});