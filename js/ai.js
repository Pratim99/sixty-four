/* Sixty-Four — the thinking engine.
   Alpha-beta search with a material + piece-square evaluation. Used for:
     - the bot (strength scaled by an approximate Elo setting)
     - reviewing games (how much did each move cost?)
     - generating and checking puzzles
   Runs in the page, in a web worker, or under Node. Scores are in centipawns for the side to move. */
var __AiLib = function (root) {
  'use strict';

  var Chess = root.Chess || (typeof require === 'function' ? require('./chess.js') : null);
  var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  var MATE = 100000, INF = 1000000;

  /* Piece-square tables, written from White's side with rank 8 on the top row. */
  var PST = {
    p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
    b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
    r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
    q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
    ke: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50]
  };

  function evaluate(g) {
    var b = g.board, s = 0, i, p, v, npW = 0, npB = 0, kW = -1, kB = -1;
    for (i = 0; i < 64; i++) {
      p = b[i];
      if (!p) continue;
      if (p.type === 'k') { if (p.color === 'w') kW = i; else kB = i; continue; }
      if (p.color === 'w') {
        v = VAL[p.type] + PST[p.type][(7 - (i >> 3)) * 8 + (i & 7)];
        s += v;
        if (p.type !== 'p') npW += VAL[p.type];
      } else {
        v = VAL[p.type] + PST[p.type][(i >> 3) * 8 + (i & 7)];
        s -= v;
        if (p.type !== 'p') npB += VAL[p.type];
      }
    }
    var kt = (npW <= 1300 && npB <= 1300) ? PST.ke : PST.k;
    if (kW >= 0) s += kt[(7 - (kW >> 3)) * 8 + (kW & 7)];
    if (kB >= 0) s -= kt[(kB >> 3) * 8 + (kB & 7)];
    // With a big lead against a nearly bare king: drive it to the edge and bring the kings together.
    if (kW >= 0 && kB >= 0 && (s > 300 ? npB <= 330 : (s < -300 ? npW <= 330 : false))) {
      var loser = s > 0 ? kB : kW;
      var edge = Math.max(Math.abs(2 * (loser & 7) - 7), Math.abs(2 * (loser >> 3) - 7));
      var dist = Math.max(Math.abs((kW & 7) - (kB & 7)), Math.abs((kW >> 3) - (kB >> 3)));
      var bonus = edge * 7 + (8 - dist) * 9;
      s += s > 0 ? bonus : -bonus;
    }
    return g.turn === 'w' ? s : -s;
  }

  /* ---------- search state ---------- */
  var nodes, stopAt, stopped, killers, history, prevPv, maxPly;

  function same(a, b) { return a && b && a.from === b.from && a.to === b.to && a.promotion === b.promotion; }

  function order(ms, ply, pvMove) {
    var k = killers[ply], i, m, s;
    for (i = 0; i < ms.length; i++) {
      m = ms[i];
      if (pvMove && same(m, pvMove)) s = 1e7;
      else if (m.captured) s = 1e6 + VAL[m.captured] * 10 - VAL[m.piece];
      else if (m.promotion === 'q') s = 9e5;
      else if (k && (same(m, k[0]) || same(m, k[1]))) s = 8e5;
      else s = history[(m.color === 'w' ? 0 : 4096) + m.from * 64 + m.to] || 0;
      m._s = s;
    }
    ms.sort(function (a, b) { return b._s - a._s; });
  }

  function quiesce(g, alpha, beta, ply, qd) {
    nodes++;
    var us = g.turn, them = us === 'w' ? 'b' : 'w';
    var inCheck = qd < 2 && g._attacked(g._king(us), them);
    if (!inCheck) {
      var stand = evaluate(g);
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      if (qd >= 8) return alpha;
    }
    var ms = g._gen(), i, m, sc, legal = 0;
    if (!inCheck) ms = ms.filter(function (x) { return x.captured || x.promotion === 'q'; });
    for (i = 0; i < ms.length; i++) { m = ms[i]; m._s = m.captured ? VAL[m.captured] * 10 - VAL[m.piece] : 0; }
    ms.sort(function (a, b) { return b._s - a._s; });
    for (i = 0; i < ms.length; i++) {
      m = ms[i];
      g._make(m);
      if (g._attacked(g._king(us), them)) { g._unmake(); continue; }
      legal++;
      sc = -quiesce(g, -beta, -alpha, ply + 1, qd + 1);
      g._unmake();
      if (sc >= beta) return sc;
      if (sc > alpha) alpha = sc;
    }
    if (inCheck && !legal) return -MATE + ply;
    return alpha;
  }

  function negamax(g, depth, alpha, beta, ply, pv, onPv) {
    if ((++nodes & 1023) === 0 && Date.now() > stopAt) stopped = true;
    if (stopped) return 0;
    var us = g.turn, them = us === 'w' ? 'b' : 'w';
    var inCheck = g._attacked(g._king(us), them);
    if (inCheck && ply < maxPly) depth++;
    if (depth <= 0) return quiesce(g, alpha, beta, ply, 0);
    if (g.halfmove >= 100) return 0;

    var ms = g._gen(), pvMove = onPv ? prevPv[ply] : null, i, m, sc, legal = 0, best = -INF, child = [];
    order(ms, ply, pvMove);
    for (i = 0; i < ms.length; i++) {
      m = ms[i];
      g._make(m);
      if (g._attacked(g._king(us), them)) { g._unmake(); continue; }
      legal++;
      child.length = 0;
      sc = -negamax(g, depth - 1, -beta, -alpha, ply + 1, child, onPv && same(m, pvMove));
      g._unmake();
      if (stopped) return 0;
      if (sc > best) {
        best = sc;
        if (sc > alpha) {
          alpha = sc;
          pv.length = 0;
          pv.push(m);
          for (var j = 0; j < child.length; j++) pv.push(child[j]);
          if (alpha >= beta) {
            if (!m.captured) {
              var k = killers[ply] || (killers[ply] = [null, null]);
              if (!same(k[0], m)) { k[1] = k[0]; k[0] = m; }
              history[(us === 'w' ? 0 : 4096) + m.from * 64 + m.to] = (history[(us === 'w' ? 0 : 4096) + m.from * 64 + m.to] || 0) + depth * depth;
            }
            break;
          }
        }
      }
    }
    if (!legal) return inCheck ? -MATE + ply : 0;
    return best;
  }

  function toPub(g, m, legal) {
    return { from: Chess.sq(m.from), to: Chess.sq(m.to), promotion: m.promotion, piece: m.piece,
      captured: m.captured, san: g._san(m, legal) };
  }

  function pvToSan(g, pv) {
    var c = new Chess(g.fen()), out = [];
    for (var i = 0; i < pv.length; i++) {
      var r = c.move({ from: Chess.sq(pv[i].from), to: Chess.sq(pv[i].to), promotion: pv[i].promotion || undefined });
      if (!r) break;
      out.push(r.san);
    }
    return out;
  }

  /* Search a position.  o.depth: max depth.  o.time: ms budget.  o.all: exact scores for every move. */
  function think(fen, o) {
    o = o || {};
    var g = new Chess(fen), maxDepth = o.depth || 4, all = !!o.all;
    nodes = 0; stopped = false; killers = []; history = []; prevPv = [];
    stopAt = Date.now() + (o.time || 5000);
    var legal = g._legal();
    if (!legal.length) return { best: null, score: g.inCheck() ? -MATE : 0, depth: 0, pv: [], lines: [], nodes: 0 };
    order(legal, 0, null);
    var rootMoves = legal.slice(), snapshot = null, done = 0, d, i;

    for (d = 1; d <= maxDepth; d++) {
      var alpha = -INF, results = [];
      maxPly = d + 6;
      prevPv = snapshot ? snapshot[0].pv : [];
      for (i = 0; i < rootMoves.length; i++) {
        var m = rootMoves[i], child = [];
        g._make(m);
        var sc = -negamax(g, d - 1, -INF, all ? INF : -alpha, 1, child, i === 0);
        g._unmake();
        if (stopped) break;
        results.push({ m: m, score: sc, pv: [m].concat(child) });
        if (sc > alpha) alpha = sc;
      }
      if (stopped) { if (!snapshot && results.length) { results.sort(function (a, b) { return b.score - a.score; }); snapshot = results; done = d; } break; }
      results.sort(function (a, b) { return b.score - a.score; });
      snapshot = results;
      rootMoves = results.map(function (r) { return r.m; });
      done = d;
      if (Math.abs(results[0].score) > MATE - 200) break;
      if (Date.now() > stopAt) break;
    }
    if (!snapshot) snapshot = [{ m: legal[0], score: 0, pv: [legal[0]] }];
    var top = snapshot[0];
    return {
      best: toPub(g, top.m, legal), score: top.score, depth: done, nodes: nodes, pv: pvToSan(g, top.pv),
      lines: all ? snapshot.map(function (r) { return { move: toPub(g, r.m, legal), score: r.score }; }) : null
    };
  }

  /* ---------- the bot ---------- */

  function gauss() {
    var u = 0;
    while (!u) u = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
  }
  function soft(s) { return s > 3000 ? 3000 : (s < -3000 ? -3000 : s); }

  /* How the Elo setting maps onto search depth and error size. */
  function profile(elo) {
    var t = Math.max(0, Math.min(1, (elo - 400) / 1400));
    return {
      t: t,
      sigma: 330 * Math.pow(1 - t, 1.5),              // random error added to each move's score, in centipawns
      wide: elo < 700 ? 1 : (elo < 1150 ? 2 : 3),      // depth at which every move is scored
      deep: elo < 1250 ? 0 : (elo < 1450 ? 4 : (elo < 1650 ? 5 : 6)), // extra depth for the main line
      time: 350 + 1200 * t
    };
  }

  /* Choose a move the way a player of roughly this rating might. */
  function botMove(fen, elo) {
    var p = profile(elo);
    var base = think(fen, { depth: p.wide, all: true, time: 4000 });
    if (!base.best) return null;
    var lines = base.lines, topScore = lines[0].score, pick = lines[0], i;
    if (p.deep) {
      var deep = think(fen, { depth: p.deep, time: p.time });
      for (i = 0; i < lines.length; i++) {
        if (lines[i].move.san === deep.best.san) {
          lines[i].score = Math.max(lines[i].score, topScore) + 1;
          pick = lines[i];
          topScore = lines[i].score;
        }
      }
    }
    if (p.sigma >= 10 && !(elo >= 700 && topScore > MATE - 10)) {
      var bestV = -INF, cap = 150 + p.sigma * 2.2;
      for (i = 0; i < lines.length; i++) {
        if (soft(topScore) - soft(lines[i].score) > cap) continue;
        var v = soft(lines[i].score) + gauss() * p.sigma;
        if (v > bestV) { bestV = v; pick = lines[i]; }
      }
    }
    return { move: pick.move, score: pick.score, best: lines[0].move.san };
  }

  /* ---------- game review ---------- */

  /* For each move by `side` ('w', 'b' or 'both'): the engine's best move and what the played move cost. */
  function review(startFen, sans, side, depth, onPly) {
    var g = new Chess(startFen || Chess.START);
    for (var i = 0; i < sans.length; i++) {
      var mover = g.turn, fen = g.fen();
      var played = g.move(sans[i]);
      if (!played) break;
      if (side !== 'both' && mover !== side) continue;
      var res = think(fen, { depth: depth, time: 2500 });
      var bestScore = res.score, playedScore = bestScore, refute = null;
      if (res.best && res.best.san !== played.san) {
        var r2 = think(g.fen(), { depth: Math.max(1, depth - 1), time: 2000 });
        playedScore = r2.best ? -r2.score : (g.inCheck() ? MATE : 0);
        if (r2.best) refute = { san: r2.best.san, captured: r2.best.captured };
        if (playedScore > bestScore) playedScore = bestScore;
      }
      onPly({ ply: i, fen: fen, color: mover, san: played.san, from: played.from, to: played.to,
        captured: played.captured, piece: played.piece,
        best: res.best ? { san: res.best.san, from: res.best.from, to: res.best.to, captured: res.best.captured } : null,
        bestScore: bestScore, playedScore: playedScore, pv: res.pv.slice(0, 6), refute: refute });
    }
  }

  root.ChessAI = { think: think, botMove: botMove, review: review, evaluate: evaluate, profile: profile, MATE: MATE, VAL: VAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.ChessAI;
};
__AiLib(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
