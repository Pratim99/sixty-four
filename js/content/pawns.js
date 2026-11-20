/* Part 5 — Pawns */
(function () {
  'use strict';
  var CL = window.CL;

  var FRENCH = '1. e4 e6 2. d4 d5 3. e5';
  var KID = '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7';
  var DRAGON = '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 g6 6. Be3 Bg7 7. f3 O-O 8. Qd2 Nc6 9. O-O-O';
  var IQP = '2rq1rk1/pb2bppp/1p2pn2/3n2B1/3P4/2NQ1N2/PPB2PPP/R3R1K1 w - - 0 1';
  var KP = '8/8/4k3/8/4K3/8/4P3/8 w - - 0 1';

  CL.content.pawns = {
    id: 'pawns', num: 5, title: 'Pawns', short: 'Structure, breaks, passed pawns',
    tagline: 'Pieces come and go, but pawns stay where they are put. The pawn structure tells you where your pieces belong, which side of the board to play on, and who is better in the endgame.',

    lessons: [
      {
        id: 'nature', title: 'Why pawns are different',
        blurb: 'They cannot retreat, they capture diagonally, and every push is permanent.',
        takeaway: 'A pawn move can never be taken back, and every pawn move stops guarding two squares for ever. Push pawns for a reason.',
        steps: [
          { type: 'info', after: '1. e4', hl: { good: ['d5', 'f5'], bad: ['d3', 'f3'] }, title: 'One step, for ever',
            text: 'Every other piece can go back to where it came from. A pawn cannot. That makes each pawn move a commitment.\n\nA pawn moves straight ahead but **attacks diagonally**. After `1. e4`, the pawn attacks `d5` and `f5` (green). And it has given up `d3` and `f3` (red): it will never guard those squares again.\n\nThis is the trade-off in every pawn move: new squares gained in front, old squares abandoned behind.' },
          { type: 'quiz', fen: '8/8/8/8/2P5/8/8/8 w - - 0 1', title: 'Check the basics',
            text: 'A white pawn stands on `c4`. Which squares does it **attack**?',
            choices: ['`c5` only', '`b5` and `d5`', '`b3` and `d3`', '`b4` and `d4`'], answer: 1,
            explain: 'One square diagonally forward on each side. It moves to `c5` but it does not attack it, which is why a piece standing directly in front of a pawn is safe from it, and blocks it.' },
          { type: 'info', fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1', title: 'The skeleton of the position',
            text: 'A famous line from the 18th-century master Philidor: _pawns are the soul of chess_.\n\nTake the pieces off any position and what is left, the **pawn structure**, tells you most of what you need to know: which files are open for rooks, which diagonals are open for bishops, which squares are outposts, and where the weaknesses are.\n\nThe rest of this part teaches you to read that skeleton.' }
        ]
      },

      {
        id: 'types', title: 'The pawn vocabulary',
        blurb: 'Isolated, doubled, backward, passed, chains and islands. Find each one.',
        takeaway: 'Weak pawns are the ones no other pawn can defend: **isolated**, **backward**, and often **doubled**. Strong pawns are **passed** or **connected**. Fewer **pawn islands** means a healthier structure.',
        steps: [
          { type: 'find', fen: '6k1/pp3ppp/4p3/8/3P4/8/PP3PPP/6K1 w - - 0 1', answers: ['d4'], title: 'Isolated',
            text: 'An **isolated pawn** has no friendly pawns on the files either side of it. If it is attacked, only pieces can defend it.\n\n**Click White’s isolated pawn.**',
            explain: 'The d-pawn: there is no white pawn on the c-file or the e-file. The square in front of it, `d5`, is also a problem, because no white pawn can ever attack a piece that settles there.' },
          { type: 'find', fen: '6k1/ppp2ppp/8/8/8/2P5/PPP2PPP/6K1 w - - 0 1', answers: ['c2', 'c3'], title: 'Doubled',
            text: '**Doubled pawns** are two pawns of the same colour on the same file, the result of a capture. The front one blocks the back one, and they cannot protect each other.\n\n**Click both of White’s doubled pawns.**',
            explain: 'The pawns on `c2` and `c3`. Doubled pawns are not always bad: they control extra squares and the capture that made them opened a file. But they are clumsy, especially in endgames.' },
          { type: 'find', fen: '6k1/5ppp/8/1P2p3/4P3/8/5PPP/6K1 w - - 0 1', answers: ['b5'], title: 'Passed',
            text: 'A **passed pawn** has no enemy pawn in front of it, on its own file or on either neighbouring file. No pawn can stop it or capture it on its way to promotion.\n\n**Click White’s passed pawn.**',
            explain: 'The b-pawn. There are no black pawns on the a-, b- or c-files. The pawn on `e4` is not passed: Black’s pawn on `e5` stands in its way.' },
          { type: 'find', fen: '6k1/pp3ppp/3p4/4p3/2P1P3/8/PP3PPP/6K1 w - - 0 1', answers: ['d6'], hl: { note: ['d5'] }, title: 'Backward',
            text: 'A **backward pawn** has fallen behind its neighbours. They cannot protect it, and it cannot safely advance to join them.\n\n**Click Black’s backward pawn.**',
            explain: 'The pawn on `d6`. Its neighbour on `e5` has gone ahead and there is no c-pawn. If it advances to `d5` it is simply captured. And the square in front of it (yellow) is an outpost for White: you saw a knight sitting there in Part 4.' },
          { type: 'find', fen: '6k1/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/6K1 b - - 0 1', answers: ['d4'], hl: { info: ['e5'] }, title: 'Chains',
            text: 'A **pawn chain** is a diagonal line of pawns, each protecting the one in front. The front pawn is the **head**; the back pawn, which nothing protects, is the **base**.\n\nWhite has a chain from `d4` to `e5`. **Click its base.**',
            explain: '`d4`. A chain is only as strong as its base, so that is where you attack it. Black has a chain too: `f7`, `e6`, `d5`.' },
          { type: 'quiz', fen: '6k1/pp3ppp/4p3/8/3P4/8/PP3PPP/6K1 w - - 0 1', title: 'Islands',
            text: 'A **pawn island** is a group of pawns on neighbouring files. Count White’s islands here.',
            choices: ['One', 'Two', 'Three', 'Four'], answer: 2,
            explain: 'Three: the a- and b-pawns, the lone d-pawn, and the f-, g- and h-pawns. Black has two. Each island needs defending separately, so fewer islands is better.' }
        ]
      },

      {
        id: 'breaks', title: 'Chains and pawn breaks',
        blurb: 'Attack the base, and let your pawn chain tell you where to play.',
        takeaway: 'A **pawn break** is a pawn move that attacks the enemy pawns to open lines. Aim breaks at the **base** of a chain. And play on the side your own chain **points towards**.',
        steps: [
          { type: 'info', after: FRENCH, hl: { info: ['d4', 'e5'], note: ['f7', 'e6', 'd5'] }, arrows: [['c7', 'c5', 'red'], ['f7', 'f6', 'red']], title: 'Two chains, locked together',
            text: 'This is the French Defence. White’s chain (blue) runs `d4`–`e5`. Black’s (yellow) runs `f7`–`e6`–`d5`. Neither can capture the other.\n\nA locked centre like this would stay locked for ever without **pawn breaks**: pawn moves that challenge the chain.\n\nBlack has two. `...c5` hits the **base** on `d4`. `...f6` hits the **head** on `e5`. The base is the better target, because once it falls the whole chain is undefended.' },
          { type: 'puzzle', concept: true, after: FRENCH, orient: 'b', solution: ['c5'], title: 'Make the break',
            text: 'You are Black. Play the pawn break that attacks the base of White’s chain.',
            hint: 'The base is the pawn on d4. Which black pawn can attack it?',
            explain: 'The c-pawn strikes at `d4`. If White takes, the chain is broken. If not, Black piles up on `d4` with the knight and queen. This one move is the key to the whole French Defence.' },
          { type: 'info', after: KID, arrows: [['c4', 'c5', 'blue'], ['f7', 'f5', 'red']], hl: { info: ['e4', 'd5'], bad: ['c7', 'd6', 'e5'] }, title: 'Chains point the way',
            text: 'This is the King’s Indian. White’s chain `e4`–`d5` leans towards the **queenside**. Black’s chain `c7`–`d6`–`e5` leans towards the **kingside**.\n\nEach side has more space on the wing its chain points to, so that is where each side attacks:\n\n- White plays for the break `c5`, striking Black’s chain at `d6`.\n- Black plays for the break `...f5`, hitting White’s base on `e4`.\n\nWhen you do not know which side of the board to play on, look where your pawns are pointing.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'In one sentence',
            text: 'What is a pawn break?',
            choices: ['A pawn sacrifice to win a piece', 'A pawn move that attacks the enemy pawns in order to open lines', 'A gap between two pawn islands', 'A pawn that has been captured'], answer: 1,
            explain: 'Breaks are how closed positions get opened. Before you start a slow manoeuvre, work out which breaks each side has.' }
        ]
      },

      {
        id: 'passed', title: 'Passed pawns',
        blurb: 'The rule of the square, the blockade, and the outside passed pawn.',
        takeaway: 'A passed pawn is a constant threat to promote. **Push it** when you can, **blockade it** (ideally with a knight) when it is theirs, and remember that an **outside** passed pawn wins endgames by dragging the enemy king away.',
        steps: [
          { type: 'info', fen: '8/8/8/8/2P4k/8/8/K7 w - - 0 1', hl: { note: CL.rect('c4', 'g8') }, title: 'The rule of the square',
            text: 'Can a lone king catch a running pawn? You do not need to count moves. Draw a square from the pawn to the far rank.\n\nThe pawn on `c4` has four steps to go, so count four files across as well: the square runs from `c4` to `g8`.\n\n**If the enemy king can step into the square, it catches the pawn. If not, the pawn queens.**' },
          { type: 'quiz', fen: '8/8/8/8/2P4k/8/8/K7 w - - 0 1', hl: { note: CL.rect('c4', 'g8') }, title: 'White to move',
            text: 'It is **White’s** move. White pushes the pawn at once. Does Black’s king catch it?',
            choices: ['Yes', 'No'], answer: 1,
            explain: 'No. After `c5` the square shrinks to `c5`–`f8`, and the king on `h4` cannot get inside it in one move. The pawn promotes.' },
          { type: 'quiz', fen: '8/8/8/8/2P4k/8/8/K7 b - - 0 1', hl: { note: CL.rect('c4', 'g8') }, title: 'Black to move',
            text: 'Same position, but now it is **Black’s** move. Does the king catch the pawn?',
            choices: ['Yes', 'No'], answer: 0,
            explain: 'Yes. `...Kg5` steps inside the square, and the king arrives just in time to capture the pawn when it promotes. One tempo decides it.' },
          { type: 'info', fen: '6k1/5ppp/3n4/3P4/8/8/5PPP/3R2K1 w - - 0 1', hl: { good: ['d6'], note: ['d5'] }, title: 'The blockade',
            text: 'The way to stop a passed pawn is to put a piece on the square directly in front of it. That is a **blockade**.\n\nThe best blockader is a **knight**. It loses none of its power standing there, because it jumps over the pawn, and the pawn shields it from attack along the file.\n\nThe worst blockader is a queen or rook: too valuable to be standing guard.' },
          { type: 'line', fen: '8/6pp/3k4/8/P2K4/8/6PP/8 w - - 0 1', arrows: [['a4', 'a5', 'green']], hl: { good: ['a4'] }, title: 'The outside passed pawn',
            text: 'White’s a-pawn is a passed pawn far from the other pawns: an **outside passed pawn**. It will never promote. Its job is to be a decoy. Step through.',
            moves: [
              ['a5', 'The pawn runs. Black’s king must go after it.'],
              ['Kc6', ''],
              ['Ke5', 'While Black’s king goes left, White’s goes right.'],
              ['Kb5', ''],
              ['Ke6', ''],
              ['Kxa5', 'Black wins the pawn, but the king is now a long way from home.'],
              ['Kf7', 'White’s king arrives among the black pawns.'],
              ['g5', ''],
              ['Kg7', ''],
              ['h5', ''],
              ['Kg6', 'Both pawns are attacked.'],
              ['g4', ''],
              ['Kxh5', 'The pawns fall, and White’s own pawns will promote. The a-pawn did its job by being captured.']
            ] }
        ]
      },

      {
        id: 'iqp', title: 'The isolated queen’s pawn',
        blurb: 'One structure, two completely different plans.',
        takeaway: 'With the isolated d-pawn: **keep pieces on and attack**. Against it: **blockade the square in front, trade pieces, and win it in the endgame**.',
        steps: [
          { type: 'info', fen: IQP, hl: { note: ['d4'], good: ['e5', 'c5'], bad: ['d5'] }, arrows: [['d3', 'h7', 'red']], title: 'A strength and a weakness',
            text: 'White has an isolated pawn on `d4`. It arises from many openings: the Queen’s Gambit, the Caro-Kann, the French, the Sicilian.\n\n**What White gets:** more space; open c- and e-files for the rooks; outposts on `e5` and `c5` (green); and free diagonals for both bishops. Look at the queen and bishop lined up against `h7`.\n\n**What Black gets:** a perfect blockading square on `d5` (red), where the knight cannot be attacked by a pawn; and a target. If the pieces are traded off, the d-pawn will be weak and eventually lost.' },
          { type: 'quiz', fen: IQP, title: 'White’s plan',
            text: 'You are White, with the isolated pawn. Which approach suits the position?',
            choices: ['Trade pieces and head for an endgame', 'Keep the pieces on and attack the king'], answer: 1,
            explain: 'The isolated pawn gives active pieces now and a weakness later. So play for now: attack while the pieces are on the board.' },
          { type: 'quiz', fen: IQP, title: 'Black’s plan',
            text: 'And as Black, playing against it?',
            choices: ['Keep the knight on d5 and trade pieces when you can', 'Open the position with pawn sacrifices', 'Capture on d4 as soon as possible, whatever it costs'], answer: 0,
            explain: 'Blockade, simplify, and collect the pawn in the endgame. Each trade takes away some of White’s attack and leaves the weakness behind.' }
        ]
      },

      {
        id: 'majority', title: 'Majorities and the minority attack',
        blurb: 'How to make a passed pawn, and how to make a weakness.',
        takeaway: 'A **pawn majority** (more pawns than the opponent on one wing) can be advanced to create a passed pawn. A **minority attack** pushes fewer pawns at more, to leave the opponent with a weak pawn.',
        steps: [
          { type: 'info', fen: '6k1/pp3ppp/4p3/8/8/8/PPP2PPP/6K1 w - - 0 1', hl: { good: ['a2', 'b2', 'c2'], info: ['e6', 'f7', 'g7', 'h7'] }, title: 'The majority',
            text: 'Count the pawns on each wing. On the queenside White has three against two. On the kingside Black has four against three.\n\nEach side has a **majority** on one wing. A healthy majority, advanced carefully, always produces a passed pawn: three against two becomes one against none.\n\nA majority far from the kings is especially valuable, because the passed pawn it produces will be an outside passed pawn.' },
          { type: 'info', fen: '6k1/pp3ppp/2p5/3p4/3P4/4P3/PP3PPP/6K1 w - - 0 1', arrows: [['b2', 'b4', 'green'], ['b4', 'b5', 'green']], hl: { bad: ['c6'] }, title: 'The minority attack',
            text: 'This structure comes from the Queen’s Gambit Declined after White trades on `d5`. On the queenside White has two pawns against three.\n\nIt seems backwards, but White attacks with the **minority**: `b4`, then `b5`, then takes on `c6`. However Black recaptures, a weak pawn is left behind on a half-open file, a target for White’s rooks for the rest of the game.\n\nThe point is not to make a passed pawn. It is to make a weakness.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Which is which',
            text: 'You have three pawns against two on the queenside, and the kings are castled on the other wing. What is your long-term asset?',
            choices: ['A minority attack', 'A queenside majority that can make an outside passed pawn', 'A pawn chain', 'An isolated pawn'], answer: 1,
            explain: 'More pawns on a wing is a majority. Advance it, trade two for two, and the third is a passed pawn far from the enemy king.' }
        ]
      },

      {
        id: 'shield', title: 'Pawns and your king',
        blurb: 'Holes, hooks and pawn storms.',
        takeaway: 'Pawns in front of your king are its walls: leave them alone. When the kings are castled on **opposite** wings, your own pawns on the other side are free to storm forward.',
        steps: [
          { type: 'info', fen: '6k1/5ppp/8/8/8/6P1/5P1P/6K1 w - - 0 1', hl: { bad: ['f3', 'h3'] }, title: 'Holes around the king',
            text: 'White has pushed the g-pawn one square. Look at what it left behind: `f3` and `h3` (red) are no longer guarded by any pawn.\n\nIf White has a bishop on `g2`, it covers those squares and the set-up is fine. That is a fianchetto. But if that bishop is ever traded off, the holes are permanent, and an enemy queen or knight will settle in them.\n\nEvery pawn move in front of the king is like this. Some are worth it. None are free.' },
          { type: 'info', after: DRAGON, arrows: [['h2', 'h4', 'blue'], ['h4', 'h5', 'blue'], ['g2', 'g4', 'blue'], ['b7', 'b5', 'red'], ['a7', 'a5', 'red']], title: 'The pawn storm',
            text: 'This is the Sicilian Dragon. White has castled queenside; Black has castled kingside.\n\nWith the kings on opposite wings, the rule about not pushing the pawns in front of your king no longer holds for the _other_ wing. White’s g- and h-pawns are not sheltering anything, so they can charge at Black’s king to pry open files for the rooks. Black does the same on the queenside.\n\nThese positions are races. The pawn on `g6` is the **hook** that White’s h-pawn will grab onto to open the h-file.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Same side, opposite side',
            text: 'Both kings are castled on the **kingside**. Is launching your kingside pawns at the enemy king usually a good idea?',
            choices: ['Yes, the same as with opposite-side castling', 'Usually not: those pawns are your own king’s shelter'], answer: 1,
            explain: 'A pawn storm on the wing where your own king lives strips away its cover. With same-side castling, attacks are usually made with pieces, and pawns are used in the centre or on the other wing.' }
        ]
      },

      {
        id: 'opposition', title: 'King and pawn: the opposition',
        blurb: 'The single most important endgame idea, in one position.',
        takeaway: 'Kings facing each other with one square between: whoever does **not** have to move has the **opposition**. With your king in front of your pawn and the opposition, you win. A spare pawn move is how you hand the turn back.',
        steps: [
          { type: 'info', fen: '8/8/4k3/8/4K3/8/8/8 w - - 0 1', hl: { bad: ['d5', 'e5', 'f5'] }, title: 'A staring contest',
            text: 'Two kings can never stand next to each other. So when they face each other with one square between, neither can step forward. The three squares between them (red) are forbidden to both.\n\nThis stand-off is called the **opposition**, and it is bad to be the one who has to move. You must step aside, and the other king walks past you.\n\nSo: the player who does **not** have the move "has the opposition".' },
          { type: 'puzzle', concept: true, fen: KP, solution: ['e3'], title: 'Pass the move',
            text: 'White is a pawn up, with the king in front of the pawn. But the kings are in opposition and it is White’s move, which is the wrong way round.\n\nFind the move that changes nothing about the kings, and hands the turn to Black.',
            hint: 'There is one white piece that can make a move without disturbing the kings.',
            explain: 'The pawn steps forward one square. Nothing else has changed, but now it is Black who must give way. That spare move is why you keep your pawn **behind** your king in these endings.' },
          { type: 'line', fen: KP, title: 'And now it wins',
            text: 'Watch how the opposition is used again and again to escort the pawn home.',
            moves: [
              ['e3', 'The waiting move. Black must step aside.'],
              ['Kd6', ''],
              ['Kf5', 'White’s king goes round the other side.'],
              ['Ke7', ''],
              ['Ke5', 'The opposition again, one rank further up.'],
              ['Kd7', ''],
              ['Kf6', 'And round again.'],
              ['Ke8', ''],
              ['e4', 'Only now does the pawn follow.'],
              ['Kf8', ''],
              ['e5', ''],
              ['Ke8', ''],
              ['Ke6', 'King on the sixth rank in front of its pawn: this wins no matter whose move it is.'],
              ['Kf8', ''],
              ['Kd7', 'The king guards the promotion square and the whole path to it.'],
              ['Kf7', ''],
              ['e6+', ''],
              ['Kf8', ''],
              ['e7+', ''],
              ['Kf7', ''],
              ['e8=Q+', 'The pawn promotes.']
            ] },
          { type: 'quiz', fen: CL.EMPTY, title: 'The principle',
            text: 'In a king-and-pawn ending, where should your king be in relation to your pawn?',
            choices: ['Behind it, pushing', 'Beside it', 'In front of it, leading the way'], answer: 2,
            explain: 'In front. The king clears the road and the pawn follows. A pawn pushed ahead of its king is usually just blockaded, and the game is drawn.' }
        ]
      }
    ]
  };
})();
