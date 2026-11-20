/* Sixty-Four — the board component.
   Draws squares, pieces, highlights, labels, tints and arrows; handles click and drag moves. */
(function () {
  'use strict';

  var FILES = 'abcdefgh';
  /* Piece artwork: simple original outlines, drawn in a 45 x 45 box. */
  var SHAPES = {
      "p": "<path d=\"M16 35.5C16 28.5 20 27 20.5 21.5H24.5C25 27 29 28.5 29 35.5Z\"/><rect x=\"17\" y=\"19.5\" width=\"11\" height=\"3.2\" rx=\"1.6\"/><circle cx=\"22.5\" cy=\"13.2\" r=\"6\"/><rect x=\"12\" y=\"35\" width=\"21\" height=\"5\" rx=\"2\"/>",
      "r": "<path d=\"M14.5 35L16 18H29L30.5 35Z\"/><path d=\"M12 18V9H16.5V12H20.5V9H24.5V12H28.5V9H33V18Z\"/><rect x=\"13\" y=\"31\" width=\"19\" height=\"4.5\" rx=\"1\"/><rect x=\"10.5\" y=\"35\" width=\"24\" height=\"5\" rx=\"2\"/>",
      "b": "<path d=\"M15 36C15 31.5 19.5 31 20 27H25C25.5 31 30 31.5 30 36Z\"/><path d=\"M22.5 8.5C17 13 15 19 17 23C18.500 26 26.500 26 28 23C30 19 28 13 22.5 8.5Z\"/><path class=\"d\" d=\"M24.800 12.500L21 18\"/><rect x=\"17\" y=\"24.5\" width=\"11\" height=\"3.2\" rx=\"1.6\"/><circle cx=\"22.5\" cy=\"6.5\" r=\"2.2\"/><rect x=\"10.5\" y=\"35\" width=\"24\" height=\"5\" rx=\"2\"/>",
      "n": "<path d=\"M14 36C14 27 18 24 19 19C17.5 19.5 16 19 14.5 19.5C13 21 12 22 10.5 21.5C9 21 8.3 19.5 9 17.5C10.5 13 13 9 16.5 7L18.5 3.5L20 6.5C25 7 28.5 11 30 16C32 21 33 27 33 36Z\"/><path class=\"d\" d=\"M26.500 11.500C29 16.500 30 24 30 32.500\"/><circle class=\"e\" cx=\"16.8\" cy=\"11.6\" r=\"1.1\"/><rect x=\"10.5\" y=\"35\" width=\"24\" height=\"5\" rx=\"2\"/>",
      "q": "<path d=\"M13 36L9 15L15.5 26L16 10L20 25.5L22.5 8.5L25 25.5L29 10L29.5 26L36 15L32 36Z\"/><circle cx=\"9\" cy=\"13.5\" r=\"2\"/><circle cx=\"16\" cy=\"8.5\" r=\"2\"/><circle cx=\"22.5\" cy=\"6.8\" r=\"2\"/><circle cx=\"29\" cy=\"8.5\" r=\"2\"/><circle cx=\"36\" cy=\"13.5\" r=\"2\"/><path class=\"d\" d=\"M13.800 31.500H31.200\"/><rect x=\"10.5\" y=\"35\" width=\"24\" height=\"5\" rx=\"2\"/>",
      "k": "<path d=\"M21 4H24V7H27V10H24V23H21V10H18V7H21Z\"/><path d=\"M13 36C9.5 29 8.5 22 12.5 19C16.5 16 21 18.5 22.5 23C24 18.5 28.5 16 32.5 19C36.5 22 35.5 29 32 36Z\"/><path class=\"d\" d=\"M13.800 31.500H31.200\"/><rect x=\"10.5\" y=\"35\" width=\"24\" height=\"5\" rx=\"2\"/>"
  };
  function pieceSvg(type) { return '<svg class="pc" viewBox="0 0 45 45" aria-hidden="true">' + SHAPES[type] + '</svg>'; }
  var SVGNS = 'http://www.w3.org/2000/svg';

  function toMap(pos) {
    if (!pos) return {};
    if (typeof pos === 'string') return new Chess(pos).pieces();
    if (typeof pos.pieces === 'function') return pos.pieces();
    return pos;
  }

  function Board(host, opts) {
    opts = opts || {};
    this.host = host;
    this.orient = opts.orient || 'w';
    this.showCoords = opts.coords !== false;
    this.pieces = {};
    this.el = document.createElement('div');
    this.el.className = 'board';
    host.appendChild(this.el);
    this.reset(true);
    this._build();
    this._bind();
  }

  /* Forget all handlers and decorations (pieces stay). */
  Board.prototype.reset = function (silent) {
    this.hl = {};
    this.last = null;
    this.sel = null;
    this.dests = [];
    this.labels = {};
    this.tints = {};
    this.arrows = [];
    this.movable = null;   // function (square) -> array of destination squares
    this.onMove = null;    // function (from, to, {dragged})
    this.onSquare = null;  // function (square)
    this.onHover = null;   // function (square | null)
    this._drag = null;
    this._hover = null;
    if (!silent) { this._paint(); this._decorate(); this._drawArrows(); }
  };

  Board.prototype._build = function () {
    var el = this.el, x, y;
    el.innerHTML = '';
    el.classList.toggle('no-coords', !this.showCoords);
    var grid = document.createElement('div');
    grid.className = 'board-squares';
    this.sqEls = {};
    for (y = 0; y < 8; y++) {
      for (x = 0; x < 8; x++) {
        var f = this.orient === 'w' ? x : 7 - x, r = this.orient === 'w' ? 7 - y : y;
        var name = FILES.charAt(f) + (r + 1);
        var d = document.createElement('div');
        d._base = 'sq ' + ((f + r) % 2 ? 'light' : 'dark');
        d.className = d._base;
        d.innerHTML = '<i class="tint"></i>' +
          (x === 0 ? '<span class="coord rank">' + (r + 1) + '</span>' : '') +
          (y === 7 ? '<span class="coord file">' + FILES.charAt(f) + '</span>' : '') +
          '<span class="sq-label"></span><i class="dot"></i>';
        grid.appendChild(d);
        this.sqEls[name] = d;
      }
    }
    el.appendChild(grid);
    this.pieceLayer = document.createElement('div');
    this.pieceLayer.className = 'board-pieces';
    el.appendChild(this.pieceLayer);
    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.setAttribute('class', 'board-arrows');
    this.svg.setAttribute('viewBox', '0 0 8 8');
    el.appendChild(this.svg);
    this._render(this.pieces);
    this._paint();
    this._decorate();
    this._drawArrows();
  };

  Board.prototype._xy = function (s) {
    var f = FILES.indexOf(s.charAt(0)), r = +s.charAt(1) - 1;
    return this.orient === 'w' ? [f, 7 - r] : [7 - f, r];
  };

  Board.prototype._place = function (el, s) {
    var p = this._xy(s);
    el.style.transform = 'translate(' + p[0] * 100 + '%,' + p[1] * 100 + '%)';
  };

  Board.prototype._render = function (map) {
    this.pieceLayer.innerHTML = '';
    this.pieceEls = {};
    for (var s in map) {
      var p = map[s], d = document.createElement('div');
      d.className = 'piece ' + p.color + ' t-' + p.type; // 't-' so a bishop ('b') is never mistaken for black ('b')
      d.innerHTML = pieceSvg(p.type);
      this._place(d, s);
      this.pieceLayer.appendChild(d);
      this.pieceEls[s] = d;
    }
  };

  Board.prototype._paint = function () {
    var cls = {}, k, i, self = this;
    function add(s, c) { cls[s] = (cls[s] || '') + ' ' + c; }
    for (k in this.hl) for (i = 0; i < this.hl[k].length; i++) add(this.hl[k][i], 'hl-' + k);
    if (this.last) { add(this.last[0], 'last'); add(this.last[1], 'last'); }
    if (this.sel) add(this.sel, 'sel');
    for (i = 0; i < this.dests.length; i++) add(this.dests[i], self.pieces[this.dests[i]] ? 'dest cap' : 'dest');
    for (k in this.sqEls) this.sqEls[k].className = this.sqEls[k]._base + (cls[k] || '');
  };

  Board.prototype._decorate = function () {
    for (var k in this.sqEls) {
      var el = this.sqEls[k];
      el.querySelector('.sq-label').textContent = this.labels[k] == null ? '' : this.labels[k];
      el.firstChild.style.background = this.tints[k] || '';
    }
  };

  Board.prototype._drawArrows = function () {
    var svg = this.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    for (var i = 0; i < this.arrows.length; i++) {
      var a = this.arrows[i], p = this._xy(a[0]), q = this._xy(a[1]);
      var g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'arrow ' + (a[2] || 'green'));
      var x1 = p[0] + 0.5, y1 = p[1] + 0.5, x2 = q[0] + 0.5, y2 = q[1] + 0.5;
      var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.01) {
        var c = document.createElementNS(SVGNS, 'circle');
        c.setAttribute('cx', x1); c.setAttribute('cy', y1); c.setAttribute('r', 0.42);
        c.setAttribute('fill', 'none'); c.setAttribute('stroke-width', 0.09);
        g.appendChild(c);
      } else {
        var ux = dx / len, uy = dy / len, head = 0.36, w = 0.19;
        var ex = x2 - ux * 0.1, ey = y2 - uy * 0.1, bx = ex - ux * head, by = ey - uy * head;
        var ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', x1 + ux * 0.25); ln.setAttribute('y1', y1 + uy * 0.25);
        ln.setAttribute('x2', bx); ln.setAttribute('y2', by);
        ln.setAttribute('stroke-width', 0.14); ln.setAttribute('stroke-linecap', 'round');
        g.appendChild(ln);
        var tri = document.createElementNS(SVGNS, 'polygon');
        tri.setAttribute('points', ex + ',' + ey + ' ' + (bx - uy * w) + ',' + (by + ux * w) + ' ' + (bx + uy * w) + ',' + (by - ux * w));
        tri.setAttribute('stroke', 'none');
        g.appendChild(tri);
      }
      svg.appendChild(g);
    }
  };

  /* ---------- public setters ---------- */

  Board.prototype.setPosition = function (pos, o) {
    var map = toMap(pos), self = this;
    clearTimeout(this._t);
    this.pieces = map;
    this.sel = null; this.dests = [];
    var a = o && o.animate, el = a && this.pieceEls[a.from];
    if (el) {
      el.classList.add('moving');
      this._place(el, a.to);
      this._t = setTimeout(function () { self._render(self.pieces); }, 200);
    } else this._render(map);
    this._paint();
  };

  Board.prototype.setHighlights = function (hl) { this.hl = hl || {}; this._paint(); };
  Board.prototype.setLast = function (pair) { this.last = pair || null; this._paint(); };
  Board.prototype.setLabels = function (m) { this.labels = m || {}; this._decorate(); };
  Board.prototype.setTints = function (m) { this.tints = m || {}; this._decorate(); };
  Board.prototype.setArrows = function (list) { this.arrows = list || []; this._drawArrows(); };

  Board.prototype.setOrientation = function (o) {
    if (o === this.orient) return;
    this.orient = o;
    clearTimeout(this._t);
    this._build();
  };
  Board.prototype.flip = function () { this.setOrientation(this.orient === 'w' ? 'b' : 'w'); };

  Board.prototype.setCoords = function (on) {
    this.showCoords = !!on;
    this.el.classList.toggle('no-coords', !this.showCoords);
  };

  /* Briefly flash a square: cls is 'good' or 'bad'. */
  Board.prototype.flash = function (s, cls) {
    var el = this.sqEls[s];
    if (!el) return;
    el.classList.remove('fx-good', 'fx-bad');
    void el.offsetWidth;
    el.classList.add('fx-' + cls);
    setTimeout(function () { el.classList.remove('fx-' + cls); }, 450);
  };

  Board.prototype.shake = function () {
    var el = this.el;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  };

  /* ---------- interaction ---------- */

  Board.prototype._sqAt = function (e) {
    var rc = this.el.getBoundingClientRect();
    var x = Math.floor((e.clientX - rc.left) / rc.width * 8), y = Math.floor((e.clientY - rc.top) / rc.height * 8);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    var f = this.orient === 'w' ? x : 7 - x, r = this.orient === 'w' ? 7 - y : y;
    return FILES.charAt(f) + (r + 1);
  };

  Board.prototype._select = function (s, dests) {
    this.sel = s || null;
    this.dests = s ? dests : [];
    this._paint();
  };

  Board.prototype._bind = function () {
    var self = this, el = this.el;

    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      var s = self._sqAt(e);
      if (!s) return;
      if (self.onSquare) self.onSquare(s);
      if (!self.movable) return;
      e.preventDefault();
      if (self.sel && self.dests.indexOf(s) >= 0) {
        var from = self.sel;
        self._select(null);
        if (self.onMove) self.onMove(from, s, { dragged: false });
        return;
      }
      var d = self.pieces[s] ? (self.movable(s) || []) : [];
      if (d.length) {
        self._select(s, d);
        self._drag = { sq: s, el: self.pieceEls[s], x: e.clientX, y: e.clientY, moved: false };
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      } else self._select(null);
    });

    el.addEventListener('pointermove', function (e) {
      var dg = self._drag;
      if (dg) {
        if (!dg.moved && Math.abs(e.clientX - dg.x) + Math.abs(e.clientY - dg.y) > 6) {
          dg.moved = true;
          if (dg.el) dg.el.classList.add('dragging');
        }
        if (dg.moved && dg.el) {
          var rc = el.getBoundingClientRect(), size = rc.width / 8;
          dg.el.style.transform = 'translate(' + (e.clientX - rc.left - size / 2) + 'px,' + (e.clientY - rc.top - size / 2) + 'px)';
        }
        return;
      }
      if (self.onHover) {
        var s = self._sqAt(e);
        if (s !== self._hover) { self._hover = s; self.onHover(s); }
      }
    });

    function drop(e) {
      var dg = self._drag;
      if (!dg) return;
      self._drag = null;
      if (dg.el) dg.el.classList.remove('dragging');
      if (!dg.moved) return; // a plain click: the piece stays selected
      var s = self._sqAt(e);
      if (s && s !== dg.sq && self.dests.indexOf(s) >= 0) {
        self._select(null);
        if (self.onMove) self.onMove(dg.sq, s, { dragged: true });
      } else if (dg.el) self._place(dg.el, dg.sq);
    }
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);

    el.addEventListener('pointerleave', function () {
      if (self._hover !== null) { self._hover = null; if (self.onHover) self.onHover(null); }
    });
  };

  Board.pieceSvg = pieceSvg;
  window.Board = Board;
})();
