/* Tests for js/train-puzzle.js: the rules on CL.puzzleLogic, then a run through each of the four
   trainers against a stand-in board and page.          Run:  node tools/test-train-puzzle.js  */
var store = {};
global.window = global;
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};
global.Chess = require('../js/chess.js');
require('../js/core.js');
['openings', 'mates', 'tactics', 'puzzles'].forEach(function (n) { require('../js/content/' + n + '.js'); });
require('../js/drills.js');          // CL.timedDrill, used by "name the opening"
require('../js/train-puzzle.js');

var CL = global.CL, Chess = global.Chess, L = CL.puzzleLogic;
var failures = 0, checks = 0;

function ok(cond, msg) {
  checks++;
  if (!cond) { failures++; console.log('FAIL  ' + msg); }
  return !!cond;
}
function section(name) { console.log('\n' + name); }
function strip(s) { return String(s).replace(/[+#!?]/g, ''); }
function rng(seed) { // small repeatable generator
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function nonDecreasing(list) {
  for (var i = 1; i < list.length; i++) if (list[i] < list[i - 1]) return false;
  return true;
}

/* ================= puzzle ratings ================= */
section('Puzzle ratings');
var bank = CL.puzzleBank;
function wantBand(p) {
  if (p.theme === 'Mate in 1') return [550, 900];
  if (p.theme === 'Loose piece') return [650, 1000];
  if (p.theme === 'Mate in 2') return [1150, 1550];
  if (p.theme === 'Win material') return p.level >= 3 ? [1250, 1600] : (p.level === 2 ? [950, 1300] : null);
  return null;
}
ok(bank && bank.length > 0, 'the puzzle bank is loaded');
var distinct = {}, byTheme = {};
bank.forEach(function (p) {
  var b = wantBand(p), r = L.rate(p);
  if (!ok(b, p.id + ': no band is defined for theme "' + p.theme + '" level ' + p.level)) return;
  ok(r === Math.round(r) && r >= b[0] && r <= b[1], p.id + ': rating ' + r + ' is outside ' + b[0] + '–' + b[1]);
  ok(L.rate(p) === r, p.id + ': rating changes between calls');
  ok(L.rate({ id: p.id, theme: p.theme, level: p.level }) === r, p.id + ': rating depends on more than id, theme and level');
  distinct[r] = 1;
  (byTheme[p.theme + p.level] = byTheme[p.theme + p.level] || {})[r] = 1;
});
ok(Object.keys(distinct).length >= bank.length / 3, 'ratings are spread out (' + Object.keys(distinct).length + ' different values for ' + bank.length + ' puzzles)');
Object.keys(byTheme).forEach(function (k) { ok(Object.keys(byTheme[k]).length > 1, k + ': every puzzle got the same rating'); });
console.log('  ' + bank.length + ' bank puzzles rated, ' + Object.keys(distinct).length + ' different ratings, ' +
  Math.min.apply(null, Object.keys(distinct)) + ' to ' + Math.max.apply(null, Object.keys(distinct)));

/* ================= Elo ================= */
section('Elo');
ok(L.eloChange(800, 800, true) === 16 && L.eloChange(800, 800, false) === -16, 'equal ratings should give +16 / -16');
[400, 800, 1234, 1600, 2100].forEach(function (r) {
  ok(L.eloChange(r, r, true) === -L.eloChange(r, r, false), 'equal ratings at ' + r + ': win and loss differ in size');
});
var player, puzzle, up, down, prevUp, prevDown;
for (player = 300; player <= 2000; player += 170) {
  prevUp = -Infinity; prevDown = -Infinity;
  for (puzzle = 400; puzzle <= 1800; puzzle += 50) {
    up = L.eloChange(player, puzzle, true); down = L.eloChange(player, puzzle, false);
    ok(up > 0, 'a win must raise the rating (' + player + ' v ' + puzzle + ' gave ' + up + ')');
    ok(down < 0, 'a loss must lower the rating (' + player + ' v ' + puzzle + ' gave ' + down + ')');
    ok(up <= 32 && down >= -32, 'a change is larger than K (' + player + ' v ' + puzzle + ')');
    ok(up >= prevUp, 'a harder puzzle should be worth at least as much (' + player + ' v ' + puzzle + ')');
    ok(down >= prevDown, 'a harder puzzle should cost no more (' + player + ' v ' + puzzle + ')');
    ok(Math.abs(L.expected(player, puzzle) + L.expected(puzzle, player) - 1) < 1e-9, 'expected scores do not sum to 1');
    ok(L.eloNext(player, puzzle, true) === player + up && L.eloNext(player, puzzle, false) === player + down, 'eloNext disagrees with eloChange');
    prevUp = up; prevDown = down;
  }
}
ok(L.eloChange(800, 1200, true) > L.eloChange(800, 800, true), 'beating a harder puzzle should gain more');
ok(L.eloChange(800, 500, false) < L.eloChange(800, 800, false), 'missing an easier puzzle should cost more');
ok(L.eloChange(800, 800, true, 16) === 8, 'K is not respected');
console.log('  800 v 800: ' + L.eloChange(800, 800, true) + ' / ' + L.eloChange(800, 800, false) +
  ';  800 v 1000: +' + L.eloChange(800, 1000, true) + ' / ' + L.eloChange(800, 1000, false) +
  ';  1000 v 800: +' + L.eloChange(1000, 800, true) + ' / ' + L.eloChange(1000, 800, false));

/* ================= choosing a rated puzzle ================= */
section('Choosing a rated puzzle');
var ratedList = bank.map(function (p) { return { id: p.id, rating: L.rate(p) }; });
var r, pick, i, rnd = rng(7);
for (r = 300; r <= 2000; r += 50) {
  var inReach = ratedList.filter(function (p) { return Math.abs(p.rating - r) <= 150; });
  for (i = 0; i < 20; i++) {
    pick = L.pickRated(ratedList, r, [], rnd);
    if (!ok(pick, 'no puzzle chosen at rating ' + r)) break;
    if (inReach.length) ok(Math.abs(pick.rating - r) <= 150, 'at ' + r + ' a puzzle rated ' + pick.rating + ' was chosen although ' + inReach.length + ' are within 150');
  }
}
var recent = ratedList.filter(function (p) { return Math.abs(p.rating - 800) <= 150; }).map(function (p) { return p.id; });
for (i = 0; i < 50; i++) {
  pick = L.pickRated(ratedList, 800, recent, rnd);
  ok(pick && recent.indexOf(pick.id) < 0, 'a recently seen puzzle was served again');
}
ok(L.pickRated(ratedList, 800, ratedList.map(function (p) { return p.id; }), rnd), 'nothing served when every puzzle is recent');
ok(L.pickRated([], 800, [], rnd) === null, 'an empty bank should give null');

/* ================= puzzle rush ================= */
section('Puzzle rush');
var pool = L.rushPool(), course = CL.collectPuzzles(['mates', 'tactics']).length;
ok(pool.length === bank.length + course, 'rush pool should hold the bank (' + bank.length + ') and the course puzzles (' + course + '), got ' + pool.length);
var ids = {};
pool.forEach(function (p) {
  ok(!ids[p.id], 'duplicate rush id ' + p.id);
  ids[p.id] = 1;
  var g = new Chess(p.fen), good = p.solution.length % 2 === 1;
  p.solution.forEach(function (s) { if (!g.move(s)) good = false; });
  ok(good, p.id + ': solution is not playable, or does not end on the solver’s move');
});
[1, 2, 3, 4, 5].forEach(function (seed) {
  var order = L.rushOrder(pool, rng(seed)), deck = L.rushDeck(pool, rng(seed)), seen = {};
  ok(order.length === pool.length, 'rush order should contain every puzzle');
  ok(nonDecreasing(order.map(L.rushDifficulty)), 'rush order is not easiest-first (seed ' + seed + ')');
  ok(nonDecreasing(deck.map(L.rushDifficulty)), 'rush deck is not easiest-first (seed ' + seed + ')');
  deck.forEach(function (p) { ok(!seen[p.id] && pool.indexOf(p) >= 0, 'rush deck repeats or invents a puzzle'); seen[p.id] = 1; });
  ok(L.rushDifficulty(deck[0]) === L.rushDifficulty(order[0]), 'the deck should open with the easiest group');
  ok(L.rushDifficulty(deck[deck.length - 1]) === L.rushDifficulty(order[order.length - 1]), 'the deck should finish with the hardest group');
  ok(L.rushDifficulty(deck[9]) > L.rushDifficulty(deck[0]), 'the deck should already be harder by the tenth puzzle');
});
var o1 = L.rushOrder(pool, rng(1)).map(function (p) { return p.id; }).join(), o2 = L.rushOrder(pool, rng(2)).map(function (p) { return p.id; }).join();
ok(o1 !== o2, 'rush order should be shuffled within a level');
var d0 = L.rushDeck(pool, rng(3)), groups = {};
L.rushOrder(pool, rng(3)).forEach(function (p) { var d = L.rushDifficulty(p); groups[d] = (groups[d] || 0) + 1; });
console.log('  ' + pool.length + ' puzzles in groups ' + JSON.stringify(groups) + '; one run serves up to ' + d0.length +
  ': ' + d0.map(L.rushDifficulty).join(' '));

/* ================= openings ================= */
section('Openings');
var all = CL.content.openings.lines, lines = L.bookLines(), first = L.distinctPlies(lines), walks = {};
ok(lines.length === all.length - 3, 'book lines should be every line except the three traps');
ok(!lines.some(function (l) { return ['scholars', 'elephant', 'noahs'].indexOf(l.id) >= 0; }), 'a trap is among the book lines');
lines.forEach(function (l) { walks[l.id] = L.walk(l); });
function sans(l) { return l.moves.map(function (m) { return m[0]; }); }
function prefix(l, n) { return sans(l).slice(0, n).map(strip).join(' '); }
function reachable(l, ply, fen) {
  try { return Chess.fromMoves(sans(l).slice(0, ply)).fen() === fen; } catch (e) { return false; }
}
function elsewhere(l, fen) { // is this position found in any other line, at any ply?
  return lines.some(function (o) {
    return o !== l && walks[o.id].fens.some(function (f) { return L.posKey(f) === L.posKey(fen); });
  });
}
lines.forEach(function (l) {
  var k = first[l.id];
  if (!ok(k != null && k >= 1 && k <= l.moves.length, l.id + ': no distinguishing ply')) return;
  ok(!lines.some(function (o) { return o !== l && prefix(o, k) === prefix(l, k); }), l.id + ': first ' + k + ' plies are shared with another line');
  ok(k === 1 || lines.some(function (o) { return o !== l && prefix(o, k - 1) === prefix(l, k - 1); }), l.id + ': ply ' + k + ' is later than it need be');
  ok(!elsewhere(l, walks[l.id].fens[k]), l.id + ': the position at ply ' + k + ' also occurs in another line');
  ok(reachable(l, k, walks[l.id].fens[k]), l.id + ': the position at ply ' + k + ' is not reached by the line’s moves');
});
console.log('  distinguishing ply: ' + lines.map(function (l) { return l.id + ' ' + first[l.id]; }).join(', '));

var nameQ = L.nameQuestions(lines), perLine = {};
nameQ.forEach(function (q) {
  var where = q.line.id + ' ply ' + q.ply;
  perLine[q.line.id] = (perLine[q.line.id] || 0) + 1;
  ok(q.ply >= first[q.line.id], where + ': asked before the line is distinguishable');
  ok(!elsewhere(q.line, q.fen), where + ': the position also occurs in another line');
  ok(reachable(q.line, q.ply, q.fen), where + ': position is not reachable by legal moves');
  ok(q.last && strip(q.last.san) === strip(q.line.moves[q.ply - 1][0]), where + ': wrong last move');
});
lines.forEach(function (l) { ok(perLine[l.id] > 0, l.id + ': no "name the opening" position'); });

var moveQ = L.moveQuestions(lines), expectQ = 0;
lines.forEach(function (l) { expectQ += l.moves.length - 2; });
ok(moveQ.length === expectQ, '"next move" should ask every move from the third on (' + expectQ + '), got ' + moveQ.length);
moveQ.forEach(function (q) {
  var where = q.line.id + ' ply ' + q.ply, g = new Chess(q.fen), mv = g.move(q.move.san);
  ok(q.ply >= 2 && q.ply < q.line.moves.length, where + ': outside the line');
  ok(reachable(q.line, q.ply, q.fen), where + ': position is not reachable by legal moves');
  ok(mv && strip(mv.san) === strip(q.line.moves[q.ply][0]), where + ': the book move is not legal here');
  ok(mv && g.fen() === walks[q.line.id].fens[q.ply + 1], where + ': the book move does not lead on down the line');
  ok(q.why === (q.line.moves[q.ply][1] || ''), where + ': wrong explanation');
});
lines.forEach(function (l) {
  var c = L.nameChoices(l, lines, rng(l.moves.length)), names = {};
  c.forEach(function (o) { names[o.id] = 1; });
  ok(c.length === 4 && Object.keys(names).length === 4 && c.indexOf(l) >= 0, l.id + ': choices should be four different lines including the right one');
});
console.log('  ' + lines.length + ' lines, ' + nameQ.length + ' "name the opening" positions, ' + moveQ.length + ' "next move" positions');

/* ================= weighted line choice ================= */
section('Weighted line choice');
ok(L.lineWeight([0, 5]) > L.lineWeight(undefined) && L.lineWeight(undefined) > L.lineWeight([10, 0]), 'missed lines should weigh more than new ones, and new ones more than known ones');
ok(L.lineWeight([200, 0]) > 0, 'a well-known line must still come up sometimes');
ok(L.pickWeighted(['a', 'b', 'c'], [1, 1, 1], function () { return 0; }) === 'a', 'pickWeighted: lowest draw');
ok(L.pickWeighted(['a', 'b', 'c'], [1, 1, 1], function () { return 0.999999; }) === 'c', 'pickWeighted: highest draw');
ok(L.pickWeighted(['a', 'b', 'c'], [0, 1, 0], rng(3)) === 'b', 'pickWeighted: zero weights are never chosen');
var stats = {}, tally = {}, weak = lines[3].id, strong = lines[5].id;
for (i = 0; i < 8; i++) { L.record(stats, weak, false); L.record(stats, strong, true); }
rnd = rng(11);
for (i = 0; i < 6000; i++) { pick = L.chooseLine(lines, stats, rnd, null).id; tally[pick] = (tally[pick] || 0) + 1; }
ok(lines.every(function (l) { return l.id === weak || tally[weak] > (tally[l.id] || 0); }), 'the line missed most should be asked most');
ok(lines.every(function (l) { return l.id === strong || (tally[strong] || 0) < tally[l.id]; }), 'the line known best should be asked least');
ok(tally[strong] > 0, 'a known line should still be asked now and then');
for (i = 0; i < 300; i++) ok(L.chooseLine(lines, stats, rnd, weak).id !== weak, 'the line to avoid was chosen');
var fade = {};
for (i = 0; i < 100; i++) L.record(fade, 'x', i % 4 === 0);
ok(fade.x[0] + fade.x[1] <= 24 && fade.x[1] > fade.x[0], 'old answers should fade without losing the balance');
console.log('  after 8 misses ' + weak + ' was asked ' + tally[weak] + ' times in 6000; after 8 right answers ' + strong + ' ' + tally[strong] + '; a new line about ' + tally[lines[0].id]);

/* ================= sparkline ================= */
section('Sparkline');
[[800], [800, 816], [800, 784, 770, 790, 812, 830, 815], [800, 801, 800]].forEach(function (v) {
  var pts = L.sparkPoints(v, 120, 36, 4);
  ok(pts.length === v.length && pts.every(function (p) { return p[0] >= 4 && p[0] <= 116 && p[1] >= 4 && p[1] <= 32; }), 'sparkline leaves its box for ' + v.join(','));
});
var sp = L.sparkPoints([800, 900], 120, 36, 4);
ok(sp[1][1] < sp[0][1], 'a higher rating should be drawn higher up');

/* ================= the trainers, against a stand-in page ================= */
section('Trainers');

function Node(tag) {
  this.tagName = String(tag).toUpperCase(); this.nodeType = 1; this.children = []; this.attrs = {};
  this.style = {}; this.listeners = {}; this.className = ''; this.hidden = false; this._text = '';
}
Node.prototype.appendChild = function (c) { this.children.push(c); c.parentNode = this; return c; };
Node.prototype.setAttribute = function (k, v) {
  this.attrs[k] = String(v);
  if (k === 'hidden') this.hidden = true;
  if (k === 'class') this.className = String(v);
};
Node.prototype.addEventListener = function (t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); };
Node.prototype.focus = function () {};
Node.prototype.click = function () {
  var self = this;
  (this.listeners.click || []).slice().forEach(function (fn) { fn({ target: self, preventDefault: function () {} }); });
};
Object.defineProperty(Node.prototype, 'innerHTML', {
  get: function () { return this._text; },
  set: function (v) { this.children = []; this._text = String(v); }
});
Object.defineProperty(Node.prototype, 'textContent', {
  get: function () { // markup set through innerHTML reads back as its text
    return this._text.replace(/<[^>]*>/g, '') + this.children.map(function (c) { return c.nodeType === 3 ? c.text : c.textContent; }).join('');
  },
  set: function (v) { this.children = []; this._text = String(v); }
});
function visible(el) { for (; el; el = el.parentNode) if (el.hidden) return false; return true; }
function findAll(el, test, out) {
  out = out || [];
  if (el.nodeType !== 1) return out;
  if (test(el)) out.push(el);
  el.children.forEach(function (c) { findAll(c, test, out); });
  return out;
}
function byClass(root, cls) { return findAll(root, function (el) { return (' ' + el.className + ' ').indexOf(' ' + cls + ' ') >= 0; }); }
function button(root, text) {
  return findAll(root, function (el) { return (el.tagName === 'BUTTON' || el.tagName === 'A') && el.textContent.indexOf(text) >= 0 && visible(el); })[0];
}

var docListeners = [];
global.document = {
  createElement: function (t) { return new Node(t); },
  createElementNS: function (ns, t) { return new Node(t); },
  createTextNode: function (s) { return { nodeType: 3, text: String(s) }; },
  addEventListener: function (t, fn) { docListeners.push({ t: t, fn: fn }); },
  removeEventListener: function (t, fn) { docListeners = docListeners.filter(function (l) { return l.t !== t || l.fn !== fn; }); }
};
function press(key) {
  docListeners.slice().forEach(function (l) { if (l.t === 'keydown') l.fn({ key: key, target: { tagName: 'BODY' }, preventDefault: function () {} }); });
}

/* A board that remembers what it was told and lets the test make moves. */
function FakeBoard(host, opts) { this.orient = (opts && opts.orient) || 'w'; this.arrows = []; this.last = null; this.fen = null; FakeBoard.latest = this; }
FakeBoard.prototype.setPosition = function (pos) { this.fen = typeof pos === 'string' ? pos : pos.fen(); };
FakeBoard.prototype.setOrientation = function (o) { this.orient = o; };
FakeBoard.prototype.setArrows = function (a) { this.arrows = a || []; };
FakeBoard.prototype.setLast = function (p) { this.last = p || null; };
['setHighlights', 'setLabels', 'setTints', 'setCoords', 'flash', 'shake', 'flip', 'reset'].forEach(function (m) { FakeBoard.prototype[m] = function () {}; });
FakeBoard.prototype.play = function (mv) { // a move object from chess.js; false if the board would not allow it
  var dests = this.movable ? this.movable(mv.from) : null;
  if (!dests || dests.indexOf(mv.to) < 0) return false;
  this.onMove(mv.from, mv.to, { dragged: false });
  return true;
};
global.Board = FakeBoard;
CL.seg = function (options, value, onChange) { var el = new Node('div'); el.pick = onChange; return el; };

/* A clock the test can wind forward. */
var now = 1700000000000, pending = [], seq = 0;
Date.now = function () { return now; };
global.setTimeout = function (fn, ms) { pending.push({ id: ++seq, at: now + (ms || 0), fn: fn }); return seq; };
global.setInterval = function (fn, ms) { pending.push({ id: ++seq, at: now + ms, fn: fn, every: ms }); return seq; };
global.clearTimeout = global.clearInterval = function (id) { pending = pending.filter(function (t) { return t.id !== id; }); };
function wind(ms) {
  var until = now + ms, t;
  for (;;) {
    t = null;
    pending.forEach(function (p) { if (p.at <= until && (!t || p.at < t.at)) t = p; });
    if (!t) break;
    now = t.at;
    if (t.every) t.at += t.every; else pending = pending.filter(function (p) { return p !== t; });
    t.fn();
  }
  now = until;
}

var CHAPTER = { id: 'train', title: 'Training' };
function trainer(id) { return CL.trainers.filter(function (t) { return t.id === id; })[0]; }
function open(id) {
  var root = new Node('main'), meta = trainer(id), cleanup = meta.run(root, CHAPTER, meta);
  return { root: root, board: FakeBoard.latest, cleanup: cleanup };
}
function closed(page, name) {
  ok(typeof page.cleanup === 'function', name + ': run() should return a cleanup function');
  page.cleanup();
  ok(pending.length === 0, name + ': ' + pending.length + ' timer(s) left running after cleanup');
  ok(docListeners.length === 0, name + ': ' + docListeners.length + ' document listener(s) left after cleanup');
}
function wrongMove(fen, solution) { // a legal move that is not the answer and not mate
  var g = new Chess(fen), list = g.moves(), i, t;
  for (i = 0; i < list.length; i++) {
    if (strip(list[i].san) === strip(solution) || /#$/.test(list[i].san)) continue;
    t = new Chess(fen);
    return t.move(list[i].san);
  }
  return null;
}
/* Play a puzzle's whole solution on the board, waiting for each scripted reply. */
function solve(board, puz) {
  var g = new Chess(puz.fen), i, mv;
  for (i = 0; i < puz.solution.length; i += 2) {
    mv = g.move(puz.solution[i]);
    if (!board.play(mv)) return false;
    if (i + 1 < puz.solution.length) { g.move(puz.solution[i + 1]); wind(650); if (board.fen !== g.fen()) return false; }
  }
  return true;
}

['rush', 'rated', 'nextmove', 'nameit'].forEach(function (id) {
  var t = trainer(id);
  ok(t && typeof t.run === 'function' && t.title && t.desc, id + ': trainer is not registered properly');
  ok(CL.trainers.filter(function (x) { return x.id === id; }).length === 1, id + ': registered more than once');
});
ok(trainer('rush').group === 'tactics' && trainer('rated').group === 'tactics', 'rush and rated belong to the tactics group');
ok(trainer('nextmove').group === 'openings' && trainer('nameit').group === 'openings', 'nextmove and nameit belong to the openings group');
ok(trainer('rush').timed === 180 && trainer('nameit').timed === 45, 'rush is 180 s and nameit 45 s');

/* ---------- puzzle rush ---------- */
(function () {
  var page = open('rush'), root = page.root, board, served = [], byFen = {}, puz, n, mv;
  pool.forEach(function (p) { byFen[p.fen] = byFen[p.fen] || p; });
  function current() { var p = byFen[board.fen]; served.push(p); return p; }
  ok(button(root, 'Start'), 'rush: no Start button on the intro');
  ok(pending.length === 0, 'rush: the clock should not run before Start');
  button(root, 'Start').click();
  board = FakeBoard.latest;
  for (n = 0; n < 2; n++) {
    puz = current();
    if (!ok(puz, 'rush: the board shows a position that is not a rush puzzle')) return;
    ok(board.orient === puz.fen.split(' ')[1], 'rush: board should face the side to move');
    ok(solve(board, puz), 'rush: could not play the solution of ' + puz.id);
    wind(500);
  }
  ok(byClass(root, 'hud-score')[0].textContent === '2', 'rush: two solved puzzles should score 2');
  for (n = 0; n < 3; n++) {
    puz = current();
    mv = wrongMove(puz.fen, puz.solution[0]);
    ok(board.play(mv), 'rush: could not play a wrong move');
    ok(byClass(root, 'strike').filter(function (el) { return /\bon\b/.test(el.className); }).length === n + 1, 'rush: strike ' + (n + 1) + ' not shown');
    wind(400);
    ok(board.fen === puz.fen && board.arrows.length === 1, 'rush: after a strike the move is taken back and the right one shown');
    ok(board.movable(mv.from) === null, 'rush: no second try at a missed puzzle');
    wind(1400);
  }
  ok(byClass(root, 'drill-end').length === 1 && byClass(root, 'big-score')[0].textContent === '2', 'rush: three strikes should end the run with a score of 2');
  ok(/Three strikes/.test(byClass(root, 'drill-end')[0].textContent), 'rush: the end screen should say why it ended');
  ok(CL.store.best('train/drill/rush') === 2, 'rush: best score not stored');
  ok(CL.activity.last('train/drill/rush') && CL.activity.last('train/drill/rush').score === 2, 'rush: activity not logged');
  ok(nonDecreasing(served.map(L.rushDifficulty)), 'rush: puzzles were not served easiest first');
  ok(pending.length === 0, 'rush: timers still running on the end screen');

  button(root, 'Go again').click();
  board = FakeBoard.latest;
  ok(solve(board, current()), 'rush: second run, could not solve the first puzzle');
  wind(179000);
  ok(byClass(root, 'drill-end').length === 0, 'rush: a three-minute run ended early');
  wind(1500);
  ok(byClass(root, 'drill-end').length === 1 && /Time/.test(byClass(root, 'drill-end')[0].textContent), 'rush: the run should end when time is up');
  ok(CL.store.best('train/drill/rush') === 2, 'rush: a lower score must not replace the best');

  button(root, 'Go again').click();
  closed(page, 'rush');
  console.log('  rush: solved 2, three strikes ended the run, the clock ended the next; served difficulty ' + served.map(L.rushDifficulty).join(' '));
})();

/* ---------- rated puzzles ---------- */
(function () {
  var page = open('rated'), root = page.root, board = page.board, byFen = {}, puz, before, mv, n, seenIds = {};
  bank.forEach(function (p) { byFen[p.fen] = p; });
  function rating() { return CL.store.pref('puzzleRating', 800); }
  function current() { return byFen[board.fen]; }

  ok(rating() === 800 && byClass(root, 'elo-num')[0].textContent === '800', 'rated: should start at 800');
  puz = current();
  if (!ok(puz, 'rated: the board shows a position that is not a bank puzzle')) return;
  ok(Math.abs(L.rate(puz) - 800) <= 150, 'rated: first puzzle (' + L.rate(puz) + ') is not near 800');
  ok(board.orient === puz.fen.split(' ')[1], 'rated: board should face the side to move');
  ok(!button(root, 'Next puzzle'), 'rated: Next puzzle should wait for a result');

  // 1: solved first try
  ok(solve(board, puz), 'rated: could not play the solution of ' + puz.id);
  ok(rating() === 800 + L.eloChange(800, L.rate(puz), true), 'rated: a first-try solve should add the Elo change');
  ok(CL.store.isDone('puz/' + puz.id), 'rated: a solved bank puzzle should count as solved');
  ok(button(root, 'Next puzzle') && !button(root, 'Show me'), 'rated: after a result there is Next puzzle and no Show me');
  ok(byClass(root, 'feedback')[0].textContent.indexOf(String(L.rate(puz))) >= 0 && byClass(root, 'feedback')[0].textContent.indexOf(puz.theme.toLowerCase()) >= 0,
    'rated: the result should show the puzzle’s rating and theme');
  ok(byClass(root, 'spark').length === 1, 'rated: no sparkline after the first result');
  seenIds[puz.id] = 1;

  // 2: a miss, another miss, then solved: one change only
  button(root, 'Next puzzle').click();
  puz = current(); before = rating();
  ok(puz && !seenIds[puz.id], 'rated: the same puzzle came straight back');
  mv = wrongMove(puz.fen, puz.solution[0]);
  ok(board.play(mv), 'rated: could not play a wrong move');
  ok(rating() === before + L.eloChange(before, L.rate(puz), false), 'rated: a miss should subtract the Elo change');
  ok(board.movable(mv.from) === null, 'rated: input should wait while the wrong move is shown');
  wind(750);
  ok(board.fen === puz.fen, 'rated: the wrong move should be taken back');
  n = rating();
  ok(board.play(mv), 'rated: the player should be able to try again');
  wind(750);
  ok(rating() === n, 'rated: a second miss must not move the rating again');
  ok(solve(board, puz), 'rated: could not solve after a miss');
  ok(rating() === n, 'rated: solving after a miss must not move the rating');
  ok(CL.store.pref('puzzleLog', []).length === 2, 'rated: one log entry per puzzle');
  seenIds[puz.id] = 1;

  // 3: Show me
  press('Enter');
  puz = current(); before = rating();
  ok(puz && !seenIds[puz.id], 'rated: Enter should bring a new puzzle');
  button(root, 'Show me').click();
  wind(4000);
  ok(rating() === before + L.eloChange(before, L.rate(puz), false), 'rated: Show me should count as a miss');
  ok(!CL.store.isDone('puz/' + puz.id), 'rated: a puzzle that was shown is not solved');
  ok(button(root, 'Next puzzle'), 'rated: Next puzzle should appear after Show me');
  ok(!CL.activity.last('train/drill/rated'), 'rated: activity should not be logged before five puzzles');
  seenIds[puz.id] = 1;

  // 4, 5: two more, to reach the activity log
  for (n = 0; n < 2; n++) {
    button(root, 'Next puzzle').click();
    puz = current();
    ok(puz && !seenIds[puz.id], 'rated: a recent puzzle was served again');
    seenIds[puz.id] = 1;
    ok(solve(board, puz), 'rated: could not play the solution of ' + puz.id);
  }
  var log = CL.store.pref('puzzleLog', []).slice();
  ok(log.length === 5 && log[4].r === rating(), 'rated: the log should hold five results ending at the current rating');
  ok(CL.activity.last('train/drill/rated') && CL.activity.last('train/drill/rated').score === rating(), 'rated: activity should be logged after five puzzles, with the rating');
  ok(CL.store.best('train/drill/rated') === Math.max.apply(null, log.map(function (e) { return e.r; })), 'rated: best should be the peak rating');
  ok(CL.store.pref('puzzleCount', 0) === 5, 'rated: puzzle count');

  // the log never grows past 30
  for (n = 0; n < 30; n++) { button(root, 'Next puzzle').click(); if (!solve(board, current())) break; }
  ok(n === 30 && CL.store.pref('puzzleLog', []).length === 30, 'rated: the log should stop at 30 results');
  ok(rating() > 800, 'rated: thirty solves should have raised the rating');
  closed(page, 'rated');

  // a second visit picks up where the first left off
  n = rating();
  page = open('rated');
  ok(byClass(page.root, 'elo-num')[0].textContent === String(n) && byClass(page.root, 'spark').length === 1, 'rated: rating and history should survive a reload');
  closed(page, 'rated (second visit)');
  console.log('  rated: 800 → ' + log.map(function (e) { return e.r + ' (' + (e.d > 0 ? '+' : '') + e.d + ')'; }).join(' → ') + ' … ' + n + ' after 35 puzzles; peak ' + CL.store.best('train/drill/rated'));
})();

/* ---------- opening: next move ---------- */
(function () {
  var page = open('nextmove'), root = page.root, board = page.board, n, q, mv, bad, text, asked = [];
  function current() {
    var name = findAll(root, function (el) { return el.tagName === 'H2'; })[0].textContent;
    return moveQ.filter(function (m) { return m.fen === board.fen && m.line.name === name; })[0];
  }
  q = current();
  if (!ok(q, 'nextmove: the board shows a position that is not a book question')) return;
  ok(board.orient === q.fen.split(' ')[1], 'nextmove: board should face the side to move');

  // right
  mv = new Chess(q.fen).move(q.move.san);
  ok(board.play(mv), 'nextmove: could not play the book move');
  text = byClass(root, 'feedback')[0];
  ok(/good/.test(text.className) && (!q.why || text.textContent.indexOf(q.why) >= 0), 'nextmove: a right answer should show the move’s explanation in green');
  ok(CL.store.best('train/drill/nextmove') === 1, 'nextmove: streak of one should be the best so far');
  ok(CL.store.pref('openingStats').lines[q.line.id][0] === 1, 'nextmove: right answer not counted for the line');
  asked.push(q);
  wind(4000);
  ok(current() && current() !== q, 'nextmove: a right answer should lead on to a new question');

  // wrong
  q = current();
  asked.push(q);
  bad = wrongMove(q.fen, q.move.san);
  ok(board.play(bad), 'nextmove: could not play a wrong move');
  text = byClass(root, 'feedback')[0];
  ok(/bad/.test(text.className) && text.textContent.indexOf(q.move.san) >= 0 && (!q.why || text.textContent.indexOf(q.why) >= 0),
    'nextmove: a wrong answer should name the book move and say why');
  ok(CL.store.pref('openingStats').lines[q.line.id][1] === 1, 'nextmove: wrong answer not counted for the line');
  ok(/Streak 0/.test(byClass(root, 'streak')[0].textContent) && /1 slip/.test(byClass(root, 'streak')[0].textContent), 'nextmove: streak should reset and the slip be counted');
  wind(700);
  ok(board.fen === q.fen && board.arrows.length === 1 && board.arrows[0][0] === q.move.from && board.arrows[0][1] === q.move.to, 'nextmove: the book move should be shown with an arrow');
  ok(board.movable(bad.from) === null, 'nextmove: no second try at a missed question');
  wind(10000);
  ok(current() === q, 'nextmove: after a wrong answer the question waits for the player');
  ok(!CL.activity.last('train/drill/nextmove'), 'nextmove: activity should not be logged before ten questions');
  button(root, 'Next question').click();
  ok(current() && current() !== q, 'nextmove: Next question should bring a new one');

  // eight more right answers: a streak of eight, and ten questions in all
  for (n = 0; n < 8; n++) {
    q = current();
    if (!ok(q, 'nextmove: lost track of the question')) return;
    asked.push(q);
    board.play(new Chess(q.fen).move(q.move.san));
    if (n % 2) press(' '); else wind(4000);
  }
  ok(CL.store.best('train/drill/nextmove') === 8, 'nextmove: best should be the longest streak (8), got ' + CL.store.best('train/drill/nextmove'));
  ok(CL.store.pref('openingStats').n === 10, 'nextmove: ten questions should have been counted');
  ok(CL.activity.last('train/drill/nextmove') && CL.activity.last('train/drill/nextmove').score === 8, 'nextmove: activity should be logged after ten questions');
  for (n = 1; n < asked.length; n++) ok(asked[n].line !== asked[n - 1].line, 'nextmove: the same opening twice running');
  closed(page, 'nextmove');
  console.log('  nextmove: asked ' + asked.map(function (a) { return a.line.id + '@' + a.ply; }).join(' '));
})();

/* ---------- name the opening ---------- */
(function () {
  var page = open('nameit'), root = page.root, board, n, q, choices, right, hits = 0;
  function current() { return nameQ.filter(function (m) { return m.fen === board.fen; })[0]; }
  function options() { return byClass(root, 'choice'); }
  button(root, 'Start').click();
  board = FakeBoard.latest;
  for (n = 0; n < 6; n++) {
    q = current(); choices = options();
    if (!ok(q, 'nameit: the board shows a position that does not identify a line')) return;
    ok(choices.length === 4, 'nameit: there should be four choices');
    right = choices.filter(function (c) { return c.textContent.indexOf(q.line.name) >= 0; });
    ok(right.length === 1, 'nameit: exactly one choice should be the right name');
    if (n < 3) { right[0].click(); hits++; }                                   // by click
    else if (n < 5) { press(String(choices.indexOf(right[0]) + 1)); hits++; }   // by key
    else press(String((choices.indexOf(right[0]) + 1) % 4 + 1));                // a wrong key
  }
  ok(byClass(root, 'hud-score')[0].textContent === String(hits), 'nameit: score should be ' + hits);
  ok(/that was the/.test(byClass(root, 'drill-note')[0].textContent), 'nameit: a wrong answer should name the opening');
  wind(46000);
  ok(byClass(root, 'drill-end').length === 1, 'nameit: the round should end after 45 seconds');
  ok(CL.store.best('train/drill/nameit') === hits, 'nameit: best score not stored under train/drill/nameit');
  ok(CL.activity.last('train/drill/nameit') && CL.activity.last('train/drill/nameit').score === hits, 'nameit: activity not logged');
  closed(page, 'nameit');
  console.log('  nameit: ' + hits + ' right out of 6 by click and key, round ended on time');
})();

console.log('\n' + checks + ' checks, ' + (failures ? failures + ' FAILED.' : 'all passed.'));
process.exit(failures ? 1 : 0);
