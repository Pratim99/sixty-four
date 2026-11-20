/* Sixty-Four — endgame trainers: play the basic wins and draws out against the engine.
   Also holds an exact solver for king and pawn against king (CL.kpk), which the two pawn trainers lean on. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;

  function rnd(n) { return Math.floor(Math.random() * n); }
  function dist(a, b) { return Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3))); }
  function posKey(g) { return g.fen().split(' ').slice(0, 4).join(' '); }

  /* ================= king and pawn against king, solved =================
     Every position with a white king, a white pawn and a black king, worked out backwards from the
     promotions. One byte per position: 0 = not known yet, 1..250 = White wins and can promote safely in
     that many half-moves, DRAW, or BAD (not a legal position). The pawn is kept on files a to d; positions
     with it on e to h are looked up as their mirror image. Squares are numbers: a1 = 0, h8 = 63. */

  var DRAW = 254, BAD = 255, kpkTab = null, KM = null;

  function kpkIndex(stm, wk, bk, p) { return stm + 2 * (wk + 64 * (bk + 64 * ((p & 7) + 4 * ((p >> 3) - 1)))); }
  function pawnHits(p, t) { return (t >> 3) === (p >> 3) + 1 && Math.abs((t & 7) - (p & 7)) === 1; }

  /* Does a queen (or rook) on q attack square s? The white king can stand in the way; the black king cannot. */
  function lineHits(q, s, wk, queen) {
    var df = (s & 7) - (q & 7), dr = (s >> 3) - (q >> 3), n = Math.max(Math.abs(df), Math.abs(dr)), x = q, i;
    if (!n || (df && dr && !(queen && Math.abs(df) === Math.abs(dr)))) return false;
    for (i = 1; i < n; i++) {
      x += Math.sign(df) + 8 * Math.sign(dr);
      if (x === wk) return false;
    }
    return true;
  }

  /* Would a new queen (or rook) on q leave Black, to move, stalemated? */
  function stale(q, wk, bk, queen) {
    if (lineHits(q, bk, wk, queen)) return false;
    for (var j = 0; j < KM[bk].length; j++) {
      if (dist(KM[bk][j], wk) > 1 && !lineHits(q, KM[bk][j], wk, queen)) return false;
    }
    return true;
  }

  function kpkBuild() {
    var tab = new Uint8Array(2 * 64 * 64 * 24), todo = [], rest, found, idx, stm, wk, bk, pi, p, i, j, k, t, v, r, moves, a, b;
    KM = [];
    for (i = 0; i < 64; i++) {
      KM[i] = [];
      for (t = 0; t < 64; t++) if (dist(i, t) === 1) KM[i].push(t);
    }

    /* What is known at once: illegal positions, safe promotions (to a queen, or to a rook if the queen
       would be stalemate), and Black taking the pawn or being stalemated. */
    for (pi = 0; pi < 24; pi++) {
      p = (pi & 3) + 8 * ((pi >> 2) + 1);
      for (bk = 0; bk < 64; bk++) for (wk = 0; wk < 64; wk++) for (stm = 0; stm < 2; stm++) {
        idx = kpkIndex(stm, wk, bk, p);
        if (wk === bk || wk === p || bk === p || dist(wk, bk) < 2 || (stm === 0 && pawnHits(p, bk))) { tab[idx] = BAD; continue; }
        if (stm === 0) {
          t = p + 8;
          if ((p >> 3) === 6 && wk !== t && bk !== t && (dist(bk, t) > 1 || dist(wk, t) === 1) &&
              !(stale(t, wk, bk, true) && stale(t, wk, bk, false))) { tab[idx] = 1; continue; }
        } else {
          moves = 0; a = false;
          for (j = 0; j < KM[bk].length; j++) {
            t = KM[bk][j];
            if (dist(t, wk) < 2 || pawnHits(p, t)) continue;
            moves++;
            if (t === p) a = true;
          }
          if (a || !moves) { tab[idx] = DRAW; continue; }
        }
        todo.push(idx);
      }
    }

    /* Layer by layer: pass k finds exactly the positions won in k half-moves. White needs one move into a
       won position; Black is lost only when every move runs into one. */
    for (k = 2; todo.length; k++) {
      rest = []; found = 0;
      for (i = 0; i < todo.length; i++) {
        idx = todo[i];
        stm = idx & 1; r = idx >> 1; wk = r & 63; r >>= 6; bk = r & 63; pi = r >> 6;
        p = (pi & 3) + 8 * ((pi >> 2) + 1);
        a = false; b = false;
        if (stm === 0) {
          /* a: a winning move exists; b: some move is not yet known to draw */
          for (j = 0; j < KM[wk].length && !a; j++) {
            t = KM[wk][j];
            if (t === p || dist(t, bk) < 2) continue;
            v = tab[kpkIndex(1, t, bk, p)];
            if (v && v < k) a = true; else if (v !== DRAW) b = true;
          }
          t = p + 8;
          if (!a && (p >> 3) < 6 && t !== wk && t !== bk) {
            v = tab[kpkIndex(1, wk, bk, t)];
            if (v && v < k) a = true; else if (v !== DRAW) b = true;
            t = p + 16;
            if (!a && (p >> 3) === 1 && t !== wk && t !== bk) {
              v = tab[kpkIndex(1, wk, bk, t)];
              if (v && v < k) a = true; else if (v !== DRAW) b = true;
            }
          }
          v = a ? k : (b ? 0 : DRAW);
        } else {
          /* a: a drawing move exists; b: some move is not yet known to lose */
          for (j = 0; j < KM[bk].length && !a; j++) {
            t = KM[bk][j];
            if (dist(t, wk) < 2 || pawnHits(p, t)) continue;
            v = tab[kpkIndex(0, wk, t, p)];
            if (v === DRAW) a = true; else if (!v || v >= k) b = true;
          }
          v = a ? DRAW : (b ? 0 : k);
        }
        tab[idx] = v;
        if (!v) rest.push(idx); else if (v === k) found++;
      }
      todo = rest;
      if (!found) break;
    }
    for (i = 0; i < todo.length; i++) tab[todo[i]] = DRAW;
    kpkTab = tab;
  }

  function kpkProbe(wk, p, bk, stm) {
    if (!kpkTab) kpkBuild();
    if (!(wk >= 0 && wk < 64 && bk >= 0 && bk < 64 && p >= 8 && p < 56)) return BAD;
    if ((p & 7) > 3) { wk ^= 7; p ^= 7; bk ^= 7; }
    return kpkTab[kpkIndex(stm, wk, bk, p)];
  }

  function sqNum(s) { return typeof s === 'number' ? s : Chess.idx(String(s)); }
  function kpkLook(wk, p, bk, side) {
    return kpkProbe(sqNum(wk), sqNum(p), sqNum(bk), String(side).charAt(0) === 'b' ? 1 : 0);
  }

  /* Squares may be names ("e6") or numbers (a1 = 0 ... h8 = 63); the pawn is always White's. */
  CL.kpk = {
    /* 'win' (White can force the pawn home), 'draw', or null if the position is not legal. */
    result: function (whiteKing, pawn, blackKing, sideToMove) {
      var v = kpkLook(whiteKing, pawn, blackKing, sideToMove);
      return v === BAD ? null : (v === DRAW ? 'draw' : 'win');
    },
    /* Half-moves until the pawn promotes safely with best play by both sides; 0 if it is not a win. */
    plies: function (whiteKing, pawn, blackKing, sideToMove) {
      var v = kpkLook(whiteKing, pawn, blackKing, sideToMove);
      return v < DRAW ? v : 0;
    },
    build: function () { if (!kpkTab) kpkBuild(); }
  };

  /* What a king-and-pawn ending on the board is worth to White: { res: 'win' | 'draw', plies }.
     Also covers the moment after the pawn has gone: taken, or turned into a new piece. */
  function outlook(g) {
    var ps = g.pieces(), wk, bk, x = null, n = 0, s, v, ms;
    for (s in ps) {
      if (ps[s].type !== 'k') { x = { sq: s, type: ps[s].type, color: ps[s].color }; n++; }
      else if (ps[s].color === 'w') wk = s;
      else bk = s;
    }
    if (n !== 1 || x.color !== 'w' || x.type === 'b' || x.type === 'n') return { res: 'draw', plies: 0 };
    if (x.type === 'p') {
      v = kpkProbe(Chess.idx(wk), Chess.idx(x.sq), Chess.idx(bk), g.turn === 'w' ? 0 : 1);
      return v < DRAW ? { res: 'win', plies: v } : { res: 'draw', plies: 0 };
    }
    /* a new queen or rook wins unless it can be taken at once, or Black is stalemated */
    if (g.turn === 'b') {
      ms = g.moves();
      if (ms.length ? ms.some(takes) : !g.inCheck()) return { res: 'draw', plies: 0 };
    }
    return { res: 'win', plies: 0 };
  }

  /* The solver's choice in a king-and-pawn ending, used to keep the engine honest. `m` (the engine's move)
     stands only if it does the job: for White, a winning move that brings the promotion nearer, so that
     a win never goes round in circles; for Black, a drawing move when there is one. Otherwise the table's
     own best is played: the quickest win for White, a draw or the longest defence for Black.
     When nothing is at stake (White cannot win, Black cannot draw) the engine's move stands. */
  function guard(g, m) {
    var white = g.turn === 'w', now = outlook(g), legal = g.moves(), best = null, bestScore = -1, same = null, sameOk = false, i, v, score;
    for (i = 0; i < legal.length; i++) {
      g.move(legal[i]);
      v = outlook(g);
      g.undo();
      score = white ? (v.res === 'win' ? 1000 - v.plies : 0) : (v.res === 'draw' ? 1000 : v.plies);
      if (score > bestScore) { bestScore = score; best = legal[i]; }
      if (m && legal[i].from === m.from && legal[i].to === m.to && (!legal[i].promotion || legal[i].promotion === (m.promotion || 'q'))) {
        same = legal[i];
        sameOk = white ? (v.res === 'win' && v.plies < now.plies) : v.res === 'draw';
      }
    }
    if (same && (sameOk || (white ? bestScore === 0 : bestScore < 1000))) return same;
    return best;
  }

  function takes(m) { return !!m.captured; }
  function canTake(g) { return g.moves().some(takes); }

  /* White to move: is there a move that does not simply lose the pawn? (Stalemating Black counts.) */
  function canKeepPawn(g) {
    var ms = g.moves(), ok = false, i;
    for (i = 0; i < ms.length && !ok; i++) {
      g.move(ms[i]);
      ok = !canTake(g);
      g.undo();
    }
    return ok;
  }

  /* Is the white king within two squares of its pawn? */
  function kingNear(g) {
    var ps = g.pieces(), wk = -1, p = -1, s;
    for (s in ps) {
      if (ps[s].type === 'p') p = Chess.idx(s);
      else if (ps[s].color === 'w') wk = Chess.idx(s);
    }
    return p >= 0 && dist(wk, p) <= 2;
  }

  /* White's move in a drawn king-and-pawn ending. To an engine every drawing move is as good as another,
     so the tries are chosen here, the way a person would test the defender: stay by the pawn, never walk
     into losing it, do not repeat a position, and pick the move that leaves Black the most ways to go
     wrong (a pawn advance when it is close, or when no trap is left to set).
     Returns null when there is nothing left to try. With no quiet move at all, White has to stalemate
     or give up the pawn, and that move is returned. */
  function tryMove(g, keys) {
    var legal = g.moves(), best = null, bestScore = -1, forced = null, quiet = 0, i, j, m, replies, lost, sound, score;
    for (i = 0; i < legal.length; i++) {
      m = legal[i];
      if (m.promotion && m.promotion !== 'q') continue;
      g.move(m);
      replies = g.moves();
      if (!replies.length || replies.some(takes)) {
        if (!forced || !replies.length) forced = m;
      } else {
        quiet++;
        if (keys.indexOf(posKey(g)) < 0 && kingNear(g)) {
          lost = 0; sound = true;
          for (j = 0; j < replies.length; j++) {
            g.move(replies[j]);
            if (outlook(g).res === 'win') lost++;
            else if (sound) sound = canKeepPawn(g);
            g.undo();
          }
          score = (lost ? 1 + lost / replies.length : 0) + (m.piece === 'p' ? 0.25 : 0) + Math.random() * 0.05;
          if (sound && (lost || m.piece === 'p') && score > bestScore) { bestScore = score; best = m; }
        }
      }
      g.undo();
    }
    return best || (quiet ? null : forced);
  }

  /* A stand-in reply for when the engine cannot be reached: take what is hanging, else head for the centre. */
  function standIn(g) {
    var ms = g.moves(), best = null, bestScore = -1;
    ms.forEach(function (m) {
      var t = Chess.idx(m.to), f = t & 7, r = t >> 3;
      var score = Math.min(f, 7 - f) + Math.min(r, 7 - r) + Math.random() + (m.captured ? 20 : 0);
      if (score > bestScore) { bestScore = score; best = m; }
    });
    return best;
  }

  /* ================= start positions ================= */

  /* A FEN from a list of [square number, piece letter]. */
  function fenOf(list, turn) {
    var b = [], out = '', r, f, n, c;
    list.forEach(function (x) { b[x[0]] = x[1]; });
    for (r = 7; r >= 0; r--) {
      n = 0;
      for (f = 0; f < 8; f++) {
        c = b[r * 8 + f];
        if (c) { out += (n || '') + c; n = 0; } else n++;
      }
      out += (n || '') + (r ? '/' : '');
    }
    return out + ' ' + turn + ' - - 0 1';
  }

  /* King and `men` ("Q", "R" or "RR") against a lone king, White to move. The black king starts away
     from the edge, out of check, and with no white piece next to it. */
  function startMate(men) {
    var bk, wk, list, used, s, i, ok;
    for (;;) {
      bk = 1 + rnd(6) + 8 * (1 + rnd(6));
      wk = rnd(64);
      if (dist(wk, bk) < 2) continue;
      list = [[bk, 'k'], [wk, 'K']]; used = [bk, wk]; ok = true;
      for (i = 0; i < men.length; i++) {
        do { s = rnd(64); } while (used.indexOf(s) >= 0);
        used.push(s);
        list.push([s, men.charAt(i)]);
        if (dist(s, bk) < 2) ok = false;
      }
      if (!ok || new Chess(fenOf(list, 'b')).inCheck()) continue;
      return fenOf(list, 'w');
    }
  }

  /* Can the pawn simply run? White pushes it every move and Black defends as well as possible. */
  function pawnRuns(fen) {
    var g = new Chess(fen), ms, push, over, i;
    for (;;) {
      ms = g.moves(); push = null;
      for (i = 0; i < ms.length; i++) if (ms[i].piece === 'p' && (!ms[i].promotion || ms[i].promotion === 'q')) push = ms[i];
      if (!push) return false;
      g.move(push);
      over = judge('kp-win', g, [], 0);
      if (!over) {
        g.move(guard(g, null));
        over = judge('kp-win', g, [], 0);
      }
      if (over) return over.won;
    }
  }

  /* Play a drawn position out against a defender who picks any drawing move at random.
     Returns how many moves Black had to find before the round ended. */
  function rehearse(fen) {
    var g = new Chess(fen), keys = [posKey(g)], n = 0, ms, ok, m, i;
    for (;;) {
      ms = g.moves();
      if (g.turn === 'b') {
        ok = [];
        for (i = 0; i < ms.length; i++) {
          g.move(ms[i]);
          if (outlook(g).res === 'draw') ok.push(ms[i]);
          g.undo();
        }
        if (!ok.length) return 0;
        g.move(ok[rnd(ok.length)]);
        n++;
      } else {
        m = ms.length === 1 ? ms[0] : tryMove(g, keys);
        if (!m) return n;
        g.move(m);
      }
      keys.push(posKey(g));
      if (judge('kp-draw', g, keys, n)) return n;
    }
  }

  /* King and pawn against king with the wanted result ('win' or 'draw'), chosen to be worth playing:
     pawn on ranks 2 to 5, a rook pawn only about one time in six, and both kings close to the pawn.
     A win must need the king (the pawn cannot just run, and at most half of the first moves win);
     a draw must take at least four good moves to hold. */
  function startPawn(want) {
    var f, p, wk, bk, stm, v, g, ms, good, i, fen;
    for (;;) {
      f = Math.random() < 1 / 6 ? 7 * rnd(2) : 1 + rnd(6);
      p = f + 8 * (1 + rnd(4));
      wk = rnd(64); bk = rnd(64);
      if (dist(wk, p) > 2 || dist(bk, p) > 3) continue;
      stm = want === 'win' ? 0 : rnd(2);
      v = kpkProbe(wk, p, bk, stm);
      if (v === BAD || (v === DRAW) !== (want === 'draw')) continue;
      fen = fenOf([[wk, 'K'], [p, 'P'], [bk, 'k']], stm ? 'b' : 'w');
      if (want === 'draw') {
        if ((stm && canTake(new Chess(fen))) || rehearse(fen) < 4 || rehearse(fen) < 4) continue;
        return fen;
      }
      g = new Chess(fen);
      ms = g.moves(); good = 0;
      for (i = 0; i < ms.length; i++) {
        g.move(ms[i]);
        if (outlook(g).res === 'win') good++;
        g.undo();
      }
      if (good * 2 > ms.length || v < 7 || pawnRuns(fen)) continue;
      return fen;
    }
  }

  var KINDS = ['krr', 'kq', 'kr', 'kp-win', 'kp-draw'];
  function startFor(kind) {
    if (kind === 'krr') return startMate('RR');
    if (kind === 'kq') return startMate('Q');
    if (kind === 'kr') return startMate('R');
    return startPawn(kind === 'kp-win' ? 'win' : 'draw');
  }

  /* ================= judging a round ================= */

  var MEN = { krr: 2, kq: 1, kr: 1 }, HOLD = 16;

  /* Is the round over? Returns null, or { won, code }. `moves` is how many moves the player has made. */
  function judge(kind, g, keys, moves) {
    var ps = g.pieces(), men = [], s, last = keys[keys.length - 1], none = !g.moves().length, lm = g.lastMove();
    for (s in ps) if (ps[s].type !== 'k') men.push(ps[s].type);
    var thrice = keys.filter(function (k) { return k === last; }).length >= 3;

    if (kind === 'kp-draw') {
      if (!men.length) return { won: true, code: 'taken' };
      if (men[0] !== 'p') return g.turn === 'b' && canTake(g) ? null : { won: false, code: 'promoted' };
      if (none) return { won: true, code: 'stalemate' };
      if (thrice) return { won: true, code: 'threefold' };
      if (g.halfmove >= 100) return { won: true, code: 'fifty' };
      if (moves >= HOLD && g.turn === 'b' && outlook(g).res === 'draw') return { won: true, code: 'held' };
      return null;
    }

    if (none) return g.inCheck() ? { won: true, code: 'mate' } : { won: false, code: 'stalemate' };
    if (kind === 'kp-win') {
      if (!men.length) return { won: false, code: lm && lm.captured === 'p' ? 'pawn-lost' : 'piece-lost' };
      if (men[0] === 'b' || men[0] === 'n') return { won: false, code: 'minor' };
      if (men[0] !== 'p') return g.turn === 'b' && canTake(g) ? null : { won: true, code: 'promoted' };
    } else if (men.length < MEN[kind]) return { won: false, code: 'piece-lost' };
    if (g.halfmove >= 100) return { won: false, code: 'fifty' };
    if (thrice) return { won: false, code: 'threefold' };
    return null;
  }

  /* The last move was a promotion that stalemated Black. Would a rook on the same square have left a move? */
  function rookWorks(g) {
    var lm = g.undo(), ok;
    g.move({ from: lm.from, to: lm.to, promotion: 'r' });
    ok = g.moves().length > 0;
    g.undo();
    g.move({ from: lm.from, to: lm.to, promotion: lm.promotion });
    return ok;
  }

  /* The headline and the explanation for a finished round. */
  function describe(kind, over, g, moves) {
    var lm = g.lastMove(), n = moves + (moves === 1 ? ' move' : ' moves'), pawns = kind === 'kp-win' || kind === 'kp-draw';
    if (kind === 'kp-draw') {
      switch (over.code) {
        case 'taken': return [lm && lm.captured === 'p' ? 'You took the pawn.' : 'You took the new ' + Chess.PIECE_NAMES[lm ? lm.captured : 'q'] + '.',
          'King against king is a draw.'];
        case 'stalemate': return g.turn === 'b'
          ? ['Stalemate: you held the draw.', 'You are not in check and you have no legal move, so the game is drawn. This is the picture the defender plays for: the pawn one step from promoting, and your king on the square in front of it.']
          : ['Stalemate: you held the draw.', 'White is not in check and has no legal move: the king is shut in the corner in front of its own pawn.'];
        case 'threefold': return ['Draw by repetition.', 'The same position has come up three times. White found no way through.'];
        case 'fifty': return ['Draw by the fifty-move rule.', 'Fifty moves each without a capture or a pawn move. White found no way through.'];
        case 'held': return ['A book draw.', 'You have held for ' + n + ' and the position is still a draw. With the same care White will never get through.'];
        case 'tries': return ['White has run out of ideas.', 'White has tried everything that does not repeat the position or lose the pawn, and you had the answer each time. A book draw, held in ' + n + '.'];
        default: return ['The pawn promoted.', 'White has a new ' + Chess.PIECE_NAMES[lm && lm.promotion ? lm.promotion : 'q'] + ' and wins. The usual mistakes: stepping back to the side instead of straight back, leaving the pawn’s file too early, or letting the white king take the opposition.'];
      }
    }
    switch (over.code) {
      case 'mate': return ['Checkmate.', 'Done in ' + n + '.'];
      case 'promoted': return ['The pawn is home.', 'A safe promotion in ' + n + '. From here it is the ' + (lm && lm.promotion === 'r' ? 'rook' : 'queen') + '-and-king mate.'];
      case 'stalemate':
        if (g.turn === 'w') return ['Stalemate: a draw.', 'You are not in check and you have no legal move. Your king was shut in front of its own pawn.'];
        if (lm && lm.promotion) return ['Stalemate: a draw.', 'The new ' + Chess.PIECE_NAMES[lm.promotion] + ' leaves Black with no legal move, and it is not check. ' + (lm.promotion === 'q' && rookWorks(g) ? 'Promote to a rook here and you still win.' : 'Make a king move first, and promote when the black king has a square to go to.')];
        return ['Stalemate: a draw.', 'Black is not in check but has no legal move, so the game is drawn. ' + (pawns
          ? 'With the pawn on the seventh rank, your king has to arrive beside it while the black king still has a square to go to.'
          : 'It happens when a quiet move takes away the king’s last square. Before every move, ask whether the king can still move afterwards. If it cannot, your move must be check.')];
      case 'pawn-lost': return ['Black took the pawn.', 'King against king is a draw. The pawn must never run further ahead than your king can protect it.'];
      case 'piece-lost':
        if (kind === 'kp-win') return ['Black took the new ' + Chess.PIECE_NAMES[lm ? lm.captured : 'q'] + '.', 'The promotion square was next to the black king and your king was not guarding it. Cover that square before the pawn takes its last step.'];
        if (kind === 'krr') return ['Black took a rook.', 'One rook can still win with the king’s help, but the ladder needs both. When the king walks up to a rook, slide that rook to the far end of its rank and carry on.'];
        return ['Black took your ' + (kind === 'kq' ? 'queen' : 'rook') + '.', 'King against king is a draw. ' + (kind === 'kq'
          ? 'The queen is only safe next to the enemy king when your own king protects her.'
          : 'Keep the rook either protected by your king or well out of the enemy king’s reach.')];
      case 'minor': return ['A draw.', 'A king with only a ' + Chess.PIECE_NAMES[lm && lm.promotion ? lm.promotion : 'b'] + ' cannot give checkmate. Promote to a queen, or to a rook when a queen would be stalemate.'];
      case 'fifty': return ['Draw by the fifty-move rule.', 'Fifty moves each have gone by without a capture or a pawn move, so the game is drawn. ' + (pawns
        ? 'The pawn has to keep moving forward.' : 'Followed step by step, the method below takes far fewer.')];
      default: return ['Draw by repetition.', 'The same position has come up three times, which is a draw. ' + (pawns
        ? 'If you cannot make progress, the win has probably already gone.' : 'Checks alone do not win: each move should take squares away from the king or bring your own king closer.')];
    }
  }

  CL.endgame = { kinds: KINDS, start: startFor, judge: judge, describe: describe, outlook: outlook, guard: guard, tryMove: tryMove };

  /* ================= the page ================= */

  /* cfg: { kind, human ('w' | 'b'), par (moves, or 0 to take it from the solver), goal, tips, lesson: [href, title] } */
  function playOut(root, chapter, meta, cfg) {
    var storeId = 'train/drill/' + meta.id, kind = cfg.kind, human = cfg.human, foe = human === 'w' ? 'Black' : 'White';
    var pawns = kind === 'kp-win' || kind === 'kp-draw', holding = kind === 'kp-draw';
    var boardHost = h('div.board-host'), cap = h('div.board-caption'), panel = h('div.panel');
    root.appendChild(h('div.lesson', [
      h('header.page-head', [
        h('a.crumb', { href: '#/' + chapter.id }, '← ' + chapter.title),
        h('h1', { text: meta.title })
      ]),
      h('div.lesson-body', [h('div.board-col', [boardHost, cap]), panel])
    ]));
    var board = new Board(boardHost, { orient: human });
    var game = null, startFen = '', keys = [], over = null, thinking = false, pending = false, token = 0, timers = [];
    var moves = 0, hints = 0, backs = 0, par = 0, streak = 0, hintMove = null, looking = false, promoBox = null, blackFirst = false;

    var statusEl = h('div.status'), noteEl = h('div.feedback', { hidden: true }), listEl = h('div.movelist.gap'), endEl = h('div');
    var t1 = h('b'), t2 = h('b'), t3 = h('b');
    var bBack = h('button.btn.small', { text: 'Take back', onclick: takeBack });
    var bHint = h('button.btn.small', { text: 'Hint', onclick: hint });
    var choiceEl = h('div.tools.gap', { hidden: true }, [
      h('button.btn.small.primary', { text: 'Take it back', onclick: takeBack }),
      h('button.btn.small', { text: 'Play on', onclick: playOn })
    ]);
    panel.appendChild(h('div.kicker', { text: 'Play it out' }));
    panel.appendChild(statusEl);
    panel.appendChild(h('div.prose', { html: CL.fmt(cfg.goal) }));
    panel.appendChild(h('div.tiles.gap', [
      h('div.tile', [t1, h('span', { text: holding ? 'moves held' : 'your moves' })]),
      h('div.tile', [t2, h('span', { text: holding ? 'held in a row' : 'par' })]),
      h('div.tile', [t3, h('span', { text: holding ? 'best run' : 'your best' })])
    ]));
    panel.appendChild(noteEl);
    panel.appendChild(choiceEl);
    panel.appendChild(listEl);
    panel.appendChild(h('div.tools.gap', [
      h('button.btn.small', { text: 'New position', onclick: function () { start(); } }),
      bBack, bHint,
      h('button.btn.small', { text: 'Flip board', onclick: function () { board.flip(); } })
    ]));
    panel.appendChild(endEl);
    panel.appendChild(h('div.kicker.sub', { text: 'How to do it' }));
    panel.appendChild(h('div.prose', { html: CL.fmt(cfg.tips) }));
    panel.appendChild(h('p.small.gap', [h('a', { href: cfg.lesson[0] }, 'Lesson: ' + cfg.lesson[1] + ' →')]));

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function say(msg, kind2) { noteEl.className = 'feedback ' + (kind2 || ''); noteEl.innerHTML = msg ? CL.fmt(msg) : ''; noteEl.hidden = !msg; }
    function bestText() {
      var b = CL.store.best(storeId);
      return holding ? String(b) : (b ? String(60 - b) : '–');
    }
    function clearMarks() {
      hintMove = null; looking = false;
      board.setHighlights({});
      board.setArrows([]);
    }
    function closePromo() {
      if (promoBox && promoBox.parentNode) promoBox.parentNode.removeChild(promoBox);
      promoBox = null;
    }

    /* ---------- a round ---------- */
    function start(fen) {
      token++;
      timers.forEach(clearTimeout); timers = [];
      if (game) CL.brain.cancel();
      closePromo();
      startFen = fen || CL.endgame.start(kind);
      game = new Chess(startFen);
      blackFirst = game.turn === 'b';
      keys = [posKey(game)];
      over = null; thinking = false; pending = false;
      moves = 0; hints = 0; backs = 0;
      par = cfg.par || Math.ceil(outlook(game).plies / 2);
      board.setPosition(game);
      board.setLast(null);
      clearMarks();
      endEl.innerHTML = '';
      choiceEl.hidden = true;
      say('');
      update();
      if (game.turn !== human) reply();
    }

    function update() {
      var sans = game.history();
      if (blackFirst) sans = ['…'].concat(sans);
      CL.renderScore(listEl, sans, sans.length);
      if (over) statusEl.textContent = over.won ? 'Well played' : 'Round over';
      else if (pending) statusEl.textContent = 'Are you sure?';
      else if (thinking) statusEl.textContent = foe + ' is thinking…';
      else statusEl.textContent = (game.inCheck() ? 'Check! ' : '') + 'Your move';
      cap.textContent = over ? '' : ((game.turn === 'w' ? 'White' : 'Black') + ' to move');
      t1.textContent = String(moves);
      t2.textContent = holding ? String(streak) : String(par);
      t3.textContent = bestText();
      bBack.disabled = !!over || thinking || game.hist.length < (game.turn === human ? 2 : 1);
      bHint.disabled = !!over || thinking || pending;
    }

    function afterMove() {
      keys.push(posKey(game));
      clearMarks();
      over = judge(kind, game, keys, moves);
      update();
      if (over) finish();
    }

    board.movable = function (s) {
      if (over || thinking || pending || game.turn !== human) return null;
      var p = game.get(s);
      if (!p || p.color !== human) return null;
      return game.moves({ square: s }).map(function (mv) { return mv.to; });
    };
    board.onMove = function (from, to, info) {
      var p = game.get(from);
      if (p && p.type === 'p' && (to.charAt(1) === '8' || to.charAt(1) === '1')) {
        askPromotion(function (piece) {
          if (piece) play(from, to, piece, info); else board.setPosition(game);
        });
      } else play(from, to, undefined, info);
    };

    function play(from, to, promo, info) {
      if (over || thinking || pending || game.turn !== human) { board.setPosition(game); return; }
      var before = pawns ? outlook(game).res : '';
      var mv = game.move({ from: from, to: to, promotion: promo });
      if (!mv) { board.setPosition(game); return; }
      board.setPosition(game, info && info.dragged ? null : { animate: { from: from, to: to } });
      board.setLast([from, to]);
      moves++;
      say('');
      afterMove();
      if (over) return;
      if (pawns && outlook(game).res !== before) {
        /* the solver says this move changed the result: stop and offer it back before the reply */
        pending = true;
        choiceEl.hidden = false;
        say(holding
          ? '`' + mv.san + '` **loses**: the position was a draw before it, and now White can force the pawn home. Take it back and look again, or play on and see how White does it.'
          : '`' + mv.san + '` **lets Black draw**: the position was winning before it. Take it back and look again, or play on and see how Black holds.', 'bad');
        board.shake();
        update();
        return;
      }
      reply();
    }

    function playOn() {
      if (!pending || over) return;
      pending = false;
      choiceEl.hidden = true;
      say('');
      reply();
    }

    /* The other side's move: a capture or an only move at once, a solver try in a drawn pawn ending,
       and otherwise the engine at full strength (checked against the solver in the pawn endings). */
    function reply() {
      var mine = token, t0 = Date.now(), legal = game.moves(), now = null, i, job;
      thinking = true;
      update();
      for (i = 0; i < legal.length; i++) if (legal[i].captured) now = legal[i];
      if (!now && legal.length === 1) now = legal[0];
      if (!now && holding && outlook(game).res === 'draw') {
        now = tryMove(game, keys);
        if (!now) {
          thinking = false;
          over = { won: true, code: 'tries' };
          update();
          finish();
          return;
        }
      }
      job = now ? Promise.resolve({ move: now }) : CL.brain.bot(game.fen(), 2800);
      job.then(null, function () { return null; }).then(function (res) {
        later(function () {
          if (mine !== token) return;
          var mv = res && res.move;
          if (pawns && !now) mv = guard(game, mv);
          mv = (mv && game.move({ from: mv.from, to: mv.to, promotion: mv.promotion || undefined })) || game.move(standIn(game));
          thinking = false;
          if (!mv) { update(); return; }
          board.setPosition(game, { animate: { from: mv.from, to: mv.to } });
          board.setLast([mv.from, mv.to]);
          afterMove();
        }, Math.max(0, 450 - (Date.now() - t0)));
      });
    }

    function takeBack() {
      if (over || thinking) return;
      var n = game.turn === human ? 2 : 1, i, last;
      if (game.hist.length < n) return;
      for (i = 0; i < n; i++) { game.undo(); keys.pop(); }
      backs++;
      if (holding) moves--;
      pending = false;
      choiceEl.hidden = true;
      closePromo();
      last = game.lastMove();
      board.setPosition(game);
      board.setLast(last ? [last.from, last.to] : null);
      clearMarks();
      say('');
      update();
    }

    function hint() {
      if (over || thinking || pending || looking || game.turn !== human) return;
      if (hintMove) {
        board.setArrows([[hintMove.from, hintMove.to, 'yellow']]);
        say('The engine would play `' + hintMove.san + '`.', 'hint');
        return;
      }
      var mine = token, fen = game.fen();
      looking = true;
      say('Looking…', 'hint');
      CL.brain.best(fen).then(null, function () { return null; }).then(function (r) {
        if (mine !== token || game.fen() !== fen || over || !looking) return;
        looking = false;
        var mv = r && r.best;
        if (pawns) mv = guard(game, mv);
        if (!mv) { say('No hint is available just now.', 'hint'); return; }
        hintMove = mv; hints++;
        board.setHighlights({ note: [mv.from] });
        say('Look at your ' + Chess.PIECE_NAMES[mv.piece] + ' on `' + mv.from + '`. Press **Hint** again to see the move.', 'hint');
      });
    }

    function finish() {
      var words = describe(kind, over, game, moves), extra = '', score = 0, clean = !hints && !backs;
      if (holding) {
        if (!over.won) streak = 0;
        else if (clean) streak++;
        score = over.won ? streak : 0;
        if (over.won) {
          extra = clean ? ' That is ' + streak + ' in a row.' : ' Held with help, so it does not add to your run.';
          if (score && CL.store.setBest(storeId, score)) extra += ' A new best run!';
        }
      } else if (over.won) {
        score = Math.max(1, 60 - moves);
        extra = ' Par is ' + par + '.';
        if (hints) extra += ' You used a hint, so this one does not count towards your best.';
        else if (CL.store.setBest(storeId, score)) extra += ' A new best!';
      }
      CL.activity.log(storeId, score);
      closePromo();
      update();
      endEl.innerHTML = '';
      endEl.appendChild(h('div.result' + (over.won ? '.won' : '.lost'), { html: '<b>' + CL.esc(words[0]) + '</b> ' + CL.inline(words[1] + extra) }));
      endEl.appendChild(h('div.step-nav', [
        h('button.btn.ghost', { text: 'Same position again', onclick: function () { start(startFen); } }),
        h('button.btn.primary', { text: 'New position', onclick: function () { start(); } })
      ]));
    }

    function askPromotion(done) {
      closePromo();
      var box = h('div.promo', { onclick: function (e) { if (e.target === box) close(null); } });
      function close(piece) { closePromo(); done(piece); }
      var row = h('div.promo-row');
      ['q', 'r', 'b', 'n'].forEach(function (t) {
        row.appendChild(h('button.promo-btn', { title: Chess.PIECE_NAMES[t], html: Board.pieceSvg(t), onclick: function () { close(t); } }));
      });
      box.appendChild(h('div.promo-card', [h('div.kicker', { text: 'Promote to' }), row]));
      boardHost.appendChild(box);
      promoBox = box;
    }

    start();
    return function () {
      token++;
      timers.forEach(clearTimeout);
      CL.brain.cancel();
    };
  }

  CL.playOut = playOut;

  /* ================= the five trainers ================= */

  var LADDER = ['#/mates/lesson/ladder', 'Rooks: the ladder and the box'];
  var QUEEN = ['#/mates/lesson/queen', 'Queen and king'];
  var OPPOSITION = ['#/pawns/lesson/opposition', 'King and pawn: the opposition'];

  function add(id, title, desc, cfg) {
    cfg.kind = id;
    CL.addTrainer({ id: id, group: 'endgames', title: title, desc: desc,
      run: function (root, chapter, meta) { return playOut(root, chapter, meta, cfg); } });
  }

  add('krr', 'The ladder', 'Checkmate a lone king with two rooks, from a new position every time.', {
    human: 'w', par: 8, lesson: LADDER,
    goal: 'You are White, with two rooks. **Checkmate the lone king.** Your own king can stay where it is.',
    tips: '- One rook holds a rank as a wall. The other gives check on the next rank, and the king has to step back.\n' +
      '- Then they swap jobs, rank after rank, until the king is on the edge.\n' +
      '- If the king walks up to a rook, slide that rook to the far end of its rank and carry on.\n' +
      '- Files work just as well as ranks: push the king towards whichever edge is nearest.'
  });

  add('kq', 'Queen and king', 'Checkmate a lone king with king and queen, without stalemating it.', {
    human: 'w', par: 10, lesson: QUEEN,
    goal: 'You are White, with a queen. **Checkmate the lone king**, and do not stalemate it on the way.',
    tips: '- Put the queen a knight’s move away from the king. Each time it moves, follow it so that you are a knight’s move away again, and its box shrinks.\n' +
      '- When the king is on the edge, stop. Leave the queen where she is and walk your own king up.\n' +
      '- Mate with the queen right next to the king, protected by your king.\n' +
      '- Before every move, ask whether the king can still move afterwards. If it cannot, your move must be check.'
  });

  add('kr', 'Rook and king', 'Checkmate a lone king with king and rook: the box and the opposition.', {
    human: 'w', par: 16, lesson: LADDER,
    goal: 'You are White, with one rook, so your king has to help. **Checkmate the lone king.**',
    tips: '- Use the rook to shut the king in a box, and make the box smaller whenever it is safe.\n' +
      '- Bring your king up to face the enemy king. Keep the rook protected, or far out of reach.\n' +
      '- When the kings stand in opposition, a rook check drives the king back a rank. If it is your move and they are not, make a waiting move with the rook.\n' +
      '- The mate comes on the edge: kings in opposition, rook giving check along the edge.'
  });

  add('kp-win', 'Escort the pawn', 'King and pawn against king from winning positions: get the pawn home safely.', {
    human: 'w', par: 0, lesson: OPPOSITION,
    goal: 'You are White. This position is a win, but only with the right moves. **Promote the pawn safely.** You will be told the moment a move throws the win away. Par is the quickest promotion against the best defence.',
    tips: '- Lead with the king. It belongs in front of the pawn, not behind it.\n' +
      '- Take the opposition: kings facing each other with one square between, and the other side to move.\n' +
      '- Keep a spare pawn move for the moment you need to hand the turn back. The pawn follows only when the king has cleared the way.\n' +
      '- If a new queen would leave Black with no legal move, promote to a rook.'
  });

  add('kp-draw', 'Hold the draw', 'A lone king against king and pawn from drawn positions: stop the pawn.', {
    human: 'b', par: 0, lesson: OPPOSITION,
    goal: 'You are Black, with only a king. This position is a draw, but only with the right moves. **Do not let the pawn promote.** You will be told the moment a move loses.',
    tips: '- Stand in front of the pawn and stay on its file for as long as you can.\n' +
      '- When you have to step back, step **straight back**, so that you can face the white king when it comes forward.\n' +
      '- When the white king advances, take the opposition: kings facing each other, one square between, White to move.\n' +
      '- Against a rook pawn, head for the corner in front of it. You cannot be driven out.'
  });
})();
