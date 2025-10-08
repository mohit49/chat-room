#!/usr/bin/env node

const os = require('os');

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address,
          url: `http://${iface.address}:3000`
        });
      }
    }
  }

  return addresses;
}

console.log('🌐 Network IP Addresses:');
console.log('========================');

const addresses = getNetworkIP();

if (addresses.length === 0) {
  console.log('❌ No network interfaces found');
  process.exit(1);
}

addresses.forEach((addr, index) => {
  console.log(`${index + 1}. ${addr.interface}: ${addr.address}`);
  console.log(`   Frontend: ${addr.url}`);
  console.log(`   Backend:  ${addr.url.replace(':3000', ':3001')}`);
  console.log('');
});

console.log('💡 To use network access:');
console.log('1. Run: npm run dev');
console.log('2. Open one of the URLs above on your device');
console.log('3. Make sure your device is on the same WiFi network');
