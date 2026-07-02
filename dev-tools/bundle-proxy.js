/**
 * bundle-proxy.js
 *
 * Solves the Metro chunked-streaming truncation bug on Android emulator/device.
 * Metro streams the 18+ MB bundle over chunked HTTP and the emulator's OkHttp
 * client times out mid-transfer (~97% through), giving Hermes a truncated file.
 *
 * This proxy:
 *   1. Downloads the full bundle from Metro once (30s)
 *   2. Serves it instantly to the device with Content-Length (no chunked encoding)
 *   3. Proxies everything else (WebSocket hot-reload, assets, status) to Metro
 *
 * Usage: node dev-tools/bundle-proxy.js
 * Then: adb reverse tcp:8082 tcp:8082
 *       adb reverse tcp:8081 tcp:8081
 */

const http = require('http');
const net  = require('net');

const METRO_PORT = 8081;
const PROXY_PORT = 8082;
const PLATFORM   = process.argv[2] || 'android';

function downloadBundle() {
  return new Promise((resolve, reject) => {
    const path = `/index.bundle?platform=${PLATFORM}&dev=true&minify=false`;
    console.log(`[proxy] Downloading bundle from Metro :${METRO_PORT}${path}`);
    console.log('[proxy] This takes ~30s on first run, please wait...');

    const req = http.get({ hostname: 'localhost', port: METRO_PORT, path, timeout: 300000 }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Metro returned HTTP ${res.statusCode}`));
      }
      const chunks = [];
      let received = 0;
      res.on('data', (chunk) => {
        chunks.push(chunk);
        received += chunk.length;
        process.stdout.write(`\r[proxy] Received ${(received / 1024 / 1024).toFixed(1)} MB...`);
      });
      res.on('end', () => {
        const bundle = Buffer.concat(chunks);
        console.log(`\n[proxy] Bundle ready: ${(bundle.length / 1024 / 1024).toFixed(2)} MB`);
        resolve(bundle);
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Metro request timed out')); });
  });
}

async function main() {
  // Wait for Metro to be ready
  let metroReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((res, rej) => {
        const r = http.get({ hostname: 'localhost', port: METRO_PORT, path: '/status', timeout: 2000 }, (resp) => {
          resp.resume(); res();
        });
        r.on('error', rej);
        r.on('timeout', () => { r.destroy(); rej(new Error('timeout')); });
      });
      metroReady = true;
      break;
    } catch {
      process.stdout.write(`\r[proxy] Waiting for Metro... (${i + 1}/30)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  if (!metroReady) { console.error('\n[proxy] Metro did not start in time. Is Metro running?'); process.exit(1); }
  console.log('\n[proxy] Metro is up.');

  let bundle = await downloadBundle();

  const server = http.createServer((req, res) => {
    if (req.url && req.url.includes('.bundle')) {
      console.log(`[proxy] Serving cached bundle (${bundle.length} bytes) → ${req.url.slice(0, 60)}`);
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Content-Length': bundle.length,
        'Cache-Control': 'no-cache',
        'X-Bundle-Source': 'fuse-dev-proxy',
      });
      res.end(bundle);
    } else {
      // Forward everything else (assets, status, symbolicate) to Metro
      const opts = {
        hostname: 'localhost', port: METRO_PORT,
        path: req.url, method: req.method, headers: req.headers,
      };
      const proxy = http.request(opts, (pr) => {
        res.writeHead(pr.statusCode, pr.headers);
        pr.pipe(res);
      });
      proxy.on('error', () => res.end());
      req.pipe(proxy);
    }
  });

  // Proxy WebSocket upgrades (Metro hot-reload / Fast Refresh)
  server.on('upgrade', (req, socket, head) => {
    const upstream = net.connect(METRO_PORT, 'localhost', () => {
      upstream.write(
        `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        '\r\n\r\n'
      );
      if (head && head.length) upstream.write(head);
      socket.pipe(upstream);
      upstream.pipe(socket);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
  });

  server.listen(PROXY_PORT, () => {
    console.log(`\n[proxy] Ready on :${PROXY_PORT}  (Metro on :${METRO_PORT})`);
    console.log('[proxy] Hot-reload via WebSocket still works through this proxy.');
    console.log('[proxy] Press Ctrl+C to stop.\n');
  });

  // Refresh bundle in background every 5 minutes so code changes are picked up on next app restart
  setInterval(async () => {
    console.log('[proxy] Refreshing bundle cache...');
    try { bundle = await downloadBundle(); } catch (e) { console.error('[proxy] Refresh failed:', e.message); }
  }, 5 * 60 * 1000);
}

main().catch((e) => { console.error('[proxy] Fatal:', e.message); process.exit(1); });
