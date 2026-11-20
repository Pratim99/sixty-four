/* Sixty-Four — app shell: routing, sidebar, home page, chapter pages. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
  var main = document.getElementById('main'), nav = document.getElementById('nav'), nav2 = document.getElementById('nav2');
  var PRACTICE = [
    { id: 'train', glyph: '✦', title: 'Training', sub: 'Drills for every part', blurb: 'Short, repeatable exercises for every part of the course, with a daily workout.' },
    { id: 'play', glyph: '♞︎', title: 'Play the bot', sub: 'From beginner to Stockfish', blurb: 'A sparring partner at the rating you choose. Games are saved for review.' },
    { id: 'games', glyph: '±', title: 'Your games', sub: 'Engine review of every move', blurb: 'See where each game turned, what was better, and which habits to fix.' },
    { id: 'puzzles', glyph: '★', title: 'Puzzles', sub: 'Including your own mistakes', blurb: 'A bank of checked puzzles, plus positions from your own games.' }
  ];
  var cleanup = null;

  function chapters() {
    return CL.order.map(function (id) { return CL.content[id]; }).filter(Boolean);
  }
  function find(list, id) {
    for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function progress(ch) {
    var items = ch.lessons.concat(ch.lines || []);
    return { total: items.length, done: items.filter(function (x) { return CL.store.isDone(ch.id + '/' + x.id); }).length };
  }
  function nextUp() {
    var all = chapters();
    for (var i = 0; i < all.length; i++) {
      for (var j = 0; j < all[i].lessons.length; j++) {
        if (!CL.store.isDone(all[i].id + '/' + all[i].lessons[j].id)) return { chapter: all[i], lesson: all[i].lessons[j] };
      }
    }
    return null;
  }

  CL.refreshNav = function () {
    var cur = location.hash.replace(/^#\/?/, '').split('/')[0];
    nav.innerHTML = '';
    chapters().forEach(function (ch) {
      var p = progress(ch);
      nav.appendChild(h('a.nav-item' + (cur === ch.id ? '.on' : ''), { href: '#/' + ch.id }, [
        h('span.nav-num', { text: ch.num }),
        h('span.nav-text', [h('b', { text: ch.title }), h('small', { text: ch.short })]),
        h('span.nav-prog' + (p.done === p.total ? '.full' : ''), { text: p.done + '/' + p.total })
      ]));
    });
    nav2.innerHTML = '';
    PRACTICE.forEach(function (it) {
      var extra = it.id === 'train' ? (CL.activity.streak() ? CL.activity.streak() + 'd' : 0) : it.id === 'games' ? CL.games.all().length : (it.id === 'puzzles' ? CL.games.puzzles().filter(function (p) { return !CL.store.isDone('puz/' + p.id); }).length : 0);
      nav2.appendChild(h('a.nav-item' + (cur === it.id ? '.on' : ''), { href: '#/' + it.id }, [
        h('span.nav-num.glyph', { text: it.glyph }),
        h('span.nav-text', [h('b', { text: it.title }), h('small', { text: it.sub })]),
        h('span.nav-prog', { text: extra ? String(extra) : '' })
      ]));
    });
  };

  /* ---------- home ---------- */
  function home(root) {
    var up = nextUp(), started = chapters().some(function (ch) { return progress(ch).done > 0; });
    var boardHost = h('div.board-host.hero-board');
    var cta = up
      ? h('a.btn.primary.big', { href: '#/' + up.chapter.id + '/lesson/' + up.lesson.id }, (started ? 'Continue: ' : 'Begin: ') + up.lesson.title + ' →')
      : h('a.btn.primary.big', { href: '#/tactics' }, 'Course complete — keep solving →');

    root.appendChild(h('section.hero', [
      h('div.hero-text', [
        h('div.kicker', { text: 'A chess course in seven parts' }),
        h('h1', { text: 'Learn to see the board.' }),
        h('p.lede', { text: 'Beginners see thirty-two pieces. Strong players see sixty-four named squares, the lines that connect them, and who controls each one. This course starts there. Once the board is a map you can read and a language you can speak, openings, plans, pawn play, checkmates and tactics stop being things to memorise and start being things you can see.' }),
        h('div.hero-actions', [cta, h('a.btn.ghost', { href: '#/train' }, 'Or go straight to training')])
      ]),
      h('div.hero-art', [boardHost, h('div.board-caption', { text: 'The same position as a map of control: blue squares belong to White, red to Black.' })])
    ]));

    var hb = new Board(boardHost, { coords: false });
    try {
      var g = Chess.fromMoves('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O');
      hb.setPosition(g);
      hb.setTints(CL.controlMap(g).tints);
    } catch (e) { console.error(e); }

    root.appendChild(h('h2.section', { text: 'The path' }));
    var path = h('div.path');
    chapters().forEach(function (ch) {
      var p = progress(ch), pct = p.total ? Math.round(p.done / p.total * 100) : 0;
      path.appendChild(h('a.path-card', { href: '#/' + ch.id }, [
        h('span.path-num', { text: ch.num }),
        h('span.path-body', [h('b', { text: ch.title }), h('span', { text: ch.tagline })]),
        h('span.path-prog', [h('span.bar', [h('i', { style: 'width:' + pct + '%' })]), h('small', { text: p.done + ' of ' + p.total })])
      ]));
    });
    root.appendChild(path);

    root.appendChild(h('h2.section', { text: 'Then use it' }));
    var prac = h('div.cards.three');
    PRACTICE.forEach(function (it) {
      prac.appendChild(h('a.card.link.stack', { href: '#/' + it.id }, [
        h('span.card-num', { text: it.glyph }),
        h('span.card-body', [h('b', { text: it.title }), h('span', { text: it.blurb })])
      ]));
    });
    root.appendChild(prac);

    root.appendChild(h('h2.section', { text: 'How to use this' }));
    root.appendChild(h('div.notes', [
      h('div.note', [h('b', { text: 'Do, don’t read.' }), h('p', { text: 'Every lesson asks you to click, move or type. If you skip those steps the ideas will not stick. Wrong answers are free.' })]),
      h('div.note', [h('b', { text: 'Parts 1 and 2 first.' }), h('p', { text: 'Everything later is written in notation and refers to squares by name. An hour spent on the board and its language pays for itself many times over.' })]),
      h('div.note', [h('b', { text: 'Two minutes a day.' }), h('p', { text: 'The timed drills in Part 1 are the fastest way to change what you see. Do one or two before each session and watch your score climb.' })])
    ]));

    root.appendChild(h('h2.section', { text: 'Your progress' }));
    root.appendChild(dataPanel());
  }

  /* ---------- chapter page ---------- */
  function chapterPage(root, ch) {
    var el = h('div.chapter');
    el.appendChild(h('header.page-head', [
      h('div.kicker', { text: 'Part ' + ch.num + ' of 7' }),
      h('h1', { text: ch.title }),
      h('p.lede', { text: ch.tagline })
    ]));

    el.appendChild(h('h2.section', { text: 'Lessons' }));
    var list = h('div.cards');
    ch.lessons.forEach(function (ls, i) {
      var done = CL.store.isDone(ch.id + '/' + ls.id);
      list.appendChild(h('a.card.link' + (done ? '.done' : ''), { href: '#/' + ch.id + '/lesson/' + ls.id }, [
        h('span.card-num', { text: done ? '✓' : String(i + 1) }),
        h('span.card-body', [h('b', { text: ls.title }), h('span', { text: ls.blurb })]),
        h('span.card-meta', { text: ls.steps.length + ' steps' })
      ]));
    });
    el.appendChild(list);

    (ch.groups || []).forEach(function (grp) {
      el.appendChild(h('h2.section', { text: grp.title }));
      if (grp.blurb) el.appendChild(h('p.section-sub', { text: grp.blurb }));
      var grid = h('div.cards.two');
      grp.ids.forEach(function (id) {
        var op = find(ch.lines, id);
        if (!op) return;
        var done = CL.store.isDone(ch.id + '/' + op.id);
        var sans = op.moves.map(function (m) { return m[0]; });
        grid.appendChild(h('a.card.link' + (done ? '.done' : ''), { href: '#/' + ch.id + '/line/' + op.id }, [
          h('span.card-num', { text: done ? '✓' : '♞︎' }),
          h('span.card-body', [h('b', { text: op.name }), h('span.mono', { text: CL.lineSummary(sans, 6) }), h('span', { text: op.tag })])
        ]));
      });
      el.appendChild(grid);
    });

    var more = CL.trainers.filter(function (t) { return t.group === ch.id; });
    if ((ch.drills && ch.drills.length) || more.length) {
      el.appendChild(h('h2.section', { text: 'Practice' }));
      var dl = h('div.cards.two');
      (ch.drills || []).forEach(function (d) {
        var best = CL.store.best(ch.id + '/drill/' + d.id);
        dl.appendChild(h('a.card.link.drill-card', { href: '#/' + ch.id + '/drill/' + d.id }, [
          h('span.card-num', { text: '▶︎' }),
          h('span.card-body', [h('b', { text: d.title }), h('span', { text: d.desc })]),
          h('span.card-meta', { text: best ? 'best ' + best : (d.timed ? d.timed + ' s' : '') })
        ]));
      });
      more.forEach(function (t) {
        var best = CL.store.best('train/drill/' + t.id);
        dl.appendChild(h('a.card.link.drill-card', { href: '#/train/' + t.id }, [
          h('span.card-num', { text: '▶︎' }),
          h('span.card-body', [h('b', { text: t.title }), h('span', { text: t.desc })]),
          h('span.card-meta', { text: best ? 'best ' + best : (t.timed ? t.timed + ' s' : '') })
        ]));
      });
      el.appendChild(dl);
    }
    root.appendChild(el);
  }

  function notFound(root) {
    root.appendChild(h('div.chapter', [
      h('header.page-head', [h('h1', { text: 'That page isn’t here.' }), h('p.lede', [h('a', { href: '#/' }, 'Back to the start')])])
    ]));
  }

  /* ---------- router ---------- */
  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    main.innerHTML = '';
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    var ch = CL.content[parts[0]], view = notFound, item;
    if (!parts.length) view = home;
    else if (parts[0] === 'train') view = parts[1] ? function (r) { return CL.trainerView(r, parts[1]); } : CL.trainView;
    else if (parts[0] === 'play') view = CL.playView;
    else if (parts[0] === 'games') view = parts[1] ? function (r) { return CL.reviewView(r, parts[1]); } : CL.gamesView;
    else if (parts[0] === 'puzzles') view = parts[1] ? function (r) { return CL.puzzleSetView(r, parts[1]); } : CL.puzzlesView;
    else if (ch && parts.length === 1) view = function (r) { return chapterPage(r, ch); };
    else if (ch && parts[1] === 'lesson' && (item = find(ch.lessons, parts[2]))) {
      view = function (r) { return CL.lessonView(r, ch, item); };
    } else if (ch && parts[1] === 'drill' && (item = find(ch.drills, parts[2])) && CL.drills[item.kind || item.id]) {
      view = function (r) { return CL.drills[item.kind || item.id].run(r, ch, item); };
    } else if (ch && parts[1] === 'line' && (item = find(ch.lines, parts[2]))) {
      view = function (r) { return CL.openingView(r, ch, item); };
    }
    try { cleanup = view(main) || null; }
    catch (e) {
      console.error(e);
      main.appendChild(h('p.feedback.bad', { text: 'Something went wrong loading this page: ' + e.message }));
    }
    CL.refreshNav();
    window.scrollTo(0, 0);
  }

  /* ---------- your data: where it lives, backing it up, installing ---------- */
  var ON_FILE = window.SIXTYFOUR_SAVED_TO === 'file';   // set by the Windows launcher, which keeps a file on disk
  var installEvent = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvent = e; });
  document.getElementById('saved-where').textContent = ON_FILE ? 'Progress is saved on this computer.' : 'Progress is saved on this device.';

  function allData() {
    var o = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('sixtyfour.') === 0) o[k] = localStorage.getItem(k);
    }
    return o;
  }
  function backup() {
    var a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(allData(), null, 1)], { type: 'application/json' })),
      download: 'sixty-four-progress-' + CL.activity.dayKey() + '.json' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  function restore(file, say) {
    var rd = new FileReader();
    rd.onload = function () {
      var data, keys;
      try {
        data = JSON.parse(rd.result);
        keys = Object.keys(data).filter(function (k) { return k.indexOf('sixtyfour.') === 0 && typeof data[k] === 'string'; });
      } catch (e) { keys = []; }
      if (!keys.length) return say('That file is not a Sixty-Four backup.', 'bad');
      if (!window.confirm('Replace the progress on this device with the backup?')) return;
      Object.keys(allData()).forEach(function (k) { localStorage.removeItem(k); });
      keys.forEach(function (k) { localStorage.setItem(k, data[k]); });
      setTimeout(function () { location.reload(); }, 400);   // give the launcher a moment to write its file
    };
    rd.readAsText(file);
  }
  function dataPanel() {
    var note = h('div.feedback', { hidden: true });
    function say(msg, kind) { note.className = 'feedback ' + kind; note.textContent = msg; note.hidden = false; }
    var file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    file.addEventListener('change', function () { if (file.files[0]) restore(file.files[0], say); file.value = ''; });
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
    var apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var tools = h('div.tools', [
      h('button.btn.small', { text: 'Download a backup', onclick: backup }),
      h('button.btn.small', { text: 'Restore from a backup', onclick: function () { file.click(); } }),
      h('button.btn.small', { text: 'Erase everything', onclick: function () {
        if (window.confirm('Clear all saved progress, best scores, saved games and personal puzzles?')) {
          CL.store.reset(); CL.games.clear(); CL.activity.clear(); route();
        }
      } })
    ]);
    var kids = [
      h('p', { text: ON_FILE
        ? 'Everything you do here is saved in a file on this computer, so it is there every time you open Sixty-Four, whatever happens to your browser.'
        : 'Everything you do here is saved on this device and is there every time you come back. It lives in this browser’s storage, so clearing the browser’s site data would erase it: download a backup now and then, and use one to move your progress to another device.' }),
      tools, file, note
    ];
    if (!ON_FILE && !standalone && location.protocol === 'https:') {
      if (installEvent) {
        tools.insertBefore(h('button.btn.small.primary', { text: 'Install as an app', onclick: function () { installEvent.prompt(); installEvent = null; } }), tools.firstChild);
      } else {
        kids.push(h('p.muted.small.gap', { text: apple
          ? 'To use it like an app on an iPhone or iPad: open it in Safari, tap the Share button, then "Add to Home Screen".'
          : 'To use it like an app: open your browser’s menu and choose "Install app" or "Add to Home screen".' }));
      }
    }
    return h('div.card.data-card', kids);
  }
  CL.dataPanel = dataPanel;

  if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) { /* not supported */ } }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* the app works without it */ });
  }

  window.addEventListener('hashchange', route);
  route();
})();
