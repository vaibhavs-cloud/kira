/*
 * Kira CDP relay.
 *
 * WSL2 cannot reach Windows' 127.0.0.1, and Chrome's remote-debugging port
 * only listens on Windows loopback. This relay listens on the WSL-facing
 * adapter (vEthernet (WSL)) and forwards raw TCP to 127.0.0.1:9223.
 *
 * It is transparent at the byte level, so it carries both the CDP HTTP
 * endpoints and the WebSocket upgrade. Chrome rewrites the returned
 * webSocketDebuggerUrl to use the relay's Host, so the client keeps talking
 * through the relay.
 *
 * Run: node cdp-relay.js [listenPort] [targetPort]
 * Started automatically at logon by %APPDATA%\...\Startup\kira-cdp-relay.vbs
 */
const net = require('net');
const os = require('os');

const LISTEN_PORT = Number(process.argv[2] || 9224);
const TARGET_PORT = Number(process.argv[3] || 9223);
const TARGET_HOST = '127.0.0.1';

function wslAddress() {
  const ifaces = os.networkInterfaces();
  for (const [name, addrs] of Object.entries(ifaces)) {
    if (!/wsl|vethernet/i.test(name)) continue;
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return null;
}

const bindAddress = wslAddress() || '0.0.0.0';

const server = net.createServer((client) => {
  const upstream = net.connect(TARGET_PORT, TARGET_HOST);
  const kill = () => {
    client.destroy();
    upstream.destroy();
  };
  client.on('error', kill);
  upstream.on('error', kill);
  client.on('close', kill);
  upstream.on('close', kill);
  client.pipe(upstream);
  upstream.pipe(client);
});

server.on('error', (err) => {
  console.error(`[kira-cdp-relay] ${err.code}: ${err.message}`);
  process.exit(1);
});

server.listen(LISTEN_PORT, bindAddress, () => {
  console.log(`[kira-cdp-relay] ${bindAddress}:${LISTEN_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
});
