/* A tiny static file server for the course.   Run:  node tools/serve.js   then open http://localhost:5173 */
var http = require('http'), fs = require('fs'), path = require('path');
var ROOT = path.resolve(__dirname, '..'), PORT = +process.env.PORT || 5173;
var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

http.createServer(function (req, res) {
  var rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.slice(-1) === '/') rel += 'index.html';   // a folder address serves its index page
  var file = path.join(ROOT, rel);
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, function () { console.log('Sixty-Four is running at http://localhost:' + PORT); });
