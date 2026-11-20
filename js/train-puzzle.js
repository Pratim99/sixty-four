/* Sixty-Four — puzzle and opening trainers.
   Puzzle rush, rated puzzles, "opening: next move" and "name the opening".
   The rules they share (ratings, ordering, which opening positions are fair to ask) live on
   CL.puzzleLogic, with no DOM access, so tools/test-train-puzzle.js can check them under Node. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
  var TRAPS = ['scholars', 'elephant', 'noahs'];
  var SVGNS = 'http://www.w3.org/2000/svg';

  function strip(s) { return String(s).replace(/[+#!?]/g, ''); }
  function sideName(c) { return c === 'w' ? 'White' : 'Black'; }
  function signed(n) { return (n < 0 ? '−' : '+') + Math.abs(n); }

  /* ================= the rules (no DOM) ================= */

  var L = CL.puzzleLogic = {};

  /* A stable 32-bit number from a string (FNV-1a, then a final stir so similar ids land far apart). */
  L.hash = function (str) {
    var x = 2166136261, i;
    for (i = 0; i < str.length; i++) {
      x ^= str.charCodeAt(i);
      x = (x + (x << 1) + (x << 4) + (x << 7) + (x << 8) + (x << 24)) >>> 0;
    }
    x ^= x >>> 15;
    x = (x + (x << 3)) >>> 0;
    x ^= x >>> 11;
    return x >>> 0;
  };

  function shuffled(arr, rnd) {
    var a = arr.slice(), i, j, t;
    rnd = rnd || Math.random;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(rnd() * (i + 1)); t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- puzzle ratings ---------- */

  /* The rating range a bank puzzle falls in, from its theme and level: [low, high]. */
  L.band = function (p) {
    var lv = p.level || 1;
    if (p.theme === 'Mate in 1') return [550, 900];
    if (p.theme === 'Loose piece') return [650, 1000];
    if (p.theme === 'Mate in 2') return [1150, 1550];
    if (p.theme === 'Win material') return lv >= 3 ? [1250, 1600] : [950, 1300];
    return lv >= 3 ? [1250, 1600] : (lv === 2 ? [950, 1300] : [650, 1000]);
  };

  /* A puzzle's fixed rating: a spot in its band chosen by its id, in steps of five. */
  L.rate = function (p) {
    var b = L.band(p), steps = Math.floor((b[1] - b[0]) / 5) + 1;
    return b[0] + 5 * (L.hash(String(p.id)) % steps);
  };

  /* Elo: the chance (0..1) that a player of this rating solves a puzzle of that rating. */
  L.expected = function (player, puzzle) { return 1 / (1 + Math.pow(10, (puzzle - player) / 400)); };

  /* The rating change for one result. It is never zero, so every result shows. */
  L.eloChange = function (player, puzzle, won, k) {
    var e = L.expected(player, puzzle);
    k = k || 32;
    return won ? Math.max(1, Math.round(k * (1 - e))) : -Math.max(1, Math.round(k * e));
  };

  /* The rating after a result, kept inside sensible limits. */
  L.eloNext = function (player, puzzle, won, k) {
    return Math.max(100, Math.min(3000, player + L.eloChange(player, puzzle, won, k)));
  };

  /* Choose a puzzle close to the player's rating, skipping ids in `recent`. list: [{ id, rating }].
     Starts within 150 points and widens until something turns up. */
  L.pickRated = function (list, rating, recent, rnd) {
    var pool = [], span;
    recent = recent || [];
    rnd = rnd || Math.random;
    function fresh(p) { return recent.indexOf(p.id) < 0; }
    for (span = 150; span <= 2950 && !pool.length; span += 100) {
      pool = list.filter(function (p) { return fresh(p) && Math.abs(p.rating - rating) <= span; });
    }
    if (!pool.length) pool = list.filter(fresh);
    if (!pool.length) pool = list;
    return pool.length ? pool[Math.floor(rnd() * pool.length)] : null;
  };

  /* Where to draw a sparkline: [[x, y], ...] inside a w-by-hgt box. Small wobbles stay small. */
  L.sparkPoints = function (values, w, hgt, pad) {
    var lo = Math.min.apply(null, values), hi = Math.max.apply(null, values);
    var span = Math.max(hi - lo, 40), mid = (hi + lo) / 2, n = values.length;
    return values.map(function (v, i) {
      return [pad + (n > 1 ? i / (n - 1) : 1) * (w - 2 * pad), hgt / 2 - (v - mid) / span * (hgt - 2 * pad)];
    });
  };

  /* ---------- puzzle rush ---------- */

  /* Bank puzzles plus the course puzzles, in one shape: { id, fen, solution, level }. */
  L.rushPool = function () {
    var out = [];
    (CL.puzzleBank || []).forEach(function (p) {
      out.push({ id: p.id, fen: p.fen, solution: p.solution, level: p.level || 1 });
    });
    CL.collectPuzzles(['mates', 'tactics']).forEach(function (c, i) {
      var st = c.step, n = st.solution.length, mate = !st.tactic && /#$/.test(st.solution[n - 1]), fen;
      try { fen = CL.resolve(st).fen(); } catch (e) { return; }
      out.push({ id: c.chapter.id + '/' + c.lesson.id + '/' + i, fen: fen, solution: st.solution,
        level: mate ? (n > 1 ? 2 : 1) : (n >= 5 ? 3 : 2) });
    });
    return out;
  };

  /* How hard a rush puzzle is: its level first, then the length of its solution. */
  L.rushDifficulty = function (p) { return (p.level || 1) * 10 + Math.min(p.solution.length, 9); };

  function tiers(list, rnd) {
    var by = {}, keys = [];
    list.forEach(function (p) {
      var d = L.rushDifficulty(p);
      if (!by[d]) { by[d] = []; keys.push(d); }
      by[d].push(p);
    });
    keys.sort(function (a, b) { return a - b; });
    return keys.map(function (d) { return shuffled(by[d], rnd); });
  }

  /* Every puzzle, easiest first, shuffled among equals. */
  L.rushOrder = function (list, rnd) {
    return tiers(list, rnd).reduce(function (all, t) { return all.concat(t); }, []);
  };

  /* One run's worth: a few from the easiest group, more from each harder one, all of the hardest,
     so the run climbs instead of spending its three minutes on mates in one. */
  L.rushDeck = function (list, rnd, caps) {
    caps = caps || [6, 9, 14];
    return tiers(list, rnd).reduce(function (all, t, i) {
      return all.concat(i < caps.length ? t.slice(0, caps[i]) : t);
    }, []);
  };

  /* ---------- openings ---------- */

  /* The opening lines without the three traps. */
  L.bookLines = function () {
    var op = CL.content.openings;
    return ((op && op.lines) || []).filter(function (l) { return TRAPS.indexOf(l.id) < 0; });
  };

  /* For each line, the first ply (number of moves played) at which its moves differ from every
     other line's. null if the line never separates from another. */
  L.distinctPlies = function (lines) {
    var out = {};
    lines.forEach(function (a) {
      var need = 1, ok = true;
      lines.forEach(function (b) {
        var i = 0;
        if (b === a) return;
        while (i < a.moves.length && i < b.moves.length && strip(a.moves[i][0]) === strip(b.moves[i][0])) i++;
        if (i >= a.moves.length) ok = false;
        else need = Math.max(need, i + 1);
      });
      out[a.id] = ok ? need : null;
    });
    return out;
  };

  /* Play a line through: fens[n] is the position after n plies, moves[n] the move played from it. */
  L.walk = function (line) {
    var g = new Chess(), fens = [g.fen()], moves = [];
    line.moves.forEach(function (m) {
      var mv = g.move(m[0]);
      if (!mv) throw new Error('Illegal move "' + m[0] + '" in opening line ' + line.id);
      moves.push(mv);
      fens.push(g.fen());
    });
    return { fens: fens, moves: moves };
  };

  /* Two positions are the same if the pieces, the side to move and the castling rights match. */
  L.posKey = function (fen) { return fen.split(' ').slice(0, 3).join(' '); };

  /* "Name the opening" questions: [{ line, ply, fen, last }]. Only positions at or after the line's
     distinguishing ply, and never one that another line also reaches by a different move order. */
  L.nameQuestions = function (lines) {
    var first = L.distinctPlies(lines), walks = {}, seen = {}, out = [];
    lines.forEach(function (l) {
      var w = walks[l.id] = L.walk(l), mine = {};
      w.fens.forEach(function (f) { mine[L.posKey(f)] = 1; });
      Object.keys(mine).forEach(function (k) { seen[k] = (seen[k] || 0) + 1; });
    });
    lines.forEach(function (l) {
      var w = walks[l.id], n;
      if (first[l.id] == null) return;
      for (n = first[l.id]; n < w.fens.length; n++) {
        if (seen[L.posKey(w.fens[n])] === 1) out.push({ line: l, ply: n, fen: w.fens[n], last: w.moves[n - 1] });
      }
    });
    return out;
  };

  /* "Next move" questions: [{ line, ply, fen, move, why, prev }], from two plies in to the last move. */
  L.moveQuestions = function (lines) {
    var out = [];
    lines.forEach(function (l) {
      var w = L.walk(l), n;
      for (n = 2; n < w.moves.length; n++) {
        out.push({ line: l, ply: n, fen: w.fens[n], move: w.moves[n], why: l.moves[n][1] || '', prev: w.moves[n - 1] });
      }
    });
    return out;
  };

  /* Four lines to choose a name from: the right one, its closest relative, and two others. */
  L.nameChoices = function (line, lines, rnd) {
    var others = shuffled(lines.filter(function (l) { return l !== line; }), rnd);
    function shared(l) {
      var i = 0;
      while (i < l.moves.length && i < line.moves.length && strip(l.moves[i][0]) === strip(line.moves[i][0])) i++;
      return i;
    }
    var near = others.slice().sort(function (a, b) { return shared(b) - shared(a); })[0];
    var rest = others.filter(function (l) { return l !== near; }).slice(0, 2);
    return shuffled([line].concat(near ? [near] : [], rest), rnd);
  };

  /* How often a line should come up: its share of wrong answers (smoothed), never less than a floor.
     stat is [right, wrong]. */
  L.lineWeight = function (stat) {
    var r = stat ? stat[0] : 0, w = stat ? stat[1] : 0;
    return 0.1 + (w + 1) / (r + w + 2);
  };

  L.pickWeighted = function (items, weights, rnd) {
    var total = 0, i, x;
    for (i = 0; i < items.length; i++) total += weights[i];
    x = (rnd || Math.random)() * total;
    for (i = 0; i < items.length; i++) {
      x -= weights[i];
      if (x < 0) return items[i];
    }
    return items[items.length - 1];
  };

  /* Pick a line to ask about, leaning towards the ones missed most. stats: { lineId: [right, wrong] }. */
  L.chooseLine = function (lines, stats, rnd, avoidId) {
    var pool = lines.filter(function (l) { return l.id !== avoidId; });
    if (!pool.length) pool = lines;
    return L.pickWeighted(pool, pool.map(function (l) { return L.lineWeight(stats && stats[l.id]); }), rnd);
  };

  /* Count an answer. Old results fade: past 24 answers on a line, both counts are halved. */
  L.record = function (stats, id, ok) {
    var s = stats[id] || (stats[id] = [0, 0]);
    s[ok ? 0 : 1]++;
    if (s[0] + s[1] > 24) { s[0] = Math.round(s[0] / 2); s[1] = Math.round(s[1] / 2); }
    return stats;
  };

  /* ================= shared page pieces ================= */

  function head(chapter, meta) {
    return h('header.page-head', [
      h('a.crumb', { href: '#/' + chapter.id }, '← ' + chapter.title),
      h('h1', { text: meta.title })
    ]);
  }

  /* The untimed layout: board on the left, a panel on the right. */
  function page(root, chapter, meta) {
    var boardHost = h('div.board-host'), cap = h('div.board-caption'), panel = h('div.panel');
    root.appendChild(h('div.lesson', [head(chapter, meta), h('div.lesson-body', [h('div.board-col', [boardHost, cap]), panel])]));
    return { board: new Board(boardHost), cap: cap, panel: panel };
  }

  function typing(e) { return e.target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName); }

  /* One puzzle on a board: a lean version of the lesson player's puzzle step.
     cb.wrong(move) — a wrong move is on the board; call takeBack() to remove it.
     cb.step(move)  — a right move, with more to come (the reply is played after `pause` ms).
     cb.solved()    — the last move of the solution is on the board. */
  function playPuzzle(board, puz, later, cb, pause) {
    var game = new Chess(puz.fen), sol = puz.solution, me = game.turn;
    var ply = 0, busy = false, over = false, last = null;
    board.setOrientation(me);
    board.setPosition(game);
    board.setLast(null);
    board.setHighlights({});
    board.setArrows([]);

    function expected() {
      var want = strip(sol[ply]), list = game.moves();
      for (var i = 0; i < list.length; i++) if (strip(list[i].san) === want) return list[i];
      return null;
    }
    function put(mv) {
      board.setPosition(game, { animate: { from: mv.from, to: mv.to } });
      last = [mv.from, mv.to];
      board.setLast(last);
    }
    function reply() {
      if (over) return;
      put(game.move(sol[ply]));
      ply++;
      busy = false;
      if (ply >= sol.length) { over = true; cb.solved(); }
    }

    board.movable = function (s) {
      if (busy || over || game.turn !== me) return null;
      var p = game.get(s);
      if (!p || p.color !== me) return null;
      return game.moves({ square: s }).map(function (m) { return m.to; });
    };
    board.onMove = function (from, to, info) {
      var want = sol[ply], pm = /=([QRBN])/.exec(want);
      var mv = game.move({ from: from, to: to, promotion: pm ? pm[1].toLowerCase() : 'q' });
      if (!mv) { board.setPosition(game); return; }
      board.setPosition(game, info.dragged ? null : { animate: { from: from, to: to } });
      board.setLast([from, to]);
      board.setArrows([]);
      busy = true;
      // any mate will do when the solution move is a mate
      if (strip(mv.san) !== strip(want) && !(/#$/.test(want) && game.isCheckmate())) { cb.wrong(mv); return; }
      last = [from, to];
      ply++;
      if (ply >= sol.length) { over = true; cb.solved(); return; }
      if (cb.step) cb.step(mv);
      later(reply, pause || 500);
    };

    return {
      side: me,
      expected: expected,
      /* Remove a wrong move. resume: let the player try again. */
      takeBack: function (resume) {
        if (over) return;
        game.undo();
        board.setPosition(game);
        board.setLast(last);
        board.shake();
        busy = !resume;
      },
      /* Play out the rest of the solution, then call done. Returns false while a move is in the air. */
      reveal: function (done) {
        if (busy || over) return false;
        busy = true;
        (function stepOn() {
          if (over) return;
          if (ply >= sol.length) { over = true; done(); return; }
          put(game.move(sol[ply]));
          ply++;
          later(stepOn, 750);
        })();
        return true;
      },
      stop: function () { over = true; }
    };
  }

  /* ================= puzzle rush ================= */

  function clock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
  }

  function rush(root, chapter, meta) {
    var storeId = 'train/drill/' + meta.id;
    var body = h('div.drill-body'), tick = null, timers = [];
    var minutes = +CL.store.pref('rushMinutes', 3) === 5 ? 5 : 3;
    root.appendChild(h('div.drill', [head(chapter, meta), body]));

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clear() {
      clearInterval(tick); tick = null;
      timers.forEach(clearTimeout); timers = [];
      body.innerHTML = '';
    }

    function intro() {
      clear();
      var best = CL.store.best(storeId);
      var go = h('button.btn.primary.big', { onclick: run });
      function label() { go.textContent = 'Start — ' + minutes + ' minutes'; }
      label();
      body.appendChild(h('div.card.drill-intro', [
        h('div.prose', { html: CL.fmt('Solve as many puzzles as you can before the clock runs out. They start easy and get harder.\n\n' +
          'A wrong move is a **strike**: you are shown the right move and that puzzle is gone. **Three strikes** end the run. ' +
          'Some puzzles need more than one move; the replies are played for you.') }),
        h('div.opt-row', [h('span.opt-label', { text: 'Time' }),
          CL.seg([{ v: 3, label: '3 minutes' }, { v: 5, label: '5 minutes' }], minutes, function (v) {
            minutes = v; CL.store.setPref('rushMinutes', v); label();
          })]),
        h('div.step-nav', [h('span.muted', { text: best ? 'Your best: ' + best : 'No score yet' }), go])
      ]));
    }

    function run() {
      clear();
      var deck = L.rushDeck(L.rushPool(), Math.random), at = -1, score = 0, strikes = 0, over = false, play = null;
      var total = minutes * 60000, endAt = Date.now() + total;
      var bar = h('i'), time = h('span.hud-time', { text: clock(total) }), points = h('span.hud-score', { text: '0' });
      var marks = h('span.strikes'), status = h('div.status'), count = h('span.muted'), note = h('div.drill-note');
      var boardHost = h('div.board-host');
      body.appendChild(h('div.drill-run', [
        h('div.hud', [
          h('div.timebar', [bar]),
          h('div.hud-row', [h('span', [time, ' left']), h('span', ['solved ', points]), marks,
            h('button.btn.small.ghost', { text: 'Stop', onclick: function () { end('Stopped'); } })])
        ]),
        h('div.drill-stage', [h('div.drill-side.rush-side', [h('div.drill-prompt', [count, status]), note]), h('div.board-col', [boardHost])])
      ]));
      var board = new Board(boardHost, { coords: true });

      function say(msg, kind) { note.className = 'drill-note ' + (kind || ''); note.innerHTML = msg ? CL.inline(msg) : ''; }
      function paintStrikes() {
        marks.innerHTML = '';
        marks.setAttribute('aria-label', strikes + ' of 3 strikes');
        for (var i = 0; i < 3; i++) marks.appendChild(h('span.strike' + (i < strikes ? '.on' : ''), { text: i < strikes ? '✕' : '' }));
      }
      function next() {
        if (over) return;
        at++;
        if (at >= deck.length) return end('Every puzzle solved');
        play = playPuzzle(board, deck[at], later, {
          wrong: function (mv) {
            strikes++;
            paintStrikes();
            board.flash(mv.to, 'bad');
            later(function () {
              play.takeBack(false);
              var m = play.expected();
              if (m) { board.setArrows([[m.from, m.to, 'green']]); say('Strike. The move was `' + m.san + '`.', 'bad'); }
            }, 350);
            later(function () { if (strikes >= 3) end('Three strikes'); else next(); }, 1700);
          },
          solved: function () {
            score++;
            points.textContent = score;
            say('Solved.', 'good');
            later(next, 450);
          }
        }, 400);
        count.textContent = 'Puzzle ' + (at + 1);
        status.textContent = sideName(play.side) + ' to move';
      }
      function end(why) {
        if (over) return;
        over = true;
        if (play) play.stop();
        clear();
        var isBest = CL.store.setBest(storeId, score);
        CL.activity.log(storeId, score);
        body.appendChild(h('div.card.drill-end', [
          h('div.kicker', { text: why }),
          h('div.big-score', { text: score }),
          h('p.muted', { text: (score === 1 ? '1 puzzle solved' : score + ' puzzles solved') + ' · ' +
            (strikes === 1 ? '1 strike' : strikes + ' strikes') + ' · ' + (isBest ? 'a new best!' : 'best ' + CL.store.best(storeId)) }),
          h('p', { text: score >= 20 ? 'Quick and sure. The patterns are doing the work for you.'
            : (score >= 10 ? 'A good run. To go further, look at every check and capture before you move.'
              : 'Three strikes end a run long before the clock does. Go for accuracy first; speed follows.') }),
          h('div.step-nav', [
            h('a.btn.ghost', { href: '#/' + chapter.id }, 'Back to ' + chapter.title),
            h('button.btn.primary', { text: 'Go again', onclick: run })
          ])
        ]));
      }

      tick = setInterval(function () {
        var left = endAt - Date.now();
        bar.style.width = Math.max(0, left / total * 100) + '%';
        time.textContent = clock(left);
        if (left <= 0) end('Time');
      }, 100);
      paintStrikes();
      next();
    }

    intro();
    return clear;
  }

  /* ================= rated puzzles ================= */

  function sparkline(values) {
    var W = 120, H = 36, svg = document.createElementNS(SVGNS, 'svg');
    var pts = L.sparkPoints(values, W, H, 4), end = pts[pts.length - 1];
    svg.setAttribute('class', 'spark');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Your rating over the last ' + (values.length - 1) + ' puzzles: ' + values[0] + ' to ' + values[values.length - 1]);
    var line = document.createElementNS(SVGNS, 'polyline');
    line.setAttribute('points', pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '));
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', 2);
    line.setAttribute('stroke-linejoin', 'round');
    line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
    var dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('cx', end[0].toFixed(1));
    dot.setAttribute('cy', end[1].toFixed(1));
    dot.setAttribute('r', 3);
    dot.setAttribute('fill', 'currentColor');
    svg.appendChild(dot);
    return svg;
  }

  function rated(root, chapter, meta) {
    var storeId = 'train/drill/' + meta.id;
    var ui = page(root, chapter, meta), board = ui.board, timers = [];
    var list = (CL.puzzleBank || []).map(function (p) { return { id: p.id, rating: L.rate(p), puzzle: p }; });
    var rating = Math.round(+CL.store.pref('puzzleRating', 800)) || 800;
    var saved = CL.store.pref('puzzleLog', []);
    var log = (Array.isArray(saved) ? saved : []).filter(function (r) {
      return r && typeof r.r === 'number' && typeof r.d === 'number';
    }).slice(-30);
    var cur = null, play = null, scored = false, finished = false, change = 0, seen = 0;

    var num = h('span.elo-num'), sub = h('span'), delta = h('span.rating-delta'), sparkHost = h('span.spark-host');
    var status = h('div.status'), fb = h('div.feedback', { hidden: true });
    var bShow = h('button.btn.small', { text: 'Show me', onclick: reveal });
    var bNext = h('button.btn.primary', { text: 'Next puzzle →', hidden: true, onclick: next });
    ui.panel.appendChild(h('div.kicker', { text: 'Rated puzzles' }));
    ui.panel.appendChild(h('div.elo-box', [num, h('div.elo-text', [h('b', ['Your puzzle rating', delta]), sub]), sparkHost]));
    ui.panel.appendChild(status);
    ui.panel.appendChild(h('div.prose', { html: CL.fmt('Find the best move. Only your **first try** at each puzzle counts, so look before you move. ' +
      'Solve it and your rating goes up; miss, or ask to be shown, and it goes down.') }));
    ui.panel.appendChild(fb);
    ui.panel.appendChild(h('div.step-nav', [h('div.tools', [bShow]), bNext]));

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function say(msg, kind) { fb.className = 'feedback ' + (kind || ''); fb.innerHTML = msg ? CL.fmt(msg) : ''; fb.hidden = !msg; }
    function paint(showChange) {
      var wins = log.filter(function (r) { return r.ok; }).length;
      num.textContent = rating;
      delta.textContent = showChange ? signed(change) : '';
      delta.className = 'rating-delta ' + (change < 0 ? 'down' : 'up');
      sub.textContent = log.length
        ? 'Peak ' + Math.max(rating, CL.store.best(storeId)) + ' · ' + wins + ' of the last ' + log.length + ' solved first try'
        : 'Everyone starts at 800.';
      sparkHost.innerHTML = '';
      if (log.length) sparkHost.appendChild(sparkline([log[0].r - log[0].d].concat(log.map(function (r) { return r.r; }))));
    }

    /* The one rating change this puzzle is allowed. */
    function score(won) {
      var before = rating, n;
      scored = true;
      rating = L.eloNext(rating, cur.rating, won);
      change = rating - before;
      log.push({ id: cur.id, ok: won ? 1 : 0, d: change, r: rating });
      while (log.length > 30) log.shift();
      CL.store.setPref('puzzleRating', rating);
      CL.store.setPref('puzzleLog', log);
      CL.store.setBest(storeId, rating);
      n = (+CL.store.pref('puzzleCount', 0) || 0) + 1;
      CL.store.setPref('puzzleCount', n);
      if (n % 5 === 0) CL.activity.log(storeId, rating);
      paint(true);
    }

    function next() {
      timers.forEach(clearTimeout); timers = [];
      if (play) play.stop();
      cur = L.pickRated(list, rating, log.map(function (r) { return r.id; }), Math.random);
      scored = false; finished = false; change = 0; seen++;
      bNext.hidden = true; bShow.hidden = false;
      say('');
      paint(false);
      play = playPuzzle(board, cur.puzzle, later, {
        wrong: function (mv) {
          var first = !scored;
          if (first) score(false);
          board.flash(mv.to, 'bad');
          say('`' + mv.san + '` is not the move' + (first ? ': **' + signed(change) + '**' : '') + '. ' +
            'Try again, or press **Show me**. Your rating will not move again on this puzzle.', 'bad');
          later(function () { play.takeBack(true); }, 700);
        },
        step: function (mv) { say('`' + mv.san + '` — yes. Keep going…', 'good'); },
        solved: function () { finish(false); }
      }, 600);
      status.textContent = sideName(play.side) + ' to move';
      ui.cap.textContent = 'Puzzle ' + seen + ' this visit';
    }

    function finish(shown) {
      var clean = !scored, p = cur.puzzle, lead;
      if (clean) score(!shown);
      finished = true;
      bShow.hidden = true; bNext.hidden = false;
      if (!shown) CL.store.markDone('puz/' + cur.id);
      if (shown) lead = '**The solution:** `' + p.solution.join(' ') + '`' + (clean ? ' (**' + signed(change) + '**).' : '.');
      else if (clean) lead = '**Solved first try: ' + signed(change) + '.**';
      else lead = '**Solved**, but the first try was a miss (' + signed(change) + ').';
      say(lead + ' This puzzle is rated **' + cur.rating + '**. Theme: ' + p.theme.toLowerCase() + '.' +
        (p.line ? ' The engine’s main line: ' + p.line + '.' : ''), shown ? 'hint' : 'good');
      ui.cap.textContent = p.theme + ' · rated ' + cur.rating;
    }

    function reveal() {
      if (finished || !play) return;
      if (play.reveal(function () { finish(true); })) bShow.hidden = true;
    }

    function onKey(e) {
      if (typing(e) || !finished) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
    }

    if (!list.length) {
      paint(false);
      bShow.hidden = true;
      say('The puzzle bank is empty, so there is nothing to rate yet.', 'hint');
      return function () {};
    }
    document.addEventListener('keydown', onKey);
    next();
    return function () {
      timers.forEach(clearTimeout); timers = [];
      if (play) play.stop();
      document.removeEventListener('keydown', onKey);
    };
  }

  /* ================= opening: next move ================= */

  function nextMove(root, chapter, meta) {
    var storeId = 'train/drill/' + meta.id;
    var ui = page(root, chapter, meta), board = ui.board, timers = [];
    var lines = L.bookLines(), byLine = {}, also = {};
    var saved = CL.store.pref('openingStats', null) || {};
    var stats = { n: +saved.n || 0, lines: saved.lines || {} };
    var q = null, game = null, lastId = null, streak = 0, longest = 0, slips = 0, busy = false, waiting = false;

    L.moveQuestions(lines).forEach(function (m) { (byLine[m.line.id] = byLine[m.line.id] || []).push(m); });
    // every book move from every position (traps included), to recognise "right move, wrong opening"
    ((CL.content.openings && CL.content.openings.lines) || []).forEach(function (l) {
      var w;
      try { w = L.walk(l); } catch (e) { return; }
      w.moves.forEach(function (mv, n) {
        var k = L.posKey(w.fens[n]);
        (also[k] = also[k] || []).push({ line: l, san: mv.san });
      });
    });

    var name = h('h2'), ask = h('div.play-this'), list = h('div.movelist'), fb = h('div.feedback', { hidden: true }), stat = h('div.streak');
    var bNext = h('button.btn.primary', { text: 'Next question →', hidden: true, onclick: question });
    ui.panel.appendChild(h('div.kicker', { text: 'Which move comes next?' }));
    ui.panel.appendChild(name);
    ui.panel.appendChild(h('div.prose', { html: CL.fmt('The opening is named and its first moves are on the board. **Play the next book move.** ' +
      'Openings you miss come round more often.') }));
    ui.panel.appendChild(h('div.step-ui', [ask, list]));
    ui.panel.appendChild(fb);
    ui.panel.appendChild(h('div.step-nav', [stat, bNext]));

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function say(msg, kind) { fb.className = 'feedback ' + (kind || ''); fb.innerHTML = msg ? CL.fmt(msg) : ''; fb.hidden = !msg; }
    function paint() {
      stat.innerHTML = 'Streak <b>' + streak + '</b> · best <b>' + Math.max(streak, CL.store.best(storeId)) + '</b>' +
        (slips ? ' · ' + slips + (slips === 1 ? ' slip' : ' slips') : '');
    }
    function score(upto) {
      var sans = q.sans;
      list.innerHTML = '';
      for (var i = 0; i < upto; i++) {
        if (i % 2 === 0) list.appendChild(h('span.mnum', { text: (i / 2 + 1) + '.' }));
        list.appendChild(h('span.mbtn.static', { text: sans[i] }));
      }
    }

    function question() {
      timers.forEach(clearTimeout); timers = [];
      var line = L.chooseLine(lines, stats.lines, Math.random, lastId), pool = byLine[line.id], pick;
      do { pick = CL.pick(pool); } while (pool.length > 1 && q && pick === q.item);
      lastId = line.id;
      q = { item: pick, line: line, want: pick.move, sans: L.walk(line).moves.map(function (m) { return m.san; }) };
      game = new Chess(pick.fen);
      busy = false; waiting = false;
      board.setOrientation(game.turn);
      board.setPosition(game);
      board.setHighlights({});
      board.setArrows([]);
      board.setLast([pick.prev.from, pick.prev.to]);
      name.textContent = line.name;
      ask.innerHTML = '<span class="muted">' + sideName(game.turn) + ' to play</span><span class="mv huge">' +
        Math.floor(pick.ply / 2 + 1) + (game.turn === 'w' ? '. ?' : '… ?') + '</span>';
      score(pick.ply);
      ui.cap.textContent = line.name + ' · ' + sideName(game.turn) + ' to move';
      say('');
      bNext.hidden = true;
      paint();
    }

    function answered(ok) {
      L.record(stats.lines, q.line.id, ok);
      stats.n++;
      CL.store.setPref('openingStats', stats);
      if (ok) { streak++; longest = Math.max(longest, streak); CL.store.setBest(storeId, streak); }
      else { streak = 0; slips++; }
      if (stats.n % 10 === 0) CL.activity.log(storeId, longest);
      waiting = true;
      bNext.hidden = false;
      paint();
    }

    board.movable = function (s) {
      if (busy || !q) return null;
      var p = game.get(s);
      if (!p || p.color !== game.turn) return null;
      return game.moves({ square: s }).map(function (m) { return m.to; });
    };
    board.onMove = function (from, to, info) {
      var want = q.want, why = q.item.why || Chess.describe(want) + '.', other = null;
      var mv = game.move({ from: from, to: to });
      if (!mv) { board.setPosition(game); return; }
      board.setPosition(game, info.dragged ? null : { animate: { from: from, to: to } });
      busy = true;
      if (strip(mv.san) === strip(want.san)) {
        board.setLast([from, to]);
        board.flash(to, 'good');
        score(q.item.ply + 1);
        say('`' + mv.san + '` — ' + why, 'good');
        answered(true);
        later(question, Math.min(3600, 1100 + 30 * why.length));
        return;
      }
      (also[L.posKey(q.item.fen)] || []).forEach(function (o) {
        if (!other && o.line !== q.line && strip(o.san) === strip(mv.san)) other = o.line;
      });
      board.setLast([from, to]);
      board.flash(to, 'bad');
      say((other ? '`' + mv.san + '` is a book move, but it belongs to a different opening: **' + other.name + '**. '
        : '`' + mv.san + '` is not the book move. ') +
        'The ' + q.line.name + ' continues `' + want.san + '`. ' + why, 'bad');
      answered(false);
      later(function () {
        game.undo();
        board.setPosition(game);
        board.setLast([q.item.prev.from, q.item.prev.to]);
        board.setArrows([[want.from, want.to, 'green']]);
        board.shake();
      }, 600);
    };

    function onKey(e) {
      if (typing(e) || !waiting) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); question(); }
    }

    if (!lines.length) {
      say('There are no opening lines to ask about.', 'hint');
      return function () {};
    }
    document.addEventListener('keydown', onKey);
    question();
    return function () {
      timers.forEach(clearTimeout); timers = [];
      document.removeEventListener('keydown', onKey);
    };
  }

  /* ================= name the opening ================= */

  function nameIt(root, chapter, meta) {
    var lines = L.bookLines(), byLine = {};
    L.nameQuestions(lines).forEach(function (n) { (byLine[n.line.id] = byLine[n.line.id] || []).push(n); });
    var askable = lines.filter(function (l) { return byLine[l.id]; });

    return CL.timedDrill(root, chapter, meta, {
      seconds: 45,
      intro: 'A position from one of the main openings appears. **Pick its name** from the four choices, or press **1** to **4**.\n\n' +
        'Look at the pawns first: where the centre pawns stand usually gives the opening away.',
      verdict: function (n) {
        if (n >= 18) return 'You know these on sight. That is what lets you find your way when a game leaves the book.';
        if (n >= 9) return 'Solid. The pairs that share their first moves are the ones to study side by side.';
        return 'Play through a few lines in Part 3, then come back. The names stick once the moves mean something.';
      },
      start: function (api) {
        var board = new Board(api.boardHost, { coords: true }), box = h('div.choices'), q = null, opts = [];
        var side = h('span.muted');
        api.prompt.appendChild(h('div.status', { text: 'Which opening is this?' }));
        api.prompt.appendChild(side);
        api.answers.appendChild(box);

        function next() {
          var line;
          do { line = CL.pick(askable); } while (askable.length > 1 && q && line === q.line);
          q = CL.pick(byLine[line.id]);
          opts = L.nameChoices(line, askable, Math.random);
          board.setPosition(q.fen);
          board.setLast([q.last.from, q.last.to]);
          side.textContent = sideName(q.fen.split(' ')[1]) + ' to move';
          box.innerHTML = '';
          opts.forEach(function (o, i) {
            box.appendChild(h('button.choice', { type: 'button', onclick: function () { answer(i); } },
              [h('span.mv', { text: i + 1 }), ' ' + o.name]));
          });
        }
        function answer(i) {
          if (!q || !opts[i]) return;
          if (opts[i] === q.line) api.hit('Yes: the ' + q.line.name + '.');
          else api.miss('No, that was the ' + q.line.name + '.');
          next();
        }
        api.onKey(function (e) {
          if (!/^[1-4]$/.test(e.key)) return false;
          answer(+e.key - 1);
          return true;
        });
        if (askable.length) next();
      }
    });
  }

  /* ================= registration ================= */

  CL.addTrainer({ id: 'rush', group: 'tactics', title: 'Puzzle rush', timed: 180,
    desc: 'Three minutes, three strikes. The puzzles start easy and get harder.', run: rush });
  CL.addTrainer({ id: 'rated', group: 'tactics', title: 'Rated puzzles',
    desc: 'Puzzles matched to your puzzle rating, which rises and falls with your results.', run: rated });
  CL.addTrainer({ id: 'nextmove', group: 'openings', title: 'Opening: next move',
    desc: 'A named opening, part-way through. Play the next book move.', run: nextMove });
  CL.addTrainer({ id: 'nameit', group: 'openings', title: 'Name the opening', timed: 45,
    desc: 'A position appears. Say which opening it comes from.', run: nameIt });
})();
