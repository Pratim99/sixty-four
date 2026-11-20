/* Builds dist/Sixty-Four.exe: one Windows program with the whole app embedded in it.
   Uses the C# compiler that ships with Windows, so nothing has to be downloaded.
   Run:  node tools/build-exe.js      (run it again whenever the app's files change) */
var fs = require('fs'), path = require('path'), cp = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var OUT = path.join(ROOT, 'dist');
var WORK = path.join(OUT, 'build');
var CSC = ['Framework64', 'Framework'].map(function (d) {
  return path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', d, 'v4.0.30319', 'csc.exe');
}).filter(fs.existsSync)[0];
if (!CSC) { console.error('Could not find the C# compiler (csc.exe) that normally ships with Windows.'); process.exit(1); }

/* Everything the browser needs: the page, styles, scripts and the Stockfish build. */
function walk(dir, list) {
  fs.readdirSync(path.join(ROOT, dir)).forEach(function (name) {
    var rel = dir + '/' + name, st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walk(rel, list); else list.push(rel);
  });
  return list;
}
var files = ['index.html', 'manifest.webmanifest'].concat(walk('css', []), walk('js', []), walk('vendor', []), walk('icons', []));

/* Warn about any script or stylesheet the page asks for that is not there. */
var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), missing = [], m, re = /(?:src|href)="([^"#]+\.(?:js|css))"/g;
while ((m = re.exec(html))) if (files.indexOf(m[1]) < 0) missing.push(m[1]);
if (missing.length) console.warn('Warning: index.html refers to files that do not exist: ' + missing.join(', '));

/* A small icon: a four-by-four board with one green square. */
function icon() {
  var S = 32, px = Buffer.alloc(S * S * 4), light = [0xbd, 0xdc, 0xec], dark = [0x5f, 0x86, 0xad], green = [0x4f, 0x6a, 0x2d];
  for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
    var cx = x >> 3, cy = y >> 3, c = (cx + cy) % 2 ? light : dark;
    if (cx === 2 && cy === 1) c = green;                       // rows are stored bottom-up
    var o = (y * S + x) * 4;
    px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;   // B, G, R, A
  }
  var head = Buffer.alloc(6 + 16), bih = Buffer.alloc(40), mask = Buffer.alloc(S * 4);
  head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head[6] = S; head[7] = S; head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(40 + px.length + mask.length, 14); head.writeUInt32LE(22, 18);
  bih.writeUInt32LE(40, 0); bih.writeInt32LE(S, 4); bih.writeInt32LE(S * 2, 8);
  bih.writeUInt16LE(1, 12); bih.writeUInt16LE(32, 14); bih.writeUInt32LE(px.length + mask.length, 20);
  return Buffer.concat([head, bih, px, mask]);
}

fs.mkdirSync(WORK, { recursive: true });
var ico = path.join(WORK, 'sixty-four.ico'), exe = path.join(OUT, 'Sixty-Four.exe'), rsp = path.join(WORK, 'build.rsp');
fs.writeFileSync(ico, icon());

var args = ['/nologo', '/target:winexe', '/optimize+', '/platform:anycpu',
  '/out:"' + exe + '"', '/win32icon:"' + ico + '"',
  '/r:System.dll',
  '/resource:"' + path.join(__dirname, 'launcher', 'bootstrap.js') + '","launcher/bootstrap.js"'];
files.forEach(function (f) { args.push('/resource:"' + path.join(ROOT, f) + '","app/' + f + '"'); });
args.push('"' + path.join(__dirname, 'launcher', 'Launcher.cs') + '"');
fs.writeFileSync(rsp, args.join('\r\n'));

try { if (fs.existsSync(exe)) fs.unlinkSync(exe); }
catch (e) { console.error('Could not replace ' + exe + '. Is Sixty-Four still running? Quit it and try again.'); process.exit(1); }

var r = cp.spawnSync(CSC, ['@' + rsp], { encoding: 'utf8' });
if (r.status !== 0) { console.error((r.stdout || '') + (r.stderr || '')); process.exit(1); }
var bytes = files.reduce(function (n, f) { return n + fs.statSync(path.join(ROOT, f)).size; }, 0);
console.log('Built ' + path.relative(ROOT, exe) + ': ' + (fs.statSync(exe).size / 1048576).toFixed(1) + ' MB, ' +
  files.length + ' files embedded (' + (bytes / 1048576).toFixed(1) + ' MB).');
