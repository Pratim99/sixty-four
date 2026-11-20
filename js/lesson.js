/* Sixty-Four — the lesson player.
   A lesson is a list of steps. Step types:
     info    a diagram with explanation
     line    a sequence of moves to play through, each with a comment
     puzzle  find the move(s) on the board
     find    click the right square(s)
     quiz    multiple choice
     write   watch a move, type its notation
     widget  an interactive explorer (see widgets.js)                                  */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
  var KIND = { info: 'Idea', line: 'Play through', puzzle: 'Your move', find: 'Find it', quiz: 'Question', write: 'Write it', widget: 'Explore' };
  var MUST = { puzzle: 1, find: 1, quiz: 1, write: 1 };

  function strip(s) { return String(s).replace(/[+#!?]/g, ''); }
  CL.stripSan = strip;

  /* Mark a typed move against the real notation. */
  CL.gradeSan = function (typed, san) {
    var t = String(typed).trim().replace(/\s+/g, '');
    if (!t) return { ok: false, note: '' };
    if (/^[0oO]-[0oO](-[0oO])?$/.test(t)) t = t.replace(/[0o]/g, 'O');
    if (t === san) return { ok: true, note: '' };
    if (strip(t) === strip(san)) {
      var end = san.slice(-1);
      if (end === '#') return { ok: true, note: 'Right move. It is checkmate, so the full notation is `' + san + '`.' };
      if (end === '+') return { ok: true, note: 'Right move. It also gives check, so the full notation is `' + san + '`.' };
      return { ok: true, note: 'Right move. It is not check, so it is written simply `' + san + '`.' };
    }
    if (strip(t).toLowerCase() === strip(san).toLowerCase()) {
      return { ok: true, note: 'Right move. Mind the capitals (pieces are upper-case, squares lower-case): `' + san + '`.' };
    }
    function bare(s) { return strip(s).replace(/x/g, '').toLowerCase(); }
    if (bare(t) === bare(san)) {
      return { ok: false, note: san.indexOf('x') >= 0 ? 'Close. Something was captured, so the move needs an `x`.' : 'Close. Nothing was captured, so there is no `x`.' };
    }
    return { ok: false, note: '' };
  };

  function makeCtx(p) {
    var timers = [], keyFn = null;
    var ctx = {
      board: p.board, ui: p.ui, step: p.step, game: p.game, done: false,
      caption: function (t) { p.cap.textContent = t || ''; },
      feedback: function (msg, kind) {
        p.fb.className = 'feedback ' + (kind || '');
        p.fb.innerHTML = msg ? CL.fmt(msg) : '';
        p.fb.hidden = !msg;
      },
      solve: function (msg) {
        ctx.done = true;
        ctx.feedback(msg, 'good');
        if (p.onSolve) p.onSolve();
      },
      timer: function (fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; },
      onKey: function (fn) { keyFn = fn; },
      key: function (e) { return keyFn ? keyFn(e) : false; },
      destroy: function () { ctx.dead = true; timers.forEach(clearTimeout); keyFn = null; }
    };
    return ctx;
  }
  CL.makeCtx = makeCtx;

  /* ================= step renderers ================= */

  CL.steps = {};

  CL.steps.info = function () {};

  CL.steps.widget = function (ctx) {
    var fn = CL.widgets[ctx.step.widget];
    return fn ? fn(ctx) : null;
  };

  /* ---- line: play through moves ---- */
  CL.steps.line = function (ctx) {
    var step = ctx.step, board = ctx.board, start = ctx.game.fen();
    var raw = typeof step.moves === 'string'
      ? Chess.parseMoves(step.moves).map(function (s) { return [s, '']; })
      : step.moves;
    var g = new Chess(start), fens = [start], moves = [], at = 0;
    raw.forEach(function (it) {
      var num = g.fullmove, color = g.turn, m = g.move(it[0]);
      if (!m) throw new Error('Illegal move in line: ' + it[0]);
      moves.push({ san: m.san, from: m.from, to: m.to, note: it[1] || '', desc: Chess.describe(m), color: color, num: num });
      fens.push(g.fen());
    });

    var list = h('div.movelist'), note = h('div.move-note');
    moves.forEach(function (m, k) {
      if (m.color === 'w' || k === 0) list.appendChild(h('span.mnum', { text: m.num + (m.color === 'w' ? '.' : '…') }));
      m.btn = h('button.mbtn', { text: m.san, onclick: function () { go(k + 1); } });
      list.appendChild(m.btn);
    });
    var bFirst = h('button.btn.icon', { title: 'Back to the start', text: '«', onclick: function () { go(0); } });
    var bPrev = h('button.btn.icon', { title: 'Previous move (←)', text: '‹', onclick: function () { go(at - 1); } });
    var bNext = h('button.btn.icon.go', { title: 'Next move (→)', text: 'Next move ›', onclick: function () { go(at + 1); } });
    var bLast = h('button.btn.icon', { title: 'Jump to the end', text: '»', onclick: function () { go(moves.length); } });
    ctx.ui.appendChild(h('div.line-ctl', [bFirst, bPrev, bNext, bLast]));
    ctx.ui.appendChild(note);
    ctx.ui.appendChild(list);

    function go(k) {
      k = Math.max(0, Math.min(moves.length, k));
      var fwd = k === at + 1, mv = moves[k - 1];
      at = k;
      board.setPosition(fens[k], fwd ? { animate: { from: mv.from, to: mv.to } } : null);
      board.setLast(mv ? [mv.from, mv.to] : null);
      board.setHighlights(k === 0 ? (step.hl || {}) : {});
      board.setArrows(k === 0 ? (step.arrows || []) : []);
      moves.forEach(function (m, j) { m.btn.classList.toggle('on', j === k - 1); });
      bFirst.disabled = bPrev.disabled = k === 0;
      bNext.disabled = bLast.disabled = k === moves.length;
      if (mv) {
        note.innerHTML = '<span class="mv big">' + mv.num + (mv.color === 'w' ? '. ' : '… ') + mv.san + '</span>' +
          '<span class="desc">' + mv.desc + '.</span>' + (mv.note ? '<p>' + CL.inline(mv.note) + '</p>' : '');
      } else {
        note.innerHTML = '<p class="muted">' + CL.inline(step.intro || 'Press **Next move**, or use the ← → arrow keys.') + '</p>';
      }
      ctx.caption(k === moves.length && g.isCheckmate() ? 'Checkmate' : '');
    }
    ctx.onKey(function (e) {
      if (e.key === 'ArrowRight') { go(at + 1); return true; }
      if (e.key === 'ArrowLeft') { go(at - 1); return true; }
      return false;
    });
    go(step.startAt || 0);
  };

  /* ---- puzzle: make the right move(s) ---- */
  CL.steps.puzzle = function (ctx) {
    var step = ctx.step, game = ctx.game, board = ctx.board, sol = step.solution;
    var ply = 0, busy = false, hint = 0, me = game.turn, also = null;
    var side = me === 'w' ? 'White' : 'Black';
    ctx.caption(side + ' to move');

    if (step.show) {
      ctx.ui.appendChild(h('div.play-this', [h('span.muted', { text: 'Play' }), h('span.mv.huge', { text: step.show })]));
    }
    var bHint = h('button.btn.small', { text: 'Hint', onclick: giveHint });
    var bShow = h('button.btn.small', { text: 'Show me', onclick: reveal });
    var tools = h('div.tools', [bHint, bShow]);
    ctx.ui.appendChild(tools);

    function expected() {
      var want = strip(sol[ply]), list = game.moves();
      for (var i = 0; i < list.length; i++) if (strip(list[i].san) === want) return list[i];
      return null;
    }

    board.movable = function (s) {
      if (busy || ctx.done || game.turn !== me) return null;
      var p = game.get(s);
      if (!p || p.color !== me) return null;
      return game.moves({ square: s }).map(function (m) { return m.to; });
    };

    board.onMove = function (from, to, info) {
      var want = sol[ply], pm = /=([QRBN])/.exec(want);
      var mv = game.move({ from: from, to: to, promotion: pm ? pm[1].toLowerCase() : 'q' });
      if (!mv) { board.setPosition(game); return; }
      var ok = strip(mv.san) === strip(want) || (/#$/.test(want) && game.isCheckmate());
      board.setPosition(game, info.dragged ? null : { animate: { from: from, to: to } });
      if (!ok) {
        busy = true;
        board.setLast([from, to]);
        if (step.lenient != null && CL.brain) {
          // A puzzle from the player's own game: any move about as good as the engine's counts.
          ctx.feedback('Checking `' + mv.san + '`…', 'hint');
          CL.brain.best(game.fen()).then(function (r) {
            if (ctx.dead) return;
            var mine = r.best ? -r.score : (game.inCheck() ? 100000 : 0);
            if (CL.softScore(step.lenient) - CL.softScore(mine) <= 70) { busy = false; also = mv.san; advance(mv); }
            else reject(mv);
          }).catch(function () { if (!ctx.dead) reject(mv); });
          return;
        }
        reject(mv);
        return;
      }
      advance(mv);
    };

    function reject(mv) {
      ctx.feedback('`' + mv.san + '` is not the move. ' + (step.wrong || 'Take it back and look again.'), 'bad');
      ctx.timer(function () {
        game.undo();
        board.setPosition(game);
        board.setLast(null);
        board.shake();
        busy = false;
      }, 700);
    }

    function advance(mv) {
      board.setLast([mv.from, mv.to]);
      board.setHighlights({});
      board.setArrows([]);
      ply++; hint = 0;
      if (ply >= sol.length) return finish(false);
      busy = true;
      ctx.feedback('`' + mv.san + '` — yes. Keep going…', 'good');
      ctx.timer(function () {
        var r = game.move(sol[ply]);
        ply++;
        board.setPosition(game, { animate: { from: r.from, to: r.to } });
        board.setLast([r.from, r.to]);
        busy = false;
        if (ply >= sol.length) finish(false);
      }, 600);
    }

    function finish(shown) {
      tools.hidden = true;
      ctx.shown = shown;
      var lead = shown ? '**The solution:** ' + sol.join(' ') + '. '
        : (game.isCheckmate() ? '**Checkmate.** ' : (also ? '**Good: `' + also + '` is about as strong.** ' : '**Correct.** '));
      ctx.solve(lead + (step.explain || ''));
    }

    function giveHint() {
      var m = expected();
      if (!m || busy) return;
      hint++;
      if (hint === 1) {
        board.setHighlights({ note: [m.from] });
        ctx.feedback(step.hint || 'Look at the ' + Chess.PIECE_NAMES[m.piece] + ' on `' + m.from + '`.', 'hint');
      } else {
        board.setArrows([[m.from, m.to, 'yellow']]);
        ctx.feedback('The move is `' + m.san + '`. Play it on the board.', 'hint');
      }
    }

    function reveal() {
      if (busy) return;
      busy = true;
      board.setHighlights({}); board.setArrows([]);
      (function stepOn() {
        if (ply >= sol.length) { busy = false; return finish(true); }
        var r = game.move(sol[ply]);
        ply++;
        board.setPosition(game, { animate: { from: r.from, to: r.to } });
        board.setLast([r.from, r.to]);
        ctx.timer(stepOn, 750);
      })();
    }
  };

  /* ---- find: click the right square(s) ---- */
  CL.steps.find = function (ctx) {
    var step = ctx.step, board = ctx.board, base = step.hl || {};
    var found = [], k = 0, seq = step.targets, answers = step.answers || [];
    var ask = h('div.play-this');
    if (seq) ctx.ui.appendChild(ask);
    var bShow = h('button.btn.small', { text: 'Show me', onclick: function () { finish(true); } });
    var tools = h('div.tools', [bShow]);
    ctx.ui.appendChild(tools);

    function paint(extra) {
      var hl = {}, key;
      for (key in base) hl[key] = base[key];
      hl.good = (hl.good || []).concat(found);
      if (extra) for (key in extra) hl[key] = extra[key];
      board.setHighlights(hl);
    }
    function prompt() {
      ask.innerHTML = '<span class="muted">Click</span><span class="mv huge">' + seq[k] + '</span>' +
        '<span class="muted small">' + (k + 1) + ' of ' + seq.length + '</span>';
    }
    function finish(shown) {
      tools.hidden = true;
      if (seq) { found = seq.slice(); ask.hidden = true; }
      else found = answers.slice();
      paint();
      ctx.solve((shown ? '**Here it is.** ' : '**Yes.** ') + (step.explain || ''));
    }

    board.onSquare = function (s) {
      if (ctx.done) return;
      if (seq) {
        if (s === seq[k]) {
          board.flash(s, 'good');
          found.push(s);
          k++;
          if (k >= seq.length) finish(false); else { prompt(); ctx.feedback('', ''); }
        } else {
          board.flash(s, 'bad');
          ctx.feedback('That square is `' + s + '`. Try again for `' + seq[k] + '`.', 'bad');
        }
        return;
      }
      if (found.indexOf(s) >= 0) return;
      if (answers.indexOf(s) >= 0) {
        found.push(s);
        paint();
        if (found.length >= answers.length) finish(false);
        else ctx.feedback(found.length + ' of ' + answers.length + ' found.', 'hint');
      } else {
        board.flash(s, 'bad');
        ctx.feedback(step.wrong || '`' + s + '` is not one of them.', 'bad');
      }
    };
    if (seq) prompt();
    if (step.toMove !== false && ctx.game._king('w') >= 0 && step.showTurn) ctx.caption((ctx.game.turn === 'w' ? 'White' : 'Black') + ' to move');
  };

  /* ---- quiz: multiple choice ---- */
  CL.steps.quiz = function (ctx) {
    var step = ctx.step, box = h('div.choices');
    step.choices.forEach(function (c, i) {
      var b = h('button.choice', { html: CL.inline(c) });
      b.addEventListener('click', function () {
        if (ctx.done) return;
        if (i === step.answer) {
          b.classList.add('right');
          Array.prototype.forEach.call(box.children, function (x) { x.disabled = true; });
          ctx.solve('**Right.** ' + (step.explain || ''));
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          ctx.feedback('Not that one — try again.', 'bad');
        }
      });
      box.appendChild(b);
    });
    ctx.ui.appendChild(box);
  };

  /* ---- write: watch a move, type its notation ---- */
  CL.steps.write = function (ctx) {
    var step = ctx.step, board = ctx.board, before = ctx.game.fen();
    var after = new Chess(before), mv = after.move(step.san);
    if (!mv) throw new Error('Illegal move in write step: ' + step.san);
    var input = h('input.san-input', { type: 'text', maxlength: '8', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'type the move', 'aria-label': 'The move in notation' });
    var bCheck = h('button.btn.primary.small', { text: 'Check', onclick: check });
    var bAgain = h('button.btn.small', { text: 'Replay', onclick: play });
    var bShow = h('button.btn.small', { text: 'Show me', onclick: function () { input.value = mv.san; done('**It is written `' + mv.san + '`.** ' + Chess.describe(mv) + '. '); } });
    var tools = h('div.tools', [bAgain, bShow]);
    ctx.ui.appendChild(h('div.write-row', [input, bCheck]));
    ctx.ui.appendChild(CL.sanKeys(input));
    ctx.ui.appendChild(tools);
    ctx.caption((ctx.game.turn === 'w' ? 'White' : 'Black') + ' just moved — what was it?');

    function play() {
      board.setPosition(before);
      board.setLast(null);
      ctx.timer(function () {
        board.setPosition(after, { animate: { from: mv.from, to: mv.to } });
        board.setLast([mv.from, mv.to]);
      }, 450);
    }
    function done(msg) {
      input.disabled = true; bCheck.disabled = true; tools.hidden = true;
      ctx.solve(msg + (step.explain || ''));
    }
    function check() {
      if (ctx.done) return;
      var res = CL.gradeSan(input.value, mv.san);
      if (res.ok) done('**Correct: `' + mv.san + '`.** ' + (res.note ? res.note + ' ' : ''));
      else {
        input.classList.remove('nope'); void input.offsetWidth; input.classList.add('nope');
        ctx.feedback(res.note || 'Not quite. Which piece moved, and where did it land?', 'bad');
      }
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    play();
    ctx.timer(function () { try { input.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50);
  };

  /* Little on-screen keys for the characters notation uses. */
  CL.sanKeys = function (input) {
    var row = h('div.san-keys');
    ['K', 'Q', 'R', 'B', 'N', 'x', '+', '#', '=', 'O-O', 'O-O-O'].forEach(function (k) {
      row.appendChild(h('button.key', { type: 'button', text: k, onclick: function () {
        if (input.disabled) return;
        input.value = k.charAt(0) === 'O' ? k : input.value + k;
        input.focus();
      } }));
    });
    row.appendChild(h('button.key', { type: 'button', text: '⌫', title: 'Delete', onclick: function () {
      if (!input.disabled) { input.value = input.value.slice(0, -1); input.focus(); }
    } }));
    return row;
  };

  /* ================= the lesson shell ================= */

  CL.lessonView = function (root, chapter, lesson) {
    var steps = lesson.steps, n = 0, solved = {}, ctx = null, stepCleanup = null;
    var dots = h('div.dots');
    var boardHost = h('div.board-host'), cap = h('div.board-caption'), panel = h('div.panel');
    root.appendChild(h('div.lesson', [
      h('header.page-head', [
        h('a.crumb', { href: '#/' + chapter.id }, '← ' + chapter.title),
        h('h1', { text: lesson.title }),
        dots
      ]),
      h('div.lesson-body', [h('div.board-col', [boardHost, cap]), panel])
    ]));
    var board = new Board(boardHost);
    var dotEls = steps.map(function (s, i) {
      var d = h('button.dot-btn', { title: 'Step ' + (i + 1), 'aria-label': 'Go to step ' + (i + 1), onclick: function () { show(i); } });
      dots.appendChild(d);
      return d;
    });

    function paintDots() {
      dotEls.forEach(function (d, i) {
        d.className = 'dot-btn' + (i === n ? ' on' : '') + (solved[i] ? ' ok' : '') + (i < n ? ' seen' : '');
      });
    }
    function teardown() {
      if (stepCleanup) stepCleanup();
      stepCleanup = null;
      if (ctx) ctx.destroy();
      ctx = null;
    }

    function show(i) {
      teardown();
      n = i;
      if (i >= steps.length) return finish();
      var step = steps[i], kind = step.type || 'info', last = i === steps.length - 1;
      board.reset();
      board.setOrientation(step.orient || 'w');
      board.setCoords(step.coords !== false);
      boardHost.classList.toggle('blind', !!step.blind);
      var game;
      try { game = CL.resolve(step); } catch (e) { console.error(e); game = new Chess(CL.EMPTY); }
      board.setPosition(game);
      board.setHighlights(step.hl || {});
      board.setArrows(step.arrows || []);
      board.setLabels(step.labels || {});
      cap.textContent = step.caption || '';

      var ui = h('div.step-ui'), fb = h('div.feedback', { hidden: true });
      var next = h('button.btn.primary', { onclick: function () { show(n + 1); } });
      var back = h('button.btn.ghost', { text: '← Back', onclick: function () { show(n - 1); } });
      back.disabled = i === 0;
      function label() {
        var pending = MUST[kind] && !solved[i];
        next.textContent = last ? (pending ? 'Skip and finish' : 'Finish lesson ✓') : (pending ? 'Skip →' : 'Next →');
        next.classList.toggle('quiet', !!pending);
      }
      panel.innerHTML = '';
      panel.appendChild(h('div.kicker', { text: 'Step ' + (i + 1) + ' of ' + steps.length + ' · ' + KIND[kind] }));
      if (step.title) panel.appendChild(h('h2', { text: step.title }));
      if (step.text) panel.appendChild(h('div.prose', { html: CL.fmt(step.text) }));
      panel.appendChild(ui);
      panel.appendChild(fb);
      panel.appendChild(h('div.step-nav', [back, next]));
      ctx = makeCtx({ board: board, ui: ui, fb: fb, cap: cap, step: step, game: game,
        onSolve: function () {
          solved[i] = true;
          if (step.doneId && !ctx.shown) CL.store.markDone(step.doneId);
          label();
          paintDots();
        } });
      label();
      paintDots();
      try {
        var r = (CL.steps[kind] || CL.steps.info)(ctx);
        if (typeof r === 'function') stepCleanup = r;
      } catch (e) {
        console.error(e);
        ctx.feedback('This step failed to load: ' + e.message, 'bad');
      }
    }

    function finish() {
      CL.store.markDone(lesson.doneId || (chapter.id + '/' + lesson.id));
      CL.activity.log(lesson.doneId || (chapter.id + '/' + lesson.id), null);
      if (CL.refreshNav) CL.refreshNav();
      board.reset();
      boardHost.classList.remove('blind');
      cap.textContent = '';
      paintDots();
      var idx = chapter.lessons.indexOf(lesson), nextL = idx >= 0 ? chapter.lessons[idx + 1] : null;
      panel.innerHTML = '';
      panel.appendChild(h('div.kicker', { text: 'Lesson complete' }));
      panel.appendChild(h('h2', { text: lesson.title }));
      if (lesson.takeaway) {
        panel.appendChild(h('div.takeaway', [h('div.kicker', { text: 'Keep this' }), h('div.prose', { html: CL.fmt(lesson.takeaway) })]));
      }
      var drills = CL.allTrainers ? CL.allTrainers().filter(function (t) { return t.group === chapter.id; }) : [];
      if (drills.length) {
        var row = h('div.tools');
        CL.shuffle(drills).slice(0, 3).forEach(function (t) { row.appendChild(h('a.btn.small', { href: t.href }, t.title)); });
        row.appendChild(h('a.btn.small', { href: '#/train' }, 'All training →'));
        panel.appendChild(h('div.kicker.sub', { text: 'Now practise it' }));
        panel.appendChild(row);
      }
      var acts = h('div.step-nav');
      acts.appendChild(h('button.btn.ghost', { text: 'Go through it again', onclick: function () { solved = {}; show(0); } }));
      if (nextL) acts.appendChild(h('a.btn.primary', { href: '#/' + chapter.id + '/lesson/' + nextL.id }, 'Next: ' + nextL.title + ' →'));
      else acts.appendChild(h('a.btn.primary', { href: '#/' + chapter.id }, 'Back to ' + chapter.title + ' →'));
      panel.appendChild(acts);
    }

    function onKey(e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (ctx && ctx.key(e)) e.preventDefault();
    }
    document.addEventListener('keydown', onKey);
    show(0);

    return function () {
      teardown();
      document.removeEventListener('keydown', onKey);
    };
  };
})();
