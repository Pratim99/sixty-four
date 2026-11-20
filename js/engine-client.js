/* Sixty-Four — talks to the thinking engine (in a web worker when possible, so the page never freezes),
   and keeps the player's saved games and personal puzzles. */
(function () {
  'use strict';

  var CL = window.CL;
  var worker = null, failed = false, seq = 0, pending = {};

  /* This function's source is copied into the worker. */
  function workerMain() {
    self.onmessage = function (e) {
      var d = e.data, AI = self.ChessAI;
      try {
        if (d.type === 'bot') self.postMessage({ id: d.id, done: true, result: AI.botMove(d.fen, d.elo) });
        else if (d.type === 'think') self.postMessage({ id: d.id, done: true, result: AI.think(d.fen, d.opts) });
        else if (d.type === 'review') {
          AI.review(d.start, d.sans, d.side, d.depth, function (r) { self.postMessage({ id: d.id, progress: r }); });
          self.postMessage({ id: d.id, done: true, result: null });
        }
      } catch (err) {
        self.postMessage({ id: d.id, done: true, error: String((err && err.message) || err) });
      }
    };
  }

  function start() {
    if (worker || failed) return worker;
    try {
      var src = 'var __ChessLib=' + window.__ChessLib.toString() + ';__ChessLib(self);' +
        'var __AiLib=' + window.__AiLib.toString() + ';__AiLib(self);(' + workerMain.toString() + ')();';
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = function (e) {
        var d = e.data, p = pending[d.id];
        if (!p) return;
        if (d.progress) { if (p.onProgress) p.onProgress(d.progress); return; }
        delete pending[d.id];
        if (d.error) p.reject(new Error(d.error)); else p.resolve(d.result);
      };
      worker.onerror = function () { failed = true; stop(); };
    } catch (e) { failed = true; worker = null; }
    return worker;
  }

  function stop() {
    if (worker) { try { worker.terminate(); } catch (e) { /* ignore */ } }
    worker = null;
    var old = pending;
    pending = {};
    Object.keys(old).forEach(function (k) { old[k].reject(new Error('cancelled')); });
  }

  /* Same work on the page itself, for browsers that refuse to start the worker. */
  function local(msg, onProgress) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          var AI = window.ChessAI;
          if (msg.type === 'bot') resolve(AI.botMove(msg.fen, msg.elo));
          else if (msg.type === 'think') resolve(AI.think(msg.fen, msg.opts));
          else { AI.review(msg.start, msg.sans, msg.side, msg.depth, onProgress || function () {}); resolve(null); }
        } catch (e) { reject(e); }
      }, 30);
    });
  }

  function ask(msg, onProgress) {
    if (!start()) return local(msg, onProgress);
    return new Promise(function (resolve, reject) {
      msg.id = ++seq;
      pending[msg.id] = { resolve: resolve, reject: reject, onProgress: onProgress };
      worker.postMessage(msg);
    });
  }

  CL.engine = {
    bot: function (fen, elo) { return ask({ type: 'bot', fen: fen, elo: elo }); },
    think: function (fen, opts) { return ask({ type: 'think', fen: fen, opts: opts || {} }); },
    review: function (startFen, sans, side, depth, onProgress) {
      return ask({ type: 'review', start: startFen, sans: sans, side: side, depth: depth }, onProgress);
    },
    cancel: stop
  };

  /* ---------- scores ---------- */

  var MATE = 100000;
  CL.isMateScore = function (s) { return Math.abs(s) > MATE - 500; };
  /* Scores squashed into a range where "how much did that cost" makes sense. */
  CL.softScore = function (s) {
    if (s > MATE - 500) return 2000;
    if (s < -MATE + 500) return -2000;
    return Math.max(-1500, Math.min(1500, s));
  };
  CL.fmtScore = function (s) {
    if (CL.isMateScore(s)) return (s > 0 ? '+' : '−') + 'M' + Math.max(1, Math.ceil((MATE - Math.abs(s)) / 2));
    var v = (Math.abs(s) / 100).toFixed(1);
    return (s > 0 ? '+' : (s < 0 ? '−' : '')) + v;
  };

  /* ---------- Stockfish (optional, much stronger) ----------
     The WebAssembly build in vendor/stockfish runs in its own worker and speaks the UCI protocol.
     It needs the page to be served over http (tools/serve.js); opened as a plain file, the app
     falls back to the built-in engine above. */

  var SF_URL = 'vendor/stockfish/stockfish-19-lite-single.js';
  var sf = null, sfReady = false, sfInit = null, sfQueue = [], sfCurrent = null;

  function sfLine(line) {
    var j = sfCurrent;
    if (!j) return;
    var m = /^info .*?\bdepth (\d+) .*?\bmultipv (\d+) .*?\bscore (cp|mate) (-?\d+)( upperbound| lowerbound)? .*?\bpv (.+)$/.exec(line);
    if (m && !m[5]) {
      var v = +m[4];
      j.lines[+m[2]] = { depth: +m[1], pv: m[6].trim().split(/\s+/),
        score: m[3] === 'cp' ? v : (v > 0 ? MATE - (2 * v - 1) : -MATE + 2 * Math.abs(v)) };
      return;
    }
    m = /^bestmove (\S+)/.exec(line);
    if (m) {
      sfCurrent = null;
      if (j.cancelled) j.reject(new Error('cancelled'));
      else j.resolve({ best: m[1] === '(none)' ? null : m[1], lines: j.lines });
      sfPump();
    }
  }

  function sfPump() {
    if (sfCurrent || !sfQueue.length || !sfReady) return;
    sfCurrent = sfQueue.shift();
    sfCurrent.cmds.forEach(function (c) { sf.postMessage(c); });
  }

  function sfJob(cmds) {
    return new Promise(function (resolve, reject) {
      sfQueue.push({ cmds: cmds, resolve: resolve, reject: reject, lines: {} });
      sfPump();
    });
  }

  function sfFail() {
    sfReady = false;
    if (sf) { try { sf.terminate(); } catch (e) { /* ignore */ } }
    sf = null;
    var all = sfQueue.splice(0);
    if (sfCurrent) all.push(sfCurrent);
    sfCurrent = null;
    all.forEach(function (j) { j.reject(new Error('Stockfish stopped')); });
  }

  function sfStart() {
    if (sfInit) return sfInit;
    sfInit = new Promise(function (resolve) {
      var settled = false, timer = null;
      function finish(ok) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (ok) sfReady = true;
        else { sfFail(); setTimeout(function () { sfInit = null; }, 3000); }   // allow another try later
        resolve(ok);
      }
      if (location.protocol === 'file:' || typeof Worker === 'undefined') return finish(false);
      try {
        sf = new Worker(SF_URL);
        sf.onerror = function () { if (settled) sfFail(); else finish(false); };
        sf.onmessage = function (e) {
          var line = String(e.data);
          if (!settled) { if (line === 'uciok') finish(true); return; }
          sfLine(line);
        };
        sf.postMessage('uci');
        timer = setTimeout(function () { finish(false); }, 12000);
      } catch (e) { finish(false); }
    });
    return sfInit;
  }

  function sfCancel() {
    sfQueue.splice(0).forEach(function (j) { j.reject(new Error('cancelled')); });
    if (sfCurrent && sf) { sfCurrent.cancelled = true; sf.postMessage('stop'); }
  }

  function uciToMove(g, u) {
    return g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.charAt(4) || undefined });
  }

  /* Analyse a position with Stockfish; the answer has the same shape as the built-in engine's. */
  function sfAnalyse(fen, o) {
    o = o || {};
    return sfJob(['setoption name UCI_LimitStrength value false', 'setoption name MultiPV value 1',
      'position fen ' + fen, 'go depth ' + (o.depth || 13) + ' movetime ' + (o.time || 800)]).then(function (r) {
      var g = new Chess(fen), line = r.lines[1];
      if (!r.best) return { best: null, score: g.inCheck() ? -MATE : 0, pv: [], depth: 0 };
      var pv = [], t = new Chess(fen), list = line ? line.pv : [r.best];
      for (var i = 0; i < list.length && i < 8; i++) { var mv = uciToMove(t, list[i]); if (!mv) break; pv.push(mv.san); }
      var best = uciToMove(g, r.best);
      return { best: best, score: line ? line.score : 0, pv: pv, depth: line ? line.depth : 0 };
    });
  }

  var SF_FLOOR = 1350;   // below this rating the built-in bot plays (Stockfish cannot be limited lower than 1320)
  var SF_FULL = 2800;    // at the top of the slider the limiter is switched off

  /* One front door for everything that needs an engine. */
  CL.brain = {
    /* Resolves to true if Stockfish is available. Safe to call often. */
    init: sfStart,
    hasStockfish: function () { return sfReady; },
    name: function () { return sfReady ? 'Stockfish 19' : 'the built-in engine'; },
    maxElo: function () { return sfReady ? SF_FULL : 1800; },
    usesStockfish: function (elo) { return sfReady && elo >= SF_FLOOR; },

    /* Best move and score (for the side to move) in a position. */
    best: function (fen) {
      return sfStart().then(function (ok) {
        return ok ? sfAnalyse(fen, { depth: 18, time: 900 }) : CL.engine.think(fen, { depth: 4, time: 1500 });
      });
    },

    /* The bot's move at a given rating. */
    bot: function (fen, elo) {
      return sfStart().then(function (ok) {
        if (!ok || elo < SF_FLOOR) return CL.engine.bot(fen, Math.min(elo, 1800));
        var full = elo >= SF_FULL, t = Math.round(250 + (elo - SF_FLOOR) / (SF_FULL - SF_FLOOR) * 750);
        return sfJob(['setoption name MultiPV value 1',
          'setoption name UCI_LimitStrength value ' + (full ? 'false' : 'true'),
          'setoption name UCI_Elo value ' + Math.max(1320, Math.min(3190, elo)),
          'position fen ' + fen, 'go movetime ' + t]).then(function (r) {
          if (!r.best) return null;
          return { move: { from: r.best.slice(0, 2), to: r.best.slice(2, 4), promotion: r.best.charAt(4) || null } };
        });
      });
    },

    /* Go through a game: for each move by `side`, the engine's choice and what the played move cost.
       Resolves to the name of the engine that did the work. */
    review: function (sans, side, onRow) {
      return sfStart().then(function (ok) {
        if (!ok) return CL.engine.review(Chess.START, sans, side, 4, onRow).then(function () { return 'built-in'; });
        var g = new Chess(), i = 0;
        function step() {
          if (i >= sans.length) return Promise.resolve('Stockfish 19');
          var ply = i++, mover = g.turn, fen = g.fen(), played = g.move(sans[ply]);
          if (!played) return Promise.resolve('Stockfish 19');
          if (side !== 'both' && mover !== side) return step();
          var after = g.fen(), checked = g.inCheck();
          return sfAnalyse(fen, { depth: 18, time: 700 }).then(function (a) {
            if (!a.best || a.best.san === played.san) return { a: a, b: null };
            return sfAnalyse(after, { depth: 18, time: 700 }).then(function (b) { return { a: a, b: b }; });
          }).then(function (r) {
            var bestScore = r.a.score, playedScore = bestScore, refute = null;
            if (r.b) {
              playedScore = r.b.best ? -r.b.score : (checked ? MATE : 0);
              if (r.b.best) refute = { san: r.b.best.san, captured: r.b.best.captured };
              if (playedScore > bestScore) playedScore = bestScore;
            }
            onRow({ ply: ply, fen: fen, color: mover, san: played.san, from: played.from, to: played.to,
              captured: played.captured, piece: played.piece,
              best: r.a.best ? { san: r.a.best.san, from: r.a.best.from, to: r.a.best.to, captured: r.a.best.captured } : null,
              bestScore: bestScore, playedScore: playedScore, pv: r.a.pv.slice(0, 6), refute: refute });
            return step();
          });
        }
        sf.postMessage('ucinewgame');
        return step();
      });
    },

    cancel: function () { sfCancel(); stop(); }
  };

  /* ---------- saved games and personal puzzles ---------- */

  var GKEY = 'sixtyfour.games.v1', PKEY = 'sixtyfour.mine.v1';
  function read(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } }

  CL.games = {
    all: function () { return read(GKEY); },
    get: function (id) { return read(GKEY).filter(function (g) { return g.id === id; })[0] || null; },
    save: function (game) {
      var list = read(GKEY), at = -1;
      list.forEach(function (g, i) { if (g.id === game.id) at = i; });
      if (at >= 0) list[at] = game; else list.unshift(game);
      write(GKEY, list.slice(0, 40));
    },
    remove: function (id) {
      write(GKEY, read(GKEY).filter(function (g) { return g.id !== id; }));
      write(PKEY, read(PKEY).filter(function (p) { return p.game !== id; }));
    },
    puzzles: function () { return read(PKEY); },
    addPuzzles: function (list) {
      var cur = read(PKEY), have = {};
      cur.forEach(function (p) { have[p.id] = 1; });
      list.forEach(function (p) { if (!have[p.id]) cur.unshift(p); });
      write(PKEY, cur.slice(0, 80));
    },
    clear: function () { write(GKEY, []); write(PKEY, []); }
  };

  /* Turn pasted text (a move list or a PGN) into a list of moves; throws if a move is illegal. */
  CL.parseGameText = function (text) {
    var body = String(text).replace(/\[[^\]]*\]/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/\([^)]*\)/g, ' ')
      .replace(/\$\d+/g, ' ').replace(/\d+\.\.\./g, ' ');
    var sans = Chess.parseMoves(body);
    if (!sans.length) throw new Error('No moves found.');
    var g = Chess.fromMoves(sans);
    var result = (/(1-0|0-1|1\/2-1\/2)/.exec(text) || [])[1] || '*';
    return { sans: g.history(), result: result, mate: g.isCheckmate() };
  };
})();
