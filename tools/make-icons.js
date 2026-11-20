/* Draws the app icons (a small board with one green square) as PNG files in icons/.
   No image library needed: PNG is written by hand with Node's built-in zlib.
   Run:  node tools/make-icons.js      (only needed if you change the design) */
var fs = require('fs'), path = require('path'), zlib = require('zlib');

var CREAM = [0xf4, 0xf0, 0xe7], LIGHT = [0xec, 0xdc, 0xbd], DARK = [0xad, 0x86, 0x5f], GREEN = [0x2d, 0x6a, 0x4f], EDGE = [0x6b, 0x52, 0x3a];

/* size: pixels. inset: fraction of the icon left as margin around the board. */
function draw(size, inset) {
  var px = Buffer.alloc(size * size * 3), m = Math.round(size * inset), b = size - 2 * m, cell = b / 4, line = Math.max(1, Math.round(size / 96));
  for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
    var c = CREAM, bx = x - m, by = y - m;
    if (bx >= -line && by >= -line && bx < b + line && by < b + line) {
      if (bx < 0 || by < 0 || bx >= b || by >= b) c = EDGE;
      else {
        var cx = Math.min(3, Math.floor(bx / cell)), cy = Math.min(3, Math.floor(by / cell));
        c = (cx === 2 && cy === 2) ? GREEN : ((cx + cy) % 2 ? DARK : LIGHT);
      }
    }
    var o = (y * size + x) * 3;
    px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
  }
  return png(size, px);
}

var table = [];
for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
function crc(buf) { var c = 0xffffffff; for (var i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  var len = Buffer.alloc(4), body = Buffer.concat([Buffer.from(type, 'ascii'), data]), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0); sum.writeUInt32BE(crc(body), 0);
  return Buffer.concat([len, body, sum]);
}
function png(size, rgb) {
  var head = Buffer.alloc(13), raw = Buffer.alloc(size * (size * 3 + 1));
  head.writeUInt32BE(size, 0); head.writeUInt32BE(size, 4); head[8] = 8; head[9] = 2;   // 8-bit RGB
  for (var y = 0; y < size; y++) rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

var out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
[['icon-192.png', 192, 0.1], ['icon-512.png', 512, 0.1], ['icon-maskable-512.png', 512, 0.2], ['apple-touch-icon.png', 180, 0.12]]
  .forEach(function (i) { fs.writeFileSync(path.join(out, i[0]), draw(i[1], i[2])); console.log('icons/' + i[0]); });
