/* Part 2 — Speak the Language (algebraic notation) */
(function () {
  'use strict';
  var CL = window.CL;

  var OPERA = '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#';
  var OPERA_TO_11 = '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+';
  var LONDON_5 = '1. d4 d5 2. Bf4 Nf6 3. e3 c5 4. c3 Nc6 5. Nd2 e6';

  CL.content.notation = {
    id: 'notation', num: 2, title: 'Speak the Language', short: 'Reading and writing moves',
    tagline: 'Algebraic notation is how chess is written, taught and talked about. A handful of small rules cover every move ever played, and once you can read them, every book, video and game score opens up.',

    /* Complete games used by the notation drills. */
    games: [
      { name: 'The Opera Game (Morphy, 1858)', moves: OPERA },
      { name: 'The Immortal Game (Anderssen, 1851)', moves: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#' },
      { name: 'Réti’s double check (1910)', moves: '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Nf6 5. Qd3 e5 6. dxe5 Qa5+ 7. Bd2 Qxe5 8. O-O-O Nxe4 9. Qd8+ Kxd8 10. Bg5+ Kc7 11. Bd8#' },
      { name: 'Légal’s Mate', moves: '1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5#' }
    ],

    lessons: [
      {
        id: 'basics', title: 'Pieces and squares',
        blurb: 'A move is a piece letter plus the square it lands on.',
        takeaway: '**Piece letter + destination square.** `K` `Q` `R` `B` `N`, and no letter at all for a pawn. You write where the piece arrives, not where it came from.',
        steps: [
          { type: 'info', title: 'Five letters and a silence',
            text: 'Every move is written the same way: **which piece, then the square it lands on.**\n\n- `K` king, `Q` queen, `R` rook, `B` bishop\n- `N` knight, because `K` was already taken\n- pawns get **no letter at all**\n\nSo `Nf3` means "a knight moves to f3", and plain `e4` means "a pawn moves to e4". You do not say where the piece came from. Almost always only one piece can get there.' },
          { type: 'line', title: 'Watch three moves each',
            text: 'Step through these six moves and read how each one is written.',
            moves: [
              ['e4', 'No letter, so it is a pawn. Only one pawn can reach e4.'],
              ['e5', 'Black’s reply. In a game score White’s move comes first, then Black’s, under the same number.'],
              ['Nf3', '`N` for knight. Only the knight from g1 can reach f3.'],
              ['Nc6', 'A black knight goes to c6.'],
              ['Bc4', '`B` for bishop.'],
              ['Bc5', 'The whole thing so far is written: 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5']
            ] },
          { type: 'puzzle', after: '1. e4 e5', show: 'Nf3', solution: ['Nf3'], title: 'Your turn to read',
            text: 'Play the move shown. Drag the piece, or click it and then click its destination.',
            explain: 'Knight to f3. You read a move and found it on the board: that is all notation is.' },
          { type: 'puzzle', after: '1. e4 e5 2. Nf3', show: 'Nc6', solution: ['Nc6'], title: 'A move for Black',
            text: 'Now Black’s reply. The board has not turned: Black’s pieces are at the top, and the ranks still count from White’s side.',
            explain: 'The knight from b8 goes to c6, defending the pawn on e5.' },
          { type: 'puzzle', after: '1. e4 e5 2. Nf3 Nc6', show: 'Bc4', solution: ['Bc4'], title: 'And a bishop',
            text: 'One more for White.',
            explain: 'Bishop to c4, onto the diagonal that points at f7. You have just played the Italian Game.' },
          { type: 'write', after: '1. d4', san: 'Nf6', title: 'Your turn to write',
            text: 'Now the other direction. A move is played on the board. Type how it is written, then press Enter.' },
          { type: 'write', after: '1. e4 e5 2. Nf3 Nc6', san: 'Bb5', title: 'And another',
            text: 'Which piece moved, and where did it land?',
            explain: 'That is the Ruy López, one of the oldest openings there is.' }
        ]
      },

      {
        id: 'captures', title: 'Captures',
        blurb: 'The little x, and why pawn captures start with a file letter.',
        takeaway: 'A capture puts `x` before the square: `Bxc6`. A pawn has no letter, so it borrows the file it came from: `exd5`.',
        steps: [
          { type: 'info', after: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6', arrows: [['b5', 'c6', 'red']], title: 'x marks the capture',
            text: 'A capture is marked with an `x` between the piece and the square. `Bxc6` reads "bishop takes on c6".\n\nYou name the **square** where the capture happens, not the piece that was taken.' },
          { type: 'puzzle', after: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6', show: 'Bxc6', solution: ['Bxc6'], title: 'Play it',
            text: 'Make the capture shown.',
            explain: 'Bishop takes on c6.' },
          { type: 'info', after: '1. e4 d5', arrows: [['e4', 'd5', 'red']], title: 'Pawn captures',
            text: 'Pawns have no letter, so `xd5` on its own would not tell you which pawn took. A pawn capture therefore starts with **the file the pawn came from**.\n\n`exd5` reads "the e-pawn takes on d5".' },
          { type: 'puzzle', after: '1. e4 d5', show: 'exd5', solution: ['exd5'], title: 'Play it',
            text: 'Make the capture shown.',
            explain: 'The e-pawn takes on d5.' },
          { type: 'write', after: '1. e4 e5 2. Nf3 Nc6 3. d4', san: 'exd4', title: 'Write it',
            text: 'Black captures. How is it written?' },
          { type: 'write', after: '1. e4 e5 2. Nf3 Nc6 3. d4 exd4', san: 'Nxd4', title: 'And the recapture',
            text: 'White takes back.',
            explain: 'Those four moves, `3. d4 exd4 4. Nxd4`, are the Scotch Game.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Read this one', text: 'What does `Rxa7` say?',
            choices: ['A rook captures something on a7', 'A rook moves away from a7', 'The a-pawn captures a rook', 'A rook gives check from a7'], answer: 0,
            explain: '`R` is the piece, `x` says it captures, `a7` is where.' }
        ]
      },

      {
        id: 'checks', title: 'Check, mate and castling',
        blurb: 'Two endings (+, #) and two special moves (O-O, O-O-O).',
        takeaway: '`+` is check and `#` is checkmate, both added to the end of the move. `O-O` castles kingside; `O-O-O` castles queenside.',
        steps: [
          { type: 'info', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7', arrows: [['d1', 'f3', 'green'], ['f3', 'f7', 'red']], title: 'Check',
            text: 'A move that gives check gets a `+` on the end. Nothing else about the move changes.\n\nHere White can play the queen to f3, attacking the king along the f-file: `Qf3+`.' },
          { type: 'puzzle', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7', show: 'Qf3+', solution: ['Qf3+'], title: 'Play it',
            text: 'Give the check.',
            explain: 'Queen to f3, check. This wild line is the Fried Liver Attack.' },
          { type: 'puzzle', after: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6', show: 'Qxf7#', solution: ['Qxf7#'], title: 'Checkmate',
            text: 'Checkmate is marked with `#`. This move has everything: a piece letter, a capture, a square and the mate sign.',
            explain: 'Queen takes on f7, checkmate. This four-move disaster is called Scholar’s Mate.' },
          { type: 'info', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5', arrows: [['e1', 'g1', 'green'], ['h1', 'f1', 'green']], title: 'Castling',
            text: 'Castling moves two pieces at once, so it gets its own symbol.\n\n- `O-O` is castling **kingside**, the short way.\n- `O-O-O` is castling **queenside**, the long way.\n\nA way to remember: count the empty squares between king and rook. Two on the kingside, three on the queenside.' },
          { type: 'puzzle', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5', show: 'O-O', solution: ['O-O'], title: 'Castle',
            text: 'On this board you castle by moving the **king** two squares towards the rook.',
            explain: 'The king goes to g1 and the rook hops over to f1.' },
          { type: 'write', after: OPERA_TO_11 + ' Nbd7', san: 'O-O-O', title: 'Write it',
            text: 'Watch what White does here, and write it down.',
            explain: 'The king went two squares towards the a-rook, and the rook jumped to d1.' },
          { type: 'write', after: '1. f3 e5 2. g4', san: 'Qh4#', title: 'And this one',
            text: 'Black to play. Write the move, with the right symbol on the end.',
            explain: 'This is Fool’s Mate, the fastest checkmate possible. White opened the diagonal to their own king.' }
        ]
      },

      {
        id: 'twins', title: 'Which one? Telling twins apart',
        blurb: 'When two identical pieces can reach the same square.',
        takeaway: 'If two of the same piece can reach the square, add the **file** of the one that moves (`Ngf3`). If they are on the same file, use the **rank** instead (`R1e3`).',
        steps: [
          { type: 'info', after: LONDON_5, arrows: [['g1', 'f3', 'green'], ['d2', 'f3', 'yellow']], title: 'Two knights, one square',
            text: 'Both white knights can jump to f3. Writing `Nf3` would not say which.\n\nThe fix is to add the **file the piece comes from**, right after its letter:\n\n- `Ngf3` is the knight from the g-file\n- `Ndf3` is the knight from the d-file' },
          { type: 'puzzle', after: LONDON_5, show: 'Ngf3', solution: ['Ngf3'], title: 'Play the right knight',
            text: 'Play exactly the move shown.',
            explain: 'The knight from g1. Had you moved the other one, the score would have read `Ndf3`.' },
          { type: 'info', fen: '6k1/5ppp/8/4R3/8/8/5PPP/4R1K1 w - - 0 1', arrows: [['e1', 'e3', 'green'], ['e5', 'e3', 'yellow']], title: 'Twins on the same file',
            text: 'Both rooks are on the e-file, so the file letter cannot separate them. In that case use the **rank** instead:\n\n- `R1e3` is the rook from rank 1\n- `R5e3` is the rook from rank 5' },
          { type: 'puzzle', fen: '6k1/5ppp/8/4R3/8/8/5PPP/4R1K1 w - - 0 1', show: 'R1e3', solution: ['R1e3'], title: 'Play it',
            text: 'Move the rook the notation asks for.',
            explain: 'The rook from the first rank.' },
          { type: 'write', fen: 'r4rk1/ppp2ppp/8/8/8/8/PPP2PPP/R4RK1 w - - 0 1', san: 'Rfe1', title: 'Write it',
            text: 'Either rook could have made this move. Write it so there is no doubt.' },
          { type: 'write', after: OPERA_TO_11, san: 'Nbd7', title: 'From a real game',
            text: 'Black blocks the check. Look carefully at which knight moves.',
            explain: 'The knight on f6 could also have gone to d7, so the `b` is needed.' },
          { type: 'quiz', fen: '6k1/8/8/8/8/5N2/8/1N4K1 w - - 0 1', arrows: [['f3', 'd2', 'green'], ['b1', 'd2', 'yellow']], title: 'Choose',
            text: 'White has knights on `b1` and `f3`. How do you write the **f3** knight going to `d2`?',
            choices: ['`Nd2`', '`Nfd2`', '`N3d2`', '`Nf3d2`'], answer: 1,
            explain: 'The file is enough to tell them apart, so the file is all you add. (`N3d2` would be understood, but the file comes first whenever it does the job.)' }
        ]
      },

      {
        id: 'specials', title: 'Promotion, en passant and margin marks',
        blurb: 'The last few symbols: =, the en passant capture, and !, ?, 1-0.',
        takeaway: 'Promotion is `e8=Q`. En passant is written like any pawn capture. `!` and `?` are opinions about a move; `1-0`, `0-1` and `½-½` are the result.',
        steps: [
          { type: 'info', fen: '8/4P1k1/8/8/8/8/6K1/8 w - - 0 1', arrows: [['e7', 'e8', 'green']], title: 'Promotion',
            text: 'When a pawn reaches the far end it becomes another piece. Write the pawn move, then `=` and the new piece: `e8=Q`.\n\nIf you wanted a knight instead (here it would give check) you would write `e8=N+`.' },
          { type: 'puzzle', fen: '8/4P1k1/8/8/8/8/6K1/8 w - - 0 1', show: 'e8=Q', solution: ['e8=Q'], title: 'Play it',
            text: 'Promote the pawn.',
            explain: 'Pawn to e8, becoming a queen.' },
          { type: 'line', title: 'En passant', text: 'The strangest rule in chess has no special symbol at all. Step through.',
            moves: [
              ['e4', ''], ['Nf6', ''],
              ['e5', 'The pawn reaches its fifth rank.'],
              ['d5', 'Black’s pawn moves two squares and lands right beside it.'],
              ['exd6', 'White captures it _in passing_, as though it had moved only one square. It is written like any pawn capture: the e-pawn takes, and lands on d6. Some books add "e.p." afterwards.']
            ] },
          { type: 'puzzle', after: '1. e4 Nf6 2. e5 d5', show: 'exd6', solution: ['exd6'], title: 'Play it',
            text: 'Capture en passant. The pawn you take is not on the square you land on.',
            explain: 'The e-pawn lands on d6 and the pawn on d5 disappears. This chance exists for one move only.' },
          { type: 'info', title: 'Marks in the margin',
            text: 'Writers add symbols to give their opinion of a move:\n\n- `!` a good move, `!!` a brilliant one\n- `?` a mistake, `??` a blunder\n- `!?` interesting, `?!` dubious\n\nThree dots mean it is a **black** move: `3...Nf6` is Black’s third move.\n\nAnd the result goes at the end: `1-0` White won, `0-1` Black won, `½-½` a draw.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Decode it', text: 'What is `2...Nf6??` telling you?',
            choices: ['White’s knight went to f6 and it was brilliant', 'Black’s second move, knight to f6, was a blunder', 'Nobody knows whether Nf6 is legal', 'The knight went to f6 twice'], answer: 1,
            explain: 'Move 2, three dots so it is Black’s, knight to f6, and two question marks from the annotator.' }
        ]
      },

      {
        id: 'opera', title: 'Read a whole game',
        blurb: 'Seventeen moves at the Paris Opera, 1858: the most famous short game ever played.',
        takeaway: 'Reading a game score is like reading music: slow at first, then suddenly you hear it. Use the **Read and play** and **Watch and write** drills until you no longer have to decode.',
        steps: [
          { type: 'info', title: 'A night at the opera',
            text: 'You now know every symbol. Time to read a real game.\n\nParis, 1858. Paul Morphy, the best player in the world, is invited to a box at the Opera by two noblemen, who insist on playing him during the performance. Morphy wants to watch the show, so he finishes the game quickly.\n\nIt is still taught today because every move White plays is simple: develop a piece, make a threat.' },
          { type: 'line', title: 'Morphy vs. the Duke and the Count',
            text: 'Before each press, read the next move in the list and try to see it on the board first.',
            moves: [
              ['e4', ''], ['e5', ''], ['Nf3', 'Attacks e5.'],
              ['d6', 'Defends with a pawn. Solid, but it shuts in the f8-bishop.'],
              ['d4', 'Strikes at the centre straight away.'],
              ['Bg4', 'Pins the knight. Natural-looking, but it will cost Black time.'],
              ['dxe5', 'A pawn capture: the d-pawn takes on e5.'],
              ['Bxf3', 'Forced. Recapturing on e5 at once would lose a pawn to a queen trade followed by Nxe5.'],
              ['Qxf3', 'The queen recaptures and already eyes f7.'],
              ['dxe5', 'Material is level, but White has the queen out and the move, and Black has nothing developed.'],
              ['Bc4', 'Queen and bishop both aim at f7. The threat is Qxf7 mate.'],
              ['Nf6', 'Blocks the queen’s line.'],
              ['Qb3', 'A double attack: f7 again, and the pawn on b7.'],
              ['Qe7', 'Guards f7. Black’s queen now blocks their own bishop.'],
              ['Nc3', 'Morphy could win a pawn. He prefers to bring out another piece.'],
              ['c6', 'Defends b7 by letting the queen see along the seventh rank.'],
              ['Bg5', 'Pins the f6-knight. Every white minor piece is developed.'],
              ['b5', 'Black tries to drive the bishop away…'],
              ['Nxb5', '…and Morphy sacrifices a knight to tear the position open.'],
              ['cxb5', ''],
              ['Bxb5+', 'Bishop takes with check. Note the plus sign.'],
              ['Nbd7', 'Here is the twin rule: either knight could go to d7, so the score names the one from the b-file.'],
              ['O-O-O', 'Castles queenside, and the rook lands on the d-file aimed at the pinned knight.'],
              ['Rd8', 'Black adds a defender.'],
              ['Rxd7', 'Rook takes. White gives up a rook for a knight to keep the attack rolling.'],
              ['Rxd7', ''],
              ['Rd1', 'The last white piece joins in. Black’s f8-bishop and h8-rook have still never moved.'],
              ['Qe6', 'Black unpins the knight and offers a queen trade.'],
              ['Bxd7+', 'Takes the rook, with check.'],
              ['Nxd7', ''],
              ['Qb8+', 'A queen sacrifice! The knight is forced to capture and leave the d-file.'],
              ['Nxb8', ''],
              ['Rd8#', 'Rook to d8, checkmate. White has only a rook and a bishop left, and they are enough.']
            ] },
          { type: 'puzzle', after: OPERA.replace(' 17. Rd8#', ''), solution: ['Rd8#'], title: 'Finish it yourself',
            text: 'Here is the position before the last move. Deliver the mate.',
            explain: 'The bishop on g5 guards d8 and covers e7. The rook does the rest.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'One last reading test',
            text: 'In the game, move 11 for Black was written `Nbd7`. Why not just `Nd7`?',
            choices: ['Because it was a capture', 'Because two black knights could reach d7', 'Because the knight gave check', 'Because it was Black’s move'], answer: 1,
            explain: 'The knights on b8 and f6 could both go to d7, so the file of the one that moved is added.' }
        ]
      }
    ],

    drills: [
      { id: 'read', title: 'Read and play', desc: 'A game is dictated move by move. Play each move on the board.' },
      { id: 'write', title: 'Watch and write', desc: 'Moves are played for you. Type each one in notation and build a streak.' }
    ]
  };
})();
