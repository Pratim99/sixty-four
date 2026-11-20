/* Checks the logic behind the "spot it" trainers (js/train-spot.js) against positions worked out by hand.
   Run:  node tools/test-train-spot.js  */
global.window = global;
global.Chess = require('../js/chess.js');
require('../js/core.js');
require('../js/train-spot.js');

var CL = global.CL, Chess = global.Chess, spot = CL.spot;
var checks = 0, problems = 0;

function same(where, got, want) {
  checks++;
  var a = JSON.stringify(got), b = JSON.stringify(want);
  if (a !== b) { problems++; console.log('FAIL  ' + where + '\n      got  ' + a + '\n      want ' + b); }
}
function truthy(where, v) { same(where, !!v, true); }
function sq(text) { return text ? text.split(' ') : []; }

var START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
var ITALIAN = 'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';

/* ---------- registration ---------- */

same('trainers registered', CL.trainers.map(function (t) { return t.id + ':' + t.group + ':' + t.timed; }),
  ['loose:vision:60', 'attackers:vision:45', 'pawnspot:pawns:60', 'outpost:strategy:60', 'material:strategy:45', 'square:pawns:45']);
CL.trainers.forEach(function (t) {
  truthy(t.id + ' has a title, a description and a run function', t.title && t.desc && typeof t.run === 'function');
});

/* ---------- loose pieces ---------- */

[
  // Only the rooks: each knight is guarded by its rook, each bishop and the queen by the king or queen.
  { name: 'start', fen: START, w: 'a1 h1', b: 'a8 h8' },
  // The bishops on c4 and c5 have left their defenders; the f3 and c6 knights are held by pawns.
  { name: 'Italian', fen: ITALIAN, w: 'a1 c4 h1', b: 'a8 c5 h8' },
  // Knight held by the g-pawn, rook held by the king.
  { name: 'all defended', fen: '6k1/5ppp/8/8/8/5N2/5PPP/5RK1 w - - 0 1', w: '', b: '' },
  // Queen and rook defend each other down the file; so do the two black rooks.
  { name: 'batteries', fen: '3r2k1/3r1ppp/8/8/8/8/3Q1PPP/3R2K1 w - - 0 1', w: '', b: '' },
  // A king between the rooks does not connect them; the queen is alone in the centre.
  { name: 'loose queen', fen: '4k3/8/8/8/3q4/8/8/R3K2R w - - 0 1', w: 'a1 h1', b: 'd4' }
].forEach(function (c) {
  var g = new Chess(c.fen);
  same('loose, ' + c.name + ', White', spot.loose(g, 'w'), sq(c.w));
  same('loose, ' + c.name + ', Black', spot.loose(g, 'b'), sq(c.b));
});

/* ---------- pawns ---------- */

var PAWNS = [
  // White a2 b2 c4 e4 e5 h3; Black a7 b7 c6 f7 g6 h7.
  // f7 is backward: its only neighbour (g6) has gone ahead and the white e5-pawn guards f6.
  // h7 is not: nothing guards h6. c6 is not: b7 stands behind it.
  { name: 'P1', fen: '4k3/pp3p1p/2p3p1/4P3/2P1P3/7P/PP6/4K3 w - - 0 1',
    w: { passed: '', isolated: 'e4 e5 h3', doubled: 'e4 e5', backward: '' },
    b: { passed: '', isolated: '', doubled: '', backward: 'f7' } },
  // White c4 e4 g4 h2; Black a7 c5 d6 e5. The classic backward d6-pawn behind c5 and e5, facing c4 and e4.
  // h2 has its neighbour ahead of it but nothing guards h3, so it is not backward.
  { name: 'P2', fen: '4k3/p7/3p4/2p1p3/2P1P1P1/8/7P/4K3 w - - 0 1',
    w: { passed: 'g4 h2', isolated: 'c4 e4', doubled: '', backward: '' },
    b: { passed: 'a7', isolated: 'a7', doubled: '', backward: 'd6' } },
  // White a4 b3 c4; Black a5 b6 f5 f6 f7. b3 is backward (a5 guards b4), b6 is backward (a4 and c4 guard b5).
  // The tripled f-pawns are passed, isolated and doubled all at once.
  { name: 'P3', fen: '4k3/5p2/1p3p2/p4p2/P1P5/1P6/8/4K3 w - - 0 1',
    w: { passed: '', isolated: '', doubled: '', backward: 'b3' },
    b: { passed: 'f5 f6 f7', isolated: 'f5 f6 f7', doubled: 'f5 f6 f7', backward: 'b6' } },
  // An isolated queen's pawn: d4 has no neighbours; e6 stops it being passed.
  { name: 'IQP', fen: 'r1bq1rk1/pp2bppp/2n1pn2/8/3P4/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 1',
    w: { passed: '', isolated: 'd4', doubled: '', backward: '' },
    b: { passed: '', isolated: '', doubled: '', backward: '' } },
  { name: 'start', fen: START,
    w: { passed: '', isolated: '', doubled: '', backward: '' },
    b: { passed: '', isolated: '', doubled: '', backward: '' } }
];
PAWNS.forEach(function (c) {
  var g = new Chess(c.fen);
  ['passed', 'isolated', 'doubled', 'backward'].forEach(function (cat) {
    same(cat + ', ' + c.name + ', White', spot.pawns(g, 'w', cat), sq(c.w[cat]));
    same(cat + ', ' + c.name + ', Black', spot.pawns(g, 'b', cat), sq(c.b[cat]));
  });
});

(function () {
  var p1 = new Chess(PAWNS[0].fen), p2 = new Chess(PAWNS[1].fen), p3 = new Chess(PAWNS[2].fen);
  same('why not passed', spot.pawnWhyNot(p2, 'e4', 'passed'), 'e4 is not passed: the pawn on e5 can stop it.');
  same('why not isolated', spot.pawnWhyNot(p1, 'c4', 'isolated'), 'c4 is not isolated: it has a neighbour on b2.');
  same('why not doubled', spot.pawnWhyNot(p1, 'c4', 'doubled'), 'c4 is the only White pawn on the c-file.');
  same('why not backward (isolated)', spot.pawnWhyNot(p1, 'h3', 'backward'), 'h3 is isolated, not backward: it has no neighbours at all.');
  same('why not backward (supported)', spot.pawnWhyNot(p1, 'c6', 'backward'), 'c6 is not backward: the pawn on b7 can support it.');
  same('why not backward (free square)', spot.pawnWhyNot(p1, 'h7', 'backward'), 'h7 is not backward: no enemy pawn guards h6.');
  same('no reason when it is one', spot.pawnWhyNot(p3, 'b3', 'backward'), null);
})();

/* ---------- outposts ---------- */

[
  // d5 is the classic hole; f5 and h5 are held by the g4-pawn and no black pawn can reach them.
  // b5 is not one: the a7-pawn can still go to a6. For Black, the white pawns have all passed b4, d4 and f4.
  { name: 'P2', fen: PAWNS[1].fen, w: 'd5 f5 h5', b: 'b4 d4 f4' },
  // b5 (a5 is level with it, so can never attack it) and d5; b4, e4 and g4 for Black.
  { name: 'P3', fen: PAWNS[2].fen, w: 'b5 d5', b: 'b4 e4 g4' },
  // A knight already on its outpost still counts. b5 and f5 fail to the a7- and g7-pawns, f4 to the g2-pawn.
  { name: 'knight on d5', fen: 'r4rk1/pp3ppp/3p4/3Np3/2P1P3/1P6/P4PPP/R4RK1 w - - 0 1', w: 'd5', b: 'd4' },
  // The same, but a white rook sits on d4: an enemy piece on the square rules it out for Black.
  { name: 'rook on d4', fen: 'r4rk1/pp3ppp/3p4/3Np3/2PRP3/1P6/P4PPP/5RK1 w - - 0 1', w: 'd5', b: '' },
  { name: 'start', fen: START, w: '', b: '' }
].forEach(function (c) {
  var g = new Chess(c.fen);
  same('outposts, ' + c.name + ', White', spot.outposts(g, 'w'), sq(c.w));
  same('outposts, ' + c.name + ', Black', spot.outposts(g, 'b'), sq(c.b));
});

(function () {
  var g = new Chess('r4rk1/pp3ppp/3p4/3Np3/2PRP3/1P6/P4PPP/5RK1 w - - 0 1');
  same('flaw: wrong rank', spot.outpostFlaw(g, 'w', 'd4'), 'Outposts for White are on ranks 5 and 6.');
  same('flaw: a pawn there', spot.outpostFlaw(g, 'w', 'e5'), 'A pawn stands on e5.');
  same('flaw: an enemy piece there', spot.outpostFlaw(g, 'b', 'd4'), 'A White piece stands on d4.');
  same('flaw: no pawn defends', spot.outpostFlaw(g, 'w', 'h5'), 'No White pawn defends h5.');
  same('flaw: pawn can advance', spot.outpostFlaw(g, 'w', 'b5'), 'The pawn on a7 can still advance and attack b5.');
  same('flaw: no pawn defends (sixth rank)', spot.outpostFlaw(g, 'w', 'c6'), 'No White pawn defends c6.');
  same('flaw: none', spot.outpostFlaw(g, 'w', 'd5'), null);
  // c5 for White: defended by nothing here; with a b4-pawn it would be attacked at once by d6.
  var g2 = new Chess('4k3/8/3p4/8/1P6/8/8/4K3 w - - 0 1');
  same('flaw: attacked now', spot.outpostFlaw(g2, 'w', 'c5'), 'The pawn on d6 attacks c5.');
})();

/* ---------- material ---------- */

[
  { name: 'start', fen: START, w: 39, b: 39 },
  { name: 'Italian', fen: ITALIAN, w: 39, b: 39 },
  { name: 'rook v nothing', fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', w: 5, b: 0 },
  // 6 pawns + 2 rooks + 2 knights = 22 against 6 pawns + 2 rooks = 16.
  { name: 'two knights up', fen: 'r3k2r/ppp2ppp/8/8/8/8/PPP2PPP/RN2K1NR w - - 0 1', w: 22, b: 16 },
  // Two rooks and a bishop (13) against a queen (9).
  { name: 'R+R+B v Q', fen: '3qk3/8/8/8/8/8/8/R1B1K2R w - - 0 1', w: 13, b: 9 },
  { name: 'queen odds', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w - - 0 1', w: 30, b: 39 }
].forEach(function (c) {
  same('material, ' + c.name, spot.material(new Chess(c.fen)), { w: c.w, b: c.b, diff: c.w - c.b });
});

same('label +3', spot.materialLabel(3), 'White +3');
same('label 0', spot.materialLabel(0), 'Level');
same('label -2', spot.materialLabel(-2), 'Black +2');
same('options, right answer first', spot.materialOptions(3, 0), [3, 2, 1, 0]);
same('options, right answer last', spot.materialOptions(-1, 3), [2, 1, 0, -1]);
(function () {
  for (var i = 0; i < 200; i++) {
    var d = Math.floor(Math.random() * 21) - 10, o = spot.materialOptions(d);
    if (o.length !== 4 || o.indexOf(d) < 0 || o[0] - o[3] !== 3 || o[0] - o[1] !== 1 || o[1] - o[2] !== 1) {
      same('options for ' + d, o, 'four neighbouring scores including ' + d);
      return;
    }
  }
  truthy('options are four neighbouring scores including the right one', true);
})();

/* ---------- the rule of the square ---------- */

[
  // The classic: pawn c4, king h4. 1.c5 and the king is outside the c5-f8 square.
  { name: 'classic, White to move', fen: '8/8/8/8/2P4k/8/8/K7 w - - 0 1', caught: false },
  // 1...Kg5 2.c5 Kf6 3.c6 Ke7 4.c7 Kd7 5.c8=Q+ Kxc8.
  { name: 'classic, Black to move', fen: '8/8/8/8/2P4k/8/8/K7 b - - 0 1', caught: true },
  // The double step: a2 needs five moves. 1.a4 Ke5 2.a5 Kd6 3.a6 Kc7 4.a7 Kb7 5.a8=Q+ Kxa8.
  { name: 'a2 v Kf4, White to move', fen: '8/8/8/8/5k2/8/P7/7K w - - 0 1', caught: true },
  // One file further away the king is too late (it would be in time against a single step).
  { name: 'a2 v Kg4, White to move', fen: '8/8/8/8/6k1/8/P7/7K w - - 0 1', caught: false },
  { name: 'a2 v Kg4, Black to move', fen: '8/8/8/8/6k1/8/P7/7K b - - 0 1', caught: true },
  // A black pawn: f4 needs three moves. 1.Kc2 f3 2.Kd2 f2 3.Ke2 f1=Q+ 4.Kxf1.
  { name: 'black f4 v Kb3, White to move', fen: '7k/8/8/8/5p2/1K6/8/8 w - - 0 1', caught: true },
  { name: 'black f4 v Kb3, Black to move', fen: '7k/8/8/8/5p2/1K6/8/8 b - - 0 1', caught: false },
  // King right behind the pawn: it takes at once if it is its move, and never gets round if it is not.
  { name: 'e5 v Ke4, Black to move', fen: '8/8/8/4P3/4k3/8/8/K7 b - - 0 1', caught: true },
  { name: 'e5 v Ke4, White to move', fen: '8/8/8/4P3/4k3/8/8/K7 w - - 0 1', caught: false },
  // Rook's pawn: h5 needs three moves. 1...Ke7 2.h6 Kf7 3.h7 Kg7 4.h8=Q+ Kxh8.
  { name: 'h5 v Kd7, Black to move', fen: '8/3k4/8/7P/8/8/8/K7 b - - 0 1', caught: true },
  { name: 'h5 v Kd7, White to move', fen: '8/3k4/8/7P/8/8/8/K7 w - - 0 1', caught: false },
  { name: 'h5 v Ke7, White to move', fen: '8/4k3/8/7P/8/8/8/K7 w - - 0 1', caught: true },
  // King in front of the pawn: it simply takes it.
  { name: 'd6 v Kd7, White to move', fen: '8/3k4/3P4/8/8/8/8/K7 w - - 0 1', caught: true }
].forEach(function (c) {
  same('square, ' + c.name, spot.kingCatches(c.fen), c.caught);
});

same('pawn steps', [spot.pawnSteps('c4', 'w'), spot.pawnSteps('a2', 'w'), spot.pawnSteps('a3', 'w'), spot.pawnSteps('f4', 'b'), spot.pawnSteps('f7', 'b')],
  [4, 5, 5, 3, 5]);
(function () {
  var s = spot.squareOf('c4', 'w', 'h4');
  same('square of c4: 25 squares, c4 to g8', [s.length, s.indexOf('c4') >= 0, s.indexOf('g8') >= 0, s.indexOf('g4') >= 0, s.indexOf('h4') >= 0, s.indexOf('c3') >= 0, s.indexOf('b5') >= 0],
    [25, true, true, true, false, false, false]);
  s = spot.squareOf('a2', 'w', 'g4');
  same('square of a2 starts on the third rank: a3 to f8', [s.length, s.indexOf('a3') >= 0, s.indexOf('f8') >= 0, s.indexOf('a2') >= 0, s.indexOf('g4') >= 0],
    [36, true, true, false, false]);
  s = spot.squareOf('f4', 'b', 'b3');
  same('square of a black f4-pawn: c1 to f4', [s.length, s.indexOf('c1') >= 0, s.indexOf('f4') >= 0, s.indexOf('b3') >= 0, s.indexOf('f5') >= 0],
    [16, true, true, false, false]);
  s = spot.squareOf('g5', 'w', 'h1');
  same('square clipped at the edge', s.length, 8);
  same('race FEN', spot.raceFen('w', 'c4', 'a1', 'h4', 'b'), '8/8/8/8/2P4k/8/8/K7 b - - 0 1');
  same('race FEN, black pawn', spot.raceFen('b', 'f4', 'h8', 'b3', 'w'), '7k/8/8/8/5p2/1K6/8/8 w - - 0 1');
})();

// Where the search knows better than the rule: the square of an a2-pawn starts on the third rank, so a king on a1
// is far outside it, yet with the move it just takes the pawn. (The trainer never puts the king next to the pawn.)
same('square, a2 v Ka1, Black to move', spot.kingCatches('8/8/8/8/8/8/P7/k6K b - - 0 1'), true);
same('square, a2 v Ka1, White to move', spot.kingCatches('8/8/8/8/8/8/P7/k6K w - - 0 1'), false);

function dist(a, b) {
  var p = CL.fr(a), q = CL.fr(b);
  return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]));
}

/* The search against the textbook rule, over the races the trainer can produce (every pawn square and king square,
   both sides to move, the pawn's own king on the nearest and the furthest square allowed): the king catches the
   pawn exactly when it is within n squares of the promotion square (n + 1 if it moves first), n = pawn moves left. */
(function () {
  var total = 0, bad = [];
  ['w', 'b'].forEach(function (side) {
    for (var f = 0; f < 8; f++) for (var rel = 1; rel <= 5; rel++) {
      var pawn = CL.sq(f, side === 'w' ? rel : 7 - rel), promo = CL.sq(f, side === 'w' ? 7 : 0), n = spot.pawnSteps(pawn, side);
      CL.all.forEach(function (king) {
        if (dist(king, pawn) < 2) return;
        var homes = CL.all.filter(function (home) {
          var hm = CL.fr(home);
          return (side === 'w' ? hm[1] : 7 - hm[1]) <= 1 && Math.abs(hm[0] - f) >= 4 && dist(home, king) >= 3;
        }).sort(function (a, b) { return dist(a, king) - dist(b, king); });
        if (homes.length > 2) homes = [homes[0], homes[homes.length - 1]];
        homes.forEach(function (home) {
          ['w', 'b'].forEach(function (turn) {
            var rule = dist(king, promo) <= n + (turn === side ? 0 : 1), fen = spot.raceFen(side, pawn, home, king, turn);
            total++;
            if (spot.kingCatches(fen) !== rule) bad.push(fen);
          });
        });
      });
    }
  });
  same('search agrees with the rule of the square in ' + total + ' clean races', bad.slice(0, 5), []);
})();

(function () {
  var yes = 0, n = 400, ok = true, i, q, g;
  for (i = 0; i < n; i++) {
    q = spot.raceQuestion();
    g = new Chess(q.fen);
    if (q.caught) yes++;
    if (q.caught !== spot.kingCatches(q.fen) || g.turn !== q.turn || !g.get(q.pawn) || g.get(q.pawn).color !== q.side ||
        g.get(q.king).type !== 'k' || g.get(q.home).type !== 'k' || Object.keys(g.pieces()).length !== 3 ||
        dist(q.king, q.pawn) < 2 || dist(q.king, q.home) < 3 || (q.inside && !q.caught) ||
        q.inside !== (q.square.indexOf(q.king) >= 0) ||
        typeof spot.raceWhy(q) !== 'string' || !q.square.length) { ok = false; same('race question', q.fen, 'a consistent question'); break; }
    // the side that is not to move must not be in check
    g.turn = g.turn === 'w' ? 'b' : 'w';
    if (g.inCheck()) { ok = false; same('race question', q.fen, 'a legal position'); break; }
  }
  truthy('race questions are consistent and legal', ok);
  truthy('race answers are balanced (' + yes + ' yes of ' + n + ')', yes > n * 0.4 && yes < n * 0.6);
})();

/* ---------- question makers on the real position pool (skipped if the course content cannot be loaded here) ---------- */

(function () {
  var pool;
  try {
    ['vision', 'notation', 'openings', 'strategy', 'pawns', 'mates', 'tactics', 'puzzles'].forEach(function (n) { require('../js/content/' + n + '.js'); });
    require('../js/drills.js');
    pool = CL.positionPool();
  } catch (e) {
    console.log('note  position pool not loaded (' + e.message + '); question makers checked on a small pool instead');
    pool = [START, ITALIAN].concat(PAWNS.map(function (p) { return p.fen; }));
  }
  var n = 600, i, q, stat = { loose: 0, pawn: 0, outpost: 0, attack: 0, level: 0 }, byCat = {}, counts = {}, ok = true;
  function bad(what, q) { ok = false; same(what, q.fen, 'a consistent question'); }
  for (i = 0; i < n && ok; i++) {
    q = spot.looseQuestion(pool);
    if (JSON.stringify(q.targets) !== JSON.stringify(spot.loose(new Chess(q.fen), q.color))) bad('loose question', q);
    if (q.targets.length) stat.loose++;

    q = spot.pawnQuestion(pool);
    if (JSON.stringify(q.targets) !== JSON.stringify(spot.pawns(new Chess(q.fen), q.color, q.cat))) bad('pawn question', q);
    q.targets.forEach(function (s) { if (spot.pawnWhyNot(q.game, s, q.cat) !== null) bad('pawn reason', q); });
    byCat[q.cat] = byCat[q.cat] || [0, 0];
    byCat[q.cat][1]++;
    if (q.targets.length) { stat.pawn++; byCat[q.cat][0]++; }

    q = spot.outpostQuestion(pool);
    if (JSON.stringify(q.targets) !== JSON.stringify(spot.outposts(new Chess(q.fen), q.color))) bad('outpost question', q);
    CL.all.forEach(function (s) { if ((spot.outpostFlaw(q.game, q.color, s) === null) !== (q.targets.indexOf(s) >= 0)) bad('outpost reason', q); });
    if (q.targets.length) stat.outpost++;

    q = spot.attackQuestion(pool);
    var p = q.game.get(q.square);
    if (!p || p.type === 'k' || q.count !== new Chess(q.fen).attackers(q.square, q.color).length ||
        q.count !== q.attackers.length || q.defend !== (p.color === q.color)) bad('attack question', q);
    if (q.count) stat.attack++;
    counts[Math.min(q.count, 4)] = (counts[Math.min(q.count, 4)] || 0) + 1;

    q = spot.materialQuestion(pool);
    var m = spot.material(new Chess(q.fen));
    if (m.diff !== q.diff || m.w !== q.w || m.b !== q.b || q.options.length !== 4 || q.options.indexOf(q.diff) < 0) bad('material question', q);
    if (!q.diff) stat.level++;
  }
  truthy('question makers give consistent questions (' + pool.length + ' positions in the pool)', ok);
  function share(k) { return Math.round(stat[k] / n * 100) + '%'; }
  console.log('      with an answer: loose ' + share('loose') + ', pawns ' + share('pawn') + ', outposts ' + share('outpost') +
    ', attackers ' + share('attack') + '; material level ' + share('level'));
  console.log('      pawn categories (with an answer / asked): ' + Object.keys(byCat).sort().map(function (c) { return c + ' ' + byCat[c][0] + '/' + byCat[c][1]; }).join(', '));
  console.log('      attacker counts: ' + Object.keys(counts).sort().map(function (c) { return (c === '4' ? '4+' : c) + ' × ' + counts[c]; }).join(', '));
  if (pool.length > 50) {
    truthy('about two pawn questions in three have an answer', stat.pawn / n > 0.5 && stat.pawn / n < 0.8);
    truthy('about two attacker questions in three have an attacker', stat.attack / n > 0.55 && stat.attack / n < 0.78);
  }
})();

console.log(problems ? '\n' + problems + ' of ' + checks + ' checks FAILED' : '\nAll ' + checks + ' checks passed');
process.exit(problems ? 1 : 0);
