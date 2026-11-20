/* Sixty-Four — play a game against the bot at a chosen strength. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
  var TRAPS = { scholars: 1, elephant: 1, noahs: 1 };

  /* Plain-language description of a rating setting. */
  CL.botLevel = function (elo) {
    if (CL.brain.usesStockfish(elo)) {
      if (elo >= CL.brain.maxElo()) return { name: 'Stockfish, full strength', detail: 'No limiter at all. You will not win, but you will see how a position should be played.' };
      return { name: elo < 1600 ? 'Club player' : elo < 2000 ? 'Strong club player' : elo < 2300 ? 'Expert' : 'Master',
        detail: 'Stockfish, held back to play at about this rating.' };
    }
    var p = window.ChessAI.profile(Math.min(elo, 1800)), depth = p.deep || p.wide;
    var name = elo < 600 ? 'Just learned the moves' : elo < 850 ? 'Beginner' : elo < 1100 ? 'Casual player'
      : elo < 1350 ? 'Improving player' : elo < 1600 ? 'Club player' : 'Strong club player';
    var slips = p.sigma > 200 ? 'and blunders often' : p.sigma > 100 ? 'and makes regular mistakes'
      : p.sigma > 40 ? 'and slips now and then' : p.sigma > 10 ? 'and rarely slips' : 'and plays the best move it finds';
    return { name: name, detail: 'Looks about ' + depth + ' half-move' + (depth > 1 ? 's' : '') + ' ahead, ' + slips + '.' };
  };

  CL.resultText = function (g) {
    if (g.result === '1/2-1/2') return 'Draw' + (g.reason ? ' by ' + g.reason : '');
    if (g.result === '*') return 'Unfinished';
    var won = (g.result === '1-0') === (g.color === 'w');
    return (won ? 'You won' : 'You lost') + (g.reason ? ' by ' + g.reason : '');
  };

  CL.playView = function (root) {
    var boardHost = h('div.board-host'), cap = h('div.board-caption'), panel = h('div.panel');
    root.appendChild(h('div.lesson', [
      h('header.page-head', [
        h('div.kicker', { text: 'Practice' }),
        h('h1', { text: 'Play the bot' }),
        h('p.lede', { text: 'A sparring partner whose strength you set, from a beginner to Stockfish. Start where you win about half your games, and move the slider up as you improve. Every finished game is saved so you can review it.' })
      ]),
      h('div.lesson-body', [h('div.board-col', [boardHost, cap]), panel])
    ]));
    var board = new Board(boardHost);
    var elo = CL.store.pref('elo', 900), colorPref = CL.store.pref('color', 'w'), aid = CL.store.pref('aid', 'off');
    var game = new Chess(), human = 'w', over = null, thinking = false, token = 0;
    var keys = [], hints = 0, hintMove = null, hintStage = 0, timers = [], opening = '';
    var statusEl, listEl, openEl, noteEl, endEl, bBack, bHint, bResign;

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function posKey() { return game.fen().split(' ').slice(0, 4).join(' '); }

    /* ---------- set-up screen ---------- */
    function setup() {
      token++;
      over = null; thinking = false;
      game = new Chess();
      board.reset();
      board.setOrientation(colorPref === 'b' ? 'b' : 'w');
      board.setPosition(game);
      cap.textContent = '';
      var num = h('span.elo-num'), name = h('b'), detail = h('span.muted');
      var top = h('span', { text: String(CL.brain.maxElo()) }), engineNote = h('p.muted.small.gap');
      elo = Math.min(elo, CL.brain.maxElo());
      var slider = h('input.slider', { type: 'range', min: '400', max: String(CL.brain.maxElo()), step: '50', value: String(elo), 'aria-label': 'Bot rating' });
      var mine = token;
      function engines() {
        engineNote.textContent = CL.brain.hasStockfish()
          ? 'Up to 1300 you play the built-in bot, which makes human-looking mistakes. From 1350 upwards you play Stockfish 19, held back to the rating you choose; the top of the slider removes the limit.'
          : 'Stockfish is not available here (it needs the app to be opened through the local server), so the slider stops at 1800 with the built-in bot.';
      }
      CL.brain.init().then(function () {
        if (mine !== token) return;
        slider.max = String(CL.brain.maxElo());
        top.textContent = String(CL.brain.maxElo());
        engines();
        paint();
      });
      function paint() {
        var L = CL.botLevel(elo);
        num.textContent = elo; name.textContent = L.name; detail.textContent = L.detail;
      }
      slider.addEventListener('input', function () { elo = +slider.value; paint(); });
      panel.innerHTML = '';
      panel.appendChild(h('div.kicker', { text: 'New game' }));
      panel.appendChild(h('h2', { text: 'Choose your opponent' }));
      panel.appendChild(h('div.elo-box', [num, h('div.elo-text', [name, detail])]));
      panel.appendChild(slider);
      panel.appendChild(h('div.slider-scale', [h('span', { text: '400' }), h('span', { text: 'rating' }), top]));
      panel.appendChild(engineNote);
      engines();
      panel.appendChild(h('div.opt-row', [h('span.opt-label', { text: 'You play' }),
        CL.seg([{ v: 'w', label: 'White' }, { v: 'b', label: 'Black' }, { v: 'r', label: 'Random' }], colorPref, function (v) {
          colorPref = v;
          board.setOrientation(v === 'b' ? 'b' : 'w');
        })]));
      panel.appendChild(h('div.opt-row', [h('span.opt-label', { text: 'Board aid' }),
        CL.seg([{ v: 'off', label: 'None' }, { v: 'on', label: 'Control map' }], aid, function (v) { aid = v; })]));
      panel.appendChild(h('p.muted.small.gap', { text: 'The control map is the blue and red overlay from Part 1. Playing with it on for a few games is a good way to train your eye; then turn it off. The rating numbers are approximate, not official.' }));
      panel.appendChild(h('div.step-nav', [
        h('a.btn.ghost', { href: '#/games' }, 'Your games'),
        h('button.btn.primary.big', { text: 'Start the game', onclick: begin })
      ]));
      paint();
    }

    /* ---------- the game ---------- */
    function begin() {
      CL.store.setPref('elo', elo); CL.store.setPref('color', colorPref); CL.store.setPref('aid', aid);
      human = colorPref === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : colorPref;
      token++;
      game = new Chess(); keys = [posKey()]; over = null; thinking = false;
      hints = 0; hintMove = null; hintStage = 0; opening = '';
      board.reset();
      board.setOrientation(human);
      board.setPosition(game);
      board.movable = function (s) {
        if (over || thinking || game.turn !== human) return null;
        var p = game.get(s);
        if (!p || p.color !== human) return null;
        return game.moves({ square: s }).map(function (m) { return m.to; });
      };
      board.onMove = function (from, to, info) {
        var p = game.get(from);
        if (p && p.type === 'p' && (to.charAt(1) === '8' || to.charAt(1) === '1')) {
          askPromotion(function (piece) {
            if (piece) play(from, to, piece, info); else board.setPosition(game);
          });
        } else play(from, to, undefined, info);
      };

      statusEl = h('div.status'); openEl = h('div.muted.small'); listEl = h('div.movelist.scroll');
      noteEl = h('div.feedback', { hidden: true }); endEl = h('div');
      bBack = h('button.btn.small', { text: 'Take back', onclick: takeBack });
      bHint = h('button.btn.small', { text: 'Hint', onclick: hint });
      bResign = h('button.btn.small', { text: 'Resign', onclick: resign });
      panel.innerHTML = '';
      panel.appendChild(h('div.kicker', { text: 'You are ' + (human === 'w' ? 'White' : 'Black') + ' · bot rated about ' + elo }));
      panel.appendChild(statusEl);
      panel.appendChild(openEl);
      panel.appendChild(noteEl);
      panel.appendChild(listEl);
      panel.appendChild(h('div.tools', [bBack, bHint,
        h('button.btn.small', { text: 'Flip board', onclick: function () { board.flip(); } }),
        h('button.btn.small', { text: aid === 'on' ? 'Hide control map' : 'Show control map', onclick: function (e) {
          aid = aid === 'on' ? 'off' : 'on';
          e.target.textContent = aid === 'on' ? 'Hide control map' : 'Show control map';
          update();
        } }),
        bResign]));
      panel.appendChild(endEl);
      update();
      if (game.turn !== human) botTurn();
    }

    function say(msg, kind) { noteEl.className = 'feedback ' + (kind || ''); noteEl.innerHTML = msg ? CL.fmt(msg) : ''; noteEl.hidden = !msg; }

    function bookLines() {
      var hist = game.history().map(CL.stripSan);
      return CL.content.openings.lines.filter(function (l) {
        if (TRAPS[l.id] || hist.length > l.moves.length) return false;
        for (var i = 0; i < hist.length; i++) if (CL.stripSan(l.moves[i][0]) !== hist[i]) return false;
        return true;
      });
    }

    function update() {
      var sans = game.history();
      CL.renderScore(listEl, sans, sans.length);
      listEl.scrollTop = listEl.scrollHeight;
      var lines = sans.length >= 2 ? bookLines() : [];
      if (lines.length === 1) opening = lines[0].name;
      openEl.textContent = lines.length > 1 ? 'Still in the opening book (' + lines.length + ' lines from Part 3 fit).'
        : (opening ? 'Opening: ' + opening + (lines.length ? '' : ' (now out of book)') : '');
      if (over) statusEl.textContent = 'Game over';
      else if (thinking) statusEl.textContent = 'The bot is thinking…';
      else statusEl.textContent = (game.inCheck() ? 'Check! ' : '') + 'Your move';
      cap.textContent = over ? '' : ((game.turn === 'w' ? 'White' : 'Black') + ' to move' + (aid === 'on' ? ' · blue: White controls, red: Black controls' : ''));
      board.setTints(aid === 'on' ? CL.controlMap(game).tints : {});
      bBack.disabled = !!over || thinking || game.hist.length < (game.turn === human ? 2 : 1);
      bHint.disabled = !!over || thinking;
      bResign.disabled = !!over;
    }

    function insufficient() {
      var ps = game.pieces(), minor = 0;
      for (var s in ps) {
        if (ps[s].type === 'k') continue;
        if (ps[s].type === 'n' || ps[s].type === 'b') minor++; else return false;
      }
      return minor <= 1;
    }

    function ended() {
      if (!game._legal().length) {
        return game.inCheck() ? { result: game.turn === 'w' ? '0-1' : '1-0', reason: 'checkmate' } : { result: '1/2-1/2', reason: 'stalemate' };
      }
      if (game.halfmove >= 100) return { result: '1/2-1/2', reason: 'the fifty-move rule' };
      var k = keys[keys.length - 1];
      if (keys.filter(function (x) { return x === k; }).length >= 3) return { result: '1/2-1/2', reason: 'threefold repetition' };
      if (insufficient()) return { result: '1/2-1/2', reason: 'insufficient material' };
      return null;
    }

    function afterMove() {
      keys.push(posKey());
      hintMove = null; hintStage = 0;
      board.setHighlights({});
      board.setArrows([]);
      over = ended();
      update();
      if (over) finish();
    }

    function play(from, to, promo, info) {
      var mv = game.move({ from: from, to: to, promotion: promo });
      if (!mv) { board.setPosition(game); return; }
      board.setPosition(game, info && info.dragged ? null : { animate: { from: from, to: to } });
      board.setLast([from, to]);
      say('');
      afterMove();
      if (!over) botTurn();
    }

    function bookMove() {
      var n = game.history().length, next = {};
      bookLines().forEach(function (l) { if (l.moves.length > n) next[l.moves[n][0]] = 1; });
      var list = Object.keys(next);
      if (!list.length || Math.random() > (elo >= 900 ? 0.9 : 0.55)) return null;
      return CL.pick(list);
    }

    function botTurn() {
      thinking = true;
      update();
      var mine = token, t0 = Date.now(), bk = bookMove();
      var job = bk ? Promise.resolve({ move: bk }) : CL.brain.bot(game.fen(), elo);
      job.then(function (res) {
        later(function () {
          if (mine !== token) return;
          var m = res && res.move;
          var mv = m ? game.move(typeof m === 'string' ? m : { from: m.from, to: m.to, promotion: m.promotion || undefined }) : null;
          thinking = false;
          if (!mv) { update(); return; }
          board.setPosition(game, { animate: { from: mv.from, to: mv.to } });
          board.setLast([mv.from, mv.to]);
          afterMove();
        }, Math.max(0, 450 - (Date.now() - t0)));
      }).catch(function (e) {
        if (mine !== token) return;
        thinking = false;
        update();
        say('The bot could not move: ' + e.message, 'bad');
      });
    }

    function takeBack() {
      if (over || thinking) return;
      var n = game.turn === human ? 2 : 1;
      if (game.hist.length < n) return;
      for (var i = 0; i < n; i++) { game.undo(); keys.pop(); }
      var last = game.lastMove();
      board.setPosition(game);
      board.setLast(last ? [last.from, last.to] : null);
      hintMove = null; hintStage = 0;
      board.setHighlights({}); board.setArrows([]);
      say('');
      update();
    }

    function hint() {
      if (over || thinking || game.turn !== human) return;
      if (hintMove) {
        hintStage = 2;
        board.setArrows([[hintMove.from, hintMove.to, 'yellow']]);
        say('The engine would play `' + hintMove.san + '`.', 'hint');
        return;
      }
      var mine = token, fen = game.fen();
      say('Looking…', 'hint');
      CL.brain.best(fen).then(function (r) {
        if (mine !== token || game.fen() !== fen || !r.best) return;
        hintMove = r.best; hintStage = 1; hints++;
        board.setHighlights({ note: [r.best.from] });
        say('Look at your ' + Chess.PIECE_NAMES[r.best.piece] + ' on `' + r.best.from + '`. Press **Hint** again to see the move.', 'hint');
      }).catch(function () { say(''); });
    }

    function resign() {
      if (over) return;
      if (game.hist.length >= 2 && !window.confirm('Resign this game?')) return;
      token++;
      thinking = false;
      over = { result: human === 'w' ? '0-1' : '1-0', reason: 'resignation' };
      update();
      finish();
    }

    function finish() {
      var rec = { id: Date.now().toString(36), date: new Date().toISOString(), color: human, elo: elo, hints: hints,
        sans: game.history(), result: over.result, reason: over.reason };
      var keep = rec.sans.length >= 8;
      if (keep) CL.games.save(rec);
      var won = over.result !== '1/2-1/2' && (over.result === '1-0') === (human === 'w');
      endEl.innerHTML = '';
      endEl.appendChild(h('div.result' + (over.result === '1/2-1/2' ? '' : (won ? '.won' : '.lost')), [
        h('b', { text: CL.resultText(rec) + '.' }),
        h('span', { text: won ? ' Try the slider a little higher next time.' : (over.result === '1/2-1/2' ? ' A fair fight.' : ' Every loss is a lesson: the review will show you where it turned.') })
      ]));
      endEl.appendChild(h('div.step-nav', [
        h('button.btn.ghost', { text: 'New game', onclick: setup }),
        keep ? h('a.btn.primary', { href: '#/games/' + rec.id }, 'Review this game →')
          : h('span.muted.small', { text: 'Too short to save for review.' })
      ]));
    }

    function askPromotion(done) {
      var box = h('div.promo', { onclick: function (e) { if (e.target === box) close(null); } });
      function close(piece) { boardHost.removeChild(box); done(piece); }
      var row = h('div.promo-row');
      ['q', 'r', 'b', 'n'].forEach(function (t) {
        row.appendChild(h('button.promo-btn', { title: Chess.PIECE_NAMES[t], html: Board.pieceSvg(t), onclick: function () { close(t); } }));
      });
      box.appendChild(h('div.promo-card', [h('div.kicker', { text: 'Promote to' }), row]));
      boardHost.appendChild(box);
    }

    setup();
    return function () {
      token++;
      timers.forEach(clearTimeout);
      CL.brain.cancel();
    };
  };
})();
