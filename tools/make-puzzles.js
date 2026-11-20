/* Builds the puzzle bank (js/content/puzzles.js).
   Plays engine-vs-engine games with deliberately uneven players, and keeps positions where one move
   is clearly best: a forced mate in one or two, or a move that wins material. Every puzzle is
   re-checked by a deeper search before it is kept.      Run:  node tools/make-puzzles.js [minutes]  */
global.window = global;
global.Chess = require('../js/chess.js');
var AI = require('../js/ai.js');
require('../js/core.js');
require('../js/content/openings.js');
var fs = require('fs'), path = require('path');
var Chess = global.Chess, CL = global.CL, MATE = AI.MATE;

var MINUTES = +process.argv[2] || 4;
var QUOTA = { mate1: 24, mate2: 24, loose: 10, tactic: 32 };
var bank = { mate1: [], mate2: [], loose: [], tactic: [] }, seen = {};
var deadline = Date.now() + MINUTES * 60000;
var books = CL.content.openings.lines.filter(function (l) { return ['scholars', 'elephant', 'noahs'].indexOf(l.id) < 0; });

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function full() { return Object.keys(QUOTA).every(function (k) { return bank[k].length >= QUOTA[k]; }); }

function forcedMate(g, n) {
  var ms = g._legal();
  for (var i = 0; i < ms.length; i++) {
    g._make(ms[i]);
    var replies = g._legal(), ok;
    if (!replies.length) ok = g.inCheck();
    else if (n === 1) ok = false;
    else {
      ok = true;
      for (var j = 0; j < replies.length && ok; j++) { g._make(replies[j]); if (!forcedMate(g, n - 1)) ok = false; g._unmake(); }
    }
    g._unmake();
    if (ok) return true;
  }
  return false;
}

function countMatesInOne(g) {
  var n = 0, ms = g._legal();
  for (var i = 0; i < ms.length; i++) { g._make(ms[i]); if (g.inCheck() && !g._legal().length) n++; g._unmake(); }
  return n;
}

/* Only keep positions that could come from a sensible game: no extra queens, no wildly lopsided material. */
function plausible(g) {
  var n = { w: {}, b: {} }, mat = { w: 0, b: 0 };
  for (var i = 0; i < 64; i++) {
    var p = g.board[i];
    if (!p) continue;
    n[p.color][p.type] = (n[p.color][p.type] || 0) + 1;
    mat[p.color] += AI.VAL[p.type];
  }
  for (var c in n) if ((n[c].q || 0) > 1 || (n[c].r || 0) > 2 || (n[c].b || 0) > 2 || (n[c].n || 0) > 2) return false;
  return Math.abs(mat.w - mat.b) <= 600 && mat.w >= 1200 && mat.b >= 1200;
}

function consider(g, prev) {
  if (!plausible(g)) return;
  var fen = g.fen(), key = fen.split(' ').slice(0, 2).join(' ');
  if (seen[key]) return;
  var quick = AI.think(fen, { depth: 2, all: true, time: 5000 });
  if (!quick.best || quick.lines.length < 3) return;
  var qGap = quick.lines[0].score - quick.lines[1].score;
  if (qGap < 180 && quick.lines[0].score < MATE - 100) return;

  var res = AI.think(fen, { depth: 4, all: true, time: 20000 });
  var top = res.lines[0], second = res.lines[1], stat = AI.evaluate(g);
  var entry = null, kind = null;

  if (top.score > MATE - 100) {
    var n = Math.round((MATE - top.score + 1) / 2);
    if (n === 1 && bank.mate1.length < QUOTA.mate1 && countMatesInOne(new Chess(fen)) === 1 && stat < 900) {
      kind = 'mate1';
      entry = { fen: fen, solution: [top.move.san], theme: 'Mate in 1', level: 1 };
    } else if (n === 2 && bank.mate2.length < QUOTA.mate2 && second.score < MATE - 100 && !forcedMate(new Chess(fen), 1)) {
      var pv = res.pv.slice(0, 3), t = new Chess(fen), ok = pv.length === 3;
      for (var i = 0; ok && i < 3; i++) if (!t.move(pv[i])) ok = false;
      if (ok && t.isCheckmate() && forcedMate(new Chess(fen), 2)) {
        kind = 'mate2';
        entry = { fen: fen, solution: t.history(), theme: 'Mate in 2', level: 2 };
      }
    }
  } else {
    var gap = top.score - second.score;
    var recapture = prev && prev.captured && top.move.captured && top.move.to === prev.to;
    if (gap >= 250 && top.score >= 150 && top.score <= 1600 && top.score - stat >= 200 && stat > -350 && stat < 350 && !recapture) {
      var deep = AI.think(fen, { depth: 5, time: 20000 });
      if (deep.best.san === top.move.san && deep.score >= 150) {
        var target = top.move.captured && g.attackers(top.move.to, g.turn === 'w' ? 'b' : 'w').length === 0 && AI.VAL[top.move.captured] >= 300;
        kind = target ? 'loose' : 'tactic';
        if (bank[kind].length < QUOTA[kind]) {
          entry = { fen: fen, solution: [top.move.san], theme: target ? 'Loose piece' : 'Win material',
            level: target ? 1 : (top.move.captured || /\+/.test(top.move.san) ? 2 : 3), line: deep.pv.slice(0, 5).join(' ') };
        }
      }
    }
  }
  if (entry) { seen[key] = 1; bank[kind].push(entry); process.stdout.write(kind.charAt(0)); }
}

function playGame() {
  var g = new Chess(), book = pick(books), plies = 4 + Math.floor(Math.random() * 6), i;
  for (i = 0; i < Math.min(plies, book.moves.length); i++) g.move(book.moves[i][0]);
  var strong = Math.random() < 0.7 ? pick(['w', 'b']) : null;       // sometimes both sides are weak
  var weakElo = 450 + Math.floor(Math.random() * 600), prev = g.lastMove();
  for (i = 0; i < 90 && Date.now() < deadline && !full(); i++) {
    if (!g._legal().length || g.halfmove >= 60) break;
    if (g.hist.length >= 8) consider(g, prev);
    var mv;
    if (g.turn === strong) mv = AI.think(g.fen(), { depth: 3, time: 600 }).best;
    else { var b = AI.botMove(g.fen(), weakElo); mv = b && b.move; }
    if (!mv) break;
    prev = g.move({ from: mv.from, to: mv.to, promotion: mv.promotion || undefined });
    if (!prev) break;
  }
}

var games = 0;
while (Date.now() < deadline && !full()) { playGame(); games++; }

var order = ['mate1', 'loose', 'tactic', 'mate2'], out = [];
order.forEach(function (k) {
  bank[k].sort(function (a, b) { return a.level - b.level; });
  bank[k].forEach(function (p, i) { p.id = k + '-' + (i + 1); out.push(p); });
});
var js = '/* Puzzle bank. Generated by tools/make-puzzles.js from engine-vs-engine games; every entry was\n' +
  '   re-checked by search before being kept. Regenerate any time for a fresh set. */\n' +
  'window.CL.puzzleBank = ' + JSON.stringify(out, null, 1) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'js', 'content', 'puzzles.js'), js);
console.log('\n' + games + ' games played. Kept: ' + order.map(function (k) { return k + ' ' + bank[k].length; }).join(', ') + '. Total ' + out.length + '.');
