const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { buildLedgerEntry, rebuildLedger } = require('./playtest-ledger');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'playtest-reports');
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function safePath(urlPath) {
  const pathname = decodeURIComponent((urlPath || '/').split('?')[0]);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolved = path.resolve(root, relative);
  return resolved === root || resolved.startsWith(root + path.sep) ? resolved : null;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/__playtest_report') {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const report = JSON.parse(body);
        const seed = String(report.seed ?? 'unknown').replace(/[^a-zA-Z0-9_-]/g, '');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = 'prospector-playtest-' + seed + '-' + stamp + '.json';
        fs.mkdirSync(reportDir, { recursive: true });
        report.ledger = buildLedgerEntry(report, filename);
        fs.writeFileSync(path.join(reportDir, filename), JSON.stringify(report, null, 2), 'utf8');
        rebuildLedger();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          filename,
          path: path.join(reportDir, filename),
          ledger: report.ledger,
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: String(error.message || error) }));
      }
    });
    return;
  }

  const filePath = safePath(req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, bytes) => {
    if (error) {
      res.writeHead(error.code === 'ENOENT' ? 404 : 500);
      res.end(error.code === 'ENOENT' ? 'Not found' : 'Read error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (path.basename(filePath).toLowerCase() === 'index.html') {
      const html = bytes.toString('utf8');
      const injected = html.replace(
        /<\/body>/i,
        '<script src="/playtest-agent.js"></script>\n</body>'
      );
      res.writeHead(200, {
        'Content-Type': mime['.html'],
        'Cache-Control': 'no-store',
      });
      res.end(injected);
      return;
    }

    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(bytes);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log('Prospector II developer playtest: http://127.0.0.1:' + port);
  console.log('Production index.html is served unchanged; the agent is injected only here.');
});
