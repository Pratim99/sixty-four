/* Sixty-Four — "spot it" trainers: loose pieces, attackers, pawn types, outposts, material, the rule of the square.
   Every question is generated from a real position and answered by code. The pure logic lives on CL.spot
   (tested by tools/test-train-spot.js); only the run functions at the bottom touch the page. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
  var spot = CL.spot = {};

  var FILES = 'abcdefgh';
  var VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  var CATS = ['passed', 'isolated', 'doubled', 'backward'];

  function other(c) { return c === 'w' ? 'b' : 'w'; }
  function sideName(c) { return c === 'w' ? 'White' : 'Black'; }
  function fwd(c) { return c === 'w' ? 1 : -1; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function has(list, x) { return list.indexOf(x) >= 0; }

  /* ["a1", "b2", "c3"] -> "a1, b2 and c3" */
  function listOf(list) {
    if (list.length < 2) return list.join('');
    return list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }

  /* Make candidates until one passes the test (or give up and keep the last one made). */
  function seek(make, ok, tries) {
    var q = null, last = null;
    for (var i = 0; i < tries; i++) {
      q = make();
      if (!q) continue;
      if (ok(q)) return q;
      last = q;
    }
    while (!last) last = make();
    return last;
  }

  /* ================= loose pieces ================= */

  /* Knights, bishops, rooks and queens of one colour that no friendly piece defends. */
  spot.loose = function (game, color) {
    var map = game.pieces(), out = [], s;
    for (s in map) {
      if (map[s].color === color && 'nbrq'.indexOf(map[s].type) >= 0 && !game.attackers(s, color).length) out.push(s);
    }
    return out.sort();
  };

  spot.looseQuestion = function (pool) {
    var want = Math.random() < 0.8;
    return seek(function () {
      var fen = CL.pick(pool), game = new Chess(fen), color = CL.pick(['w', 'b']);
      return { fen: fen, game: game, color: color, targets: spot.loose(game, color) };
    }, function (q) { return (q.targets.length > 0) === want; }, 40);
  };

  /* ================= attackers ================= */

  /* A square with a piece on it (never a king) and a colour: how many pieces of that colour attack it?
     Two times in three the answer is at least one, spread over 1, 2, 3 and 4+ where the position allows. */
  spot.attackQuestion = function (pool) {
    var some = Math.random() < 2 / 3;
    return seek(function () {
      var fen = CL.pick(pool), game = new Chess(fen), map = game.pieces(), groups = {}, keys, s, c, i, list, n;
      for (s in map) {
        if (map[s].type === 'k') continue;
        for (i = 0; i < 2; i++) {
          c = i ? 'b' : 'w';
          list = game.attackers(s, c);
          n = Math.min(list.length, 4);
          if ((n > 0) !== some) continue;
          (groups[n] = groups[n] || []).push({ fen: fen, game: game, square: s, color: c, attackers: list.sort(),
            count: list.length, defend: map[s].color === c });
        }
      }
      keys = Object.keys(groups);
      return keys.length ? CL.pick(groups[CL.pick(keys)]) : null;
    }, function () { return true; }, 40);
  };

  /* ================= pawns ================= */

  /* Pawn ranks by file: table.w[3] lists the ranks (0 to 7, low to high) of White's d-pawns. */
  function pawnTable(game) {
    var map = game.pieces(), t = { w: [], b: [] }, i, s, p;
    for (i = 0; i < 8; i++) { t.w.push([]); t.b.push([]); }
    for (s in map) {
      if (map[s].type !== 'p') continue;
      p = CL.fr(s);
      t[map[s].color][p[0]].push(p[1]);
    }
    return t;
  }

  /* The first pawn in `files` (a table row set) on file f-1 or f+1 (and f itself if `own`) whose rank passes the test. */
  function findPawn(files, f, own, test) {
    var k, i, ff;
    for (k = own ? 0 : 1; k < 3; k++) {
      ff = f + (k === 0 ? 0 : k === 1 ? -1 : 1);
      if (ff < 0 || ff > 7) continue;
      for (i = 0; i < files[ff].length; i++) if (test(files[ff][i])) return CL.sq(ff, files[ff][i]);
    }
    return null;
  }

  /* An enemy pawn ahead of the pawn on its own file or a neighbouring one (it stops the pawn being passed). */
  function stopper(t, c, f, r) {
    return findPawn(t[other(c)], f, true, function (q) { return (q - r) * fwd(c) > 0; });
  }
  /* Any friendly pawn on a neighbouring file. */
  function neighbour(t, c, f) {
    return findPawn(t[c], f, false, function () { return true; });
  }
  /* A friendly pawn on a neighbouring file that is level with the pawn or behind it. */
  function supporter(t, c, f, r) {
    return findPawn(t[c], f, false, function (q) { return (q - r) * fwd(c) <= 0; });
  }
  /* An enemy pawn that attacks the square directly in front of the pawn. */
  function frontGuard(t, c, f, r) {
    return findPawn(t[other(c)], f, false, function (q) { return q === r + 2 * fwd(c); });
  }

  function pawnIs(t, c, f, r, cat) {
    if (cat === 'passed') return !stopper(t, c, f, r);
    if (cat === 'isolated') return !neighbour(t, c, f);
    if (cat === 'doubled') return t[c][f].length > 1;
    if (cat === 'backward') return !!neighbour(t, c, f) && !supporter(t, c, f, r) && !!frontGuard(t, c, f, r);
    throw new Error('Unknown pawn category: ' + cat);
  }

  /* Every pawn of one colour that is passed / isolated / doubled / backward. */
  spot.pawns = function (game, color, cat) {
    var t = pawnTable(game), out = [], f, i;
    for (f = 0; f < 8; f++) {
      for (i = 0; i < t[color][f].length; i++) {
        if (pawnIs(t, color, f, t[color][f][i], cat)) out.push(CL.sq(f, t[color][f][i]));
      }
    }
    return out.sort();
  };

  /* Why the pawn on `sq` is not of that category, in plain words (null if it is). */
  spot.pawnWhyNot = function (game, sq, cat) {
    var p = game.get(sq), t = pawnTable(game), at = CL.fr(sq), f = at[0], r = at[1], c, x;
    if (!p || p.type !== 'p') return 'There is no pawn on ' + sq + '.';
    c = p.color;
    if (pawnIs(t, c, f, r, cat)) return null;
    if (cat === 'passed') return sq + ' is not passed: the pawn on ' + stopper(t, c, f, r) + ' can stop it.';
    if (cat === 'isolated') return sq + ' is not isolated: it has a neighbour on ' + neighbour(t, c, f) + '.';
    if (cat === 'doubled') return sq + ' is the only ' + sideName(c) + ' pawn on the ' + FILES.charAt(f) + '-file.';
    if (!neighbour(t, c, f)) return sq + ' is isolated, not backward: it has no neighbours at all.';
    x = supporter(t, c, f, r);
    if (x) return sq + ' is not backward: the pawn on ' + x + ' can support it.';
    return sq + ' is not backward: no enemy pawn guards ' + CL.sq(f, r + fwd(c)) + '.';
  };

  spot.pawnQuestion = function (pool) {
    var cat = CL.pick(CATS), want = Math.random() < 2 / 3;
    return seek(function () {
      var fen = CL.pick(pool), game = new Chess(fen), color = CL.pick(['w', 'b']);
      return { fen: fen, game: game, color: color, cat: cat, targets: spot.pawns(game, color, cat) };
    }, function (q) { return (q.targets.length > 0) === want; }, 80);
  };

  /* ================= outposts ================= */

  /* Why `sq` is not an outpost for `color` (null if it is one). */
  function outpostFlaw(map, t, color, sq) {
    var at = CL.fr(sq), f = at[0], r = at[1], d = fwd(color), foe = other(color), p = map[sq], x;
    if (color === 'w' ? (r !== 4 && r !== 5) : (r !== 3 && r !== 2)) {
      return 'Outposts for ' + sideName(color) + ' are on ranks ' + (color === 'w' ? '5 and 6' : '4 and 3') + '.';
    }
    if (p && p.type === 'p') return 'A pawn stands on ' + sq + '.';
    if (p && p.color === foe) return 'A ' + sideName(foe) + ' piece stands on ' + sq + '.';
    if (!findPawn(t[color], f, false, function (q) { return q === r - d; })) return 'No ' + sideName(color) + ' pawn defends ' + sq + '.';
    x = findPawn(t[foe], f, false, function (q) { return (q - r) * d > 0; });
    if (x) return 'The pawn on ' + x + (CL.fr(x)[1] === r + d ? ' attacks ' : ' can still advance and attack ') + sq + '.';
    return null;
  }

  /* Outpost squares for one colour: in the enemy half but short of the last two ranks, defended by an own pawn,
     free of pawns and enemy pieces, and out of reach of every enemy pawn for good. */
  spot.outposts = function (game, color) {
    var map = game.pieces(), t = pawnTable(game);
    return CL.all.filter(function (s) { return !outpostFlaw(map, t, color, s); }).sort();
  };

  spot.outpostFlaw = function (game, color, sq) { return outpostFlaw(game.pieces(), pawnTable(game), color, sq); };

  spot.outpostQuestion = function (pool) {
    var want = Math.random() < 2 / 3;
    return seek(function () {
      var fen = CL.pick(pool), game = new Chess(fen), color = CL.pick(['w', 'b']);
      return { fen: fen, game: game, color: color, targets: spot.outposts(game, color) };
    }, function (q) { return (q.targets.length > 0) === want; }, 60);
  };

  /* ================= material ================= */

  /* Point count for each side (pawn 1, knight 3, bishop 3, rook 5, queen 9); diff is White minus Black. */
  spot.material = function (game) {
    var map = game.pieces(), sum = { w: 0, b: 0 }, s;
    for (s in map) sum[map[s].color] += VALUE[map[s].type];
    return { w: sum.w, b: sum.b, diff: sum.w - sum.b };
  };

  spot.materialLabel = function (diff) {
    return diff ? (diff > 0 ? 'White +' + diff : 'Black +' + (-diff)) : 'Level';
  };

  /* Four answers, best for White first: four neighbouring scores with the right one in a random place,
     so the wrong ones are all near-misses and the layout gives nothing away. `slot` (0 to 3) fixes the place. */
  spot.materialOptions = function (diff, slot) {
    var top = diff + (slot == null ? rnd(4) : slot);
    return [top, top - 1, top - 2, top - 3];
  };

  spot.materialQuestion = function (pool) {
    var level = Math.random() < 0.25;
    var q = seek(function () {
      var fen = CL.pick(pool), game = new Chess(fen), m = spot.material(game);
      return { fen: fen, game: game, w: m.w, b: m.b, diff: m.diff };
    }, function (c) { return (c.diff === 0) === level; }, 40);
    q.options = spot.materialOptions(q.diff);
    return q;
  };

  /* ================= the rule of the square ================= */

  function cheb(a, b) {
    var p = CL.fr(a), q = CL.fr(b);
    return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]));
  }

  /* Moves the pawn needs to promote; from its starting square the first one is a double step. */
  spot.pawnSteps = function (sq, color) {
    var r = CL.fr(sq)[1], rel = color === 'w' ? r : 7 - r;
    return rel === 1 ? 5 : 7 - rel;
  };

  /* The pawn's "square": as many files wide as the pawn has ranks to run, drawn on the king's side of the pawn
     (clipped at the edge of the board). A pawn on its starting square counts from one rank further on. */
  spot.squareOf = function (pawnSq, color, kingSq) {
    var p = CL.fr(pawnSq), d = fwd(color), last = color === 'w' ? 7 : 0, n = spot.pawnSteps(pawnSq, color);
    var r0 = last - n * d, kf = kingSq ? CL.fr(kingSq)[0] : p[0];
    var dir = kf > p[0] ? 1 : kf < p[0] ? -1 : (p[0] + n <= 7 ? 1 : -1);
    var out = [], i, j, f;
    for (i = 0; i <= n; i++) {
      f = p[0] + i * dir;
      if (f < 0 || f > 7) break;
      for (j = 0; j <= n; j++) out.push(CL.sq(f, r0 + j * d));
    }
    return out;
  };

  /* Does the lone king catch the lone pawn? Exact search with the rules engine: the pawn's side only ever
     pushes the pawn (its own king stays put), the other king tries every legal route. "Caught" means the king
     takes the pawn, takes the new queen the moment it appears, or stands in the undefended pawn's way. */
  spot.kingCatches = function (fen) {
    var g = new Chess(fen), start = g.pieces(), runner = null, memo = {}, s;
    for (s in start) if (start[s].type === 'p') runner = start[s].color;
    if (!runner) throw new Error('No pawn in: ' + fen);

    function caught() {
      var map = g.pieces(), pawn = null, queen = null, king = null, k, key, list, i, res;
      for (k in map) {
        if (map[k].color !== runner) king = k;
        else if (map[k].type === 'p') pawn = k;
        else if (map[k].type === 'q') queen = k;
      }
      if (g.turn === runner && !pawn) return !queen; // taken, or queened and still standing
      key = g.turn + (pawn || queen) + king;
      if (memo[key] != null) return memo[key];
      if (g.turn === runner) {
        list = g.moves({ square: pawn }).filter(function (m) { return !m.captured && (!m.promotion || m.promotion === 'q'); });
        if (!list.length) res = !g.attackers(pawn, runner).length; // blocked by the king, which takes it next move
        else {
          res = true;
          for (i = 0; i < list.length && res; i++) {
            g.move(list[i]);
            if (!caught()) res = false;
            g.undo();
          }
        }
      } else {
        list = g.moves({ square: king });
        res = false;
        for (i = 0; i < list.length && !res; i++) {
          g.move(list[i]);
          if (caught()) res = true;
          g.undo();
        }
      }
      memo[key] = res;
      return res;
    }
    return caught();
  };

  /* FEN for a bare race: `side` owns the pawn and the king on `home`; the other king stands on `king`. */
  spot.raceFen = function (side, pawn, home, king, turn) {
    var map = {}, rows = [], r, f, p, row, gap;
    map[pawn] = side === 'w' ? 'P' : 'p';
    map[home] = side === 'w' ? 'K' : 'k';
    map[king] = side === 'w' ? 'k' : 'K';
    for (r = 7; r >= 0; r--) {
      row = ''; gap = 0;
      for (f = 0; f < 8; f++) {
        p = map[CL.sq(f, r)];
        if (!p) { gap++; continue; }
        row += (gap || '') + p; gap = 0;
      }
      rows.push(row + (gap || ''));
    }
    return rows.join('/') + ' ' + turn + ' - - 0 1';
  };

  function makeRace(want) {
    var side = CL.pick(['w', 'b']), foe = other(side), turn = CL.pick(['w', 'b']);
    var f = rnd(8), rel = CL.pick([1, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5]), r = side === 'w' ? rel : 7 - rel;
    var pawn = CL.sq(f, r), promo = CL.sq(f, side === 'w' ? 7 : 0), n = spot.pawnSteps(pawn, side);
    /* The rule itself is used only to aim the king near the edge of the square, where the question is
       interesting. The answer comes from the search below. */
    var edge = n + (turn === foe ? 1 : 0), near = Math.random() < 0.8;
    var kings = CL.all.filter(function (s) {
      var dist = cheb(s, promo);
      if (cheb(s, pawn) < 2) return false; // never touching the pawn: no checks, and no question when it can simply be taken
      if (want ? dist > edge : dist <= edge) return false;
      return !near || (want ? dist >= edge - 1 : dist <= edge + 2);
    });
    if (!kings.length) return null;
    var king = CL.pick(kings);
    /* The pawn's own king: on its first two ranks, at least four files from the pawn, well away from the other king. */
    var homes = CL.all.filter(function (s) {
      var p = CL.fr(s);
      return (side === 'w' ? p[1] : 7 - p[1]) <= 1 && Math.abs(p[0] - f) >= 4 && cheb(s, king) >= 3;
    });
    if (!homes.length) return null;
    var home = CL.pick(homes), fen = spot.raceFen(side, pawn, home, king, turn);
    var square = spot.squareOf(pawn, side, king);
    return { fen: fen, side: side, turn: turn, pawn: pawn, king: king, home: home, promo: promo,
      caught: spot.kingCatches(fen), square: square, inside: cheb(king, promo) <= n };
  }

  /* A lone passed pawn against a lone king, yes and no answers in equal numbers. */
  spot.raceQuestion = function () {
    var want = Math.random() < 0.5;
    return seek(function () { return makeRace(want); }, function (q) { return q.caught === want; }, 200);
  };

  /* One sentence explaining the answer in terms of the square. */
  spot.raceWhy = function (q) {
    var kingMoves = q.turn !== q.side;
    if (q.caught) {
      return q.inside ? 'Caught: the king is already inside the square.'
        : 'Caught: the king steps into the square on its move.';
    }
    if (q.inside) return 'Not caught: the king cannot get round in time.';
    return kingMoves ? 'Not caught: the king cannot reach the square in one move.'
      : 'Not caught: the king is outside the square and the pawn moves first.';
  };

  /* ================= on the page ================= */

  function grade(high, mid, a, b, c) {
    return function (n) { return n >= high ? a : n >= mid ? b : c; };
  }

  function chip(c) { return '<b class="spot-side ' + c + '">' + sideName(c) + '</b>'; }

  /* The question, as one sentence with the words that change picked out; `extra` is an optional element below it. */
  function ask(api, html, extra) {
    api.prompt.innerHTML = '';
    api.prompt.appendChild(h('div.spot-q', { html: html }));
    if (extra) api.prompt.appendChild(extra);
  }

  /* Shared frame for "click every …" questions.
     o.make(pool) -> { game, targets, … }; o.ask(q) -> html; o.none -> button label;
     o.why(q, square) -> a message (or { text, arrows }) for a wrong click, or null to ignore the click. */
  function clickAll(api, o) {
    var board = new Board(api.boardHost, { coords: true }), pool = CL.positionPool();
    var q = null, found = [], busy = false, tally = h('span.muted');

    function next() {
      q = o.make(pool); found = []; busy = false;
      board.setPosition(q.game);
      board.setHighlights({});
      board.setArrows([]);
      tally.textContent = '';
      ask(api, o.ask(q), tally);
    }
    function none() {
      if (busy) return;
      busy = true;
      board.setArrows([]);
      if (!q.targets.length) { api.hit('Right: none.'); api.timer(next, 200); return; }
      var missed = q.targets.filter(function (s) { return !has(found, s); });
      board.setHighlights({ good: found, note: missed });
      api.miss((found.length ? 'Still there: ' : 'Missed: ') + listOf(missed) + '.');
      api.timer(next, 1400);
    }
    board.onSquare = function (s) {
      if (busy || has(found, s)) return;
      if (has(q.targets, s)) {
        found.push(s);
        board.setArrows([]);
        board.setHighlights({ good: found });
        tally.textContent = found.length + ' found';
        if (found.length === q.targets.length) { busy = true; api.hit(''); api.timer(next, 260); }
        return;
      }
      var why = o.why(q, s);
      if (why == null) return;
      board.flash(s, 'bad');
      board.setArrows(why.arrows || []);
      api.miss(why.text || why);
    };
    api.answers.appendChild(h('div.keyrow.wide', [h('button.key', { text: o.none + ' (N)', onclick: none })]));
    api.onKey(function (e) {
      if (e.key.toLowerCase() === 'n') { none(); return true; }
      return false;
    });
    next();
  }

  /* ---------- loose pieces ---------- */
  CL.addTrainer({ id: 'loose', group: 'vision', title: 'Loose pieces', timed: 60,
    desc: 'Click every piece that nothing defends, before your opponent notices it.',
    run: function (root, chapter, meta) {
      return CL.timedDrill(root, chapter, meta, {
        seconds: 60,
        intro: 'A position appears and a side is named. **Click every loose piece of that side**: a knight, bishop, rook or queen that no piece or pawn of its own colour defends. Pawns and kings do not count. If everything is defended, press **None are loose** (or the **N** key).\n\n' +
          'Loose pieces are what forks and double attacks feed on. Practise spotting them at a glance, for both sides, and half of all tactics announce themselves.',
        verdict: grade(12, 6,
          'Sharp eyes. Undefended pieces now jump out at you, which is where most tactics begin.',
          'Good going. Keep checking what defends each piece and the loose ones will start to stand out.',
          'A fair start. For each piece ask one question: if it were taken, could I take back?'),
        start: function (api) {
          clickAll(api, {
            make: spot.looseQuestion, none: 'None are loose',
            ask: function (q) { return 'Click every loose ' + chip(q.color) + ' piece.'; },
            why: function (q, s) {
              var p = q.game.get(s), by;
              if (!p) return null;
              if (p.color !== q.color) return 'That is a ' + sideName(p.color) + ' piece.';
              if (p.type === 'p' || p.type === 'k') return 'Pawns and kings do not count here.';
              by = q.game.attackers(s, q.color);
              return { text: 'Not loose: ' + s + ' is defended from ' + listOf(by) + '.',
                arrows: by.map(function (a) { return [a, s, 'blue']; }) };
            }
          });
        }
      });
    } });

  /* ---------- count the attackers ---------- */
  CL.addTrainer({ id: 'attackers', group: 'vision', title: 'Count the attackers', timed: 45,
    desc: 'One square is marked: count how many pieces of one colour bear on it.',
    run: function (root, chapter, meta) {
      return CL.timedDrill(root, chapter, meta, {
        seconds: 45,
        intro: 'One piece is marked. **Count how many pieces of the named colour attack its square**, pawns and the king included, and answer with the buttons or the number keys (**4** means four or more). When the marked piece is the same colour, the question says _defend_; the counting is the same.\n\n' +
          'Count only direct attackers: a piece waiting behind another on the same line does not count yet. Before any capture you need to know who has more pieces bearing on the square, and this makes the count quick.',
        verdict: grade(15, 8,
          'Fast and accurate. You can now trust your count before you capture.',
          'Solid counting. Look along every line and at every knight jump, and the speed will come.',
          'Take it steadily: pawns first, then knights, then the long lines of bishops, rooks and queens.'),
        start: function (api) {
          var board = new Board(api.boardHost, { coords: true }), pool = CL.positionPool(), q = null, busy = false;
          var row = h('div.keyrow.wide');
          ['0', '1', '2', '3', '4+'].forEach(function (t, i) {
            row.appendChild(h('button.key', { text: t, onclick: function () { answer(i); } }));
          });
          api.answers.appendChild(row);
          function next() {
            q = spot.attackQuestion(pool); busy = false;
            board.setPosition(q.game);
            board.setArrows([]);
            board.setHighlights({ note: [q.square] });
            ask(api, 'How many ' + chip(q.color) + ' pieces ' + (q.defend ? 'defend' : 'attack') + ' <span class="mv">' + q.square + '</span>?');
          }
          function answer(n) {
            if (busy) return;
            busy = true;
            var ok = n === Math.min(q.count, 4);
            var msg = q.count ? q.count + ': from ' + listOf(q.attackers) + '.' : 'None at all.';
            board.setArrows(q.attackers.map(function (a) { return [a, q.square, ok ? 'green' : 'red']; }));
            if (ok) api.hit(msg); else api.miss(msg);
            api.timer(next, ok ? 700 : 1300);
          }
          api.onKey(function (e) {
            if (/^[0-4]$/.test(e.key)) { answer(+e.key); return true; }
            return false;
          });
          next();
        }
      });
    } });

  /* ---------- pawn spotter ---------- */
  CL.addTrainer({ id: 'pawnspot', group: 'pawns', title: 'Pawn spotter', timed: 60,
    desc: 'Pick out the passed, isolated, doubled and backward pawns in real positions.',
    run: function (root, chapter, meta) {
      return CL.timedDrill(root, chapter, meta, {
        seconds: 60,
        intro: 'A side and a kind of pawn are named. **Click every pawn of that kind**, or press **None** (the **N** key) if there are none.\n\n' +
          '- **Passed**: no enemy pawn ahead of it on its own file or on the files either side.\n' +
          '- **Isolated**: no friendly pawn on either neighbouring file.\n' +
          '- **Doubled**: two or more friendly pawns on one file. Click them all.\n' +
          '- **Backward**: it has neighbours, but they have all gone ahead of it, and an enemy pawn guards the square in front of it.\n\n' +
          'Pawns decide where the pieces belong. Reading the pawn structure quickly is the first step of every plan.',
        verdict: grade(12, 6,
          'Excellent. You read a pawn structure the way you read a sentence.',
          'Coming along well. Backward pawns are the hard ones, so check the square in front of each.',
          'Keep at it. Go file by file and ask what stands beside each pawn and what stands ahead of it.'),
        start: function (api) {
          clickAll(api, {
            make: spot.pawnQuestion, none: 'None',
            ask: function (q) { return 'Click every <span class="mv">' + q.cat + '</span> ' + chip(q.color) + ' pawn.'; },
            why: function (q, s) {
              var p = q.game.get(s);
              if (!p) return null;
              if (p.type !== 'p' || p.color !== q.color) return 'Look at ' + sideName(q.color) + '’s pawns only.';
              return spot.pawnWhyNot(q.game, s, q.cat);
            }
          });
        }
      });
    } });

  /* ---------- find the outpost ---------- */
  CL.addTrainer({ id: 'outpost', group: 'strategy', title: 'Find the outpost', timed: 60,
    desc: 'Click the squares where a piece can settle and no pawn can ever chase it away.',
    run: function (root, chapter, meta) {
      return CL.timedDrill(root, chapter, meta, {
        seconds: 60,
        intro: 'A side is named. **Click every outpost square for that side**, or press **None** (the **N** key).\n\n' +
          'An outpost is a square in the enemy half (ranks 5 and 6 for White, 4 and 3 for Black) that one of your pawns defends and that no enemy pawn can ever attack. It may be empty or hold one of your own pieces, but not a pawn or an enemy piece.\n\n' +
          'A knight on an outpost cannot be driven off by pawns. Finding these squares tells you where your pieces want to go.',
        verdict: grade(10, 5,
          'Superb. You see the holes in a position as clearly as the pieces.',
          'Good work. Check the neighbouring files all the way back for a pawn that could still advance.',
          'A start. First find the squares your pawns defend, then ask whether an enemy pawn could ever hit them.'),
        start: function (api) {
          clickAll(api, {
            make: spot.outpostQuestion, none: 'None',
            ask: function (q) { return 'Click every outpost square for ' + chip(q.color) + '.'; },
            why: function (q, s) { return spot.outpostFlaw(q.game, q.color, s); }
          });
        }
      });
    } });

  /* ---------- count the material ---------- */
  CL.addTrainer({ id: 'material', group: 'strategy', title: 'Count the material', timed: 45,
    desc: 'Say who is ahead and by how many points, at a glance.',
    run: function (root, chapter, meta) {
      return CL.timedDrill(root, chapter, meta, {
        seconds: 45,
        intro: 'A position appears. **Count the material and say who is ahead, and by how much**: pawn 1, knight 3, bishop 3, rook 5, queen 9. Use the buttons or the keys **1** to **4**.\n\n' +
          'You should know the count before every exchange and every sacrifice. The quick way is to cancel the pieces that match and count only what is left over.',
        verdict: grade(9, 5,
          'Quick and exact. You always know the score, so you can judge every exchange.',
          'Sound counting. Cancel matching pieces in pairs instead of adding up both armies.',
          'No hurry yet. Pair off queens, rooks, minor pieces and pawns, then count what is left.'),
        start: function (api) {
          var board = new Board(api.boardHost, { coords: true }), pool = CL.positionPool(), q = null, busy = false;
          var row = h('div.keyrow.wide');
          ask(api, 'Who is ahead on material, and by how much?',
            h('span.muted', { text: 'pawn 1 · knight 3 · bishop 3 · rook 5 · queen 9' }));
          api.answers.appendChild(row);
          function next() {
            q = spot.materialQuestion(pool); busy = false;
            board.setPosition(q.game);
            row.innerHTML = '';
            q.options.forEach(function (d, i) {
              row.appendChild(h('button.key', { text: spot.materialLabel(d), onclick: function () { answer(i); } }));
            });
          }
          function answer(i) {
            if (busy || i >= q.options.length) return;
            busy = true;
            var msg = 'White ' + q.w + ', Black ' + q.b + ': ' + spot.materialLabel(q.diff) + '.';
            if (q.options[i] === q.diff) api.hit(msg); else api.miss(msg);
            api.timer(next, 250);
          }
          api.onKey(function (e) {
            if (/^[1-4]$/.test(e.key)) { answer(+e.key - 1); return true; }
            return false;
          });
          next();
        }
      });
    } });

  /* ---------- rule of the square ---------- */
  CL.addTrainer({ id: 'square', group: 'pawns', title: 'Rule of the square', timed: 45,
    desc: 'A pawn runs, a king chases: judge the race without counting every move.',
    run: function (root, chapter, meta) {
      return CL.timedDrill(root, chapter, meta, {
        seconds: 45,
        intro: 'A lone pawn runs for promotion and the enemy king chases it. The pawn’s own king is too far away to matter. **Does the king catch the pawn?** Answer **Y** or **N**, and check whose move it is first.\n\n' +
          'Picture a square with one side running from the pawn to its promotion square. If the king is inside it, or can step inside on its move, the pawn is caught. A pawn on its starting square jumps two, so draw its square from one rank further on. The square is shown after each answer.',
        verdict: grade(14, 7,
          'Instant. You can judge a pawn race without counting a single move.',
          'Good. Remember to check whose move it is before you draw the square.',
          'Keep practising. Draw the square from the pawn to the far rank, then look for the king.'),
        start: function (api) {
          var board = new Board(api.boardHost, { coords: true }), q = null, busy = false;
          function next() {
            q = spot.raceQuestion(); busy = false;
            board.setPosition(q.fen);
            board.setHighlights({});
            ask(api, chip(q.turn) + ' to move. Does the ' + sideName(other(q.side)) + ' king catch the pawn?');
          }
          function answer(yes) {
            if (busy) return;
            busy = true;
            var ok = yes === q.caught, msg = spot.raceWhy(q);
            board.setHighlights({ info: q.square });
            if (ok) api.hit(msg); else api.miss(msg);
            api.timer(next, ok ? 900 : 1500);
          }
          api.answers.appendChild(h('div.keyrow.wide', [
            h('button.key', { text: 'Yes (Y)', onclick: function () { answer(true); } }),
            h('button.key', { text: 'No (N)', onclick: function () { answer(false); } })
          ]));
          api.onKey(function (e) {
            var k = e.key.toLowerCase();
            if (k === 'y') { answer(true); return true; }
            if (k === 'n') { answer(false); return true; }
            return false;
          });
          next();
        }
      });
    } });
})();
