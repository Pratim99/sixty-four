/* Sixty-Four — the puzzles hub: the generated puzzle bank, and puzzles made from your own games. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
  var CHAPTER = { id: 'puzzles', title: 'Puzzles', lessons: [] };

  function bank() { return CL.puzzleBank || []; }
  function solved(p) { return CL.store.isDone('puz/' + p.id); }
  function themed(names) { return bank().filter(function (p) { return names.indexOf(p.theme) >= 0; }); }
  function fresh(list, n) {
    var un = list.filter(function (p) { return !solved(p); }), done = CL.shuffle(list.filter(solved));
    return un.concat(done).slice(0, n);
  }

  var SETS = {
    mine: { title: 'From your own games', desc: 'Positions where the review found you a better move. The most valuable puzzles you can solve.',
      all: function () { return CL.games.puzzles(); }, pick: function () { return fresh(CL.games.puzzles(), 10); } },
    mixed: { title: 'Mixed ten', desc: 'Ten puzzles you have not solved, themes mixed, easier ones first.',
      all: bank, pick: function () {
        var un = CL.shuffle(bank().filter(function (p) { return !solved(p); }));
        if (un.length < 10) un = un.concat(CL.shuffle(bank().filter(solved)));
        var out = [], want = { 1: 4, 2: 4, 3: 2 };
        un.forEach(function (p) { if (out.length < 10 && want[p.level] > 0) { want[p.level]--; out.push(p); } });
        un.forEach(function (p) { if (out.length < 10 && out.indexOf(p) < 0) out.push(p); });
        return out.sort(function (a, b) { return a.level - b.level; });
      } },
    mate1: { title: 'Mate in one', desc: 'One move ends the game. Train yourself to check every check.',
      all: function () { return themed(['Mate in 1']); }, pick: function () { return fresh(themed(['Mate in 1']), 10); } },
    material: { title: 'Win material', desc: 'A loose piece, a fork, a pin: one move wins something.',
      all: function () { return themed(['Loose piece', 'Win material']); }, pick: function () { return fresh(themed(['Loose piece', 'Win material']), 10); } },
    mate2: { title: 'Mate in two', desc: 'A forcing first move, then the finish. Harder.',
      all: function () { return themed(['Mate in 2']); }, pick: function () { return fresh(themed(['Mate in 2']), 10); } }
  };

  function step(p, mine) {
    var side = p.fen.split(' ')[1] === 'w' ? 'White' : 'Black', mate = /^Mate/.test(p.theme || '');
    var st = { type: 'puzzle', fen: p.fen, orient: side === 'White' ? 'w' : 'b', solution: p.solution, doneId: 'puz/' + p.id };
    if (mine) {
      st.lenient = p.bestScore;
      st.title = 'From your game, move ' + p.move;
      st.text = 'You are ' + side + '. In the game you played `' + p.played + '` here, ' +
        (p.mated ? 'which allowed a forced checkmate.' : (p.missedMate ? 'but there was a forced checkmate.' : 'and it cost about ' + (p.loss / 100).toFixed(1) + ' pawns.')) +
        ' **Find a better move.**';
      st.explain = 'The engine’s choice was `' + p.solution[0] + '`' + (p.line ? ', expecting: ' + p.line : '') + '.';
      st.wrong = 'That does not improve on the game. Look again.';
    } else {
      st.title = p.theme === 'Mate in 1' ? 'Checkmate in one' : (p.theme === 'Mate in 2' ? 'Checkmate in two' : side + ' to play and win');
      st.text = mate ? side + ' to move. Find the forced mate.'
        : side + ' to move. One move is clearly best, and it wins material. Look at every check and every capture.';
      st.explain = p.line ? 'The engine’s main line: ' + p.line + '.' : '';
    }
    return st;
  }

  CL.puzzlesView = function (root) {
    var el = h('div.chapter');
    root.appendChild(el);
    var total = bank().length, done = bank().filter(solved).length;
    el.appendChild(h('header.page-head', [
      h('div.kicker', { text: 'Practice' }),
      h('h1', { text: 'Puzzles' }),
      h('p.lede', { text: 'Tactics are pattern recognition, and patterns come from repetition. A few puzzles a day do more than an hour once a week. ' + (total ? 'You have solved ' + done + ' of ' + total + ' in the bank.' : '') })
    ]));
    var grid = h('div.cards.two');
    Object.keys(SETS).forEach(function (key) {
      var s = SETS[key], all = s.all(), n = all.filter(solved).length, empty = !all.length;
      var meta = empty ? (key === 'mine' ? 'none yet' : 'empty') : n + ' / ' + all.length;
      grid.appendChild(h((empty ? 'div' : 'a') + '.card.link' + (!empty && n === all.length ? '.done' : '') + (empty ? '.off' : ''),
        empty ? {} : { href: '#/puzzles/' + key }, [
          h('span.card-num', { text: key === 'mine' ? '★' : (!empty && n === all.length ? '✓' : '♟︎') }),
          h('span.card-body', [h('b', { text: s.title }), h('span', { text: empty && key === 'mine' ? 'Play a game against the bot and review it. Your mistakes will appear here as puzzles.' : s.desc })]),
          h('span.card-meta', { text: meta })
        ]));
    });
    el.appendChild(grid);
    el.appendChild(h('h2.section', { text: 'From the course' }));
    el.appendChild(h('div.cards.two', [
      h('a.card.link', { href: '#/mates/drill/mix' }, [h('span.card-num', { text: '6' }), h('span.card-body', [h('b', { text: 'Mate mix' }), h('span', { text: 'The named checkmate patterns from Part 6, shuffled.' })])]),
      h('a.card.link', { href: '#/tactics/drill/mix' }, [h('span.card-num', { text: '7' }), h('span.card-body', [h('b', { text: 'Puzzle mix' }), h('span', { text: 'Forks, pins, skewers and mates from Parts 6 and 7.' })])])
    ]));
    if (!CL.games.puzzles().length) {
      el.appendChild(h('div.step-nav', [h('span.muted', { text: 'Want puzzles from your own games?' }), h('a.btn.primary', { href: '#/play' }, 'Play the bot →')]));
    }
  };

  CL.puzzleSetView = function (root, key) {
    var s = SETS[key], list = s ? s.pick() : [];
    if (!s || !list.length) {
      root.appendChild(h('div.chapter', [h('header.page-head', [h('h1', { text: 'Nothing here yet.' }), h('p.lede', [h('a', { href: '#/puzzles' }, 'Back to puzzles')])])]));
      return null;
    }
    return CL.lessonView(root, CHAPTER, {
      id: key, doneId: 'puzset/' + key, title: s.title,
      takeaway: key === 'mine'
        ? 'These came from your own games, so they are exactly the patterns you are missing. Come back after each review: solved ones drop to the back of the queue.'
        : 'Solved puzzles drop to the back of the queue, so each visit brings new ones until the bank is finished.',
      steps: list.map(function (p) { return step(p, key === 'mine'); })
    });
  };
})();
