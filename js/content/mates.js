/* Part 6 — Checkmates */
(function () {
  'use strict';
  var CL = window.CL;

  var LEGAL = '1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5 Bxd1 6. Bxf7+ Ke7';

  CL.content.mates = {
    id: 'mates', num: 6, title: 'Checkmates', short: 'The patterns that end games',
    tagline: 'Checkmates are not invented at the board; they are recognised. There are a few dozen patterns, and they come up again and again. Learn the shapes and you will start to see them three moves before they happen.',

    lessons: [
      {
        id: 'backrank', title: 'The back rank',
        blurb: 'A king trapped behind its own pawns. The most common mate in club chess.',
        takeaway: 'A king on the back rank behind three unmoved pawns has no escape from a rook or queen check along that rank. Before every heavy-piece move, glance at both back ranks.',
        steps: [
          { type: 'info', fen: '4R1k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1', hl: { bad: ['f8', 'h8'], note: ['f7', 'g7', 'h7'] }, arrows: [['e8', 'g8', 'red']], title: 'The shape',
            text: 'The king is in check along the back rank. It cannot move sideways, because the rook covers the whole rank. It cannot move forwards, because its **own pawns** are in the way.\n\nThe very pawns that shelter the king have become the walls of its prison. This is the **back-rank mate**, and it decides more games between improving players than any other pattern.' },
          { type: 'puzzle', fen: '6k1/5ppp/8/8/8/8/r4PPP/4R1K1 w - - 0 1', solution: ['Re8#'], title: 'Mate in one',
            text: 'White to move. Black’s rook has wandered off to attack pawns. Punish it.',
            explain: 'The rook lands on the back rank and nothing can block or capture it.' },
          { type: 'puzzle', fen: 'r3r1k1/pp3ppp/1q6/8/8/8/4QPPP/4R1K1 w - - 0 1', solution: ['Qxe8+', 'Rxe8', 'Rxe8#'], title: 'Mate in two',
            text: 'White to move. Black’s back rank is guarded by a rook this time. But count: how many times does White attack `e8`, and how many times is it defended?',
            hint: 'White attacks e8 twice (queen and rook). After one trade, what is left?',
            explain: 'White attacked `e8` twice and Black defended it once. The queen is given up to remove the defender, and the rook finishes the job. A queen sacrifice is cheap when the next move is mate.' }
        ]
      },

      {
        id: 'ladder', title: 'Rooks: the ladder and the box',
        blurb: 'Mating with two rooks, and with king and rook.',
        takeaway: '**Two rooks**: one holds a rank, the other checks on the next; walk the king to the edge. **King and rook**: your king takes the opposition, the rook checks along the edge.',
        steps: [
          { type: 'line', fen: '8/8/8/6k1/8/8/8/RR4K1 w - - 0 1', title: 'The ladder',
            text: 'Two rooks mate a lone king without any help. One rook builds a wall; the other gives check on the next rank; then they swap jobs. The king is pushed back like someone being walked down a ladder.',
            moves: [
              ['Ra4', 'A wall along the fourth rank. The king cannot come any closer.'],
              ['Kh5', ''],
              ['Rb5+', 'Check on the fifth. The king must go back.'],
              ['Kg6', ''],
              ['Ra6+', 'The first rook leapfrogs to the sixth.'],
              ['Kf7', ''],
              ['Rb7+', 'And the other to the seventh.'],
              ['Ke8', ''],
              ['Ra8#', 'The last rung. One rook holds the seventh rank, the other mates on the eighth.']
            ] },
          { type: 'puzzle', fen: '4k3/R7/1R6/8/8/8/8/6K1 w - - 0 1', solution: ['Rb8#'], title: 'The last rung',
            text: 'White to move. One rook already holds the seventh rank. Finish the ladder.',
            explain: 'The rook on `a7` stops the king stepping forward; the other rook checks on the eighth.' },
          { type: 'info', fen: 'R5k1/8/6K1/8/8/8/8/8 b - - 0 1', hl: { bad: ['f7', 'g7', 'h7'], note: ['f8', 'h8'] }, title: 'King and rook',
            text: 'One rook cannot do it alone. It needs the king to play the part of the second rook.\n\nThe mating picture is always the same: the kings stand **in opposition** on the edge, so your king takes away the three squares in front (red), and the rook checks along the edge.\n\nTo get there, use the rook to shrink the box the enemy king lives in, and bring your own king up to face it.' },
          { type: 'puzzle', fen: '6k1/8/6K1/8/8/8/8/R7 w - - 0 1', solution: ['Ra8#'], title: 'Mate in one',
            text: 'White to move. The kings are already in opposition.',
            explain: 'The white king guards `f7`, `g7` and `h7`. The rook does the rest.' }
        ]
      },

      {
        id: 'queen', title: 'Queen and king',
        blurb: 'The supported queen, the stalemate trap, and the knight’s-move trick.',
        takeaway: 'The queen mates by standing **right next to** the king, protected by your own king. With a lone king against you, always check it has a legal move before you play: stalemate is a draw.',
        steps: [
          { type: 'info', fen: '6k1/6Q1/5K2/8/8/8/8/8 b - - 0 1', hl: { bad: ['f8', 'h8', 'f7', 'h7'] }, arrows: [['f6', 'g7', 'green']], title: 'The supported queen',
            text: 'A queen standing directly in front of a king on the edge attacks every square it could run to. The king’s only hope is to capture her, so she must be **protected**. Here the white king does that.\n\nThis picture, sometimes called the kiss of death, is how nearly every queen-and-king mate ends.' },
          { type: 'puzzle', fen: '6k1/Q7/5K2/8/8/8/8/8 w - - 0 1', solution: ['Qg7#'], title: 'Mate in one',
            text: 'White to move. Put the queen where the king can protect her.',
            explain: 'Right in front of the king, guarded from `f6`.' },
          { type: 'info', fen: '7k/8/6Q1/8/8/8/8/K7 b - - 0 1', hl: { bad: ['g8', 'g7', 'h7'] }, title: 'The stalemate trap',
            text: 'It is Black’s move. The king is **not in check**, but every square it could move to is covered by the queen, and Black has no other piece to move.\n\nThat is **stalemate**, and it is a draw. Beginners throw away won games this way all the time.\n\nThe cure is one question before every move against a lone king: _after this, does the king have a legal move?_ If the answer is no, your move had better be check.' },
          { type: 'info', fen: '8/8/8/4k3/2Q5/8/8/4K3 w - - 0 1', hl: { note: CL.rect('d5', 'h8') }, title: 'The knight’s-move trick',
            text: 'To drive a lone king to the edge without ever risking stalemate, keep your queen **a knight’s move away** from it.\n\nFrom `c4` the queen fences the king into the yellow box. Wherever the king goes, move the queen so she is a knight’s move from it again, and the box shrinks.\n\nWhen the king is on the edge, stop. Leave the queen where she is, walk your own king up, and deliver the supported-queen mate.' }
        ]
      },

      {
        id: 'quick', title: 'The quick ones',
        blurb: 'Fool’s Mate, Scholar’s Mate and Légal’s Mate.',
        takeaway: 'All three punish the same sins: weakening the squares next to your king (`f2`/`f7`) and neglecting development. Know them so they never happen to you.',
        steps: [
          { type: 'line', title: 'Fool’s Mate',
            text: 'The shortest possible game. White makes the two worst opening moves on the board.',
            moves: [
              ['f3', 'Opens the diagonal that leads to the king, and takes the knight’s best square.'],
              ['e5', 'Black opens a line for the queen.'],
              ['g4', 'And now the diagonal e1–h4 is wide open.'],
              ['Qh4#', 'Checkmate in two moves. Nothing can block on g3 or f2.']
            ] },
          { type: 'puzzle', after: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6', solution: ['Qxf7#'], title: 'Scholar’s Mate',
            text: 'Black has just played `...Nf6`, attacking the queen, and missed the threat. White to move.',
            explain: 'Queen takes on `f7`, protected by the bishop on `c4`. Two attackers, one defender. (The defence, `3...g6`, is in the Openings part.)' },
          { type: 'line', title: 'Légal’s Mate',
            text: 'A trap from the 1700s that still catches people. White "blunders" the queen on purpose.',
            moves: [
              ['e4', ''], ['e5', ''], ['Nf3', ''], ['d6', ''],
              ['Bc4', 'Aims at f7.'],
              ['Bg4', 'Pins the knight to the queen.'],
              ['Nc3', ''],
              ['g6', 'A slow move. Black has only one piece developed.'],
              ['Nxe5', 'The knight moves anyway! This is a relative pin: moving is legal, it just loses the queen.'],
              ['Bxd1', 'Black takes the queen. (Taking the knight instead would only lose a pawn.)'],
              ['Bxf7+', 'The king has one square.'],
              ['Ke7', ''],
              ['Nd5#', 'Three minor pieces deliver mate. Black is a queen up and it does not matter.']
            ] },
          { type: 'puzzle', after: LEGAL, solution: ['Nd5#'], title: 'Finish Légal’s Mate',
            text: 'White has given up the queen. Find the last move.',
            explain: 'The knight covers `f6`, the other knight covers `d7`, and the bishop covers `e8` and `e6`.' }
        ]
      },

      {
        id: 'smothered', title: 'Smothered mate',
        blurb: 'A king walled in by its own pieces, and a knight that cannot be stopped.',
        takeaway: 'When a king in the corner is hemmed in by its own rook and pawns, a knight check is mate, because a knight check cannot be blocked. The queen sacrifice on `g8` is how you force the rook to complete the wall.',
        steps: [
          { type: 'info', fen: '6rk/5Npp/8/8/8/8/5PPP/6K1 b - - 0 1', hl: { bad: ['g8', 'g7', 'h7'] }, arrows: [['f7', 'h8', 'red']], title: 'The shape',
            text: 'The king has no squares at all: every one is occupied by its own rook or pawns. Normally that is harmless.\n\nBut the knight is the one piece whose check cannot be blocked, and here nothing can capture it. A lone knight has just delivered mate.\n\nThis is the **smothered mate**.' },
          { type: 'puzzle', fen: '4r2k/p5pp/7N/q7/8/1Q6/5PPP/6K1 w - - 0 1', solution: ['Qg8+', 'Rxg8', 'Nf7#'], title: 'Philidor’s legacy',
            text: 'White to move and mate in two. The wall is not quite built yet: `g8` is empty. Can you make Black fill it?',
            hint: 'Give check on g8. The king cannot take, because the knight guards that square.',
            explain: 'The queen is sacrificed on `g8`. The king cannot capture her (the knight guards `g8`), so the rook must, and that seals the king in. Then the knight hops to `f7`. This combination is more than 500 years old.' }
        ]
      },

      {
        id: 'knightmates', title: 'Rook and knight',
        blurb: 'Anastasia’s Mate and the Arabian Mate.',
        takeaway: 'A knight covers the two diagonal escape squares; a rook delivers check along the edge. Look for it whenever your knight is near the enemy king and a file is open.',
        steps: [
          { type: 'info', fen: '5r2/4N1pk/8/8/8/7R/5PPP/6K1 b - - 0 1', hl: { bad: ['g8', 'g6'], note: ['g7'] }, arrows: [['h3', 'h7', 'red']], title: 'Anastasia’s Mate',
            text: 'The king is on the edge of the board, next to one of its own pawns. The knight on `e7` covers `g8` and `g6`. The rook checks down the h-file.\n\nThree units do the work: the knight, the rook, and Black’s own g-pawn.' },
          { type: 'puzzle', fen: '5r2/4N1pk/8/8/8/3R4/5PPP/6K1 w - - 0 1', solution: ['Rh3#'], title: 'Mate in one',
            text: 'White to move. The knight is already in place.',
            explain: 'The rook swings across to the h-file.' },
          { type: 'puzzle', fen: '5r1k/4N1pp/8/8/8/R2Q4/5PPP/6K1 w - - 0 1', solution: ['Qxh7+', 'Kxh7', 'Rh3#'], title: 'Mate in two',
            text: 'White to move. The h-file is closed by Black’s own pawn. Open it.',
            hint: 'What can capture on h7 with check?',
            explain: 'The queen gives herself up to drag the king onto the h-file and remove the pawn. Then it is exactly the picture you just saw.' },
          { type: 'puzzle', fen: '7k/R7/5N2/8/8/8/8/6K1 w - - 0 1', solution: ['Rh7#'], title: 'The Arabian Mate',
            text: 'One of the oldest recorded mates. White to move: the knight on `f6` does two jobs at once.',
            explain: 'The knight guards `g8` **and** protects the rook on `h7`. The king in the corner has nowhere to go.' }
        ]
      },

      {
        id: 'batteries', title: 'Queen and bishop',
        blurb: 'The battery on h7, and the wedge on f6.',
        takeaway: 'A queen and bishop lined up on the same diagonal, a **battery**, is the standard attack on a castled king. So is a pawn or bishop wedged on `f6` with the queen coming to `g7`.',
        steps: [
          { type: 'puzzle', fen: '5rk1/5ppp/8/7Q/8/3B4/5PPP/6K1 w - - 0 1', arrows: [['d3', 'h7', 'yellow']], solution: ['Qxh7#'], title: 'The battery',
            text: 'White to move. A knight on `f6` would normally be defending `h7`. It is missing.',
            explain: 'The bishop on `d3` protects the queen all the way down the `b1–h7` diagonal, and Black’s own rook takes away `f8`. This is why a knight on `f6` is called the best defender of a castled king.' },
          { type: 'info', fen: '5rk1/5pQp/5Pp1/8/8/8/5PPP/6K1 b - - 0 1', hl: { bad: ['h8'], good: ['f6'] }, title: 'The wedge',
            text: 'Black has played `...g6`, leaving holes on `f6` and `h6`. A white pawn has driven into `f6` like a wedge, and the queen has come round through `h6` to `g7`.\n\nThe pawn protects the queen, the queen covers `h8`, and the rook on `f8` blocks the king’s only other square. A bishop on `f6` works just as well as a pawn.' },
          { type: 'puzzle', fen: '5rk1/5p1p/5PpQ/8/8/8/5PPP/6K1 w - - 0 1', solution: ['Qg7#'], title: 'Mate in one',
            text: 'White to move. The wedge is in and the queen is on `h6`.',
            explain: 'Supported by the pawn on `f6`.' }
        ]
      },

      {
        id: 'geometry', title: 'Three more shapes',
        blurb: 'The epaulettes, the opera box and the criss-cross bishops.',
        takeaway: 'Every one of these mates uses the defender’s **own pieces** as walls. When an enemy king is surrounded by its own army, start looking for checks.',
        steps: [
          { type: 'puzzle', fen: '3rkr2/pp4pp/8/8/8/1Q6/5PPP/6K1 w - - 0 1', solution: ['Qe6#'], title: 'The Epaulette Mate',
            text: 'White to move. Black’s king has a rook on each shoulder, like the epaulettes on a uniform. They are in its way.',
            explain: 'The queen covers `d7`, `e7` and `f7`, and the two rooks block `d8` and `f8`.' },
          { type: 'puzzle', fen: '4kb1r/p4ppp/8/6B1/8/8/5PPP/3R2K1 w - - 0 1', solution: ['Rd8#'], title: 'The Opera Mate',
            text: 'White to move. This is the finish of the Opera Game from Part 2, stripped down to its bones.',
            explain: 'The bishop on `g5` protects the rook on `d8` and covers `e7`. Black’s own bishop and pawn block `f8` and `f7`.' },
          { type: 'puzzle', fen: '2kr1b1r/pp1n1ppp/2p5/8/5B2/5Q2/PPP1BPPP/6K1 w - - 0 1', arrows: [['f4', 'b8', 'yellow']], solution: ['Qxc6+', 'bxc6', 'Ba6#'], title: 'Boden’s Mate',
            text: 'White to move and mate in two. Black has castled queenside. One white bishop already cuts across the king’s position. The other needs a diagonal to be opened.',
            hint: 'The b7 pawn is the only thing keeping the light-squared bishop out. Make it move.',
            explain: 'The queen sacrifice forces the b-pawn to capture, opening the diagonal `a6–c8`. The two bishops then criss-cross: one covers `b8` and `c7`, the other gives mate. Black’s rook and knight block the rest.' }
        ]
      }
    ],

    drills: [
      { id: 'mix', kind: 'mix', pool: ['mates'], count: 8, title: 'Mate mix', desc: 'Eight checkmates from this part, shuffled, with no pattern named.' }
    ]
  };
})();
