/* Sixty-Four — practice drills.
   Timed board-vision drills, the two notation drills, and the shuffled puzzle mix. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;

  /* ================= timed drill frame ================= */

  function timed(root, chapter, meta, cfg) {
    var storeId = chapter.id + '/drill/' + meta.id;
    var opts = {}, tick = null, timers = [], keyFn = null, body = h('div.drill-body');
    (cfg.options || []).forEach(function (o) { opts[o.key] = o.def; });
    root.appendChild(h('div.drill', [
      h('header.page-head', [
        h('a.crumb', { href: '#/' + chapter.id }, '← ' + chapter.title),
        h('h1', { text: meta.title })
      ]),
      body
    ]));

    function clear() {
      clearInterval(tick); tick = null;
      timers.forEach(clearTimeout); timers = [];
      keyFn = null;
      body.innerHTML = '';
    }

    function intro() {
      clear();
      var card = h('div.card.drill-intro', [h('div.prose', { html: CL.fmt(cfg.intro) })]);
      (cfg.options || []).forEach(function (o) {
        card.appendChild(h('div.opt-row', [h('span.opt-label', { text: o.label }),
          CL.seg(o.choices, opts[o.key], function (v) { opts[o.key] = v; })]));
      });
      var best = CL.store.best(storeId);
      card.appendChild(h('div.step-nav', [
        h('span.muted', { text: best ? 'Your best: ' + best : 'No score yet' }),
        h('button.btn.primary.big', { text: 'Start — ' + cfg.seconds + ' seconds', onclick: run })
      ]));
      body.appendChild(card);
    }

    function run() {
      clear();
      var hits = 0, misses = 0, left = cfg.seconds * 10;
      var bar = h('i'), time = h('span.hud-time', { text: cfg.seconds }), score = h('span.hud-score', { text: '0' });
      var note = h('div.drill-note'), prompt = h('div.drill-prompt'), boardHost = h('div.board-host'), answers = h('div.drill-answers');
      body.appendChild(h('div.drill-run' + (cfg.blind ? '.blindfold' : ''), [
        h('div.hud', [
          h('div.timebar', [bar]),
          h('div.hud-row', [h('span', [time, ' s']), h('span', ['score ', score]),
            h('button.btn.small.ghost', { text: 'Stop', onclick: end })])
        ]),
        h('div.drill-stage', [h('div.drill-side', [prompt, note, answers]), h('div.board-col', [boardHost])])
      ]));
      var api = {
        opts: opts, prompt: prompt, boardHost: boardHost, answers: answers,
        hit: function (msg) { hits++; score.textContent = hits; say(msg, 'good'); },
        miss: function (msg) { misses++; say(msg, 'bad'); },
        onKey: function (fn) { keyFn = fn; },
        timer: function (fn, ms) { timers.push(setTimeout(fn, ms)); }
      };
      function say(msg, kind) { note.className = 'drill-note ' + kind; note.textContent = msg || ''; }
      function end() {
        clear();
        var total = hits + misses, isBest = CL.store.setBest(storeId, hits);
        CL.activity.log(storeId, hits);
        if (hits) CL.store.markDone(storeId);
        body.appendChild(h('div.card.drill-end', [
          h('div.kicker', { text: 'Time' }),
          h('div.big-score', { text: hits }),
          h('p.muted', { text: (total ? Math.round(hits / total * 100) + '% accurate' : 'No answers') +
            ' · ' + (isBest ? 'a new best!' : 'best ' + CL.store.best(storeId)) }),
          h('p', { text: cfg.verdict ? cfg.verdict(hits) : '' }),
          h('div.step-nav', [
            h('a.btn.ghost', { href: '#/' + chapter.id }, 'Back to ' + chapter.title),
            h('button.btn.primary', { text: 'Go again', onclick: run })
          ])
        ]));
      }
      cfg.start(api);
      tick = setInterval(function () {
        left--;
        bar.style.width = (left / (cfg.seconds * 10) * 100) + '%';
        time.textContent = Math.ceil(left / 10);
        if (left <= 0) end();
      }, 100);
    }

    function onKey(e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (keyFn && keyFn(e)) e.preventDefault();
    }
    document.addEventListener('keydown', onKey);
    intro();
    return function () { clear(); document.removeEventListener('keydown', onKey); };
  }

  CL.timedDrill = timed;

  function speed(fast, good) {
    return function (n) {
      if (n >= fast) return 'That is fluent. The board is becoming a map you already know.';
      if (n >= good) return 'Solid. A few more sessions and the names will come without thinking.';
      return 'Everyone starts here. Two minutes a day and this number climbs quickly.';
    };
  }

  var SIDE = { key: 'side', label: 'Sit as', def: 'w', choices: [{ v: 'w', label: 'White' }, { v: 'b', label: 'Black' }, { v: 'mix', label: 'Both' }] };

  /* ---------- find the square ---------- */
  CL.drills.find = { run: function (root, chapter, meta) {
    return timed(root, chapter, meta, {
      seconds: 30, verdict: speed(25, 14),
      intro: 'A square’s name appears. **Click that square** as fast as you can.\n\nStart with the edge labels on. When you can score 15, turn them off. When you can score 15 again, sit as Black.',
      options: [SIDE, { key: 'labels', label: 'Edge labels', def: 'on', choices: [{ v: 'on', label: 'On' }, { v: 'off', label: 'Off' }] }],
      start: function (api) {
        var board = new Board(api.boardHost, { orient: api.opts.side === 'b' ? 'b' : 'w', coords: api.opts.labels === 'on' });
        var target = null, count = 0;
        function next() {
          var s;
          do { s = CL.pick(CL.all); } while (s === target);
          target = s; count++;
          if (api.opts.side === 'mix' && count > 1 && count % 4 === 1) board.flip();
          api.prompt.innerHTML = '<span class="muted">Click</span><span class="mv giant">' + s + '</span>';
        }
        board.onSquare = function (s) {
          if (s === target) { board.flash(s, 'good'); api.hit(''); next(); }
          else { board.flash(s, 'bad'); api.miss('That was ' + s + '.'); }
        };
        next();
      }
    });
  } };

  /* ---------- name the square ---------- */
  CL.drills.name = { run: function (root, chapter, meta) {
    return timed(root, chapter, meta, {
      seconds: 30, verdict: speed(22, 12),
      intro: 'A square lights up. **Type its name**: file letter, then rank number (or tap the keys).\n\nThere are no labels on this board. That is the point.',
      options: [SIDE],
      start: function (api) {
        var board = new Board(api.boardHost, { orient: api.opts.side === 'b' ? 'b' : 'w', coords: false });
        var target = null, buf = '', count = 0, typed = h('span.mv.giant');
        api.prompt.appendChild(h('span.muted', { text: 'This square is' }));
        api.prompt.appendChild(typed);
        var files = h('div.keyrow'), ranks = h('div.keyrow');
        'abcdefgh'.split('').forEach(function (c) { files.appendChild(h('button.key', { text: c, onclick: function () { press(c); } })); });
        '12345678'.split('').forEach(function (c) { ranks.appendChild(h('button.key', { text: c, onclick: function () { press(c); } })); });
        api.answers.appendChild(files);
        api.answers.appendChild(ranks);
        function show() { typed.textContent = buf ? buf + (buf.length === 1 ? '_' : '') : '??'; }
        function next() {
          var s;
          do { s = CL.pick(CL.all); } while (s === target);
          target = s; buf = ''; count++;
          if (api.opts.side === 'mix' && count > 1 && count % 4 === 1) board.flip();
          board.setHighlights({ pick: [s] });
          show();
        }
        function press(c) {
          if (/[a-h]/.test(c)) buf = c;
          else if (buf.length === 1) {
            buf += c;
            if (buf === target) { board.flash(target, 'good'); api.hit(''); }
            else { board.flash(target, 'bad'); api.miss('That was ' + target + ', not ' + buf + '.'); }
            next();
            return;
          }
          show();
        }
        api.onKey(function (e) {
          var k = e.key.toLowerCase();
          if (/^[a-h1-8]$/.test(k)) { press(k); return true; }
          return false;
        });
        next();
      }
    });
  } };

  /* ---------- light or dark (blindfold) ---------- */
  CL.drills.color = { run: function (root, chapter, meta) {
    return timed(root, chapter, meta, {
      seconds: 30, blind: true, verdict: speed(22, 12),
      intro: 'No board this time. A square is named; say whether it is **light or dark** from memory.\n\nKeys: **L** for light, **D** for dark. After each answer the board flashes up to show you.',
      start: function (api) {
        var board = new Board(api.boardHost, { coords: true }), target = null;
        api.boardHost.classList.add('blind');
        function next() {
          var s;
          do { s = CL.pick(CL.all); } while (s === target);
          target = s;
          api.prompt.innerHTML = '<span class="mv giant">' + s + '</span><span class="muted">light or dark?</span>';
        }
        function answer(dark) {
          var real = CL.isDark(target), msg = target + ' is ' + (real ? 'dark' : 'light') + '.';
          board.setHighlights({ pick: [target] });
          api.boardHost.classList.remove('blind');
          api.timer(function () { api.boardHost.classList.add('blind'); }, 900);
          if (dark === real) api.hit(msg); else api.miss(msg);
          next();
        }
        api.answers.appendChild(h('div.keyrow.wide', [
          h('button.key.light-key', { text: 'Light (L)', onclick: function () { answer(false); } }),
          h('button.key.dark-key', { text: 'Dark (D)', onclick: function () { answer(true); } })
        ]));
        api.onKey(function (e) {
          var k = e.key.toLowerCase();
          if (k === 'l') { answer(false); return true; }
          if (k === 'd') { answer(true); return true; }
          return false;
        });
        next();
      }
    });
  } };

  /* ---------- same diagonal? (blindfold) ---------- */
  CL.drills.diagonal = { run: function (root, chapter, meta) {
    return timed(root, chapter, meta, {
      seconds: 45, blind: true, verdict: speed(18, 9),
      intro: 'Two squares are named. **Are they on the same diagonal?** Answer from memory.\n\nKeys: **Y** for yes, **N** for no. This is the drill that makes bishops and queens stop surprising you.',
      start: function (api) {
        var board = new Board(api.boardHost, { coords: true }), a = null, b = null;
        api.boardHost.classList.add('blind');
        function next() {
          a = CL.pick(CL.all);
          var yes = Math.random() < 0.5, d = CL.diagonals(a);
          var onDiag = d[0].concat(d[1]).filter(function (s) { return s !== a; });
          if (yes) b = CL.pick(onDiag);
          else {
            // same colour but not on a shared diagonal, so the colour alone does not give it away
            var pool = CL.all.filter(function (s) { return s !== a && CL.isDark(s) === CL.isDark(a) && onDiag.indexOf(s) < 0; });
            b = CL.pick(pool);
          }
          api.prompt.innerHTML = '<span class="mv giant">' + a + ' · ' + b + '</span><span class="muted">same diagonal?</span>';
        }
        function answer(yes) {
          var real = CL.sameDiagonal(a, b);
          board.setHighlights(real ? { d1: CL.ray(a, b), pick: [a, b] } : { pick: [a, b] });
          api.boardHost.classList.remove('blind');
          api.timer(function () { api.boardHost.classList.add('blind'); }, 1100);
          var msg = a + ' and ' + b + (real ? ' share a diagonal.' : ' do not share a diagonal.');
          if (yes === real) api.hit(msg); else api.miss(msg);
          next();
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
  } };

  /* ---------- knight sight ---------- */
  CL.drills.knight = { run: function (root, chapter, meta) {
    return timed(root, chapter, meta, {
      seconds: 45, verdict: speed(12, 6),
      intro: 'A knight appears. **Click every square it attacks.** When you have them all, the next knight appears.\n\nYour score is the number of knights you complete. Aim to see the whole ring at once instead of counting each hop.',
      start: function (api) {
        var board = new Board(api.boardHost, { coords: true }), at = null, targets = [], found = [];
        function next() {
          var s;
          do { s = CL.pick(CL.all); } while (s === at);
          at = s; targets = CL.reach('n', at); found = [];
          var map = {};
          map[at] = { type: 'n', color: 'w' };
          board.setPosition(map);
          board.setHighlights({});
          show();
        }
        function show() {
          api.prompt.innerHTML = '<span class="muted">Knight on</span><span class="mv giant">' + at + '</span>' +
            '<span class="muted">' + found.length + ' of ' + targets.length + ' found</span>';
        }
        board.onSquare = function (s) {
          if (s === at || found.indexOf(s) >= 0) return;
          if (targets.indexOf(s) >= 0) {
            found.push(s);
            board.setHighlights({ good: found });
            show();
            if (found.length === targets.length) { api.hit(''); api.timer(next, 220); }
          } else { board.flash(s, 'bad'); api.miss('Not ' + s + '.'); }
        };
        next();
      }
    });
  } };

  /* ================= notation drills ================= */

  /* Every game and opening line in the course, as lists of SAN moves. */
  CL.practiceLines = function () {
    var out = [];
    function add(name, moves, fen) {
      try { out.push({ name: name, moves: Chess.fromMoves(moves, fen).history() }); } catch (e) { console.error(name, e); }
    }
    var nt = CL.content.notation, op = CL.content.openings;
    if (nt && nt.games) nt.games.forEach(function (g) { add(g.name, g.moves); });
    if (op && op.lines) op.lines.forEach(function (l) { add(l.name, l.moves.map(function (m) { return m[0]; })); });
    return out;
  };

  /* A few hundred realistic positions (FEN strings) taken from every game, opening line and bank puzzle
     in the app. Trainers that generate questions from real positions draw from here. */
  var pool = null;
  CL.positionPool = function () {
    if (pool) return pool;
    var seen = {}, out = [];
    function add(fen) { var k = fen.split(' ')[0]; if (!seen[k]) { seen[k] = 1; out.push(fen); } }
    CL.practiceLines().forEach(function (l) {
      var g = new Chess();
      l.moves.forEach(function (s, i) { if (g.move(s) && i >= 7 && !g.isCheckmate()) add(g.fen()); });
    });
    (CL.puzzleBank || []).forEach(function (p) { add(p.fen); });
    pool = out;
    return pool;
  };

  function untimed(root, chapter, meta, introText) {
    var boardHost = h('div.board-host'), cap = h('div.board-caption'), panel = h('div.panel');
    root.appendChild(h('div.lesson', [
      h('header.page-head', [
        h('a.crumb', { href: '#/' + chapter.id }, '← ' + chapter.title),
        h('h1', { text: meta.title })
      ]),
      h('div.lesson-body', [h('div.board-col', [boardHost, cap]), panel])
    ]));
    panel.appendChild(h('div.kicker', { text: 'Drill' }));
    panel.appendChild(h('div.prose', { html: CL.fmt(introText) }));
    return { board: new Board(boardHost), cap: cap, panel: panel };
  }

  function lineSelect(lines, onPick) {
    var sel = h('select.select', { 'aria-label': 'Choose a game' });
    sel.appendChild(h('option', { value: '-1', text: 'Surprise me' }));
    lines.forEach(function (l, i) { sel.appendChild(h('option', { value: i, text: l.name + ' (' + Math.ceil(l.moves.length / 2) + ' moves)' })); });
    sel.addEventListener('change', function () { onPick(+sel.value); });
    return sel;
  }

  function renderScore(list, sans, upto) {
    list.innerHTML = '';
    for (var i = 0; i < upto; i++) {
      if (i % 2 === 0) list.appendChild(h('span.mnum', { text: (i / 2 + 1) + '.' }));
      list.appendChild(h('span.mbtn.static', { text: sans[i] }));
    }
  }

  CL.renderScore = renderScore;

  /* ---------- read and play ---------- */
  CL.drills.read = { run: function (root, chapter, meta) {
    var ui = untimed(root, chapter, meta,
      'A game is dictated to you one move at a time. **Play each move on the board**, for both sides. If you play something else, you will be told what you actually played — in notation.');
    var board = ui.board, lines = CL.practiceLines(), timers = [];
    var line, game, ply, slips, busy = false;
    var target = h('div.play-this'), fb = h('div.feedback', { hidden: true }), list = h('div.movelist');
    ui.panel.appendChild(h('div.opt-row', [h('span.opt-label', { text: 'Game' }), lineSelect(lines, start)]));
    ui.panel.appendChild(target);
    ui.panel.appendChild(fb);
    ui.panel.appendChild(list);
    ui.panel.appendChild(h('div.tools', [
      h('button.btn.small', { text: 'Another game', onclick: function () { start(-1); } }),
      h('button.btn.small', { text: 'Flip the board', onclick: function () { board.flip(); } })
    ]));

    function say(msg, kind) { fb.className = 'feedback ' + (kind || ''); fb.innerHTML = msg ? CL.fmt(msg) : ''; fb.hidden = !msg; }
    function start(i) {
      line = i < 0 ? CL.pick(lines) : lines[i];
      game = new Chess(); ply = 0; slips = 0; busy = false;
      board.setPosition(game); board.setLast(null);
      say('');
      render();
    }
    function render() {
      renderScore(list, line.moves, ply);
      ui.cap.textContent = line.name;
      if (ply >= line.moves.length) {
        target.innerHTML = '<span class="mv huge">✓</span><span class="muted">' + Math.ceil(line.moves.length / 2) + ' moves read, ' +
          (slips ? slips + (slips === 1 ? ' slip' : ' slips') : 'no slips') + '</span>';
        CL.store.markDone(chapter.id + '/drill/' + meta.id);
        CL.activity.log(chapter.id + '/drill/' + meta.id, line.moves.length - slips);
        say(game.isCheckmate() ? '**Checkmate on the board.** You just read a whole game.' : '**End of the line.** Pick another game and keep reading.', 'good');
        return;
      }
      target.innerHTML = '<span class="muted">' + (game.turn === 'w' ? 'White' : 'Black') + ' plays</span><span class="mv huge">' +
        Math.floor(ply / 2 + 1) + (game.turn === 'w' ? '. ' : '… ') + line.moves[ply] + '</span>';
    }
    board.movable = function (s) {
      if (busy || ply >= line.moves.length) return null;
      var p = game.get(s);
      if (!p || p.color !== game.turn) return null;
      return game.moves({ square: s }).map(function (m) { return m.to; });
    };
    board.onMove = function (from, to, info) {
      var want = line.moves[ply], pm = /=([QRBN])/.exec(want);
      var mv = game.move({ from: from, to: to, promotion: pm ? pm[1].toLowerCase() : 'q' });
      if (!mv) { board.setPosition(game); return; }
      board.setPosition(game, info.dragged ? null : { animate: { from: from, to: to } });
      if (CL.stripSan(mv.san) === CL.stripSan(want)) {
        ply++;
        board.setLast([from, to]);
        say('');
        render();
      } else {
        slips++; busy = true;
        say('You played `' + mv.san + '` (' + Chess.describe(mv).toLowerCase() + '). The score says `' + want + '`.', 'bad');
        timers.push(setTimeout(function () { game.undo(); board.setPosition(game); board.shake(); busy = false; }, 900));
      }
    };
    start(-1);
    return function () { timers.forEach(clearTimeout); };
  } };

  /* ---------- watch and write ---------- */
  CL.drills.write = { run: function (root, chapter, meta) {
    var storeId = chapter.id + '/drill/' + meta.id;
    var ui = untimed(root, chapter, meta,
      'Now you are the scorekeeper. A move is played on the board; **type it in notation** and press Enter. Your streak is the number of moves written correctly in a row.');
    var board = ui.board, lines = CL.practiceLines(), timers = [];
    var line, game, ply, mv = null, streak = 0, waiting = false;
    var input = h('input.san-input', { type: 'text', maxlength: '8', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'type the move', 'aria-label': 'The move in notation' });
    var bCheck = h('button.btn.primary.small', { text: 'Check', onclick: check });
    var fb = h('div.feedback', { hidden: true }), list = h('div.movelist'), stat = h('div.streak');
    ui.panel.appendChild(h('div.opt-row', [h('span.opt-label', { text: 'Game' }), lineSelect(lines, start)]));
    ui.panel.appendChild(stat);
    ui.panel.appendChild(h('div.write-row', [input, bCheck]));
    ui.panel.appendChild(CL.sanKeys(input));
    ui.panel.appendChild(fb);
    ui.panel.appendChild(list);
    ui.panel.appendChild(h('div.tools', [
      h('button.btn.small', { text: 'Show me', onclick: reveal }),
      h('button.btn.small', { text: 'Another game', onclick: function () { start(-1); } }),
      h('button.btn.small', { text: 'Flip the board', onclick: function () { board.flip(); } })
    ]));

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function say(msg, kind) { fb.className = 'feedback ' + (kind || ''); fb.innerHTML = msg ? CL.fmt(msg) : ''; fb.hidden = !msg; }
    function stats() { stat.innerHTML = 'Streak <b>' + streak + '</b> · best <b>' + Math.max(streak, CL.store.best(storeId)) + '</b>'; }
    function start(i) {
      timers.forEach(clearTimeout); timers = [];
      line = i < 0 ? CL.pick(lines) : lines[i];
      game = new Chess(); ply = 0; mv = null;
      board.setPosition(game); board.setLast(null);
      say('');
      renderScore(list, line.moves, 0);
      ui.cap.textContent = line.name;
      stats();
      later(showNext, 500);
    }
    function showNext() {
      waiting = false;
      if (ply >= line.moves.length) {
        mv = null;
        input.disabled = true;
        say('**End of the game.** You wrote down ' + line.moves.length + ' moves. Choose another game to keep going.', 'good');
        CL.store.markDone(storeId);
        CL.activity.log(storeId, streak);
        return;
      }
      mv = game.move(line.moves[ply]);
      board.setPosition(game, { animate: { from: mv.from, to: mv.to } });
      board.setLast([mv.from, mv.to]);
      input.disabled = false;
      input.value = '';
      try { input.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      ui.cap.textContent = line.name + ' · ' + (mv.color === 'w' ? 'White' : 'Black') + ' just moved';
    }
    function accept(delay) {
      ply++;
      renderScore(list, line.moves, ply);
      waiting = true;
      later(showNext, delay);
    }
    function check() {
      if (!mv || waiting) return;
      var res = CL.gradeSan(input.value, mv.san);
      if (res.ok) {
        streak++;
        CL.store.setBest(storeId, streak);
        stats();
        say(res.note || '`' + mv.san + '` — ' + Chess.describe(mv).toLowerCase() + '.', 'good');
        accept(res.note ? 1700 : 550);
      } else {
        streak = 0; stats();
        input.classList.remove('nope'); void input.offsetWidth; input.classList.add('nope');
        say(res.note || 'Not quite. Which piece moved, and where did it land?', 'bad');
      }
    }
    function reveal() {
      if (!mv || waiting) return;
      streak = 0; stats();
      input.value = mv.san;
      say('It is written `' + mv.san + '`: ' + Chess.describe(mv).toLowerCase() + '.', 'hint');
      accept(1900);
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    start(-1);
    return function () { timers.forEach(clearTimeout); };
  } };

  /* ================= puzzle mix ================= */

  CL.drills.mix = { run: function (root, chapter, meta) {
    var pool = CL.collectPuzzles(meta.pool || ['mates', 'tactics']);
    var chosen = CL.shuffle(pool).slice(0, meta.count || 8);
    var lesson = {
      id: 'mix', doneId: chapter.id + '/drill/' + meta.id, title: meta.title,
      takeaway: 'The puzzles are reshuffled every visit. When you can solve these without the theme being named, you are recognising patterns — which is what tactics really are.',
      steps: chosen.map(function (p) {
        var st = {}, k;
        for (k in p.step) st[k] = p.step[k];
        var side = CL.resolve(st).turn === 'w' ? 'White' : 'Black';
        var mate = !st.tactic && /#$/.test(st.solution[st.solution.length - 1]), n = Math.ceil(st.solution.length / 2);
        st.title = mate ? 'Checkmate in ' + (['', 'one', 'two', 'three'][n] || n) : side + ' to play and win';
        st.text = mate ? side + ' to move. Find the forced mate.'
          : side + ' to move. No theme is named this time. Scan for **checks, captures and threats**, and look for loose pieces.';
        st.hint = null;
        st.explain = 'Theme: **' + p.lesson.title + '**. ' + (p.step.explain || '');
        return st;
      })
    };
    return CL.lessonView(root, chapter, lesson);
  } };
})();
