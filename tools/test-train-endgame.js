/* Endgame-trainer self-test.  Run:  node tools/test-train-endgame.js
   1. The king-and-pawn solver (CL.kpk) against well-known results, and against the rules engine.
   2. The start positions of all five trainers: legal, and what they claim to be.
   3. Whole rounds: judged by the trainer's own referee, then played through the page itself
      with a stand-in document, board and engine.
   Exits with status 1 if anything fails. */
global.window = global;
global.Chess = require('../js/chess.js');
require('../js/core.js');
require('../js/drills.js');
require('../js/train-endgame.js');   // must load with no document in sight

var CL = global.CL, Chess = global.Chess, E = CL.endgame, K = CL.kpk;
var bad = 0, done = 0;

function check(ok, label) {
  done++;
  if (!ok) { bad++; console.log('  FAIL ' + label); }
}
function group(name, fn) {
  var b = bad, n = done, t = Date.now();
  fn();
  console.log((bad === b ? 'ok   ' : 'FAIL ') + name + ' (' + (done - n) + ' checks, ' + (Date.now() - t) + ' ms)');
}
function rnd(n) { return Math.floor(Math.random() * n); }
function dist(a, b) { return Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3))); }
function fen3(wk, p, bk, side) {
  var g = new Chess(CL.EMPTY);
  g.board[wk] = { type: 'k', color: 'w' }; g.board[p] = { type: 'p', color: 'w' }; g.board[bk] = { type: 'k', color: 'b' };
  g.turn = side;
  return g.fen();
}
/* The three pieces of a king-and-pawn position, as square numbers. */
function men(g) {
  var ps = g.pieces(), out = { wk: -1, bk: -1, p: -1, other: 0 }, s;
  for (s in ps) {
    if (ps[s].type === 'p' && ps[s].color === 'w') out.p = Chess.idx(s);
    else if (ps[s].type !== 'k') out.other++;
    else if (ps[s].color === 'w') out.wk = Chess.idx(s);
    else out.bk = Chess.idx(s);
  }
  return out;
}

/* ================= 1. the solver ================= */

group('solver: build', function () {
  var t = Date.now();
  K.build();
  check(Date.now() - t < 1000, 'the table builds in under a second (took ' + (Date.now() - t) + ' ms)');
});

group('solver: known results', function () {
  var cases = [
    ['e6', 'e5', 'e8', 'w', 'win', 'king on the sixth in front of its pawn wins, White to move'],
    ['e6', 'e5', 'e8', 'b', 'win', 'king on the sixth in front of its pawn wins, Black to move'],
    ['b6', 'b5', 'b8', 'w', 'win', 'the same on the b-file, White to move'],
    ['b6', 'b5', 'b8', 'b', 'win', 'the same on the b-file, Black to move'],
    ['e5', 'e4', 'e7', 'b', 'win', 'White has the opposition'],
    ['e5', 'e4', 'e7', 'w', 'draw', 'Black has the opposition'],
    ['d5', 'd4', 'd7', 'b', 'win', 'opposition on the d-file, Black to move'],
    ['d5', 'd4', 'd7', 'w', 'draw', 'opposition on the d-file, White to move'],
    ['e4', 'e2', 'e6', 'w', 'win', 'the spare pawn move (the position from the opposition lesson)'],
    ['e4', 'e3', 'e6', 'w', 'draw', 'no spare pawn move left'],
    ['e4', 'e3', 'e6', 'b', 'win', 'no spare move needed: Black must give way'],
    ['a6', 'a5', 'a8', 'w', 'draw', 'rook pawn, king on the sixth, defender in the corner'],
    ['a6', 'a5', 'a8', 'b', 'draw', 'rook pawn, king on the sixth, defender in the corner'],
    ['e6', 'e7', 'e8', 'b', 'draw', 'pawn on the seventh, Black to move: stalemate'],
    ['e6', 'e7', 'e8', 'w', 'win', 'pawn on the seventh, White to move: Kd6 and Kd7'],
    ['d6', 'e6', 'e8', 'w', 'win', 'king beside the pawn on the sixth, White to move: the pawn arrives without check'],
    ['d6', 'e6', 'e8', 'b', 'draw', 'king beside the pawn on the sixth, Black to move: the pawn arrives with check'],
    ['h1', 'b4', 'g4', 'w', 'win', 'the square: the pawn runs, king too far to help'],
    ['h1', 'b4', 'g4', 'b', 'draw', 'the square: Black steps into it'],
    ['h1', 'a4', 'f4', 'w', 'win', 'the square with a rook pawn'],
    ['h1', 'a4', 'f4', 'b', 'draw', 'the square with a rook pawn, Black to move'],
    ['a1', 'h2', 'a8', 'b', 'win', 'a pawn on its second rank counts as on the third for the square'],
    ['a1', 'c4', 'h4', 'w', 'win', 'Ka1, c4, Kh4 with White to move'],
    /* The square alone says "draw" here, but the white king is near enough to help:
       1...Kg5 2.Kb2 Kf6 3.Kc3 Ke7 4.Kb4 Kd7 5.Kb5 Kc7 6.Kc5 and White has the opposition in front of the pawn. */
    ['a1', 'c4', 'h4', 'b', 'win', 'Ka1, c4, Kh4 with Black to move (the white king arrives in time)'],
    ['a8', 'a7', 'c7', 'w', 'draw', 'White stalemated in front of the rook pawn'],
    ['c7', 'a6', 'a8', 'b', 'draw', 'defender shut in the corner still draws']
  ];
  cases.forEach(function (c) {
    var got = K.result(c[0], c[1], c[2], c[3]);
    check(got === c[4], c[5] + ': K' + c[0] + ' P' + c[1] + ' k' + c[2] + ' ' + c[3] + ' expected ' + c[4] + ', got ' + got);
    check(K.result(Chess.idx(c[0]), Chess.idx(c[1]), Chess.idx(c[2]), c[3]) === got, 'square numbers give the same answer');
    check((K.plies(c[0], c[1], c[2], c[3]) > 0) === (got === 'win'), 'plies agrees with result for ' + c[5]);
  });
  check(K.result('e1', 'e2', 'e2', 'w') === null && K.result('e1', 'e2', 'd2', 'w') === null, 'impossible positions give null');
  check(K.result('e1', 'e8', 'a8', 'w') === null && K.result('e1', 'e1', 'a8', 'w') === null, 'a pawn on the first or last rank gives null');
  check(K.result('e4', 'd5', 'e6', 'w') === null && K.result('e4', 'd5', 'e6', 'b') === 'draw', 'Black cannot be in check with White to move');
});

group('solver: every position', function () {
  var wins = 0, legal = 0, most = 0, corner = 0, mirror = 0, p, wk, bk, s, r, n;
  for (p = 8; p < 56; p++) for (wk = 0; wk < 64; wk++) for (bk = 0; bk < 64; bk++) for (s = 0; s < 2; s++) {
    r = K.result(wk, p, bk, s ? 'b' : 'w');
    if (r === null) continue;
    if (r !== K.result(wk ^ 7, p ^ 7, bk ^ 7, s ? 'b' : 'w')) mirror++;
    if ((p & 7) > 3) continue;
    legal++;
    n = K.plies(wk, p, bk, s ? 'b' : 'w');
    if (r === 'win') { wins++; if (n > most) most = n; if (!n || (n % 2 === 1) !== (s === 0)) corner++; }
    else if (n) corner++;
    /* rook pawn, defender on the corner square in front of it: always a draw */
    if ((p & 7) === 0 && bk === 56 && r !== 'draw') corner++;
  }
  check(mirror === 0, 'left-right mirror images agree');
  check(wins === 111282, 'White wins ' + wins + ' positions with the pawn on files a to d (the known figure is 111282)');
  check(legal === 165676, legal + ' legal positions with the pawn on files a to d (expected 165676)');
  check(most === 38, 'the longest win takes ' + most + ' half-moves to promote (expected 38, i.e. 19 moves)');
  check(corner === 0, 'no rook-pawn win against a king in the corner, and plies has the right parity everywhere');
});

/* What the rules engine says about one position, looking one move ahead and asking the table about the rest. */
function byRules(g) {
  var ms = g.moves(), white = g.turn === 'w', best = white ? 999 : -1, i, m, v, c, rs;
  if (!ms.length) return { res: 'draw', plies: 0, mate: g.inCheck() };
  for (i = 0; i < ms.length; i++) {
    g.move(ms[i]);
    m = men(g);
    if (m.p >= 0) v = K.plies(m.wk, m.p, m.bk, g.turn);
    else if (!m.other) v = 0;                                   // the pawn was taken
    else {
      c = g.get(ms[i].to).type; rs = g.moves();
      v = (c === 'q' || c === 'r') && rs.length && !rs.some(function (x) { return x.captured; }) ? -1 : 0;   // -1: promoted safely
      if ((c === 'q' || c === 'r') && !rs.length && g.inCheck()) v = -1;
    }
    g.undo();
    if (white) { if (v === -1) best = Math.min(best, 0); else if (v) best = Math.min(best, v); }
    else if (best !== 0) best = v ? Math.max(best, v) : 0;
  }
  if (white) return best === 999 ? { res: 'draw', plies: 0 } : { res: 'win', plies: best + 1 };
  return best > 0 ? { res: 'win', plies: best + 1 } : { res: 'draw', plies: 0 };
}

group('solver: agrees with the rules engine, one move deep', function () {
  var n = 0, wk, p, bk, side, r, g, want;
  while (n < 4000) {
    wk = rnd(64); bk = rnd(64); p = 8 + rnd(48); side = rnd(2) ? 'w' : 'b';
    r = K.result(wk, p, bk, side);
    if (r === null) continue;
    n++;
    g = new Chess(fen3(wk, p, bk, side));
    want = byRules(g);
    check(!want.mate, 'no checkmate with king and pawn alone: ' + g.fen());
    check(want.res === r && want.plies === K.plies(wk, p, bk, side),
      g.fen() + ' table ' + r + '/' + K.plies(wk, p, bk, side) + ', rules ' + want.res + '/' + want.plies);
  }
  /* and the null answers really are illegal positions */
  for (n = 0; n < 2000; n++) {
    wk = rnd(64); bk = rnd(64); p = 8 + rnd(48); side = rnd(2) ? 'w' : 'b';
    g = new Chess(fen3(wk, p, bk, side));
    g.turn = side === 'w' ? 'b' : 'w';
    want = wk === bk || wk === p || bk === p || dist(wk, bk) < 2 || g.inCheck();
    check((K.result(wk, p, bk, side) === null) === want, 'legality of ' + fen3(wk, p, bk, side));
  }
});

/* ================= 2. start positions ================= */

var SAMPLES = 300;

/* Legal for a trainer: both kings, kings apart, the side not to move not in check, a move to make. */
function legalStart(fen, label) {
  var g = new Chess(fen), ps = g.pieces(), kings = { w: [], b: [] }, s, o;
  for (s in ps) if (ps[s].type === 'k') kings[ps[s].color].push(Chess.idx(s));
  check(kings.w.length === 1 && kings.b.length === 1, label + ': one king each ' + fen);
  check(dist(kings.w[0], kings.b[0]) > 1, label + ': kings not next to each other ' + fen);
  o = new Chess(fen); o.turn = g.turn === 'w' ? 'b' : 'w';
  check(!o.inCheck(), label + ': the side not to move is not in check ' + fen);
  check(g.moves().length > 0 && !g.isCheckmate() && !g.isStalemate(), label + ': not already mate or stalemate ' + fen);
  check(/ - - 0 1$/.test(fen), label + ': no castling rights or en passant square ' + fen);
  return g;
}

group('start positions: the three mates', function () {
  [['krr', 'RR'], ['kq', 'Q'], ['kr', 'R']].forEach(function (k) {
    var seen = {}, i, fen, g, ps, s, got, bk;
    for (i = 0; i < SAMPLES; i++) {
      fen = E.start(k[0]);
      seen[fen] = 1;
      g = legalStart(fen, k[0]);
      ps = g.pieces(); got = ''; bk = -1;
      for (s in ps) {
        if (ps[s].type === 'k') { if (ps[s].color === 'b') bk = Chess.idx(s); }
        else got += ps[s].color === 'w' ? ps[s].type.toUpperCase() : ps[s].type;
      }
      check(got === k[1] && g.turn === 'w', k[0] + ': White to move with exactly ' + k[1] + ' ' + fen);
      for (s in ps) if (ps[s].color === 'w' && ps[s].type !== 'k') check(dist(Chess.idx(s), bk) > 1, k[0] + ': nothing next to the black king ' + fen);
      /* whatever White plays first, the black king cannot have had a capture waiting */
      g.turn = 'b';
      check(!g.moves().some(function (m) { return m.captured; }), k[0] + ': no capture for the black king at the start ' + fen);
    }
    check(Object.keys(seen).length > SAMPLES * 0.9, k[0] + ': positions vary (' + Object.keys(seen).length + ' different)');
  });
});

group('start positions: escort the pawn', function () {
  var rook = 0, seen = {}, i, fen, g, m, ms, wins;
  for (i = 0; i < SAMPLES; i++) {
    fen = E.start('kp-win');
    seen[fen] = 1;
    g = legalStart(fen, 'kp-win');
    m = men(g);
    check(m.p >= 0 && !m.other && g.turn === 'w', 'kp-win: king and pawn against king, White to move ' + fen);
    check(K.result(m.wk, m.p, m.bk, 'w') === 'win', 'kp-win: the solver calls it a win ' + fen);
    check(E.outlook(g).res === 'win' && E.outlook(g).plies === K.plies(m.wk, m.p, m.bk, 'w'), 'kp-win: outlook agrees ' + fen);
    check((m.p >> 3) >= 1 && (m.p >> 3) <= 4, 'kp-win: pawn on ranks 2 to 5 ' + fen);
    check(dist(m.wk, m.p) <= 2 && dist(m.bk, m.p) <= 3, 'kp-win: kings near the pawn ' + fen);
    if ((m.p & 7) === 0 || (m.p & 7) === 7) rook++;
    ms = g.moves();
    wins = ms.filter(function (x) { g.move(x); var ok = E.outlook(g).res === 'win'; g.undo(); return ok; }).length;
    check(wins >= 1 && wins * 2 <= ms.length, 'kp-win: some first moves win, and at most half ' + fen);
  }
  check(rook * 3 <= SAMPLES, 'kp-win: a rook pawn at most one time in three (' + rook + ' of ' + SAMPLES + ')');
  check(Object.keys(seen).length > SAMPLES * 0.8, 'kp-win: positions vary (' + Object.keys(seen).length + ' different)');
});

group('start positions: hold the draw', function () {
  var rook = 0, first = { w: 0, b: 0 }, seen = {}, i, fen, g, m;
  for (i = 0; i < SAMPLES; i++) {
    fen = E.start('kp-draw');
    seen[fen] = 1;
    g = legalStart(fen, 'kp-draw');
    m = men(g);
    first[g.turn]++;
    check(m.p >= 0 && !m.other, 'kp-draw: king and pawn against king ' + fen);
    check(K.result(m.wk, m.p, m.bk, g.turn) === 'draw', 'kp-draw: the solver calls it a draw ' + fen);
    check(E.outlook(g).res === 'draw', 'kp-draw: outlook agrees ' + fen);
    check((m.p >> 3) >= 1 && (m.p >> 3) <= 4, 'kp-draw: pawn on ranks 2 to 5 ' + fen);
    check(dist(m.wk, m.p) <= 2 && dist(m.bk, m.p) <= 3, 'kp-draw: kings near the pawn ' + fen);
    check(!(g.turn === 'b' && g.moves().some(function (x) { return x.captured; })), 'kp-draw: the pawn is not simply hanging ' + fen);
    if ((m.p & 7) === 0 || (m.p & 7) === 7) rook++;
  }
  check(rook * 3 <= SAMPLES, 'kp-draw: a rook pawn at most one time in three (' + rook + ' of ' + SAMPLES + ')');
  check(first.w > 0 && first.b > 0, 'kp-draw: either side may move first (' + first.w + ' White, ' + first.b + ' Black)');
  check(Object.keys(seen).length > SAMPLES * 0.8, 'kp-draw: positions vary (' + Object.keys(seen).length + ' different)');
});

/* ================= 3. rounds ================= */

function key(g) { return g.fen().split(' ').slice(0, 4).join(' '); }
/* The legal moves after which the solver's verdict is `res` ('win' for White, or 'draw'). */
function leading(g, res) {
  return g.moves().filter(function (m) { g.move(m); var ok = E.outlook(g).res === res; g.undo(); return ok; });
}

group('rounds: best play promotes in exactly par', function () {
  var i, g, keys, moves, over, par, fen;
  for (i = 0; i < 150; i++) {
    fen = E.start('kp-win'); g = new Chess(fen); keys = [key(g)]; moves = 0; over = null;
    par = Math.ceil(E.outlook(g).plies / 2);
    while (!over && moves < 40) {
      g.move(E.guard(g, null));
      if (g.turn === 'b') moves++;
      keys.push(key(g));
      over = E.judge('kp-win', g, keys, moves);
    }
    check(over && over.won && (over.code === 'promoted' || over.code === 'mate') && moves === par, 'kp-win ' + fen + ': ' + JSON.stringify(over) + ' in ' + moves + ', par ' + par);
  }
});

group('rounds: a perfect defender always holds, and White keeps testing', function () {
  var ends = {}, total = 0, i, g, keys, moves, over, fen, ms, m;
  for (i = 0; i < 150; i++) {
    fen = E.start('kp-draw'); g = new Chess(fen); keys = [key(g)]; moves = 0; over = null;
    while (!over) {
      if (g.turn === 'b') {
        ms = leading(g, 'draw');
        check(ms.length > 0, 'a drawing move exists in ' + g.fen());
        g.move(ms[rnd(ms.length)]); moves++;
      } else {
        check(E.outlook(g).res === 'draw', 'still a draw with White to move: ' + g.fen());
        ms = g.moves();
        m = ms.length === 1 ? ms[0] : E.tryMove(g, keys);
        if (!m) { over = { won: true, code: 'tries' }; break; }
        check(!!g.move(m), 'the try is a legal move in ' + g.fen());
      }
      keys.push(key(g));
      over = E.judge('kp-draw', g, keys, moves);
    }
    check(over.won && moves <= 16, 'kp-draw ' + fen + ': ' + JSON.stringify(over) + ' after ' + moves);
    ends[over.code] = (ends[over.code] || 0) + 1; total += moves;
  }
  console.log('     endings: ' + JSON.stringify(ends) + ', average ' + (total / 150).toFixed(1) + ' moves');
});

group('rounds: the guard keeps an engine honest', function () {
  var i, g, ms, m, got, n, played;
  for (i = 0; i < 100; i++) {
    /* a won position: an engine move stands if it wins and brings the promotion nearer; otherwise the table's move is played */
    g = new Chess(E.start('kp-win'));
    ms = g.moves(); m = ms[rnd(ms.length)]; n = E.outlook(g).plies;
    g.move(m); got = E.outlook(g); g.undo();
    played = E.guard(g, { from: m.from, to: m.to, promotion: m.promotion });
    check((played.san === m.san) === (got.res === 'win' && got.plies < n), 'an engine move is kept only if it wins and makes progress: ' + m.san + ' in ' + g.fen());
    g.move(played);
    check(E.outlook(g).res === 'win' && E.outlook(g).plies < n, 'after the guard the win is nearer: ' + g.fen());
    /* Black, now lost, cannot be helped; but one move after a slip Black must find the draw */
    g = new Chess(E.start('kp-win'));
    ms = leading(g, 'draw');
    if (ms.length) {
      g.move(ms[rnd(ms.length)]);
      if (g.moves().length) {
        m = g.moves()[0];
        g.move(E.guard(g, { from: m.from, to: m.to }));
        check(E.outlook(g).res === 'draw', 'Black takes the draw it was offered: ' + g.fen());
      }
    }
  }
});

group('rounds: the referee', function () {
  function after(fen, moves) {
    var g = new Chess(fen), keys = [key(g)];
    moves.forEach(function (m) { if (!g.move(m)) throw new Error('illegal ' + m + ' in ' + fen); keys.push(key(g)); });
    return { g: g, keys: keys };
  }
  function verdict(kind, fen, moves, won, code, word) {
    var x = after(fen, moves), over = E.judge(kind, x.g, x.keys, Math.ceil(moves.length / 2)), words;
    check(over ? (over.won === won && over.code === code) : code === null, kind + ' ' + moves.join(' ') + ': expected ' + code + ', got ' + JSON.stringify(over));
    if (over) {
      words = E.describe(kind, over, x.g, Math.ceil(moves.length / 2));
      check(words.length === 2 && words[0] && words[1] && (words[0] + ' ' + words[1]).indexOf(word) >= 0, kind + ' ' + code + ' is explained with "' + word + '": ' + words.join(' '));
      check(key(x.g) === x.keys[x.keys.length - 1], 'describing a round leaves the game as it was');
    }
  }
  verdict('kq', '6k1/Q7/5K2/8/8/8/8/8 w - - 0 1', ['Qg7#'], true, 'mate', 'Checkmate');
  verdict('kq', '7k/8/8/6Q1/8/8/8/K7 w - - 0 1', ['Qg6'], false, 'stalemate', 'not in check');
  verdict('kq', '8/8/8/4k3/8/8/8/K6Q w - - 0 1', ['Qd5+', 'Kxd5'], false, 'piece-lost', 'queen');
  verdict('kq', '8/8/8/4k3/8/8/8/K6Q w - - 0 1', ['Qh2+'], false, null, '');
  verdict('kq', '8/8/8/4k3/8/8/8/K6Q w - - 0 1', ['Qh2+', 'Ke6', 'Qh1', 'Ke5', 'Qh2+', 'Ke6', 'Qh1', 'Ke5'], false, 'threefold', 'three times');
  verdict('kq', '8/8/8/4k3/8/8/8/K6Q w - - 99 80', ['Qh2+'], false, 'fifty', 'fifty-move');
  verdict('kr', '6k1/8/6K1/8/8/8/8/R7 w - - 0 1', ['Ra8#'], true, 'mate', 'Checkmate');
  verdict('kr', '8/8/8/4k3/8/8/8/K6R w - - 0 1', ['Rh5+', 'Kf4', 'Rh4+', 'Kg5', 'Rg4+', 'Kxg4'], false, 'piece-lost', 'rook');
  verdict('kr', 'k7/8/8/1K6/8/8/8/1R6 w - - 0 1', ['Ka6'], false, 'stalemate', 'draw');
  verdict('krr', '4k3/R7/1R6/8/8/8/8/6K1 w - - 0 1', ['Rb8#'], true, 'mate', 'Checkmate');
  verdict('krr', '8/8/8/8/3k4/2R5/8/R5K1 w - - 0 1', ['Ra4+', 'Kxc3'], false, 'piece-lost', 'ladder');
  verdict('kp-win', '8/k1P5/2K5/8/8/8/8/8 w - - 0 1', ['c8=Q'], false, 'stalemate', 'Promote to a rook');
  verdict('kp-win', '8/k1P5/2K5/8/8/8/8/8 w - - 0 1', ['c8=R'], true, 'promoted', 'rook-and-king');
  verdict('kp-win', '8/6P1/8/8/8/7K/8/7k w - - 0 1', ['g8=Q'], false, 'stalemate', 'king move first');
  verdict('kp-win', '8/6P1/8/8/8/7K/8/7k w - - 0 1', ['Kh4', 'Kg2', 'g8=Q+'], true, 'promoted', 'queen-and-king');
  verdict('kp-win', '8/2Pk4/8/8/8/8/8/K7 w - - 0 1', ['c8=Q+'], false, null, '');
  verdict('kp-win', '8/2Pk4/8/8/8/8/8/K7 w - - 0 1', ['c8=Q+', 'Kxc8'], false, 'piece-lost', 'promotion square');
  verdict('kp-win', '8/2P5/3K4/8/8/8/8/k7 w - - 0 1', ['c8=N'], false, 'minor', 'knight');
  verdict('kp-win', '8/8/8/2k5/2P5/8/8/K7 b - - 0 1', ['Kxc4'], false, 'pawn-lost', 'took the pawn');
  verdict('kp-win', 'K7/P1k5/8/8/8/8/8/8 b - - 0 1', ['Kc8'], false, 'stalemate', 'no legal move');
  verdict('kp-draw', '3k4/8/3KP3/8/8/8/8/8 w - - 0 1', ['e7+', 'Ke8', 'Ke6'], true, 'stalemate', 'held the draw');
  verdict('kp-draw', '8/8/8/2k5/2P5/8/8/K7 b - - 0 1', ['Kxc4'], true, 'taken', 'took the pawn');
  verdict('kp-draw', '8/2P5/3K4/8/8/8/8/k7 w - - 0 1', ['c8=Q'], false, 'promoted', 'promoted');
  verdict('kp-draw', '8/2Pk4/8/8/8/8/8/K7 w - - 0 1', ['c8=Q+'], false, null, '');
  verdict('kp-draw', '8/2Pk4/8/8/8/8/8/K7 w - - 0 1', ['c8=Q+', 'Kxc8'], true, 'taken', 'new queen');
  verdict('kp-draw', '8/2Pk4/8/8/8/8/8/K7 w - - 0 1', ['c8=Q+', 'Ke7', 'Kb2'], false, 'promoted', 'promoted');
  verdict('kp-draw', 'K7/P1k5/8/8/8/8/8/8 b - - 0 1', ['Kc8'], true, 'stalemate', 'White is not in check');
  verdict('kp-draw', '4k3/8/8/4P3/4K3/8/8/8 w - - 0 1', ['Kd4', 'Kd8', 'Ke4', 'Ke8', 'Kd4', 'Kd8', 'Ke4', 'Ke8'], true, 'threefold', 'three times');
  var x = after('4k3/8/8/4P3/4K3/8/8/8 b - - 0 1', []);
  check(E.judge('kp-draw', x.g, x.keys, 15) === null, 'not yet a book draw after 15 moves');
  check((E.judge('kp-draw', x.g, x.keys, 16) || {}).code === 'held', 'a book draw after 16 moves');
  ['held', 'tries', 'fifty'].forEach(function (code) {
    var w = E.describe('kp-draw', { won: true, code: code }, x.g, 16);
    check(w[0] && w[1], 'kp-draw ' + code + ' has an explanation');
  });
  check(E.describe('kp-win', { won: false, code: 'fifty' }, x.g, 60)[1] && E.describe('kp-win', { won: false, code: 'threefold' }, x.g, 9)[1], 'kp-win draws are explained');
});

/* ================= 4. the page, with stand-ins for the document, the board and the engine ================= */

function El(tag) {
  this.tagName = String(tag).toUpperCase(); this.nodeType = 1; this.children = []; this.parentNode = null;
  this.className = ''; this._text = ''; this._on = {}; this.attrs = {}; this.hidden = false; this.disabled = false; this.style = {};
}
El.prototype.appendChild = function (c) {
  if (c.parentNode) c.parentNode.removeChild(c);
  c.parentNode = this; this.children.push(c);
  return c;
};
El.prototype.removeChild = function (c) {
  var i = this.children.indexOf(c);
  if (i < 0) throw new Error('removeChild: not a child');
  this.children.splice(i, 1); c.parentNode = null;
  return c;
};
El.prototype.addEventListener = function (type, fn) { this._on[type] = fn; };
El.prototype.setAttribute = function (k, v) { if (k === 'hidden') this.hidden = true; else this.attrs[k] = v; };
Object.defineProperty(El.prototype, 'textContent', {
  get: function () { return this._text + this.children.map(function (c) { return c.textContent; }).join(''); },
  set: function (v) { this.children = []; this._text = String(v); }
});
Object.defineProperty(El.prototype, 'innerHTML', {
  get: function () { return this.textContent; },
  set: function (v) { this.children = []; this._text = String(v).replace(/<[^>]*>/g, ''); }
});
global.document = {
  createElement: function (tag) { return new El(tag); },
  createTextNode: function (s) { return { nodeType: 3, textContent: String(s), parentNode: null }; }
};

function Board(host, opts) { Board.last = this; this.host = host; this.orient = (opts && opts.orient) || 'w'; this.pos = null; this.hl = {}; this.arrows = []; this.shakes = 0; }
Board.prototype.setPosition = function (pos) { this.pos = pos; };
Board.prototype.setLast = function (pair) { this.lastPair = pair; };
Board.prototype.setHighlights = function (hl) { this.hl = hl; };
Board.prototype.setArrows = function (list) { this.arrows = list; };
Board.prototype.shake = function () { this.shakes++; };
Board.prototype.flip = function () { this.orient = this.orient === 'w' ? 'b' : 'w'; };
Board.pieceSvg = function () { return ''; };
global.Board = Board;

var store = {};
global.localStorage = {
  getItem: function (k) { return k in store ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};

/* An "engine" that moves at random: the trainers must cope with any reply. */
var engine = { bot: 0, best: 0, cancel: 0, down: false };
CL.brain = {
  bot: function (fen, elo) {
    engine.bot++; engine.elo = elo;
    if (engine.down) return Promise.reject(new Error('engine down'));
    var ms = new Chess(fen).moves(), m = ms[rnd(ms.length)];
    return Promise.resolve({ move: { from: m.from, to: m.to, promotion: m.promotion } });
  },
  best: function (fen) {
    engine.best++;
    if (engine.down) return Promise.reject(new Error('engine down'));
    var ms = new Chess(fen).moves();
    return Promise.resolve({ best: ms[rnd(ms.length)], score: 0 });
  },
  cancel: function () { engine.cancel++; }
};

/* Timers run only when the test says so. */
var queue = [], nextId = 1;
global.setTimeout = function (fn) { queue.push({ id: nextId, fn: fn }); return nextId++; };
global.clearTimeout = function (id) { queue = queue.filter(function (t) { return t.id !== id; }); };
function breathe() { return new Promise(function (resolve) { setImmediate(resolve); }); }
async function settle() {
  for (var i = 0; i < 20; i++) {
    await breathe();
    if (!queue.length) { await breathe(); if (!queue.length) return; }
    var q = queue; queue = [];
    q.forEach(function (t) { t.fn(); });
  }
  throw new Error('timers never settle');
}

function find(el, test) {
  if (el.nodeType !== 1) return null;
  if (test(el)) return el;
  for (var i = 0; i < el.children.length; i++) { var hit = find(el.children[i], test); if (hit) return hit; }
  return null;
}
function findAll(el, test, out) {
  out = out || [];
  if (el.nodeType !== 1) return out;
  if (test(el)) out.push(el);
  el.children.forEach(function (c) { findAll(c, test, out); });
  return out;
}
function hasClass(c) { return function (el) { return (' ' + el.className + ' ').indexOf(' ' + c + ' ') >= 0; }; }

var page = null, cleanup = null, board = null, fixed = null, realStart = E.start;
E.start = function (kind) { return fixed || realStart(kind); };

async function open(id) {
  if (cleanup) cleanup();
  var t = CL.trainers.filter(function (x) { return x.id === id; })[0];
  page = new El('main');
  cleanup = t.run(page, { id: 'train', title: 'Training' }, t);
  board = Board.last;
  await settle();
}
function button(label) {
  return find(page, function (el) { return el.tagName === 'BUTTON' && el.textContent === label && !(el.parentNode && el.parentNode.hidden); });
}
async function press(label) {
  var b = button(label);
  if (!b) throw new Error('no button "' + label + '"');
  if (!b.disabled) b._on.click({ target: b });
  await settle();
}
function text(cls) { var el = find(page, hasClass(cls)); return el && !el.hidden ? el.textContent : ''; }
function tiles() { return findAll(page, hasClass('tile')).map(function (t) { return t.children[0].textContent; }); }
function result() { return find(page, hasClass('result')); }
/* Make a move the way the board would report it, choosing a piece if the promotion box opens. */
async function move(m, wait) {
  check(board.movable(m.from).indexOf(m.to) >= 0, 'the board offers ' + m.from + m.to);
  board.onMove(m.from, m.to, { dragged: false });
  var box = find(page, hasClass('promo'));
  if (box) {
    var want = Chess.PIECE_NAMES[m.promotion || 'q'];
    var b = find(box, function (el) { return el.tagName === 'BUTTON' && el.attrs.title === want; });
    b._on.click({ target: b });
  }
  if (wait !== false) await settle();
}
function mv(san) { return board.pos.moves().filter(function (m) { return m.san === san; })[0]; }

async function pageTests() {
  var b, n, g, ms, i, par, bots, start;

  /* ----- queen and king: fixed positions ----- */
  n = done; b = bad;
  fixed = '6k1/Q7/5K2/8/8/8/8/8 w - - 0 1';
  await open('kq');
  check(find(page, hasClass('crumb')).attrs.href === '#/train', 'the crumb goes back to training');
  check(!!find(page, function (el) { return el.tagName === 'A' && el.attrs.href === '#/mates/lesson/queen'; }), 'kq links to its lesson');
  check(['New position', 'Take back', 'Hint', 'Flip board'].every(function (l) { return !!button(l); }) && !button('Take it back'), 'the four buttons are there');
  check(text('status') === 'Your move' && tiles().join(',') === '0,10,–', 'kq opens ready: ' + text('status') + ' / ' + tiles().join(','));
  check(button('Take back').disabled && !button('Hint').disabled, 'nothing to take back yet');
  await move(mv('Qg7#'));
  check(result() && hasClass('won')(result()) && /Checkmate/.test(result().textContent) && /Par is 10/.test(result().textContent), 'mate in one is a win: ' + (result() && result().textContent));
  check(CL.store.best('train/drill/kq') === 59 && CL.activity.last('train/drill/kq').score === 59, 'score 59 saved and logged');
  check(tiles().join(',') === '1,10,1' && button('Hint').disabled && board.movable('g7') === null, 'the round is closed: ' + tiles().join(','));
  await press('Same position again');
  check(!result() && board.pos.fen() === fixed && tiles()[0] === '0', 'the same position again');

  fixed = '7k/8/8/6Q1/8/8/8/K7 w - - 0 1';
  await press('New position');
  await move(mv('Qg6'));
  check(result() && hasClass('lost')(result()) && /Stalemate/.test(result().textContent) && /not in check/.test(result().textContent), 'stalemate is a failure with a reason');
  check(CL.store.best('train/drill/kq') === 59 && CL.activity.last('train/drill/kq').score === 0, 'a failure logs 0 and leaves the best alone');

  fixed = '8/8/8/4k3/8/8/8/K6Q w - - 0 1';
  await press('New position');
  bots = engine.bot;
  await move(mv('Qd5+'));
  check(result() && /took your queen/.test(result().textContent) && engine.bot === bots, 'a hanging queen is taken at once, without asking the engine');

  /* ----- queen and king: a random position, the buttons, an engine that is down ----- */
  fixed = null;
  await press('New position');
  start = board.pos.fen();
  ms = board.pos.moves().filter(function (m) { return m.piece === 'k'; });
  bots = engine.bot;
  await move(ms[0]);
  check(board.pos.hist.length === 2 && board.pos.turn === 'w' && (engine.bot === bots || (engine.bot === bots + 1 && engine.elo === 2800)), 'Black replied, through the engine at 2800');
  check(findAll(page, hasClass('mbtn')).length === 2, 'both moves are in the move list');
  await press('Hint');
  check(/Look at your/.test(text('feedback')) && board.hl.note && board.hl.note.length === 1, 'first hint points at a piece: ' + text('feedback'));
  await press('Hint');
  check(/The engine would play/.test(text('feedback')) && board.arrows.length === 1, 'second hint shows the move');
  await press('Take back');
  check(board.pos.fen() === start && board.pos.hist.length === 0 && board.arrows.length === 0 && !text('feedback'), 'take back undoes the move and the reply');
  check(tiles()[0] === '1', 'a move taken back still counts');
  await press('Flip board');
  check(board.orient === 'b', 'the board flips');
  engine.down = true;
  await move(board.pos.moves().filter(function (m) { return m.piece === 'k'; })[0]);
  check(board.pos.hist.length === 2 || !!result(), 'with the engine down Black still moves');
  await press('Hint');
  check(/No hint/.test(text('feedback')), 'with the engine down there is no hint, and no crash');
  engine.down = false;
  console.log((bad === b ? 'ok   ' : 'FAIL ') + 'page: queen and king (' + (done - n) + ' checks)');

  /* ----- the ladder, and rook and king ----- */
  n = done; b = bad;
  fixed = '4k3/R7/1R6/8/8/8/8/6K1 w - - 0 1';
  await open('krr');
  check(tiles().join(',') === '0,8,–' && !!find(page, function (el) { return el.attrs.href === '#/mates/lesson/ladder'; }), 'krr: par 8 and the ladder lesson');
  await move(mv('Rb8#'));
  check(result() && hasClass('won')(result()) && CL.store.best('train/drill/krr') === 59, 'krr: mate in one');
  fixed = '6k1/8/6K1/8/8/8/8/R7 w - - 0 1';
  await open('kr');
  check(tiles().join(',') === '0,16,–' && !!find(page, function (el) { return el.attrs.href === '#/mates/lesson/ladder'; }), 'kr: par 16 and the ladder lesson');
  await move(mv('Ra2'));
  await move(mv('Ra8#') || mv('Ra7') || board.pos.moves()[0]);
  check(board.pos.hist.length >= 3 || !!result(), 'kr: play goes on');
  fixed = null;
  for (i = 0; i < 20; i++) {
    await open(i % 2 ? 'kr' : 'krr');
    for (g = 0; g < 6 && !result(); g++) { ms = board.pos.moves(); await move(ms[rnd(ms.length)]); }
    check(!!result() || (board.pos.turn === 'w' && text('status').indexOf('Your move') >= 0), 'random play never jams');
  }
  console.log((bad === b ? 'ok   ' : 'FAIL ') + 'page: the ladder, rook and king (' + (done - n) + ' checks)');

  /* ----- escort the pawn ----- */
  n = done; b = bad;
  await open('kp-win');
  check(!!find(page, function (el) { return el.attrs.href === '#/pawns/lesson/opposition'; }), 'kp-win links to the opposition lesson');
  start = board.pos.fen();
  par = Math.ceil(E.outlook(board.pos).plies / 2);
  check(tiles().join(',') === '0,' + par + ',–' && par >= 4, 'par comes from the solver: ' + tiles().join(','));
  for (i = 0; i < 40 && !result(); i++) await move(E.guard(board.pos, null));
  check(result() && hasClass('won')(result()) && /pawn is home|Checkmate/.test(result().textContent), 'best play wins: ' + (result() && result().textContent));
  check(+tiles()[0] <= par && CL.store.best('train/drill/kp-win') === 60 - (+tiles()[0]), 'in par or better against a random defender: ' + tiles().join(','));

  await press('Same position again');
  ms = leading(board.pos, 'draw');
  check(ms.length > 0, 'there is a way to go wrong in ' + start);
  bots = engine.bot;
  await move(ms[0], false);
  check(!!button('Take it back') && /lets Black draw/.test(text('feedback')) && board.shakes === 1 && engine.bot === bots, 'a move that throws the win away is called out before Black replies: ' + text('feedback'));
  check(text('status') === 'Are you sure?' && board.movable(board.pos.moves()[0].from) === null && button('Hint').disabled, 'the board waits for the decision');
  await press('Take it back');
  check(board.pos.fen() === start && !button('Take it back') && !text('feedback'), 'taken back to the start');
  await move(ms[0], false);
  await press('Play on');
  check(board.pos.hist.length === 2 && E.outlook(board.pos).res === 'draw', 'played on: Black replies and keeps the draw');
  if (result()) await press('Same position again');
  else {
    await press('Take back');
    check(board.pos.fen() === start, 'take back after playing on');
  }
  await press('Hint');
  await press('Hint');
  g = board.arrows[0];
  check(g && leading(board.pos, 'win').some(function (m) { return m.from === g[0] && m.to === g[1]; }), 'the hint is a winning move even when the engine suggests nonsense');
  for (i = 0; i < 40 && !result(); i++) await move(E.guard(board.pos, null));
  check(result() && hasClass('won')(result()) && /does not count/.test(result().textContent), 'a win with a hint does not set a best');

  fixed = '8/k1P5/2K5/8/8/8/8/8 w - - 0 1';
  await press('New position');
  await move({ from: 'c7', to: 'c8', promotion: 'q' });
  check(result() && hasClass('lost')(result()) && /Promote to a rook/.test(result().textContent), 'a stalemating queen: ' + (result() && result().textContent));
  await press('Same position again');
  await move({ from: 'c7', to: 'c8', promotion: 'r' });
  check(result() && hasClass('won')(result()) && /rook-and-king/.test(result().textContent), 'the rook wins it');
  fixed = '8/2Pk4/8/8/8/8/8/K7 w - - 0 1';
  await press('New position');
  await move({ from: 'c7', to: 'c8', promotion: 'q' });
  check(result() && hasClass('lost')(result()) && /took the new queen/.test(result().textContent), 'a queen that is taken at once');
  fixed = '8/2P5/3K4/8/8/8/8/k7 w - - 0 1';
  await press('New position');
  await move({ from: 'c7', to: 'c8', promotion: 'n' });
  check(result() && hasClass('lost')(result()) && /knight cannot give checkmate/.test(result().textContent), 'an underpromotion');
  check(!find(page, hasClass('promo')), 'the promotion box is gone');
  fixed = null;
  console.log((bad === b ? 'ok   ' : 'FAIL ') + 'page: escort the pawn (' + (done - n) + ' checks)');

  /* ----- hold the draw ----- */
  n = done; b = bad;
  bots = engine.bot;
  await open('kp-draw');
  check(board.orient === 'b' && board.pos.turn === 'b', 'the player has Black, seen from Black’s side');
  check(tiles().join(',') === '0,0,0', 'no run yet: ' + tiles().join(','));
  for (g = 1; g <= 2; g++) {
    for (i = 0; i < 40 && !result(); i++) { ms = leading(board.pos, 'draw'); await move(ms[rnd(ms.length)]); }
    check(result() && hasClass('won')(result()), 'a perfect defence holds: ' + (result() && result().textContent));
    check(tiles()[1] === String(g) && CL.store.best('train/drill/kp-draw') === g && CL.activity.last('train/drill/kp-draw').score === g, 'the run grows to ' + g + ': ' + tiles().join(','));
    await press('New position');
  }
  check(engine.bot === bots, 'in a drawn position White’s tries come from the solver, not the engine');

  /* a slip, taken back: the draw is held, but with help */
  for (i = 0; i < 30 && !leading(board.pos, 'win').length; i++) await press('New position');
  start = board.pos.fen();
  ms = leading(board.pos, 'win');
  await move(ms[0], false);
  check(!!button('Take it back') && /loses/.test(text('feedback')) && board.shakes === 1, 'a losing move is called out: ' + text('feedback'));
  await press('Take it back');
  check(board.pos.fen() === start && tiles()[0] === String(Math.floor(board.pos.hist.length / 2)), 'taken back');
  for (i = 0; i < 40 && !result(); i++) { ms = leading(board.pos, 'draw'); await move(ms[rnd(ms.length)]); }
  check(result() && hasClass('won')(result()) && /with help/.test(result().textContent) && tiles()[1] === '2', 'held with help: the run stays at 2');

  /* a slip, played on: White must convert */
  for (i = 0; i < 30 && (result() || !leading(board.pos, 'win').length); i++) await press('New position');
  bots = engine.bot;
  await move(leading(board.pos, 'win')[0], false);
  await press('Play on');
  for (i = 0; i < 60 && !result(); i++) await move(E.guard(board.pos, null));
  check(result() && hasClass('lost')(result()) && /promoted/.test(result().textContent), 'after a slip White wins: ' + (result() && result().textContent));
  check(engine.bot > bots, 'the engine is asked once the position is winning');
  check(tiles()[1] === '0' && CL.store.best('train/drill/kp-draw') === 2 && CL.activity.last('train/drill/kp-draw').score === 0, 'the run is over, the best stays');

  /* White has to give up the pawn, one way or another */
  fixed = '8/2Pk4/8/8/8/8/8/K7 w - - 0 1';
  await press('New position');
  check(board.pos.turn === 'b' && !result(), 'White moved first');
  await move(board.pos.moves().filter(function (m) { return m.captured; })[0]);
  check(result() && hasClass('won')(result()) && /You took the (pawn|new queen)/.test(result().textContent), 'taking it is a draw: ' + (result() && result().textContent));
  fixed = null;
  console.log((bad === b ? 'ok   ' : 'FAIL ') + 'page: hold the draw (' + (done - n) + ' checks)');

  /* ----- leaving the page ----- */
  n = done; b = bad;
  await open('kq');
  bots = engine.cancel;
  board.onMove.call(board, board.pos.moves()[0].from, board.pos.moves()[0].to, { dragged: true });
  g = board.pos.fen();
  cleanup(); cleanup = null;
  check(engine.cancel === bots + 1 && queue.length === 0, 'cleanup cancels the engine and clears the timers');
  await settle();
  check(board.pos.fen() === g, 'nothing moves after the page is left');
  check(CL.trainers.map(function (t) { return t.id; }).join(',') === 'krr,kq,kr,kp-win,kp-draw' &&
    CL.trainers.every(function (t) { return t.group === 'endgames' && t.title && t.desc && typeof t.run === 'function'; }), 'five trainers registered in the endgames group');
  console.log((bad === b ? 'ok   ' : 'FAIL ') + 'page: leaving (' + (done - n) + ' checks)');
}

pageTests().then(function () {
  console.log(bad ? bad + ' of ' + done + ' checks FAILED' : 'All ' + done + ' checks passed.');
  process.exit(bad ? 1 : 0);
}, function (e) {
  console.log('FAIL the page tests stopped: ' + (e && e.stack || e));
  process.exit(1);
});
