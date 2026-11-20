/* Sixty-Four — board explorers used by the "See the Board" lessons.
   Each widget receives the lesson step context (board, ui panel, step) and wires up the board. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h, PIECE = Chess.PIECE_NAMES;

  /* A row of mutually exclusive buttons. */
  CL.seg = function (options, value, onChange) {
    var el = h('div.seg');
    options.forEach(function (o) {
      var b = h('button', { type: 'button', text: o.label });
      if (o.v === value) b.classList.add('on');
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(el.children, function (c) { c.classList.remove('on'); });
        b.classList.add('on');
        onChange(o.v);
      });
      el.appendChild(b);
    });
    return el;
  };

  /* ---------- 1. coordinates ---------- */
  CL.widgets.coords = function (ctx) {
    var board = ctx.board, pinned = null;
    var read = h('div.readout');
    var lab = h('button.btn.small', { text: 'Hide the labels', onclick: function () {
      board.setCoords(!board.showCoords);
      lab.textContent = board.showCoords ? 'Hide the labels' : 'Show the labels';
    } });
    var flip = h('button.btn.small', { text: 'Flip the board', onclick: function () { board.flip(); show(null); cap(); } });
    ctx.ui.appendChild(read);
    ctx.ui.appendChild(h('div.tools', [flip, lab]));

    function cap() { ctx.caption(board.orient === 'w' ? 'Seen from White’s chair' : 'Seen from Black’s chair'); }
    function show(s) {
      s = s || pinned;
      if (!s) {
        board.setHighlights({});
        read.innerHTML = '<span class="ro-big dim">··</span><span class="ro-sub">Point at any square</span>';
        return;
      }
      board.setHighlights({ line: CL.fileSquares(s.charAt(0)).concat(CL.rankSquares(s.charAt(1))), pick: [s] });
      read.innerHTML = '<span class="ro-big">' + s + '</span><span class="ro-sub">the <b>' + s.charAt(0) +
        '</b>-file, rank <b>' + s.charAt(1) + '</b></span>';
    }
    board.onHover = show;
    board.onSquare = function (s) { pinned = s; show(s); };
    show(null);
    cap();
  };

  /* ---------- 2. colours ---------- */
  CL.widgets.colors = function (ctx) {
    var board = ctx.board, pinned = null, all = false;
    var read = h('div.readout');
    var tog = h('button.btn.small', { text: 'Light up every square of that colour', onclick: function () {
      all = !all;
      tog.textContent = all ? 'Show just the one square' : 'Light up every square of that colour';
      show(null);
    } });
    ctx.ui.appendChild(read);
    ctx.ui.appendChild(h('div.tools', [tog]));

    function show(s) {
      s = s || pinned;
      if (!s) {
        board.setHighlights({});
        read.innerHTML = '<span class="ro-big dim">··</span><span class="ro-sub">Click any square</span>';
        return;
      }
      var dark = CL.isDark(s), p = CL.fr(s), sum = p[0] + p[1] + 2;
      board.setHighlights({
        soft: all ? CL.all.filter(function (x) { return CL.isDark(x) === dark; }) : [],
        pick: [s]
      });
      read.innerHTML = '<span class="ro-big">' + s + '</span><span class="ro-sub">is a <b>' + (dark ? 'dark' : 'light') + '</b> square</span>' +
        '<span class="ro-why">' + s.charAt(0) + ' is file number ' + (p[0] + 1) + '. ' + (p[0] + 1) + ' + ' + (p[1] + 1) + ' = ' + sum +
        ', which is ' + (sum % 2 ? 'odd, so light.' : 'even, so dark.') + '</span>';
    }
    board.onHover = function (s) { if (!pinned) show(s); };
    board.onSquare = function (s) { pinned = s; show(s); };
    show(null);
  };

  /* ---------- 3. diagonals ---------- */
  CL.widgets.diagonals = function (ctx) {
    var board = ctx.board, pinned = null;
    var read = h('div.readout.rows');
    var marks = [['a1', 'h8'], ['h1', 'a8'], ['a2', 'g8'], ['b1', 'h7'], ['c1', 'h6'], ['f1', 'a6']];
    var row = h('div.tools');
    marks.forEach(function (m) {
      row.appendChild(h('button.btn.small.mono', { text: m[0] + '–' + m[1], onclick: function () {
        pinned = null;
        var sq = CL.ray(m[0], m[1]);
        board.setHighlights({ d1: sq });
        read.innerHTML = '<div class="ro-head">A landmark diagonal</div>' + line(sq, 'd1');
      } }));
    });
    ctx.ui.appendChild(read);
    ctx.ui.appendChild(h('div.kicker.sub', { text: 'Landmark diagonals' }));
    ctx.ui.appendChild(row);

    function line(sq, cls) {
      if (sq.length < 2) return '<div class="ro-row"><i class="swatch ' + cls + '"></i><span>a corner: no second diagonal here</span></div>';
      return '<div class="ro-row"><i class="swatch ' + cls + '"></i><b class="mv">' + sq[0] + '–' + sq[sq.length - 1] +
        '</b><span>' + sq.length + ' squares, all ' + (CL.isDark(sq[0]) ? 'dark' : 'light') + '</span></div>';
    }
    function show(s) {
      s = s || pinned;
      if (!s) {
        board.setHighlights({});
        read.innerHTML = '<p class="muted">Click a square to see its two diagonals.</p>';
        return;
      }
      var d = CL.diagonals(s);
      board.setHighlights({ d1: d[0], d2: d[1], pick: [s] });
      read.innerHTML = '<div class="ro-head"><span class="ro-big">' + s + '</span> sits on</div>' + line(d[0], 'd1') + line(d[1], 'd2');
    }
    board.onHover = function (s) { if (!pinned) show(s); };
    board.onSquare = function (s) { pinned = s; show(s); };
    show(null);
  };

  /* ---------- 4. regions ---------- */
  var REGIONS = [
    { name: 'The centre', hl: { good: ['d4', 'e4', 'd5', 'e5'] },
      text: 'The four most valuable squares on the board. A piece here reaches both wings in one move; a pawn here takes space away from the enemy. Almost every opening is an argument about these four squares.' },
    { name: 'The extended centre', hl: { soft: CL.rect('c3', 'f6'), good: ['d4', 'e4', 'd5', 'e5'] },
      text: 'The ring around the centre. This is where knights and bishops want to live: close enough to matter, far enough back to be safe.' },
    { name: 'Kingside', hl: { note: CL.rect('e1', 'h8') },
      text: 'Files e to h, the half where the kings start. Most players castle here, so most attacks on the king happen here.' },
    { name: 'Queenside', hl: { info: CL.rect('a1', 'd8') },
      text: 'Files a to d. Play here is usually slower: gaining space, opening a file for the rooks, creating a passed pawn.' },
    { name: 'Each side’s half', hl: { info: CL.rect('a1', 'h4'), bad: CL.rect('a5', 'h8') },
      text: 'Ranks 1–4 are White’s territory, ranks 5–8 are Black’s. A piece that settles across the middle on a square where no pawn can chase it away has found an outpost, and it is a constant irritation.' },
    { name: 'The seventh rank', hl: { good: CL.rankSquares(7), bad: CL.rankSquares(2) },
      text: 'For White, rank 7; for Black, rank 2. It is where the enemy pawns start. A rook that gets there attacks them from the side and confines the king to its back rank.' },
    { name: 'The back ranks', hl: { note: CL.rankSquares(1).concat(CL.rankSquares(8)) },
      text: 'Ranks 1 and 8, where the pieces begin. A castled king boxed in by its own pawns can be checkmated here by a single rook or queen.' },
    { name: 'The rim', hl: { bad: CL.all.filter(function (s) { return 'ah'.indexOf(s.charAt(0)) >= 0 || '18'.indexOf(s.charAt(1)) >= 0; }) },
      text: 'The outer ring. Pieces here control fewer squares because half their reach falls off the board. Hence the old saying: a knight on the rim is dim.' },
    { name: 'f2 and f7', fen: Chess.START, hl: { bad: ['f2', 'f7'] }, arrows: [['e1', 'f2', 'red'], ['e8', 'f7', 'red']],
      text: 'At the start of the game, every pawn is protected by at least one piece other than the king, except these two, which only the king guards. Early attacks, from Scholar’s Mate onwards, aim here.' }
  ];

  CL.widgets.regions = function (ctx) {
    var board = ctx.board, text = h('div.region-text');
    var list = h('div.chips');
    REGIONS.forEach(function (rg, i) {
      var b = h('button.chip', { text: rg.name, onclick: function () { pick(i); } });
      rg._btn = b;
      list.appendChild(b);
    });
    ctx.ui.appendChild(list);
    ctx.ui.appendChild(text);
    function pick(i) {
      var rg = REGIONS[i];
      REGIONS.forEach(function (x, j) { x._btn.classList.toggle('on', j === i); });
      board.setPosition(rg.fen || {});
      board.setHighlights(rg.hl);
      board.setArrows(rg.arrows || []);
      text.innerHTML = '<h3>' + rg.name + '</h3><p>' + CL.esc(rg.text) + '</p>';
    }
    pick(0);
  };

  /* ---------- 5. piece reach ---------- */
  CL.widgets.reach = function (ctx) {
    var board = ctx.board, type = 'n', pinned = 'e4', heat = false;
    var read = h('div.readout');
    var pieces = CL.seg([{ v: 'n', label: 'Knight' }, { v: 'b', label: 'Bishop' }, { v: 'r', label: 'Rook' },
      { v: 'q', label: 'Queen' }, { v: 'k', label: 'King' }], type, function (v) { type = v; draw(null); });
    var tog = h('button.btn.small', { text: 'Show the heat map', onclick: function () {
      heat = !heat;
      tog.textContent = heat ? 'Hide the heat map' : 'Show the heat map';
      draw(null);
    } });
    ctx.ui.appendChild(pieces);
    ctx.ui.appendChild(read);
    ctx.ui.appendChild(h('div.tools', [tog]));

    function draw(s) {
      s = s || pinned;
      var map = {};
      map[s] = { type: type, color: 'w' };
      board.setPosition(map);
      var t = CL.reach(type, s);
      board.setHighlights({ reach: t });
      if (heat) {
        var labels = {}, tints = {}, min = 99, max = 0, c = {};
        CL.all.forEach(function (x) { c[x] = CL.reach(type, x).length; min = Math.min(min, c[x]); max = Math.max(max, c[x]); });
        CL.all.forEach(function (x) {
          labels[x] = x === s ? '' : c[x];
          tints[x] = 'rgba(220,95,30,' + (max === min ? 0.3 : 0.06 + 0.62 * (c[x] - min) / (max - min)) + ')';
        });
        board.setLabels(labels);
        board.setTints(tints);
      } else { board.setLabels({}); board.setTints({}); }
      read.innerHTML = '<span class="ro-big">' + t.length + '</span><span class="ro-sub">squares attacked by a <b>' + PIECE[type] +
        '</b> on <b class="mv">' + s + '</b></span>';
      ctx.caption(heat ? 'Each number: how many squares the ' + PIECE[type] + ' would attack from there' : '');
    }
    board.onHover = function (s) { draw(s); };
    board.onSquare = function (s) { pinned = s; draw(s); };
    draw(null);
  };

  /* ---------- 6. knight distance ---------- */
  var DIST_COL = ['', 'rgba(46,160,87,.78)', 'rgba(150,195,70,.62)', 'rgba(240,190,40,.6)', 'rgba(235,130,40,.62)', 'rgba(214,69,65,.62)', 'rgba(150,40,90,.6)'];
  var WORDS = ['', 'one move', 'two', 'three', 'four', 'five', 'six'];

  CL.widgets.knightDistance = function (ctx) {
    var board = ctx.board, at = ctx.step.start || 'd4';
    var read = h('div.readout');
    ctx.ui.appendChild(read);
    function draw() {
      var d = CL.knightDistances(at), labels = {}, tints = {}, n = [0, 0, 0, 0, 0, 0, 0], map = {};
      CL.all.forEach(function (s) {
        if (s === at) return;
        labels[s] = d[s]; tints[s] = DIST_COL[d[s]]; n[d[s]]++;
      });
      map[at] = { type: 'n', color: 'w' };
      board.setPosition(map);
      board.setLabels(labels);
      board.setTints(tints);
      var parts = [];
      for (var k = 1; k < 7; k++) if (n[k]) parts.push('<b>' + n[k] + '</b> in ' + WORDS[k]);
      read.innerHTML = '<span class="ro-big">' + at + '</span><span class="ro-sub">a ' + (CL.isDark(at) ? 'dark' : 'light') +
        ' square</span><span class="ro-why">Squares reached: ' + parts.join(', ') + '.</span>';
    }
    board.onSquare = function (s) { at = s; draw(); };
    draw();
    ctx.caption('Each number: knight moves needed to get there');
  };

  /* ---------- 7. control map ---------- */
  CL.controlMap = function (game) {
    var out = { tints: {}, labels: {}, w: 0, b: 0, both: 0 };
    CL.all.forEach(function (s) {
      var w = game.attackers(s, 'w').length, b = game.attackers(s, 'b').length, net = w - b;
      if (net > 0) { out.w++; out.tints[s] = 'rgba(38,110,214,' + Math.min(0.74, 0.2 + 0.15 * net) + ')'; }
      else if (net < 0) { out.b++; out.tints[s] = 'rgba(214,60,50,' + Math.min(0.74, 0.2 - 0.15 * net) + ')'; }
      else if (w > 0) { out.both++; out.tints[s] = 'rgba(128,90,170,.48)'; }
      out.labels[s] = (w || b) ? w + ':' + b : '';
    });
    return out;
  };

  var CONTROL_POSITIONS = [
    { name: 'Start', after: '' },
    { name: '1. e4', after: '1. e4' },
    { name: '1. e4 e5 2. Nf3', after: '1. e4 e5 2. Nf3' },
    { name: 'Italian', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5' },
    { name: 'Both castled', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O' }
  ];

  CL.widgets.control = function (ctx) {
    var board = ctx.board, list = ctx.step.positions || CONTROL_POSITIONS;
    var cur = 0, nums = false, game = null, map = null;
    var read = h('div.readout.rows'), sum = h('div.control-sum');
    var tog = h('button.btn.small', { text: 'Show the counts', onclick: function () {
      nums = !nums;
      tog.textContent = nums ? 'Hide the counts' : 'Show the counts';
      board.setLabels(nums ? map.labels : {});
    } });
    ctx.ui.appendChild(CL.seg(list.map(function (p, i) { return { v: i, label: p.name }; }), 0, function (v) { cur = v; load(); }));
    ctx.ui.appendChild(sum);
    ctx.ui.appendChild(read);
    ctx.ui.appendChild(h('div.tools', [tog]));
    board.el.classList.add('small-labels');

    function who(a) { return PIECE[game.get(a).type] + ' ' + a; }
    function row(name, sqs, cls) {
      return '<div class="ro-row"><i class="swatch ' + cls + '"></i><b>' + name + '</b><span>' +
        (sqs.length ? sqs.map(who).join(', ') : 'nobody') + '</span></div>';
    }
    function hover(s) {
      if (!s) {
        board.setArrows([]);
        read.innerHTML = '<p class="muted">Point at a square to see exactly who is watching it.</p>';
        return;
      }
      var w = game.attackers(s, 'w'), b = game.attackers(s, 'b');
      board.setArrows(w.map(function (a) { return [a, s, 'blue']; }).concat(b.map(function (a) { return [a, s, 'red']; })));
      read.innerHTML = '<div class="ro-head"><span class="ro-big">' + s + '</span> is watched by</div>' + row('White', w, 'blue') + row('Black', b, 'red');
    }
    function load() {
      game = CL.resolve(list[cur]);
      board.setPosition(game);
      map = CL.controlMap(game);
      board.setTints(map.tints);
      board.setLabels(nums ? map.labels : {});
      sum.innerHTML = '<span><i class="swatch blue"></i>White controls <b>' + map.w + '</b></span>' +
        '<span><i class="swatch red"></i>Black controls <b>' + map.b + '</b></span>' +
        '<span><i class="swatch purple"></i>contested <b>' + map.both + '</b></span>';
      hover(null);
    }
    board.onHover = hover;
    load();
    ctx.caption('Blue: White has more attackers. Red: Black has more.');
    return function () { board.el.classList.remove('small-labels'); };
  };
})();
