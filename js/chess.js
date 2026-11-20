/* Sixty-Four — chess rules engine (no dependencies).
   Knows the rules, FEN, and standard algebraic notation (SAN).
   Board index: a1 = 0, h1 = 7, a8 = 56, h8 = 63. */
var __ChessLib = function (root) {
  'use strict';

  var FILES = 'abcdefgh';
  var START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var N_OFF = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  var K_OFF = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  var DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

  function idx(s) { return FILES.indexOf(s.charAt(0)) + 8 * (parseInt(s.charAt(1), 10) - 1); }
  function sqName(i) { return FILES.charAt(i & 7) + ((i >> 3) + 1); }
  function other(c) { return c === 'w' ? 'b' : 'w'; }
  function mk(from, to, piece, color, captured, promotion, flag) {
    return { from: from, to: to, piece: piece, color: color, captured: captured || null, promotion: promotion || null, flag: flag };
  }

  function Chess(fen) { this.load(fen || START); }

  Chess.prototype.load = function (fen) {
    var parts = String(fen).trim().split(/\s+/);
    var rows = parts[0].split('/');
    if (rows.length !== 8) throw new Error('Bad FEN (need 8 ranks): ' + fen);
    this.board = new Array(64);
    for (var i = 0; i < 64; i++) this.board[i] = null;
    for (var r = 0; r < 8; r++) {
      var f = 0;
      for (var j = 0; j < rows[r].length; j++) {
        var ch = rows[r].charAt(j);
        if (ch >= '1' && ch <= '8') { f += +ch; continue; }
        var t = ch.toLowerCase();
        if ('pnbrqk'.indexOf(t) < 0 || f > 7) throw new Error('Bad FEN: ' + fen);
        this.board[(7 - r) * 8 + f] = { type: t, color: ch === t ? 'b' : 'w' };
        f++;
      }
      if (f !== 8) throw new Error('Bad FEN (rank ' + (8 - r) + ' has ' + f + ' squares): ' + fen);
    }
    this.turn = parts[1] === 'b' ? 'b' : 'w';
    this.castling = parts[2] && parts[2] !== '-' ? parts[2] : '';
    this.ep = parts[3] && parts[3] !== '-' ? idx(parts[3]) : -1;
    this.halfmove = parts[4] ? +parts[4] : 0;
    this.fullmove = parts[5] ? +parts[5] : 1;
    this.stack = [];
    this.hist = [];
    return this;
  };

  Chess.prototype.fen = function () {
    var out = '';
    for (var r = 7; r >= 0; r--) {
      var empty = 0;
      for (var f = 0; f < 8; f++) {
        var p = this.board[r * 8 + f];
        if (!p) { empty++; continue; }
        if (empty) { out += empty; empty = 0; }
        out += p.color === 'w' ? p.type.toUpperCase() : p.type;
      }
      if (empty) out += empty;
      if (r) out += '/';
    }
    return out + ' ' + this.turn + ' ' + (this.castling || '-') + ' ' +
      (this.ep >= 0 ? sqName(this.ep) : '-') + ' ' + this.halfmove + ' ' + this.fullmove;
  };

  Chess.prototype.clone = function () {
    var c = new Chess(this.fen());
    c.hist = this.hist.slice();
    return c;
  };

  Chess.prototype._king = function (color) {
    for (var i = 0; i < 64; i++) {
      var p = this.board[i];
      if (p && p.type === 'k' && p.color === color) return i;
    }
    return -1;
  };

  /* Which pieces of colour `by` attack square t? (first = stop at the first one) */
  Chess.prototype._attackers = function (t, by, first) {
    var b = this.board, f = t & 7, r = t >> 3, out = [], k, p, ff, rr, s;
    var pr = r + (by === 'w' ? -1 : 1);
    if (pr >= 0 && pr < 8) {
      for (k = -1; k <= 1; k += 2) {
        ff = f + k;
        if (ff < 0 || ff > 7) continue;
        p = b[pr * 8 + ff];
        if (p && p.color === by && p.type === 'p') { out.push(pr * 8 + ff); if (first) return out; }
      }
    }
    for (k = 0; k < 8; k++) {
      ff = f + N_OFF[k][0]; rr = r + N_OFF[k][1];
      if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
        p = b[rr * 8 + ff];
        if (p && p.color === by && p.type === 'n') { out.push(rr * 8 + ff); if (first) return out; }
      }
      ff = f + K_OFF[k][0]; rr = r + K_OFF[k][1];
      if (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
        p = b[rr * 8 + ff];
        if (p && p.color === by && p.type === 'k') { out.push(rr * 8 + ff); if (first) return out; }
      }
    }
    for (k = 0; k < 8; k++) {
      var d = k < 4 ? DIAG[k] : ORTH[k - 4], slider = k < 4 ? 'b' : 'r';
      ff = f + d[0]; rr = r + d[1];
      while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
        s = rr * 8 + ff; p = b[s];
        if (p) {
          if (p.color === by && (p.type === slider || p.type === 'q')) { out.push(s); if (first) return out; }
          break;
        }
        ff += d[0]; rr += d[1];
      }
    }
    return out;
  };

  Chess.prototype._attacked = function (t, by) { return this._attackers(t, by, true).length > 0; };

  /* Pseudo-legal moves for the side to move (may leave own king in check). */
  Chess.prototype._gen = function () {
    var b = this.board, us = this.turn, them = other(us), moves = [];
    var i, p, f, r, k, ff, rr, t, q, d;
    for (i = 0; i < 64; i++) {
      p = b[i];
      if (!p || p.color !== us) continue;
      f = i & 7; r = i >> 3;
      if (p.type === 'p') {
        var dir = us === 'w' ? 1 : -1, startR = us === 'w' ? 1 : 6, promoR = us === 'w' ? 7 : 0;
        rr = r + dir;
        if (rr < 0 || rr > 7) continue;
        t = rr * 8 + f;
        if (!b[t]) {
          if (rr === promoR) {
            moves.push(mk(i, t, 'p', us, null, 'q', 'n'), mk(i, t, 'p', us, null, 'r', 'n'),
              mk(i, t, 'p', us, null, 'b', 'n'), mk(i, t, 'p', us, null, 'n', 'n'));
          } else {
            moves.push(mk(i, t, 'p', us, null, null, 'n'));
            if (r === startR && !b[t + dir * 8]) moves.push(mk(i, t + dir * 8, 'p', us, null, null, 'b'));
          }
        }
        for (k = -1; k <= 1; k += 2) {
          ff = f + k;
          if (ff < 0 || ff > 7) continue;
          t = rr * 8 + ff; q = b[t];
          if (q && q.color === them) {
            if (rr === promoR) {
              moves.push(mk(i, t, 'p', us, q.type, 'q', 'c'), mk(i, t, 'p', us, q.type, 'r', 'c'),
                mk(i, t, 'p', us, q.type, 'b', 'c'), mk(i, t, 'p', us, q.type, 'n', 'c'));
            } else moves.push(mk(i, t, 'p', us, q.type, null, 'c'));
          } else if (!q && t === this.ep) {
            moves.push(mk(i, t, 'p', us, 'p', null, 'e'));
          }
        }
      } else if (p.type === 'n' || p.type === 'k') {
        var offs = p.type === 'n' ? N_OFF : K_OFF;
        for (k = 0; k < 8; k++) {
          ff = f + offs[k][0]; rr = r + offs[k][1];
          if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
          t = rr * 8 + ff; q = b[t];
          if (!q) moves.push(mk(i, t, p.type, us, null, null, 'n'));
          else if (q.color === them) moves.push(mk(i, t, p.type, us, q.type, null, 'c'));
        }
      } else {
        for (k = 0; k < 8; k++) {
          if (k < 4 && p.type === 'r') continue;
          if (k >= 4 && p.type === 'b') continue;
          d = k < 4 ? DIAG[k] : ORTH[k - 4];
          ff = f + d[0]; rr = r + d[1];
          while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
            t = rr * 8 + ff; q = b[t];
            if (!q) moves.push(mk(i, t, p.type, us, null, null, 'n'));
            else { if (q.color === them) moves.push(mk(i, t, p.type, us, q.type, null, 'c')); break; }
            ff += d[0]; rr += d[1];
          }
        }
      }
    }
    // castling
    var home = us === 'w' ? 4 : 60, K = us === 'w' ? 'K' : 'k', Q = us === 'w' ? 'Q' : 'q';
    var canK = this.castling.indexOf(K) >= 0, canQ = this.castling.indexOf(Q) >= 0;
    var kp = b[home];
    if ((canK || canQ) && kp && kp.type === 'k' && kp.color === us && !this._attacked(home, them)) {
      var rk = b[home + 3], rq = b[home - 4];
      if (canK && rk && rk.type === 'r' && rk.color === us && !b[home + 1] && !b[home + 2] &&
          !this._attacked(home + 1, them) && !this._attacked(home + 2, them)) {
        moves.push(mk(home, home + 2, 'k', us, null, null, 'k'));
      }
      if (canQ && rq && rq.type === 'r' && rq.color === us && !b[home - 1] && !b[home - 2] && !b[home - 3] &&
          !this._attacked(home - 1, them) && !this._attacked(home - 2, them)) {
        moves.push(mk(home, home - 2, 'k', us, null, null, 'q'));
      }
    }
    return moves;
  };

  Chess.prototype._make = function (m) {
    var b = this.board, us = this.turn;
    var st = { m: m, castling: this.castling, ep: this.ep, half: this.halfmove, full: this.fullmove, cap: null, capSq: m.to };
    var p = b[m.from];
    if (m.flag === 'e') { st.capSq = m.to + (us === 'w' ? -8 : 8); st.cap = b[st.capSq]; b[st.capSq] = null; }
    else st.cap = b[m.to];
    b[m.to] = m.promotion ? { type: m.promotion, color: us } : p;
    b[m.from] = null;
    if (m.flag === 'k') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = null; }
    else if (m.flag === 'q') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = null; }
    var c = this.castling;
    if (c) {
      if (p.type === 'k') c = c.replace(us === 'w' ? /[KQ]/g : /[kq]/g, '');
      if (m.from === 0 || m.to === 0) c = c.replace('Q', '');
      if (m.from === 7 || m.to === 7) c = c.replace('K', '');
      if (m.from === 56 || m.to === 56) c = c.replace('q', '');
      if (m.from === 63 || m.to === 63) c = c.replace('k', '');
      this.castling = c;
    }
    this.ep = m.flag === 'b' ? (m.from + m.to) / 2 : -1;
    this.halfmove = (p.type === 'p' || st.cap) ? 0 : this.halfmove + 1;
    if (us === 'b') this.fullmove++;
    this.turn = other(us);
    this.stack.push(st);
  };

  Chess.prototype._unmake = function () {
    var st = this.stack.pop(), m = st.m, b = this.board;
    this.turn = other(this.turn);
    var us = this.turn;
    b[m.from] = m.promotion ? { type: 'p', color: us } : b[m.to];
    b[m.to] = null;
    if (st.cap) b[st.capSq] = st.cap;
    if (m.flag === 'k') { b[m.to + 1] = b[m.to - 1]; b[m.to - 1] = null; }
    else if (m.flag === 'q') { b[m.to - 2] = b[m.to + 1]; b[m.to + 1] = null; }
    this.castling = st.castling; this.ep = st.ep; this.halfmove = st.half; this.fullmove = st.full;
    return m;
  };

  Chess.prototype._legal = function () {
    var ms = this._gen(), out = [], us = this.turn, them = other(us);
    for (var i = 0; i < ms.length; i++) {
      this._make(ms[i]);
      if (!this._attacked(this._king(us), them)) out.push(ms[i]);
      this._unmake();
    }
    return out;
  };

  Chess.prototype._san = function (m, legal) {
    var s;
    if (m.flag === 'k') s = 'O-O';
    else if (m.flag === 'q') s = 'O-O-O';
    else if (m.piece === 'p') {
      s = (m.captured ? FILES.charAt(m.from & 7) + 'x' : '') + sqName(m.to) +
        (m.promotion ? '=' + m.promotion.toUpperCase() : '');
    } else {
      var any = false, sameFile = false, sameRank = false, dis = '';
      for (var i = 0; i < legal.length; i++) {
        var o = legal[i];
        if (o.piece === m.piece && o.to === m.to && o.from !== m.from) {
          any = true;
          if ((o.from & 7) === (m.from & 7)) sameFile = true;
          if ((o.from >> 3) === (m.from >> 3)) sameRank = true;
        }
      }
      if (any) dis = !sameFile ? FILES.charAt(m.from & 7) : (!sameRank ? String((m.from >> 3) + 1) : sqName(m.from));
      s = m.piece.toUpperCase() + dis + (m.captured ? 'x' : '') + sqName(m.to);
    }
    this._make(m);
    if (this._attacked(this._king(this.turn), other(this.turn))) s += this._legal().length ? '+' : '#';
    this._unmake();
    return s;
  };

  function pub(m, san) {
    return { from: sqName(m.from), to: sqName(m.to), piece: m.piece, color: m.color, captured: m.captured,
      promotion: m.promotion, flag: m.flag, san: san };
  }

  /* Find the legal move matching a SAN string or a {from, to, promotion} object. */
  Chess.prototype._find = function (x, legal) {
    var i, m;
    if (x && typeof x === 'object') {
      var from = idx(x.from), to = idx(x.to), promo = (x.promotion || 'q').toLowerCase();
      for (i = 0; i < legal.length; i++) {
        m = legal[i];
        if (m.from === from && m.to === to && (!m.promotion || m.promotion === promo)) return m;
      }
      return null;
    }
    var s = String(x).replace(/[+#!?]/g, '').replace(/\s*e\.?p\.?$/i, '').trim();
    if (/^[0Oo]-[0Oo](-[0Oo])?$/.test(s)) {
      var flag = s.length > 3 ? 'q' : 'k';
      for (i = 0; i < legal.length; i++) if (legal[i].flag === flag) return legal[i];
      return null;
    }
    var mt = /^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(?:=?([QRBNqrbn]))?$/.exec(s);
    if (!mt) return null;
    var piece = mt[1] ? mt[1].toLowerCase() : 'p', dest = idx(mt[5]);
    var fFile = mt[2] ? FILES.indexOf(mt[2]) : -1, fRank = mt[3] ? +mt[3] - 1 : -1;
    var pr = mt[6] ? mt[6].toLowerCase() : 'q', found = [];
    for (i = 0; i < legal.length; i++) {
      m = legal[i];
      if (m.piece !== piece || m.to !== dest) continue;
      if (m.flag === 'k' || m.flag === 'q') continue;
      if (fFile >= 0 && (m.from & 7) !== fFile) continue;
      if (fRank >= 0 && (m.from >> 3) !== fRank) continue;
      if (piece === 'p' && fFile < 0 && (m.from & 7) !== (m.to & 7)) continue;
      if (m.promotion && m.promotion !== pr) continue;
      found.push(m);
    }
    return found.length === 1 ? found[0] : null;
  };

  /* ---------- public API ---------- */

  Chess.prototype.get = function (square) {
    var p = this.board[idx(square)];
    return p ? { type: p.type, color: p.color } : null;
  };

  Chess.prototype.pieces = function () {
    var out = {};
    for (var i = 0; i < 64; i++) if (this.board[i]) out[sqName(i)] = { type: this.board[i].type, color: this.board[i].color };
    return out;
  };

  Chess.prototype.moves = function (opts) {
    var legal = this._legal(), out = [], only = opts && opts.square ? idx(opts.square) : -1;
    for (var i = 0; i < legal.length; i++) {
      if (only >= 0 && legal[i].from !== only) continue;
      out.push(pub(legal[i], this._san(legal[i], legal)));
    }
    return out;
  };

  Chess.prototype.move = function (x) {
    var legal = this._legal(), m = this._find(x, legal);
    if (!m) return null;
    var p = pub(m, this._san(m, legal));
    this._make(m);
    this.hist.push(p);
    return p;
  };

  Chess.prototype.undo = function () {
    if (!this.hist.length) return null;
    this._unmake();
    return this.hist.pop();
  };

  Chess.prototype.history = function () { return this.hist.map(function (m) { return m.san; }); };
  Chess.prototype.lastMove = function () { return this.hist.length ? this.hist[this.hist.length - 1] : null; };
  Chess.prototype.inCheck = function () { var k = this._king(this.turn); return k >= 0 && this._attacked(k, other(this.turn)); };
  Chess.prototype.isCheckmate = function () { return this.inCheck() && this._legal().length === 0; };
  Chess.prototype.isStalemate = function () { return !this.inCheck() && this._legal().length === 0; };
  Chess.prototype.attackers = function (square, color) { return this._attackers(idx(square), color, false).map(sqName); };

  /* ---------- helpers ---------- */

  /* "1. e4 e5 2. Nf3" -> ["e4", "e5", "Nf3"] */
  Chess.parseMoves = function (text) {
    if (!text) return [];
    return String(text).replace(/\{[^}]*\}/g, ' ').split(/\s+/).map(function (tok) {
      return tok.replace(/^\d+\.+/, '');
    }).filter(function (tok) {
      return tok && !/^(1-0|0-1|1\/2-1\/2|\*|\.+)$/.test(tok);
    });
  };

  /* Build a game from a start position (or FEN) plus a string/array of SAN moves. */
  Chess.fromMoves = function (moves, fen) {
    var g = new Chess(fen), list = typeof moves === 'string' ? Chess.parseMoves(moves) : (moves || []);
    for (var i = 0; i < list.length; i++) {
      if (!g.move(list[i])) throw new Error('Illegal move "' + list[i] + '" (move ' + (i + 1) + ') in: ' + list.join(' '));
    }
    return g;
  };

  /* A move in plain words: "Knight takes on e5, check." */
  Chess.describe = function (m) {
    var s;
    if (m.flag === 'k') s = 'Castles kingside';
    else if (m.flag === 'q') s = 'Castles queenside';
    else {
      var n = PIECE_NAMES[m.piece];
      s = n.charAt(0).toUpperCase() + n.slice(1) + (m.captured ? ' takes on ' : ' to ') + m.to;
      if (m.flag === 'e') s += ' en passant';
      if (m.promotion) s += ', promoting to a ' + PIECE_NAMES[m.promotion];
    }
    if (/#$/.test(m.san)) s += ' — checkmate';
    else if (/\+$/.test(m.san)) s += ', check';
    return s;
  };

  Chess.START = START;
  Chess.FILES = FILES;
  Chess.PIECE_NAMES = PIECE_NAMES;
  Chess.idx = idx;
  Chess.sq = sqName;

  if (typeof module !== 'undefined' && module.exports) module.exports = Chess;
  else root.Chess = Chess;
};
__ChessLib(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
