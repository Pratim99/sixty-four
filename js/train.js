/* Sixty-Four — the Training hub: every drill and trainer in one place, a daily workout, and a practice log. */
(function () {
  'use strict';

  var CL = window.CL, h = CL.h;
  var CHAPTER = { id: 'train', title: 'Training' };
  var GROUPS = [
    { id: 'vision', title: 'Board vision', blurb: 'Squares, colours, lines, and who attacks what.' },
    { id: 'notation', title: 'Notation', blurb: 'Reading and writing moves until it is automatic.' },
    { id: 'openings', title: 'Openings', blurb: 'Recognise the main lines and recall their moves.' },
    { id: 'strategy', title: 'Strategy', blurb: 'Material, outposts and the features of a position.' },
    { id: 'pawns', title: 'Pawns', blurb: 'Read the pawn structure at a glance.' },
    { id: 'mates', title: 'Checkmates', blurb: 'The mating patterns, without the names attached.' },
    { id: 'tactics', title: 'Tactics', blurb: 'Puzzles against the clock and puzzles at your level.' },
    { id: 'endgames', title: 'Endgames', blurb: 'Play the basic wins and draws out against the engine.' }
  ];
  /* The daily workout takes one trainer from each of these slots. */
  var SLOTS = [['vision'], ['notation', 'openings'], ['tactics', 'mates'], ['strategy', 'pawns'], ['endgames']];

  /* Everything that can be practised: the drills that belong to course parts, plus registered trainers. */
  CL.allTrainers = function () {
    var out = [];
    CL.order.forEach(function (cid) {
      var ch = CL.content[cid];
      ((ch && ch.drills) || []).forEach(function (d) {
        out.push({ id: d.id, group: cid, title: d.title, desc: d.desc, timed: d.timed,
          href: '#/' + cid + '/drill/' + d.id, store: cid + '/drill/' + d.id });
      });
    });
    CL.trainers.forEach(function (t) {
      out.push({ id: t.id, group: t.group, title: t.title, desc: t.desc, timed: t.timed,
        href: '#/train/' + t.id, store: 'train/drill/' + t.id });
    });
    return out;
  };

  function ago(t) {
    if (!t) return 'not tried yet';
    var days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 86400000);
    return days <= 0 ? 'today' : (days === 1 ? 'yesterday' : days + ' days ago');
  }

  /* Today's five: chosen once per day, favouring whatever was practised longest ago. */
  function workout(all) {
    var key = CL.activity.dayKey(), saved = CL.store.pref('workout', null);
    if (saved && saved.day === key) {
      var kept = saved.items.map(function (s) { return all.filter(function (t) { return t.store === s; })[0]; }).filter(Boolean);
      var slots = SLOTS.filter(function (groups) { return all.some(function (t) { return groups.indexOf(t.group) >= 0; }); }).length;
      if (kept.length >= slots) return kept;
    }
    var picks = [];
    SLOTS.forEach(function (groups) {
      var cands = CL.shuffle(all.filter(function (t) { return groups.indexOf(t.group) >= 0; }));
      cands.sort(function (a, b) {
        var la = CL.activity.last(a.store), lb = CL.activity.last(b.store);
        return (la ? la.t : 0) - (lb ? lb.t : 0);
      });
      if (cands.length) picks.push(cands[0]);
    });
    CL.store.setPref('workout', { day: key, items: picks.map(function (t) { return t.store; }) });
    return picks;
  }

  function card(t, doneToday) {
    var best = CL.store.best(t.store), last = CL.activity.last(t.store);
    return h('a.card.link.train-card' + (doneToday ? '.done' : ''), { href: t.href }, [
      h('span.card-num', { text: doneToday ? '✓' : (t.timed ? String(t.timed) : '∞') }),
      h('span.card-body', [h('b', { text: t.title }), h('span', { text: t.desc })]),
      h('span.card-meta', [h('span', { text: best ? 'best ' + best : '' }), h('span', { text: ago(last && last.t) })])
    ]);
  }

  CL.trainView = function (root) {
    var all = CL.allTrainers(), today = CL.activity.today(), streak = CL.activity.streak();
    var picks = workout(all), doneCount = picks.filter(function (t) { return today.ids[t.store]; }).length;
    var tried = all.filter(function (t) { return CL.activity.last(t.store); }).length;
    var el = h('div.chapter');
    root.appendChild(el);

    el.appendChild(h('header.page-head', [
      h('div.kicker', { text: 'Practice' }),
      h('h1', { text: 'Training' }),
      h('p.lede', { text: 'The lessons explain an idea once. Skill comes from doing it a few hundred times. Every exercise here makes fresh questions each time you open it, keeps your best score, and takes a minute or two.' })
    ]));

    /* today */
    var strip = h('div.day-strip');
    CL.activity.recent(14).forEach(function (d) {
      strip.appendChild(h('i.day' + (d.n >= 3 ? '.d2' : (d.n ? '.d1' : '')), { title: d.key + ': ' + d.n + (d.n === 1 ? ' session' : ' sessions') }));
    });
    el.appendChild(h('div.today', [
      h('div.today-stat', [h('b', { text: String(streak) }), h('span', { text: 'day streak' })]),
      h('div.today-stat', [h('b', { text: String(today.n) }), h('span', { text: today.n === 1 ? 'session today' : 'sessions today' })]),
      h('div.today-stat', [h('b', { text: tried + '/' + all.length }), h('span', { text: 'exercises tried' })]),
      h('div.today-strip', [strip, h('span.muted.small', { text: 'last 14 days' })])
    ]));

    el.appendChild(h('h2.section', { text: 'Today’s workout' }));
    el.appendChild(h('p.section-sub', { text: doneCount >= picks.length
      ? 'All five done. Come back tomorrow for a new set, or carry on with anything below.'
      : 'Five short exercises, one from each area, chosen from what you have practised least. ' + doneCount + ' of ' + picks.length + ' done.' }));
    var wl = h('div.cards.two');
    picks.forEach(function (t) { wl.appendChild(card(t, !!today.ids[t.store])); });
    el.appendChild(wl);

    /* everything, by area */
    GROUPS.forEach(function (g) {
      var list = all.filter(function (t) { return t.group === g.id; });
      if (!list.length) return;
      el.appendChild(h('h2.section', { text: g.title }));
      el.appendChild(h('p.section-sub', { text: g.blurb }));
      var grid = h('div.cards.two');
      list.forEach(function (t) { grid.appendChild(card(t, false)); });
      el.appendChild(grid);
    });

    el.appendChild(h('h2.section', { text: 'More ways to practise' }));
    el.appendChild(h('div.cards.three', [
      h('a.card.link.stack', { href: '#/openings' }, [h('span.card-num', { text: '3' }), h('span.card-body', [h('b', { text: 'Opening lines from memory' }), h('span', { text: 'Pick any opening in Part 3 and play it through as White or Black.' })])]),
      h('a.card.link.stack', { href: '#/puzzles' }, [h('span.card-num', { text: '★' }), h('span.card-body', [h('b', { text: 'Puzzle sets' }), h('span', { text: 'Themed sets from the bank, and puzzles from your own games.' })])]),
      h('a.card.link.stack', { href: '#/play' }, [h('span.card-num', { text: '♞︎' }), h('span.card-body', [h('b', { text: 'A full game' }), h('span', { text: 'Play the bot at your level, then review the game.' })])])
    ]));
  };

  CL.trainerView = function (root, id) {
    var t = CL.trainers.filter(function (x) { return x.id === id; })[0];
    if (!t) {
      root.appendChild(h('div.chapter', [h('header.page-head', [h('h1', { text: 'That exercise is not here.' }), h('p.lede', [h('a', { href: '#/train' }, 'Back to training')])])]));
      return null;
    }
    return t.run(root, CHAPTER, t);
  };
})();
