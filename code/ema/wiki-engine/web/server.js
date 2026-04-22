/**
 * Web Mirror Server — port 8091
 * Serves static wiki UI + proxies /api/* to wiki API on port 4488
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8091;
const API_PORT = 4488;
const WEB_DIR = path.join(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let filePath = path.join(WEB_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // SPA fallback: if no extension, serve index.html
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath = path.join(WEB_DIR, 'index.html');
  }
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(WEB_DIR, 'index.html');
  }
  
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function proxyApi(req, res) {
  // Proxy to wiki API
  const options = {
    hostname: 'localhost',
    port: API_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'API unavailable: ' + err.message }));
  });
  
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  if (req.url.startsWith('/api/')) {
    proxyApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[web-mirror] Running at http://localhost:${PORT}`);
  console.log(`[web-mirror] API proxy → http://localhost:${API_PORT}`);
});
