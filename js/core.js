/* Sixty-Four — shared helpers: DOM, text formatting, progress, board geometry. */
(function () {
  'use strict';

  var FILES = 'abcdefgh';
  var CL = window.CL = {
    content: {}, widgets: {}, drills: {},
    order: ['vision', 'notation', 'openings', 'strategy', 'pawns', 'mates', 'tactics']
  };

  /* ---------- DOM ---------- */

  CL.h = function (spec, attrs, kids) {
    var parts = spec.split('.'), el = document.createElement(parts[0] || 'div');
    if (parts.length > 1) el.className = parts.slice(1).join(' ');
    if (attrs != null && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) { kids = attrs; attrs = null; }
    if (attrs) {
      for (var k in attrs) {
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    if (kids != null) {
      (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
        if (c == null || c === false) return;
        el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
      });
    }
    return el;
  };

  CL.esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  function inline(s) {
    return CL.esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/`(.+?)`/g, '<span class="mv">$1</span>')
      .replace(/(^|[\s(])_(.+?)_(?=[\s.,;:!?)]|$)/g, '$1<em>$2</em>');
  }

  /* Tiny markup: blank line = paragraph, "- " lines = list, **bold**, _italic_, `move`. */
  CL.fmt = function (text) {
    if (!text) return '';
    return String(text).trim().split(/\n\s*\n/).map(function (block) {
      var lines = block.split('\n').map(function (l) { return l.trim(); });
      if (lines.every(function (l) { return /^- /.test(l); })) {
        return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.slice(2)) + '</li>'; }).join('') + '</ul>';
      }
      return '<p>' + inline(lines.join(' ')) + '</p>';
    }).join('');
  };
  CL.inline = inline;

  CL.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  CL.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  /* ---------- progress (saved in this browser) ---------- */

  var KEY = 'sixtyfour.v1', mem = null;
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { mem = {}; }
    mem.done = mem.done || {};
    mem.best = mem.best || {};
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* private mode */ } }

  CL.store = {
    isDone: function (id) { return !!load().done[id]; },
    markDone: function (id) { load().done[id] = 1; save(); },
    best: function (id) { return load().best[id] || 0; },
    setBest: function (id, n) {
      if (n > (load().best[id] || 0)) { mem.best[id] = n; save(); return true; }
      return false;
    },
    pref: function (k, def) { var p = load().prefs || {}; return p[k] == null ? def : p[k]; },
    setPref: function (k, v) { load(); mem.prefs = mem.prefs || {}; mem.prefs[k] = v; save(); },
    reset: function () { mem = { done: {}, best: {} }; save(); }
  };

  /* ---------- training ---------- */

  /* Trainers register themselves here:
     { id, group, title, desc, timed (seconds, optional), run: function (root, chapter, meta) -> cleanup } */
  CL.trainers = [];
  CL.addTrainer = function (t) { CL.trainers.push(t); };

  /* A log of practice, by day, used for the daily workout, streaks and "last played". */
  var AKEY = 'sixtyfour.activity.v1';
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function readAct() {
    var a;
    try { a = JSON.parse(localStorage.getItem(AKEY)); } catch (e) { a = null; }
    a = a || {};
    a.days = a.days || {};
    a.last = a.last || {};
    return a;
  }
  CL.activity = {
    dayKey: dayKey,
    /* Call when a round of any trainer finishes. id is the trainer's store id, e.g. "train/drill/loose". */
    log: function (id, score) {
      var a = readAct(), k = dayKey(), d = a.days[k] || (a.days[k] = { n: 0, ids: {} });
      d.n++;
      d.ids[id] = (d.ids[id] || 0) + 1;
      a.last[id] = { t: Date.now(), score: score == null ? null : score };
      var keys = Object.keys(a.days).sort();
      while (keys.length > 200) delete a.days[keys.shift()];
      try { localStorage.setItem(AKEY, JSON.stringify(a)); } catch (e) { /* ignore */ }
    },
    today: function () { return readAct().days[dayKey()] || { n: 0, ids: {} }; },
    last: function (id) { return readAct().last[id] || null; },
    /* Consecutive days with practice, counting today (or up to yesterday if today is still empty). */
    streak: function () {
      var a = readAct(), d = new Date(), n = 0;
      if (!a.days[dayKey(d)]) d.setDate(d.getDate() - 1);
      while (a.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    /* The last n days, oldest first: [{ key, n }]. */
    recent: function (n) {
      var a = readAct(), out = [], d = new Date();
      d.setDate(d.getDate() - (n - 1));
      for (var i = 0; i < n; i++) { var k = dayKey(d); out.push({ key: k, n: a.days[k] ? a.days[k].n : 0 }); d.setDate(d.getDate() + 1); }
      return out;
    },
    clear: function () { try { localStorage.removeItem(AKEY); } catch (e) { /* ignore */ } }
  };

  /* ---------- positions ---------- */

  CL.EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';

  /* A step's position: `fen` (default: the starting position) plus optional `after` moves. */
  CL.resolve = function (step) {
    var g = new Chess(step.fen || Chess.START);
    if (step.after) {
      var list = Chess.parseMoves(step.after);
      for (var i = 0; i < list.length; i++) {
        if (!g.move(list[i])) throw new Error('Illegal move "' + list[i] + '" in: ' + step.after);
      }
    }
    return g;
  };

  /* ---------- geometry ---------- */

  CL.sq = function (f, r) { return FILES.charAt(f) + (r + 1); };
  CL.fr = function (s) { return [FILES.indexOf(s.charAt(0)), +s.charAt(1) - 1]; };
  CL.isDark = function (s) { var p = CL.fr(s); return (p[0] + p[1]) % 2 === 0; };

  CL.all = [];
  (function () { for (var r = 0; r < 8; r++) for (var f = 0; f < 8; f++) CL.all.push(CL.sq(f, r)); })();

  CL.fileSquares = function (f) { return CL.all.filter(function (s) { return s.charAt(0) === f; }); };
  CL.rankSquares = function (r) { return CL.all.filter(function (s) { return s.charAt(1) === String(r); }); };

  /* All squares in the rectangle with corners a and b. */
  CL.rect = function (a, b) {
    var p = CL.fr(a), q = CL.fr(b), out = [];
    for (var r = Math.min(p[1], q[1]); r <= Math.max(p[1], q[1]); r++)
      for (var f = Math.min(p[0], q[0]); f <= Math.max(p[0], q[0]); f++) out.push(CL.sq(f, r));
    return out;
  };

  /* Squares on the straight line from a to b (inclusive). */
  CL.ray = function (a, b) {
    var p = CL.fr(a), q = CL.fr(b), df = Math.sign(q[0] - p[0]), dr = Math.sign(q[1] - p[1]), out = [a];
    var f = p[0], r = p[1];
    while (f !== q[0] || r !== q[1]) { f += df; r += dr; out.push(CL.sq(f, r)); }
    return out;
  };

  /* The two diagonals through a square, each ordered from its lower end to its upper end. */
  CL.diagonals = function (s) {
    var p = CL.fr(s), up = [], down = [], f, r;
    f = p[0]; r = p[1];
    while (f > 0 && r > 0) { f--; r--; }
    while (f < 8 && r < 8) { up.push(CL.sq(f, r)); f++; r++; }
    f = p[0]; r = p[1];
    while (f < 7 && r > 0) { f++; r--; }
    while (f >= 0 && r < 8) { down.push(CL.sq(f, r)); f--; r++; }
    return [up, down];
  };

  CL.sameDiagonal = function (a, b) {
    var p = CL.fr(a), q = CL.fr(b);
    return a !== b && Math.abs(p[0] - q[0]) === Math.abs(p[1] - q[1]);
  };

  var N_OFF = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  var K_OFF = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

  /* Squares a piece attacks from s on an otherwise empty board. */
  CL.reach = function (type, s) {
    var p = CL.fr(s), out = [], i, f, r;
    function step(list) {
      for (i = 0; i < list.length; i++) {
        f = p[0] + list[i][0]; r = p[1] + list[i][1];
        if (f >= 0 && f < 8 && r >= 0 && r < 8) out.push(CL.sq(f, r));
      }
    }
    function slide(dirs) {
      for (i = 0; i < dirs.length; i++) {
        f = p[0] + dirs[i][0]; r = p[1] + dirs[i][1];
        while (f >= 0 && f < 8 && r >= 0 && r < 8) { out.push(CL.sq(f, r)); f += dirs[i][0]; r += dirs[i][1]; }
      }
    }
    if (type === 'n') step(N_OFF);
    else if (type === 'k') step(K_OFF);
    else {
      if (type === 'b' || type === 'q') slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      if (type === 'r' || type === 'q') slide([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    }
    return out;
  };

  /* How many knight moves from s to every square. */
  CL.knightDistances = function (s) {
    var dist = {}, queue = [s], i = 0;
    dist[s] = 0;
    while (i < queue.length) {
      var cur = queue[i++];
      CL.reach('n', cur).forEach(function (t) {
        if (dist[t] == null) { dist[t] = dist[cur] + 1; queue.push(t); }
      });
    }
    return dist;
  };

  /* Every lesson step of type "puzzle" in the given chapters (used by the puzzle mix). */
  CL.collectPuzzles = function (chapterIds) {
    var out = [];
    chapterIds.forEach(function (cid) {
      var ch = CL.content[cid];
      if (!ch) return;
      ch.lessons.forEach(function (ls) {
        ls.steps.forEach(function (st) {
          if (st.type === 'puzzle' && !st.show && !st.concept) out.push({ step: st, lesson: ls, chapter: ch });
        });
      });
    });
    return out;
  };
})();
