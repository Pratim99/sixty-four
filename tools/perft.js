/* Rules-engine self-test: counts legal move trees ("perft") against known-correct totals,
   and replays a few famous games through the SAN parser.  Run:  node tools/perft.js  */
var Chess = require('../js/chess.js');

function perft(g, d) {
  if (d === 0) return 1;
  var ms = g._legal(), n = 0;
  for (var i = 0; i < ms.length; i++) { g._make(ms[i]); n += perft(g, d - 1); g._unmake(); }
  return n;
}

var cases = [
  ['start', Chess.START, [20, 400, 8902, 197281]],
  ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862]],
  ['endgame', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238]],
  ['promotions', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
  ['position 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379]]
];

var bad = 0;
cases.forEach(function (c) {
  var g = new Chess(c[1]);
  c[2].forEach(function (want, i) {
    var got = perft(g, i + 1), ok = got === want;
    if (!ok) bad++;
    console.log((ok ? 'ok   ' : 'FAIL ') + c[0] + ' depth ' + (i + 1) + ': ' + got + (ok ? '' : ' (expected ' + want + ')'));
  });
  if (g.fen() !== c[1]) { bad++; console.log('FAIL ' + c[0] + ': position changed after search'); }
});

var games = [
  ['Opera Game', '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#'],
  ['Immortal Game', '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#'],
  ['En passant', '1. e4 Nf6 2. e5 d5 3. exd6']
];
games.forEach(function (gm) {
  try {
    var g = Chess.fromMoves(gm[1]);
    var typed = Chess.parseMoves(gm[1]).map(function (s) { return s.replace(/[+#]/g, ''); });
    var made = g.history().map(function (s) { return s.replace(/[+#]/g, ''); });
    var same = typed.join(' ') === made.join(' ');
    var mateOk = !/#$/.test(gm[1]) || g.isCheckmate();
    if (!same || !mateOk) bad++;
    console.log((same && mateOk ? 'ok   ' : 'FAIL ') + gm[0] + ': ' + g.history().length + ' moves' + (g.isCheckmate() ? ', ends in mate' : ''));
    if (!same) console.log('     engine wrote: ' + g.history().join(' '));
  } catch (e) { bad++; console.log('FAIL ' + gm[0] + ': ' + e.message); }
});

console.log(bad ? '\n' + bad + ' problem(s)' : '\nAll engine checks passed.');
process.exit(bad ? 1 : 0);
