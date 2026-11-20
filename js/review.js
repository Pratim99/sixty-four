/* Sixty-Four — your games: the saved list, importing a game, and the move-by-move review. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
    var TAG = {
    blunder: { mark: '??', name: 'Blunder' }, mistake: { mark: '?', name: 'Mistake' },
    inaccuracy: { mark: '?!', name: 'Inaccuracy' }, ok: { mark: '', name: 'Fine' }, best: { mark: '', name: 'Best move' }
  };
  var SVGNS = 'http://www.w3.org/2000/svg';

  function moveNo(ply) { return Math.floor(ply / 2) + 1; }
  function label(ply, san) { return moveNo(ply) + (ply % 2 === 0 ? '. ' : '… ') + san; }
  function pawns(cp) { return (cp / 100).toFixed(1); }

  function classify(r) {
    var best = CL.softScore(r.bestScore), played = CL.softScore(r.playedScore), loss = Math.max(0, best - played);
    var tag = loss >= 300 ? 'blunder' : loss >= 120 ? 'mistake' : loss >= 50 ? 'inaccuracy' : (r.best && r.best.san === r.san ? 'best' : 'ok');
    var missedMate = CL.isMateScore(r.bestScore) && r.bestScore > 0 && !(CL.isMateScore(r.playedScore) && r.playedScore > 0);
    // When the game was already decided either way, a slip matters less.
    if (!missedMate && (played > 700 || best < -700)) {
      if (tag === 'blunder') tag = 'mistake'; else if (tag === 'mistake') tag = 'inaccuracy';
    }
    return { loss: loss, tag: tag, missedMate: missedMate };
  }

  function summarise(rows) {
    var out = { rows: [], counts: { blunder: 0, mistake: 0, inaccuracy: 0 }, acc: 0, acpl: 0 }, accSum = 0, lossSum = 0;
    rows.forEach(function (r) {
      var c = classify(r);
      r.loss = c.loss; r.tag = c.tag; r.missedMate = c.missedMate;
      if (out.counts[c.tag] != null) out.counts[c.tag]++;
      accSum += 100 * Math.exp(-c.loss / 200);
      lossSum += Math.min(c.loss, 1000);
      out.rows.push(r);
    });
    out.acc = rows.length ? Math.round(accSum / rows.length) : 0;
    out.acpl = rows.length ? Math.round(lossSum / rows.length) : 0;
    return out;
  }

  /* Coaching notes: what the review says about habits, each tied to a lesson. */
  function insights(game, rv) {
    var notes = [], g = new Chess(), n = 0, castledAt = 0, queenMoves = 0, repeats = 0, landed = {}, home = -1, i;
    var homeSq = game.color === 'w' ? { b1: 'n', g1: 'n', c1: 'b', f1: 'b' } : { b8: 'n', g8: 'n', c8: 'b', f8: 'b' };
    for (i = 0; i < game.sans.length; i++) {
      var mv = g.move(game.sans[i]);
      if (!mv) break;
      if (mv.color !== game.color) continue;
      n++;
      if ((mv.flag === 'k' || mv.flag === 'q') && !castledAt) castledAt = n;
      if (n <= 8) {
        if (mv.piece === 'q') queenMoves++;
        if (mv.piece !== 'p' && mv.piece !== 'k' && !mv.captured && landed[mv.from]) repeats++;
        landed[mv.to] = 1;
      }
      if (n === 10) {
        home = 0;
        for (var s in homeSq) { var p = g.get(s); if (p && p.color === game.color && p.type === homeSq[s]) home++; }
      }
    }
    var op = '#/openings/lesson/principles';
    if (n >= 12 && (!castledAt || castledAt > 12)) notes.push({ text: castledAt ? 'You castled late, on move ' + castledAt + '.' : 'You never castled.', why: 'A king in the centre is the first thing a stronger opponent attacks.', href: op, link: 'Opening principles' });
    if (home >= 2) notes.push({ text: home + ' of your knights and bishops were still on their starting squares after move 10.', why: 'Pieces at home are not playing.', href: op, link: 'Opening principles' });
    if (queenMoves >= 2) notes.push({ text: 'Your queen moved ' + queenMoves + ' times in the first eight moves.', why: 'An early queen gets chased while the other side develops.', href: op, link: 'Opening principles' });
    if (repeats >= 2) notes.push({ text: 'You moved an already-developed piece again ' + repeats + ' times in the first eight moves.', why: 'Each repeat is a move not spent bringing out a new piece.', href: op, link: 'Opening principles' });

    function nums(list) { return (list.length === 1 ? 'move ' : 'moves ') + list.map(function (r) { return moveNo(r.ply); }).join(', '); }
    var hung = rv.rows.filter(function (r) { return (r.tag === 'blunder' || r.tag === 'mistake') && r.refute && r.refute.captured && r.refute.captured !== 'p'; });
    var missed = rv.rows.filter(function (r) { return r.loss >= 150 && !r.missedMate && hung.indexOf(r) < 0 && r.best && (r.best.captured || /\+/.test(r.best.san)); });
    var mates = rv.rows.filter(function (r) { return r.missedMate; });
    var walked = rv.rows.filter(function (r) { return CL.isMateScore(r.playedScore) && r.playedScore < 0 && !(CL.isMateScore(r.bestScore) && r.bestScore < 0); });
    if (hung.length) notes.push({ text: 'You left a piece where it could be taken ' + (hung.length === 1 ? 'once' : hung.length + ' times') + ' (' + nums(hung) + ').', why: 'Before letting go of a piece, look at every capture your opponent has.', href: '#/strategy/lesson/plan', link: 'The blunder check' });
    if (missed.length) notes.push({ text: 'You passed up a winning capture or check ' + (missed.length === 1 ? 'once' : missed.length + ' times') + ' (' + nums(missed) + ').', why: 'Look at checks and captures first, every move.', href: '#/tactics/lesson/greek', link: 'How to look for tactics' });
    if (mates.length) notes.push({ text: (mates.length === 1 ? 'There was a forced checkmate you did not play' : 'More than once there was a forced checkmate you did not play') + ' (' + nums(mates) + ').', why: 'Mates are patterns. The more of them you know, the more you see.', href: '#/mates', link: 'Checkmate patterns' });
    if (walked.length) notes.push({ text: 'You walked into a forced mate' + (walked.length === 1 ? '' : ' more than once') + ' (' + nums(walked) + ').', why: 'Check your own king’s escape squares as often as you check theirs.', href: '#/strategy/lesson/king', link: 'King safety' });
    if (!notes.length) notes.push({ text: rv.acc >= 80 ? 'A clean game: no opening lapses and nothing left hanging.' : 'No single habit stands out. The slips were small ones spread through the game.', why: 'Step through the marked moves to see where the evaluation moved.', href: null });
    return notes;
  }

  function puzzlesFrom(game, rv) {
    return rv.rows.filter(function (r) {
      return r.loss >= 150 && r.best && r.best.san !== r.san && CL.softScore(r.bestScore) > -200;
    }).map(function (r) {
      return { id: game.id + '-' + r.ply, game: game.id, fen: r.fen, solution: [r.best.san], played: r.san,
        loss: r.loss, bestScore: r.bestScore, missedMate: !!r.missedMate,
        mated: CL.isMateScore(r.playedScore) && r.playedScore < 0, line: (r.pv || []).slice(0, 4).join(' '), move: moveNo(r.ply) };
    });
  }

  function describe(game) {
    var who = game.imported ? 'Imported game' : 'Bot rated about ' + game.elo;
    return who + ' · you were ' + (game.color === 'w' ? 'White' : 'Black') + ' · ' + CL.resultText(game) +
      ' · ' + Math.ceil(game.sans.length / 2) + (game.sans.length <= 2 ? ' move' : ' moves');
  }

  /* ================= the list ================= */

  CL.gamesView = function (root) {
    var el = h('div.chapter');
    root.appendChild(el);
    el.appendChild(h('header.page-head', [
      h('div.kicker', { text: 'Practice' }),
      h('h1', { text: 'Your games' }),
      h('p.lede', { text: 'Every game you finish against the bot is kept here. Open one to have the engine go through your moves, mark the mistakes, explain what was better, and turn the worst moments into puzzles.' })
    ]));

    var listBox = h('div.cards');
    function paint() {
      var games = CL.games.all();
      listBox.innerHTML = '';
      if (!games.length) {
        listBox.appendChild(h('div.card', [h('p', { text: 'No games yet.' }), h('a.btn.primary', { href: '#/play' }, 'Play the bot →')]));
        return;
      }
      games.forEach(function (g) {
        var rv = g.review, d = new Date(g.date);
        var meta = rv ? rv.acc + '% accuracy · ' + rv.counts.blunder + ' blunder' + (rv.counts.blunder === 1 ? '' : 's') : 'Not reviewed yet';
        listBox.appendChild(h('a.card.link' + (rv ? '.done' : ''), { href: '#/games/' + g.id }, [
          h('span.card-num', { text: rv ? rv.acc : '?' }),
          h('span.card-body', [h('b', { text: CL.resultText(g) + (g.imported ? ' (imported)' : ' against the ' + g.elo + ' bot') }),
            h('span', { text: 'You were ' + (g.color === 'w' ? 'White' : 'Black') + ' · ' + Math.ceil(g.sans.length / 2) + ' moves · ' + (isNaN(d) ? '' : d.toLocaleDateString()) }),
            h('span.mono', { text: CL.lineSummary(g.sans, 8) })]),
          h('span.card-meta', { text: meta })
        ]));
      });
    }
    el.appendChild(h('h2.section', { text: 'Saved games' }));
    el.appendChild(listBox);
    paint();

    el.appendChild(h('h2.section', { text: 'Review a game played somewhere else' }));
    var color = 'w', msg = h('div.feedback', { hidden: true });
    var area = h('textarea.paste', { rows: '5', spellcheck: 'false', placeholder: 'Paste the moves or a PGN here, for example:  1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 …' });
    el.appendChild(h('div.card', [
      h('p.muted', { text: 'Any game in standard notation works: from a website, an app, or a scoresheet you typed in.' }),
      area,
      h('div.opt-row', [h('span.opt-label', { text: 'I played' }),
        CL.seg([{ v: 'w', label: 'White' }, { v: 'b', label: 'Black' }], 'w', function (v) { color = v; })]),
      msg,
      h('div.step-nav', [h('span'), h('button.btn.primary', { text: 'Add and review', onclick: function () {
        try {
          var parsed = CL.parseGameText(area.value);
          var rec = { id: Date.now().toString(36), date: new Date().toISOString(), color: color, elo: null, imported: true,
            sans: parsed.sans, result: parsed.result, reason: parsed.mate ? 'checkmate' : '' };
          if (parsed.mate && parsed.result === '*') rec.result = parsed.sans.length % 2 ? '1-0' : '0-1';
          CL.games.save(rec);
          location.hash = '#/games/' + rec.id;
        } catch (e) {
          msg.className = 'feedback bad';
          msg.textContent = 'Could not read that game. ' + e.message;
          msg.hidden = false;
        }
      } })])
    ]));
  };

  /* ================= one game ================= */

  CL.reviewView = function (root, id) {
    var game = CL.games.get(id);
    if (!game) {
      root.appendChild(h('div.chapter', [h('header.page-head', [h('h1', { text: 'That game is not saved here.' }), h('p.lede', [h('a', { href: '#/games' }, 'Back to your games')])])]));
      return null;
    }
    var boardHost = h('div.board-host'), cap = h('div.board-caption'), panel = h('div.panel');
    root.appendChild(h('div.lesson', [
      h('header.page-head', [
        h('a.crumb', { href: '#/games' }, '← Your games'),
        h('h1', { text: 'Game review' }),
        h('p.page-sub', { text: describe(game) })
      ]),
      h('div.lesson-body', [h('div.board-col', [boardHost, cap]), panel])
    ]));
    var board = new Board(boardHost, { orient: game.color });
    var replay = new Chess(), fens = [replay.fen()], moves = [], alive = true, at = 0, byPly = {}, goFn = null;
    game.sans.forEach(function (s) { var m = replay.move(s); if (m) { moves.push(m); fens.push(replay.fen()); } });
    board.setPosition(fens[0]);

    function analyse() {
      var rows = [], total = moves.filter(function (m) { return m.color === game.color; }).length;
      var bar = h('i'), text = h('p.muted', { text: 'Starting the engine…' });
      panel.innerHTML = '';
      panel.appendChild(h('div.kicker', { text: 'Analysing' }));
      panel.appendChild(h('h2', { text: 'Going through your moves' }));
      panel.appendChild(h('div.timebar', [bar]));
      bar.style.width = '0%';
      panel.appendChild(text);
      var how = h('p.muted.small', { text: 'For each of your moves the engine finds its own choice and compares the two.' });
      panel.appendChild(how);
      CL.brain.init().then(function (ok) {
        how.textContent = ok ? 'Stockfish 19 is checking each of your moves against its own choice. It looks up to 18 half-moves deep, with at most a second or so per move.'
          : 'The built-in engine is checking each of your moves against its own choice. It is a decent club player, not a grandmaster. Open the app through the local server to have Stockfish do this instead.';
      });
      CL.brain.review(game.sans, game.color, function (r) {
        if (!alive) return;
        rows.push(r);
        bar.style.width = Math.round(rows.length / Math.max(1, total) * 100) + '%';
        text.textContent = 'Move ' + moveNo(r.ply) + ' of ' + Math.ceil(game.sans.length / 2) + '…';
        board.setPosition(r.fen);
      }).then(function (engineName) {
        if (!alive) return;
        game.review = summarise(rows);
        game.review.engine = engineName;
        CL.games.save(game);
        CL.games.addPuzzles(puzzlesFrom(game, game.review));
        show();
      }).catch(function (e) {
        if (!alive) return;
        text.textContent = 'The analysis stopped: ' + e.message;
      });
    }

    function graph(rv) {
      var n = Math.max(1, moves.length), pts = [];
      rv.rows.forEach(function (r) {
        var sign = r.color === 'w' ? 1 : -1;
        pts.push([r.ply, sign * CL.softScore(r.bestScore)]);
        pts.push([r.ply + 1, sign * CL.softScore(r.playedScore)]);
      });
      pts.sort(function (a, b) { return a[0] - b[0]; });
      function X(p) { return (p / n * 100).toFixed(2); }
      function Y(v) { return (20 - Math.max(-800, Math.min(800, v)) / 800 * 18).toFixed(2); }
      var svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', '0 0 100 40');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'evalgraph');
      var line = pts.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ');
      var first = pts.length ? X(pts[0][0]) : 0, last = pts.length ? X(pts[pts.length - 1][0]) : 100;
      var html = '<rect x="0" y="0" width="100" height="20" class="g-top"/><rect x="0" y="20" width="100" height="20" class="g-bot"/>' +
        '<polygon class="g-area" points="' + first + ',20 ' + line + ' ' + last + ',20"/>' +
        '<line x1="0" y1="20" x2="100" y2="20" class="g-zero"/><polyline class="g-line" points="' + line + '"/>';
      rv.rows.forEach(function (r) {
        if (r.tag !== 'blunder' && r.tag !== 'mistake') return;
        html += '<circle class="g-dot ' + r.tag + '" cx="' + X(r.ply + 1) + '" cy="' + Y((r.color === 'w' ? 1 : -1) * CL.softScore(r.playedScore)) + '" r="1.3"/>';
      });
      html += '<line class="g-cursor" x1="0" y1="0" x2="0" y2="40"/>';
      svg.innerHTML = html;
      svg.addEventListener('click', function (e) {
        var rc = svg.getBoundingClientRect();
        if (goFn) goFn(Math.round((e.clientX - rc.left) / rc.width * n));
      });
      return svg;
    }

    function detail(r) {
      var t = TAG[r.tag], head = '**' + label(r.ply, r.san) + t.mark + '** — ';
      if (r.tag === 'best') return head + 'the engine’s first choice too.';
      if (r.tag === 'ok') return head + 'a fine move.' + (r.best && r.loss >= 15 ? ' The engine slightly preferred `' + r.best.san + '`.' : '');
      var s = head + t.name.toLowerCase() + '. ';
      if (r.missedMate) s += 'There was a forced checkmate here. ';
      else if (CL.isMateScore(r.playedScore) && r.playedScore < 0) s += 'This allows a forced checkmate. ';
      else s += 'It cost about ' + pawns(r.loss) + ' pawns. ';
      if (r.best) s += 'Better was `' + r.best.san + '`' + (r.pv && r.pv.length > 2 ? ' (the line could go ' + r.pv.slice(0, 4).join(' ') + ')' : '') + '. ';
      if (r.refute) s += 'After your move, `' + r.refute.san + '` ' + (r.refute.captured && r.refute.captured !== 'p' ? 'wins material.' : 'is the strong reply.');
      return s;
    }

    function show() {
      var rv = game.review, notes = insights(game, rv), mine = puzzlesFrom(game, rv).length;
      byPly = {};
      rv.rows.forEach(function (r) { byPly[r.ply] = r; });
      var flagged = rv.rows.filter(function (r) { return r.tag === 'blunder' || r.tag === 'mistake'; });
      var note = h('div.move-note'), list = h('div.movelist.scroll'), svg = graph(rv), cursor = svg.querySelector('.g-cursor');
      var btns = moves.map(function (m, k) {
        var r = byPly[k];
        if (k % 2 === 0) list.appendChild(h('span.mnum', { text: (k / 2 + 1) + '.' }));
        var b = h('button.mbtn' + (r && r.tag !== 'ok' && r.tag !== 'best' ? '.tag-' + r.tag : ''), { text: m.san + (r ? TAG[r.tag].mark : ''), onclick: function () { go(k + 1); } });
        list.appendChild(b);
        return b;
      });
      var bFirst = h('button.btn.icon', { title: 'Start', text: '«', onclick: function () { go(0); } });
      var bPrev = h('button.btn.icon', { title: 'Previous (←)', text: '‹', onclick: function () { go(at - 1); } });
      var bNext = h('button.btn.icon.go', { title: 'Next (→)', text: 'Next move ›', onclick: function () { go(at + 1); } });
      var bFlag = h('button.btn.icon', { title: 'Jump to your next mistake', text: 'Next mistake', onclick: function () {
        var nx = flagged.filter(function (r) { return r.ply + 1 > at; })[0] || flagged[0];
        if (nx) go(nx.ply + 1);
      } });
      bFlag.disabled = !flagged.length;

      panel.innerHTML = '';
      panel.appendChild(h('div.tiles', [
        h('div.tile', [h('b', { text: rv.acc + '%' }), h('span', { text: 'accuracy' })]),
        h('div.tile.t-blunder', [h('b', { text: rv.counts.blunder }), h('span', { text: 'blunders' })]),
        h('div.tile.t-mistake', [h('b', { text: rv.counts.mistake }), h('span', { text: 'mistakes' })]),
        h('div.tile.t-inaccuracy', [h('b', { text: rv.counts.inaccuracy }), h('span', { text: 'inaccuracies' })])
      ]));
      panel.appendChild(h('div.graph-wrap', [svg, h('div.graph-key', [h('span', { text: '↑ White' }), h('span', { text: 'click to jump' }), h('span', { text: 'Black ↓' })])]));
      panel.appendChild(h('div.line-ctl', [bFirst, bPrev, bNext, bFlag]));
      panel.appendChild(note);
      panel.appendChild(list);

      var by = h('p.muted.small.gap', { text: 'Reviewed by ' + (rv.engine === 'Stockfish 19' ? 'Stockfish 19' : 'the built-in engine') + '.' });
      panel.appendChild(by);
      if (rv.engine !== 'Stockfish 19') {
        CL.brain.init().then(function (ok) {
          if (!ok || !alive) return;
          by.appendChild(document.createTextNode(' '));
          by.appendChild(h('button.btn.small', { text: 'Review again with Stockfish', onclick: function () { goFn = null; analyse(); } }));
        });
      }
      panel.appendChild(h('div.kicker.sub', { text: 'What to work on' }));
      var nl = h('div.coach');
      notes.forEach(function (nt) {
        nl.appendChild(h('div.coach-note', [h('b', { text: nt.text }), h('span', { text: ' ' + nt.why + ' ' }),
          nt.href ? h('a', { href: nt.href }, nt.link + ' →') : null]));
      });
      panel.appendChild(nl);
      panel.appendChild(h('div.step-nav', [
        h('button.btn.ghost.small', { text: 'Delete this game', onclick: function () {
          if (window.confirm('Delete this game and its puzzles?')) { CL.games.remove(game.id); location.hash = '#/games'; }
        } }),
        mine ? h('a.btn.primary', { href: '#/puzzles/mine' }, 'Practise your ' + mine + ' mistake' + (mine === 1 ? '' : 's') + ' →')
          : h('a.btn.primary', { href: '#/play' }, 'Play again →')
      ]));

      function go(k) {
        k = Math.max(0, Math.min(moves.length, k));
        var fwd = k === at + 1, mv = moves[k - 1], r = byPly[k - 1], next = byPly[k];
        at = k;
        board.setPosition(fens[k], fwd && mv ? { animate: { from: mv.from, to: mv.to } } : null);
        board.setLast(mv ? [mv.from, mv.to] : null);
        btns.forEach(function (b, j) { b.classList.toggle('on', j === k - 1); });
        if (btns[k - 1]) list.scrollTop = Math.max(0, btns[k - 1].offsetTop - list.offsetTop - 60);
        bFirst.disabled = bPrev.disabled = k === 0;
        bNext.disabled = k === moves.length;
        cursor.setAttribute('x1', k / Math.max(1, moves.length) * 100);
        cursor.setAttribute('x2', k / Math.max(1, moves.length) * 100);
        var arrows = [];
        if (r && r.best && r.best.san !== r.san && r.tag !== 'ok') arrows.push([r.best.from, r.best.to, 'green']);
        board.setArrows(arrows);
        board.setHighlights(r && (r.tag === 'blunder' || r.tag === 'mistake') ? { bad: [r.to] } : {});
        if (!mv) note.innerHTML = '<p class="muted">Step through the game, or jump straight to your mistakes. A green arrow shows what the engine preferred.</p>';
        else if (r) note.innerHTML = CL.fmt(detail(r));
        else note.innerHTML = CL.fmt('**' + label(k - 1, mv.san) + '** — ' + (game.imported ? 'your opponent’s move.' : 'the bot’s move.'));
        var score = r ? (r.color === 'w' ? 1 : -1) * r.playedScore : (next ? (next.color === 'w' ? 1 : -1) * next.bestScore : null);
        cap.textContent = score == null ? '' : 'Engine: ' + CL.fmtScore(score) + (Math.abs(CL.softScore(score)) < 40 ? ' (level)' : (score > 0 ? ' (White is better)' : ' (Black is better)'));
      }
      goFn = go;
      go(flagged.length ? flagged[0].ply + 1 : 0);
    }

    function onKey(e) {
      if (!goFn || (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return;
      if (e.key === 'ArrowRight') { goFn(at + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { goFn(at - 1); e.preventDefault(); }
    }
    document.addEventListener('keydown', onKey);
    if (game.review) show(); else analyse();

    return function () {
      alive = false;
      document.removeEventListener('keydown', onKey);
      CL.brain.cancel();
    };
  };
})();
