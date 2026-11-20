/* Checks every position, move list and puzzle in the course against the rules engine,
   and checks each tactics puzzle with the search engine.   Run:  node tools/validate.js  */
global.window = global;
global.Chess = require('../js/chess.js');
var AI = require('../js/ai.js');
require('../js/core.js');
['vision', 'notation', 'openings', 'strategy', 'pawns', 'mates', 'tactics'].forEach(function (n) { require('../js/content/' + n + '.js'); });

var CL = global.CL, Chess = global.Chess;
var WIDGETS = ['coords', 'colors', 'diagonals', 'regions', 'reach', 'knightDistance', 'control'];
var SQ = /^[a-h][1-8]$/;
var problems = 0, warnings = 0, counts = { lessons: 0, steps: 0, puzzles: 0, lines: 0, tactics: 0 };

function strip(s) { return s.replace(/[+#!?]/g, ''); }
function fail(where, msg) { problems++; console.log('FAIL  ' + where + ': ' + msg); }
function warn(where, msg) { warnings++; console.log('warn  ' + where + ': ' + msg); }

function squaresOk(where, list, what) {
  (list || []).forEach(function (s) { if (!SQ.test(s)) fail(where, 'bad square "' + s + '" in ' + what); });
}

function sane(where, g) {
  var kings = { w: 0, b: 0 };
  for (var i = 0; i < 64; i++) { var p = g.board[i]; if (p && p.type === 'k') kings[p.color]++; }
  if (kings.w > 1 || kings.b > 1) fail(where, 'more than one king of a colour');
  if (kings.w === 1 && kings.b === 1) {
    var waiting = g.turn === 'w' ? 'b' : 'w';
    if (g._attacked(g._king(waiting), g.turn)) fail(where, 'the side that is NOT to move is in check (illegal position)');
  }
  return kings.w === 1 && kings.b === 1;
}

function forcedMate(g, n) { // can the side to move force mate in n moves?
  var ms = g._legal();
  for (var i = 0; i < ms.length; i++) {
    g._make(ms[i]);
    var replies = g._legal(), ok;
    if (!replies.length) ok = g.inCheck();
    else if (n === 1) ok = false;
    else {
      ok = true;
      for (var j = 0; j < replies.length && ok; j++) {
        g._make(replies[j]);
        if (!forcedMate(g, n - 1)) ok = false;
        g._unmake();
      }
    }
    g._unmake();
    if (ok) return true;
  }
  return false;
}

function checkStep(where, st) {
  counts.steps++;
  var kind = st.type || 'info', g;
  try { g = CL.resolve(st); } catch (e) { return fail(where, e.message); }
  var full = sane(where, g);
  for (var k in (st.hl || {})) squaresOk(where, st.hl[k], 'hl.' + k);
  (st.arrows || []).forEach(function (a) { squaresOk(where, [a[0], a[1]], 'arrows'); });
  squaresOk(where, Object.keys(st.labels || {}), 'labels');

  if (kind === 'widget') {
    if (WIDGETS.indexOf(st.widget) < 0) fail(where, 'unknown widget ' + st.widget);
  } else if (kind === 'line') {
    counts.lines++;
    var raw = typeof st.moves === 'string' ? Chess.parseMoves(st.moves) : st.moves.map(function (m) { return m[0]; });
    try {
      var lg = Chess.fromMoves(raw, g.fen());
      var last = raw[raw.length - 1];
      if (/#/.test(last) && !lg.isCheckmate()) fail(where, 'line claims mate but final position is not mate');
      if (lg.isCheckmate() && !/#/.test(last)) warn(where, 'line ends in mate but the last move is not marked #');
      raw.forEach(function (s, i) { if (strip(s) !== strip(lg.history()[i])) warn(where, 'written "' + s + '" but standard notation is "' + lg.history()[i] + '"'); });
    } catch (e) { fail(where, e.message); }
  } else if (kind === 'puzzle') {
    counts.puzzles++;
    if (!full) fail(where, 'puzzle position needs both kings');
    var pg = new Chess(g.fen()), sol = st.solution;
    for (var i = 0; i < sol.length; i++) {
      var mv = pg.move(sol[i]);
      if (!mv) return fail(where, 'solution move "' + sol[i] + '" is illegal');
      if (mv.san !== sol[i]) warn(where, 'solution written "' + sol[i] + '" but standard notation is "' + mv.san + '"');
    }
    if (sol.length % 2 === 0) fail(where, 'solution must end on the solver\'s move');
    var mate = /#$/.test(sol[sol.length - 1]) && !st.tactic;
    if (mate) {
      var n = (sol.length + 1) / 2;
      if (!pg.isCheckmate()) fail(where, 'solution does not end in checkmate');
      if (!forcedMate(new Chess(g.fen()), n)) fail(where, 'not a forced mate in ' + n);
      if (n > 1 && forcedMate(new Chess(g.fen()), n - 1)) warn(where, 'there is a quicker mate than the solution');
    } else if (!st.show && !st.concept) {
      counts.tactics++;
      var res = AI.think(g.fen(), { depth: 4, all: true, time: 60000 });
      var top = res.lines[0], second = res.lines[1];
      var gap = second ? top.score - second.score : 9999;
      var line = where + ': engine prefers ' + top.move.san + ' (' + top.score + ')' + (second ? ', next ' + second.move.san + ' (' + second.score + ')' : '');
      if (strip(top.move.san) !== strip(sol[0])) fail(where, 'engine disagrees with solution ' + sol[0] + ' -> ' + line);
      else if (gap < 60) warn(where, 'solution is best but only by ' + gap + ' centipawns');
      else console.log('ok    ' + line);
    }
  } else if (kind === 'write') {
    if (!new Chess(g.fen()).move(st.san)) fail(where, 'write-step move "' + st.san + '" is illegal');
  } else if (kind === 'find') {
    if (st.targets) squaresOk(where, st.targets, 'targets');
    else if (!st.answers || !st.answers.length) fail(where, 'find step has no answers');
    else squaresOk(where, st.answers, 'answers');
  } else if (kind === 'quiz') {
    if (!(st.answer >= 0 && st.answer < st.choices.length)) fail(where, 'quiz answer index out of range');
  }
}

CL.order.forEach(function (cid) {
  var ch = CL.content[cid];
  if (!ch) return fail(cid, 'chapter missing');
  var ids = {};
  ch.lessons.forEach(function (ls) {
    counts.lessons++;
    if (ids[ls.id]) fail(cid, 'duplicate id ' + ls.id);
    ids[ls.id] = 1;
    ls.steps.forEach(function (st, i) { checkStep(cid + '/' + ls.id + ' step ' + (i + 1), st); });
  });
  (ch.lines || []).forEach(function (op) {
    if (ids[op.id]) fail(cid, 'duplicate id ' + op.id);
    ids[op.id] = 1;
    try {
      var g = Chess.fromMoves(op.moves.map(function (m) { return m[0]; }));
      op.moves.forEach(function (m, i) { if (strip(m[0]) !== strip(g.history()[i])) warn(cid + '/' + op.id, 'written "' + m[0] + '" but standard is "' + g.history()[i] + '"'); });
    } catch (e) { fail(cid + '/' + op.id, e.message); }
  });
  (ch.groups || []).forEach(function (gr) {
    gr.ids.forEach(function (id) { if (!ch.lines.some(function (l) { return l.id === id; })) fail(cid, 'group refers to unknown line ' + id); });
  });
  (ch.games || []).forEach(function (gm) {
    try {
      var g = Chess.fromMoves(gm.moves);
      if (/#\s*$/.test(gm.moves) && !g.isCheckmate()) fail(cid + '/' + gm.name, 'game should end in mate');
    } catch (e) { fail(cid + '/' + gm.name, e.message); }
  });
});

/* The generated puzzle bank: every solution must be legal, and every mate must be forced. */
var bankCount = 0;
try { require('../js/content/puzzles.js'); } catch (e) { warn('puzzle bank', 'js/content/puzzles.js is missing; run tools/make-puzzles.js'); }
(CL.puzzleBank || []).forEach(function (p) {
  bankCount++;
  var where = 'bank/' + p.id, g;
  try { g = new Chess(p.fen); } catch (e) { return fail(where, e.message); }
  sane(where, g);
  var t = new Chess(p.fen);
  for (var i = 0; i < p.solution.length; i++) if (!t.move(p.solution[i])) return fail(where, 'illegal solution move ' + p.solution[i]);
  if (/^Mate/.test(p.theme)) {
    var n = (p.solution.length + 1) / 2;
    if (!t.isCheckmate()) fail(where, 'does not end in mate');
    else if (!forcedMate(new Chess(p.fen), n)) fail(where, 'not a forced mate in ' + n);
  }
});

console.log('\n' + bankCount + ' bank puzzles checked.');
console.log(counts.lessons + ' lessons, ' + counts.steps + ' steps, ' + counts.lines + ' move sequences, ' +
  counts.puzzles + ' puzzles (' + counts.tactics + ' engine-checked tactics), ' +
  CL.content.openings.lines.length + ' opening lines.');
console.log(problems ? problems + ' problem(s), ' + warnings + ' warning(s).' : 'No problems. ' + warnings + ' warning(s).');
process.exit(problems ? 1 : 0);
