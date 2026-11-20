/* Part 7 — Tactics */
(function () {
  'use strict';
  var CL = window.CL;

  var PETROV = '1. e4 e5 2. Nf3 Nf6 3. Nxe5 Nxe4 4. Qe2 Nf6';
  var MILNER = '1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. Bd3 cxd4 7. cxd4 Nxd4 8. Nxd4 Qxd4';
  var LOOSE = 'r3qrk1/ppp3pp/8/2b5/8/8/PPP2PPP/R1BQ1RK1 w - - 0 1';
  var GUARD = 'r2q1rk1/ppp1bppp/3p1n2/8/3P4/2NQ4/PPB3PP/R4RK1 w - - 0 1';

  CL.content.tactics = {
    id: 'tactics', num: 7, title: 'Tactics', short: 'Forks, pins and combinations',
    tagline: 'A tactic is a short forced sequence that wins something. There are only about a dozen basic ideas, and nearly all of them come down to one thing: a single move that makes two threats, when your opponent can only answer one.',

    lessons: [
      {
        id: 'fork', title: 'The fork',
        blurb: 'One piece attacks two things. Knights, pawns and queens all do it.',
        takeaway: 'A fork is one move that attacks two targets. The best forks include a **check**, because the king must be dealt with first. Before every move ask: are there two loose things I could attack at once?',
        steps: [
          { type: 'info', fen: 'r3k2r/ppN2ppp/8/8/8/8/PPP2PPP/R3K2R b - - 0 1', arrows: [['c7', 'e8', 'red'], ['c7', 'a8', 'red']], title: 'Two targets, one move',
            text: 'The knight has landed on `c7` with check, and it also attacks the rook on `a8`. Black must get out of check, and then the rook is taken.\n\nThat is a **fork**: one piece, two targets. Black can only save one.\n\nKnights are the best forkers, because the pieces they attack usually cannot attack them back. A knight that forks king and queen has a name of its own: the royal fork.' },
          { type: 'puzzle', fen: '5rk1/pp3ppp/8/3q1N2/8/8/PP3PPP/R5K1 w - - 0 1', solution: ['Ne7+', 'Kh8', 'Nxd5'], title: 'Knight fork',
            text: 'White to move. Black’s queen and king are a knight-fork apart. Find the square.',
            hint: 'Which square does a knight attack both g8 and d5 from?',
            explain: 'From `e7` the knight checks the king and attacks the queen. Notice that king and queen stood on the **same colour** (both light): that is what made the fork possible.' },
          { type: 'puzzle', after: '1. e4 e6 2. d4 Bd6 3. Nf3 Nf6', solution: ['e5'], title: 'Pawn fork',
            text: 'White to move. Two black pieces stand side by side with one square between them. The humblest piece on the board can attack both.',
            explain: 'The pawn attacks the bishop and the knight at once. Black can save one (even with `...Bb4+` first) but not both. Pieces lined up on the same rank, two files apart, are asking for a pawn fork.' },
          { type: 'find', fen: LOOSE, answers: ['c5'], title: 'First, find what is loose',
            text: 'Forks need targets, and the best targets are **loose pieces**: pieces nothing is protecting.\n\nLook at Black’s pieces (not the pawns). **Click the one that is undefended.**',
            wrong: 'That piece is protected by another black piece. Look again.',
            explain: 'The bishop on `c5`. The queen and rooks all protect each other, but nothing protects the bishop. There is a saying: _loose pieces drop off_.' },
          { type: 'puzzle', fen: LOOSE, solution: ['Qd5+', 'Kh8', 'Qxc5'], title: 'Queen fork',
            text: 'White to move. You know the bishop is loose. Now find a move that attacks it **and** gives check.',
            hint: 'Black’s f-pawn is missing, so the diagonal to the king is open.',
            explain: 'The queen checks along the open diagonal and attacks the bishop at the same time. A check plus an attack on a loose piece is the most common tactic there is.' }
        ]
      },

      {
        id: 'pin', title: 'The pin',
        blurb: 'A piece that cannot, or dare not, move.',
        takeaway: 'A pinned piece is frozen in front of something more valuable. **Attack it again**, especially with a pawn. And remember that **a pinned piece does not really defend anything**.',
        steps: [
          { type: 'info', after: '1. e4 e5 2. Nf3 Nc6 3. Bb5 d6', arrows: [['b5', 'c6', 'red'], ['c6', 'e8', 'yellow']], title: 'The absolute pin',
            text: 'The bishop attacks the knight, and behind the knight, on the same diagonal, stands the king.\n\nThe knight is **pinned**. If it moved, the king would be in check, so by the rules it cannot move at all. This is an **absolute** pin.\n\nA pin needs three things in a line: your long-range piece (bishop, rook or queen), their piece, and something more valuable behind it.' },
          { type: 'info', after: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5', arrows: [['g5', 'f6', 'red'], ['f6', 'd8', 'yellow']], title: 'The relative pin',
            text: 'Here the knight is pinned against the **queen**, not the king. It is allowed to move, but doing so would normally lose the queen. This is a **relative** pin.\n\nRelative pins can be broken when the pinned piece has something even better to do. That is exactly how Légal’s Mate and the Elephant Trap work. So treat a relative pin as strong, not unbreakable.' },
          { type: 'puzzle', fen: 'r2qk2r/ppp2ppp/3p4/4n3/8/8/PPP2PPP/R1BQR1K1 w - - 0 1', arrows: [['e1', 'e5', 'red']], solution: ['f4'], title: 'Attack the pinned piece',
            text: 'White to move. The knight on `e5` is pinned to the king by the rook, and defended by a pawn. Pinned pieces cannot run away. What is the cheapest thing you can attack it with?',
            explain: 'The pawn attacks the knight, and the knight cannot move. Next move the pawn takes it. Always look for a **pawn** to attack a pinned piece: it does not matter that the piece is defended, because a pawn for a knight is a fine trade.' },
          { type: 'puzzle', fen: 'r4rk1/pppq1ppp/8/8/4N3/8/PPP1QP1P/6RK w - - 0 1', arrows: [['g1', 'g7', 'red']], solution: ['Nf6+', 'Kh8', 'Nxd7'], title: 'A pinned piece is a poor defender',
            text: 'White to move. The pawn on `g7` appears to guard `f6`. But look at what stands behind it on the g-file.',
            hint: 'The g7 pawn is pinned to the king by the rook on g1. So what does it really guard?',
            explain: 'The knight lands on `f6` with check, forking king and queen, and the g-pawn cannot capture it because that would expose the king to the rook. When you see a pin, ask what the pinned piece was supposed to be guarding.' }
        ]
      },

      {
        id: 'skewer', title: 'The skewer',
        blurb: 'A pin turned back to front.',
        takeaway: 'In a skewer the **more** valuable piece is in front. It has to move, and the piece behind it falls. Look for enemy pieces lined up on the same rank, file or diagonal.',
        steps: [
          { type: 'info', fen: 'r5k1/5ppp/8/3q4/8/8/5PBP/6K1 b - - 0 1', arrows: [['g2', 'd5', 'red'], ['d5', 'a8', 'yellow']], title: 'The piece in front must move',
            text: 'A pin attacks a piece that has something more valuable behind it. A **skewer** is the reverse: the valuable piece is in front.\n\nThe bishop attacks the queen. The queen has to move, and when she does, the rook on `a8` is exposed on the same diagonal. Black loses at least a rook for a bishop.\n\nSkewers most often happen along a line through a king: a check, the king steps aside, and whatever was behind it is taken.' },
          { type: 'puzzle', fen: '8/q3k3/pp1pp3/8/8/6P1/PP3PK1/7R w - - 0 1', solution: ['Rh7+', 'Kf6', 'Rxa7'], title: 'Skewer the king',
            text: 'White to move. White is far behind in material, but Black’s king and queen are standing on the same rank.',
            hint: 'Give check along the seventh rank.',
            explain: 'The rook checks along the seventh rank. The king must step off it, and the queen behind it is lost. Whenever a king and another piece share a line, look for the check.' }
        ]
      },

      {
        id: 'discovery', title: 'Discovered attacks',
        blurb: 'Move one piece, unleash another. The double check.',
        takeaway: 'When one of your pieces stands in front of another on the same line, moving the front piece **uncovers an attack**, and the piece that moves gets a free move. A **double check** can only be answered by moving the king.',
        steps: [
          { type: 'line', title: 'A trap in the Petrov',
            text: 'Black copies White once too often.',
            moves: [
              ['e4', ''], ['e5', ''], ['Nf3', ''],
              ['Nf6', 'Black counter-attacks instead of defending.'],
              ['Nxe5', ''],
              ['Nxe4', 'Copying White. This is the mistake: Black should play ...d6 first.'],
              ['Qe2', 'The queen lines up behind the knight, on the same file as Black’s king.'],
              ['Nf6', 'Black retreats the attacked knight…'],
              ['Nc6+', '…and the white knight steps off the e-file. The queen now gives check, and the knight is attacking Black’s queen. Black must deal with the check, and loses the queen.']
            ] },
          { type: 'puzzle', after: PETROV, arrows: [['e2', 'e8', 'yellow']], solution: ['Nc6+'], title: 'Discovered check',
            text: 'Now find it yourself. White’s queen and Black’s king are on the same file, with only the white knight between them. Wherever the knight goes, it is check. So where should it go?',
            hint: 'Move the knight to the square where it attacks the most valuable thing it can.',
            explain: 'The knight uncovers check from the queen **and** attacks Black’s queen. Black has one move to answer two threats. A discovered check gives the moving piece a free move, so send it where it does the most damage.' },
          { type: 'puzzle', after: MILNER, arrows: [['d1', 'd4', 'yellow']], solution: ['Bb5+', 'Ke7', 'Qxd4'], title: 'Discovered attack',
            text: 'White to move. Black has just grabbed a pawn on `d4` with the queen. White’s queen would be attacking her, if only the bishop on `d3` were not in the way.',
            hint: 'Move the bishop out of the way with a check.',
            explain: 'The bishop moves away **with check**, so Black has no time to save the queen. This trap in the French Defence has caught thousands of players.' },
          { type: 'line', title: 'The double check', text: 'Réti against Tartakower, Vienna 1910. Eleven moves, one of the most famous finishes in chess. Watch for move 10.',
            moves: [
              ['e4', ''], ['c6', ''], ['d4', ''], ['d5', ''], ['Nc3', ''], ['dxe4', ''], ['Nxe4', ''], ['Nf6', ''],
              ['Qd3', ''], ['e5', ''], ['dxe5', ''],
              ['Qa5+', 'A check that wins the pawn back.'],
              ['Bd2', ''], ['Qxe5', 'The knight on e4 is now pinned to the king.'],
              ['O-O-O', 'White castles, apparently leaving the knight to be taken.'],
              ['Nxe4', 'Black takes it.'],
              ['Qd8+', 'A queen sacrifice! The king must capture.'],
              ['Kxd8', ''],
              ['Bg5+', 'The bishop moves off the d-file and gives check. The rook behind it gives check too. This is a **double check**: Black cannot block or capture two checking pieces at once, so the king must move.'],
              ['Kc7', 'Going back to e8 allows the rook to mate on d8.'],
              ['Bd8#', 'Checkmate.']
            ] }
        ]
      },

      {
        id: 'guard', title: 'Removing the defender',
        blurb: 'If a piece is holding the position together, take it away.',
        takeaway: 'Find the one piece that is stopping your threat, then **capture it, chase it or distract it**. And before any capture, check for an in-between move.',
        steps: [
          { type: 'puzzle', tactic: true, fen: GUARD, arrows: [['c2', 'h7', 'yellow']], solution: ['Rxf6', 'Bxf6', 'Qxh7#'], title: 'Capture the guard',
            text: 'White to move. Queen and bishop are lined up against `h7`, and only one black piece is defending it. Remove that piece.',
            hint: 'The knight on f6 is the only defender of h7. What can take it?',
            explain: 'The rook takes the knight. If Black recaptures with anything, `Qxh7` is mate. Black’s best is to block with `...g6`, but then White has simply won a knight. The rook was worth less than the job the knight was doing.' },
          { type: 'line', fen: 'r2q1rk1/ppp1bppp/5n2/8/8/2NQ4/PPB3PP/R4RK1 w - - 0 1', arrows: [['d8', 'd3', 'red']], title: 'A warning: the in-between move',
            text: 'Here is almost the same position, with the two d-pawns missing. The d-file is open. Watch what happens if White plays the same idea.',
            moves: [
              ['Rxf6', 'The same capture, with the same threat of mate on h7.'],
              ['Qxd3', 'But Black does not recapture! First the queens come off, with the d-file now open.'],
              ['Bxd3', ''],
              ['Bxf6', '**Now** Black recaptures. The mate threat is gone and Black is a rook for a knight ahead.']
            ],
            intro: 'A small difference in the pawns. Press **Next move**.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'The lesson',
            text: 'That move, `...Qxd3` instead of the "automatic" recapture, is called an in-between move (or _zwischenzug_). What habit protects you from them?',
            choices: ['Always recapture immediately', 'Before a capture, ask what forcing moves the opponent has instead of recapturing', 'Never sacrifice material', 'Trade queens early'], answer: 1,
            explain: 'A recapture is never truly forced. Checks and captures of bigger pieces can come first. Look for theirs before you start a sequence, and look for your own before you recapture.' }
        ]
      },

      {
        id: 'overload', title: 'Deflection and overloading',
        blurb: 'A defender with two jobs cannot do both.',
        takeaway: 'When one piece guards two things, it is **overloaded**: take one and it cannot recapture without abandoning the other. When a piece guards one vital thing, **deflect** it with a forcing move.',
        steps: [
          { type: 'puzzle', fen: '3r2k1/pp3ppp/3q4/8/8/3Q3P/PP3PP1/4R1K1 w - - 0 1', solution: ['Qxd6'], title: 'Overloaded',
            text: 'White to move. Black’s rook is doing two jobs: it protects the queen, and it guards the back rank. Test whether it can do both.',
            hint: 'Just take the queen. What happens if the rook recaptures?',
            explain: 'If the rook recaptures, it leaves the back rank and `Re8` is mate. So Black cannot recapture at all, and White has won a queen for nothing. The rook was **overloaded**.' },
          { type: 'puzzle', fen: '3r2k1/pp3pp1/3q3p/8/8/3Q3P/PP3PP1/4R1K1 w - - 0 1', solution: ['Re8+', 'Rxe8', 'Qxd6'], title: 'Deflection',
            text: 'The same position, except that Black’s h-pawn is on `h6`, so there is no back-rank mate. Now taking the queen is just an even trade.\n\nBut the rook is still the only thing protecting the queen. Can you force it to leave?',
            hint: 'A check that the rook has to capture.',
            explain: 'The rook check must be answered, and the king cannot go to `h7` because White’s queen covers it. So the rook has to capture, and that pulls it away from the queen. That is a **deflection**. One pawn changed the right answer: tactics depend on exact details.' }
        ]
      },

      {
        id: 'decoy', title: 'The decoy',
        blurb: 'Drag a piece onto the square where the tactic works.',
        takeaway: 'Sometimes a fork or a mate would work if only a piece stood one square over. A **decoy** sacrifice forces it there. Ask: "what if their king were on that square?"',
        steps: [
          { type: 'info', fen: 'r1bq2k1/ppp2pp1/3p4/6N1/8/4B3/PPP2PP1/1K2R2R w - - 0 1', hl: { note: ['h8', 'f7', 'd8'] }, title: 'If only…',
            text: 'A knight on `f7` would attack `d8` and `h8`. Black’s queen is on `d8`. If the king were on `h8`, `Nxf7+` would be a royal fork.\n\nThe king is not on `h8`. But White has a rook on the open h-file, and a way of making the king go there.' },
          { type: 'puzzle', fen: 'r1bq2k1/ppp2pp1/3p4/6N1/8/4B3/PPP2PP1/1K2R2R w - - 0 1', solution: ['Rh8+', 'Kxh8', 'Nxf7+', 'Kg8', 'Nxd8'], title: 'Lure the king',
            text: 'White to move. Play the whole combination: sacrifice, fork, capture.',
            hint: 'Give check on h8. The king has to take.',
            explain: 'The rook is sacrificed to drag the king onto `h8`. Then the knight takes on `f7` with check, forking king and queen. White gave a rook and got a queen and a pawn.' }
        ]
      },

      {
        id: 'trapped', title: 'Trapped pieces',
        blurb: 'A piece with no safe squares is a piece you can win.',
        takeaway: 'Before you attack a piece, count its escape squares. If it has none, any attacker cheaper than the piece wins it. And count your own: bishops and knights on the edge get trapped most.',
        steps: [
          { type: 'info', fen: 'r1bq1rk1/ppp3b1/2np1n1p/4ppp1/4P3/2NP2B1/PPPNBPPP/R2Q1RK1 b - - 0 1', hl: { note: ['g3'], bad: ['h4', 'f4', 'h2', 'f2'] }, title: 'Count the exits',
            text: 'Look at White’s bishop on `g3` and count where it can go.\n\n`f2` and `h2` are blocked by its own pawns. `h4` is covered by the pawn on `g5`. `f4` is covered by two pawns.\n\nIt has no safe squares. It is not attacked yet, but it is already in trouble.' },
          { type: 'puzzle', fen: 'r1bq1rk1/ppp3b1/2np1n1p/4ppp1/4P3/2NP2B1/PPPNBPPP/R2Q1RK1 b - - 0 1', orient: 'b', solution: ['f4'], title: 'Shut the door',
            text: 'You are Black. The bishop has nowhere to go. Attack it with the cheapest piece you have.',
            explain: 'The pawn attacks the bishop, and the bishop has no escape. White can take the pawn, but then loses the bishop for it. The same idea (pawns closing in on a bishop) is behind the Noah’s Ark Trap in the Openings part.' }
        ]
      },

      {
        id: 'greek', title: 'The Greek gift',
        blurb: 'The classic bishop sacrifice on h7, and how to look for tactics.',
        takeaway: 'To find tactics, look at **forcing moves first: checks, then captures, then threats**. Look for loose pieces, pieces on the same line, and kings short of defenders.',
        steps: [
          { type: 'line', fen: 'r1bq1rk1/pp1n1ppp/2n1p3/2ppP3/3P4/2PB1N2/PP3PPP/RNBQ1RK1 w - - 0 1', arrows: [['d3', 'h7', 'yellow']], title: 'Bishop takes h7',
            text: 'Three signs say the sacrifice is on: White’s bishop aims at `h7`; the pawn on `e5` stops a knight defending from `f6`; and White’s knight and queen can both reach the kingside in one move.',
            intro: 'This attacking pattern is centuries old. Press **Next move**.',
            moves: [
              ['Bxh7+', 'The Greek gift. A bishop for a pawn, to pull the king out.'],
              ['Kxh7', ''],
              ['Ng5+', 'The knight arrives with check.'],
              ['Kg8', 'Coming forward to g6 is the other try, and it is also very dangerous for Black.'],
              ['Qh5', 'The queen joins in. The threat is mate on h7.'],
              ['Re8', 'Black makes room for the king on f8.'],
              ['Qxf7+', ''],
              ['Kh8', ''],
              ['Qh5+', 'Back again, with check.'],
              ['Kg8', ''],
              ['Qh7+', ''],
              ['Kf8', ''],
              ['Qh8+', ''],
              ['Ke7', ''],
              ['Qxg7#', 'Mate. Every one of White’s moves after the sacrifice was a check or a mate threat. Black never had a free move.']
            ] },
          { type: 'info', fen: CL.EMPTY, title: 'How to look for tactics',
            text: 'Tactics are found by looking at **forcing moves** first, in this order:\n\n- **Checks.** Every one of them, even the ones that look silly.\n- **Captures.** Every one, even the ones that lose material at first.\n- **Threats.** Moves that attack something undefended or threaten mate.\n\nAnd they grow from a few warning signs in the position:\n\n- **Loose pieces**, with no defender.\n- **Pieces in a line**: on the same rank, file or diagonal (pins, skewers, discoveries).\n- **Pieces a knight-fork apart**, on the same colour.\n- **A king with few defenders**, or with no escape squares.\n- **A defender with two jobs.**\n\nWhen you see one of these signs, stop and calculate.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Order of search',
            text: 'When you are looking for a tactic, which moves do you examine first?',
            choices: ['Quiet improving moves', 'Pawn moves', 'Checks, then captures, then threats', 'Whatever looks most natural'], answer: 2,
            explain: 'Forcing moves limit your opponent’s replies, which makes them possible to calculate. Now go and practise: the puzzle mix below gives you these themes without telling you which is which.' }
        ]
      }
    ],

    drills: [
      { id: 'mix', kind: 'mix', pool: ['mates', 'tactics'], count: 10, title: 'Puzzle mix', desc: 'Ten puzzles from Parts 6 and 7, shuffled, with no theme named.' }
    ]
  };
})();
