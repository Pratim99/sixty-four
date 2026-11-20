/* Sixty-Four — the opening explorer: study a line move by move, then play it from memory. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;

  function summary(sans, plies) {
    var out = '';
    for (var i = 0; i < Math.min(plies, sans.length); i++) out += (i % 2 === 0 ? (i / 2 + 1) + '. ' : '') + sans[i] + ' ';
    return out.trim() + (sans.length > plies ? ' …' : '');
  }
  CL.lineSummary = summary;

  CL.openingView = function (root, chapter, op) {
    var boardHost = h('div.board-host'), cap = h('div.board-caption'), panel = h('div.panel'), stage = h('div.stage');
    var sans = Chess.fromMoves(op.moves.map(function (m) { return m[0]; })).history();
    var ctx = null, timers = [], doneId = chapter.id + '/' + op.id;

    root.appendChild(h('div.lesson', [
      h('header.page-head', [
        h('a.crumb', { href: '#/' + chapter.id }, '← ' + chapter.title),
        h('h1', { text: op.name }),
        h('p.page-sub.mono', { text: summary(sans, 8) })
      ]),
      h('div.lesson-body', [h('div.board-col', [boardHost, cap]), panel])
    ]));
    var board = new Board(boardHost);
    panel.appendChild(CL.seg([
      { v: 'study', label: 'Study' }, { v: 'w', label: 'Play it as White' }, { v: 'b', label: 'Play it as Black' }
    ], 'study', function (v) { render(v); }));
    panel.appendChild(stage);

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function teardown() {
      timers.forEach(clearTimeout); timers = [];
      if (ctx) ctx.destroy();
      ctx = null;
      board.reset();
      stage.innerHTML = '';
      cap.textContent = '';
    }
    function render(mode) {
      teardown();
      if (mode === 'study') study(); else practise(mode);
    }

    function plan(title, text) {
      return h('div.plan', [h('div.kicker', { text: title }), h('p', { text: text })]);
    }

    function study() {
      board.setOrientation('w');
      var ui = h('div.step-ui'), fb = h('div.feedback', { hidden: true });
      stage.appendChild(h('div.prose', { html: CL.fmt(op.idea) }));
      stage.appendChild(ui);
      stage.appendChild(h('div.plans', [plan('White’s plan', op.white), plan('Black’s plan', op.black)]));
      var game = new Chess();
      board.setPosition(game);
      ctx = CL.makeCtx({ board: board, ui: ui, fb: fb, cap: cap, step: { moves: op.moves, intro: 'Press **Next move** and read why each move is played.' }, game: game });
      CL.steps.line(ctx);
    }

    function practise(side) {
      board.setOrientation(side);
      var game = new Chess(), ply = 0, slips = 0, wrongHere = 0, hintN = 0, busy = false;
      var name = side === 'w' ? 'White' : 'Black';
      var status = h('div.play-this'), fb = h('div.feedback', { hidden: true }), list = h('div.movelist');
      stage.appendChild(h('div.prose', { html: CL.fmt('Play **' + name + '’s** moves from memory. The other side answers automatically. After each correct move you get the reason for it again.') }));
      stage.appendChild(status);
      stage.appendChild(fb);
      stage.appendChild(list);
      stage.appendChild(h('div.tools', [
        h('button.btn.small', { text: 'Hint', onclick: hint }),
        h('button.btn.small', { text: 'Start over', onclick: function () { render(side); } })
      ]));
      board.setPosition(game);

      function say(msg, kind) { fb.className = 'feedback ' + (kind || ''); fb.innerHTML = msg ? CL.fmt(msg) : ''; fb.hidden = !msg; }
      function expected() {
        var want = CL.stripSan(sans[ply]), all = game.moves();
        for (var i = 0; i < all.length; i++) if (CL.stripSan(all[i].san) === want) return all[i];
        return null;
      }
      function turn() {
        CL.renderScore(list, sans, ply);
        if (ply >= sans.length) return finish();
        if (game.turn !== side) {
          busy = true;
          status.innerHTML = '<span class="muted">' + (side === 'w' ? 'Black' : 'White') + ' replies…</span>';
          later(function () {
            var r = game.move(sans[ply]);
            ply++;
            board.setPosition(game, { animate: { from: r.from, to: r.to } });
            board.setLast([r.from, r.to]);
            busy = false;
            turn();
          }, 600);
        } else {
          status.innerHTML = '<span class="muted">Your move</span><span class="mv huge">' + Math.floor(ply / 2 + 1) +
            (side === 'w' ? '. ?' : '… ?') + '</span>';
        }
      }
      function finish() {
        status.innerHTML = '<span class="mv huge">✓</span><span class="muted">' + (slips ? slips + (slips === 1 ? ' slip' : ' slips') : 'no slips') + '</span>';
        say('**That is the whole line.** ' + (slips ? 'Run it again until it comes out clean — then try it from the other side.' : 'Clean. Now try it from the other side of the board.'), 'good');
        CL.store.markDone(doneId);
        if (CL.refreshNav) CL.refreshNav();
      }
      function hint() {
        var m = expected();
        if (!m || busy || game.turn !== side) return;
        hintN++;
        if (hintN === 1) { board.setHighlights({ note: [m.from] }); say('It is a ' + Chess.PIECE_NAMES[m.piece] + ' move, from `' + m.from + '`.', 'hint'); }
        else { board.setArrows([[m.from, m.to, 'yellow']]); say('The move is `' + m.san + '`.', 'hint'); }
      }
      board.movable = function (s) {
        if (busy || ply >= sans.length || game.turn !== side) return null;
        var p = game.get(s);
        if (!p || p.color !== side) return null;
        return game.moves({ square: s }).map(function (m) { return m.to; });
      };
      board.onMove = function (from, to, info) {
        var mv = game.move({ from: from, to: to });
        if (!mv) { board.setPosition(game); return; }
        board.setPosition(game, info.dragged ? null : { animate: { from: from, to: to } });
        if (CL.stripSan(mv.san) === CL.stripSan(sans[ply])) {
          var why = op.moves[ply][1];
          board.setLast([from, to]);
          board.setHighlights({}); board.setArrows([]);
          say('`' + mv.san + '` — ' + (why || 'yes.'), 'good');
          ply++; wrongHere = 0; hintN = 0;
          turn();
        } else {
          slips++; wrongHere++; busy = true;
          say('`' + mv.san + '` is a legal move, but it is not this opening.' + (wrongHere >= 2 ? ' Press **Hint** if you are stuck.' : ''), 'bad');
          later(function () { game.undo(); board.setPosition(game); board.shake(); busy = false; }, 700);
        }
      };
      turn();
    }

    function onKey(e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (ctx && ctx.key(e)) e.preventDefault();
    }
    document.addEventListener('keydown', onKey);
    render('study');

    return function () {
      teardown();
      document.removeEventListener('keydown', onKey);
    };
  };
})();
