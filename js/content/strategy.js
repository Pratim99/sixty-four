/* Part 4 — Strategy */
(function () {
  'use strict';
  var CL = window.CL;

  var CASTLED = '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O';
  var RUY_10 = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7';

  CL.content.strategy = {
    id: 'strategy', num: 4, title: 'Strategy', short: 'What to do when nothing is hanging',
    tagline: 'Tactics win games in a moment. Strategy is everything in between: where your pieces belong, what to trade, how to keep your king safe, and how to choose a plan when there is nothing to capture.',

    lessons: [
      {
        id: 'values', title: 'What the pieces are worth',
        blurb: 'The 1-3-3-5-9 scale, and what "winning the exchange" means.',
        takeaway: 'Pawn 1, knight 3, bishop 3, rook 5, queen 9. Count before every trade. But remember these are averages: a piece is worth what it can do.',
        steps: [
          { type: 'info', title: 'The scale',
            text: 'Every trade is a small sum. To do the sum you need the prices:\n\n- **Pawn** 1\n- **Knight** 3\n- **Bishop** 3 (a touch more than a knight when the position is open)\n- **Rook** 5\n- **Queen** 9\n- **King**: not for sale\n\nKnights and bishops are the **minor pieces**; rooks and queens are the **major pieces**. Giving a rook for a minor piece is called **losing the exchange**: you are down 2 points.' },
          { type: 'quiz', fen: 'r4rk1/ppp2ppp/2n5/8/8/2N2N2/PPP2PPP/R4RK1 w - - 0 1', title: 'Count the board',
            text: 'Add up each side’s material. Who is ahead, and by how much?',
            choices: ['It is level', 'White, by a pawn', 'White, by a knight', 'Black, by a rook'], answer: 2,
            explain: 'Both sides have two rooks and six pawns. White has two knights to Black’s one: 3 points ahead. Getting quick at this count is a real skill. Do it every few moves in your own games.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'A trade is offered',
            text: 'You can give up a rook and get a bishop plus a pawn in return. In points, you would be…',
            choices: ['two points up', 'level', 'one point down', 'three points down'], answer: 2,
            explain: 'You give 5 and get 3 + 1 = 4. One point down, so you would need something else in return, such as an attack or a ruined enemy pawn structure.' },
          { type: 'info', fen: 'r2q1rk1/pp2bppp/3p4/3Np3/2P1P3/8/PP1Q1PPP/3R1RK1 w - - 0 1', hl: { good: ['d5'], bad: ['e7'] }, title: 'Prices are averages',
            text: 'The scale assumes an average piece on an average square. Real pieces are rarely average.\n\nHere White’s knight sits in the middle of the board where no pawn can ever chase it away. Black’s bishop is hemmed in by its own pawns. On paper both are worth 3. On the board, the knight is worth far more.\n\nThe rest of this part is about that gap: how to make your pieces worth more than their price.' }
        ]
      },

      {
        id: 'activity', title: 'Good pieces need good squares',
        blurb: 'Outposts for knights, open diagonals for bishops, open files for rooks.',
        takeaway: '**Knights** want outposts. **Bishops** want diagonals not blocked by their own pawns. **Rooks** want open files and the seventh rank. When you have nothing else to do, find your worst piece and give it a better square.',
        steps: [
          { type: 'info', fen: 'r2q1rk1/pp2bppp/3p4/3Np3/2P1P3/8/PP1Q1PPP/3R1RK1 w - - 0 1', hl: { good: ['d5'] }, arrows: [['c4', 'd5', 'green'], ['e4', 'd5', 'green']], title: 'The outpost',
            text: 'An **outpost** is a square in the enemy half that is protected by one of your pawns and can never be attacked by one of theirs.\n\n`d5` here is perfect. White’s pawns on `c4` and `e4` hold it. Black has no c-pawn, and the e-pawn has already gone past. The knight can sit there for the rest of the game, attacking in every direction.\n\nKnights are short-range pieces. They need to be close to the action, which is why they love outposts more than any other piece.' },
          { type: 'find', fen: 'r2q1rk1/pp2bppp/3p4/4p3/2P1P3/2N5/PP1Q1PPP/3R1RK1 w - - 0 1', answers: ['d5'], title: 'Spot the outpost',
            text: 'White’s knight is on `c3`. **Click the square it should be heading for.**',
            explain: '`d5`: in Black’s half, supported by two pawns, and out of reach of every black pawn.' },
          { type: 'info', fen: '6k1/pp1b1p1p/2p1p1p1/3pP3/3P1P2/2PB4/PP4PP/6K1 w - - 0 1', hl: { good: ['d3'], bad: ['d7'] }, title: 'Good bishop, bad bishop',
            text: 'A bishop is **good** when your own pawns stand on the other colour, leaving its diagonals clear. It is **bad** when your pawns are fixed on its colour and it has nothing to look at.\n\nBlack’s bishop on `d7` is a light-squared bishop behind pawns on `c6`, `e6`, `g6` and `d5`: all light squares. It is little more than a tall pawn.\n\nWhite’s bishop on `d3` is also light-squared, but White’s centre pawns are on dark squares. It sees right across the board.\n\nRule of thumb: put your pawns on the opposite colour to your bishop.' },
          { type: 'info', fen: 'r5k1/ppp2ppp/8/8/8/8/PPP2PPP/3R2K1 w - - 0 1', arrows: [['d1', 'd7', 'green']], hl: { note: CL.rankSquares(7) }, title: 'Rooks: open files and the seventh',
            text: 'A rook behind its own pawn does nothing. A rook on an **open file** (one with no pawns on it) controls the whole length of the board.\n\nAnd the open file is a road to somewhere: the **seventh rank**. A rook on `d7` attacks the pawns on `c7` and `f7` from the side, where they cannot defend one another, and it traps the king on the back rank.\n\nSo: when a file opens, put a rook on it first.' },
          { type: 'quiz', fen: '6k1/pp1b1p1p/2p1p1p1/3pP3/3P1P2/2PB4/PP4PP/6K1 w - - 0 1', title: 'Think like the defender',
            text: 'You are Black, stuck with that bad bishop on `d7`. What would help most?',
            choices: ['Keep it at home to guard the pawns', 'Trade it for White’s good bishop', 'Put more pawns on light squares', 'Move the king in front of it'], answer: 1,
            explain: 'Trade your bad piece for their good one. For example, play `...b6` and bring it round via `c8` to `a6`, where it challenges the bishop on `d3`. This "which piece do I want off the board?" question is at the heart of strategy.' }
        ]
      },

      {
        id: 'king', title: 'King safety',
        blurb: 'The pawn shield, the holes pawn moves leave, and when the king should come out.',
        takeaway: 'Castle early. Do not move the pawns in front of your castled king without a reason, because each move leaves a hole. Make an escape square (**luft**) when the back rank is in danger. In the endgame, the king becomes a fighting piece.',
        steps: [
          { type: 'info', after: CASTLED, hl: { good: ['f2', 'g2', 'h2'], info: ['f7', 'g7', 'h7'] }, title: 'The pawn shield',
            text: 'A castled king sits behind three unmoved pawns with a knight on `f3` (or `f6`) in front. This is the safest formation in chess. The pawns cover every square next to the king, and the knight guards `h2` and the squares in front.\n\nAn attacker has to break this shield open with sacrifices or pry it apart with their own pawns. That takes time, which is what the defender needs.' },
          { type: 'info', fen: '5rk1/5p1p/5BpQ/8/8/8/8/6K1 b - - 0 1', hl: { bad: ['f6', 'h6', 'g7'] }, title: 'What a pawn move leaves behind',
            text: 'Pawns never go back. When the g-pawn steps forward, the squares it used to guard, `f6` and `h6`, are **holes**: squares that no pawn can ever protect again.\n\nHere White’s bishop and queen have moved into those holes, and the threat is `Qg7#`. Black’s dark-squared bishop, the one piece that could have guarded them, is gone.\n\nBefore you push a pawn in front of your king, ask what squares it leaves behind and who might use them.' },
          { type: 'info', fen: '6k1/5ppp/8/8/8/7P/5PP1/6K1 w - - 0 1', hl: { good: ['h2'], bad: ['f8', 'h8'] }, title: 'Luft',
            text: 'There is one pawn move near the king that is often worth making. Black’s king here has no squares: one check on the back rank from a rook or queen is checkmate.\n\nWhite has played `h3`, giving the king an escape square on `h2`. Players use the German word **luft** ("air") for this.\n\nMake luft when the heavy pieces are still on and the position is otherwise quiet. A tempo spent on `h3` has saved countless games.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'A matter of timing',
            text: 'The queens and most pieces have been traded. Each side has a rook and some pawns. Where does your king belong now?',
            choices: ['Tucked away in the corner', 'Marching to the centre', 'On the back rank behind the pawns', 'It does not matter'], answer: 1,
            explain: 'With no mating attacks to fear, the king is a strong piece, worth roughly as much as a knight or bishop in the fight. In the endgame, activate it. Whoever’s king reaches the centre first often wins.' }
        ]
      },

      {
        id: 'space', title: 'Space and the centre',
        blurb: 'Why more room means better pieces, and what to do when you are cramped.',
        takeaway: 'Space is room for your pieces. **With more space, avoid trades** and let the opponent suffocate. **With less space, trade pieces** to give the rest room, and look for a pawn break.',
        steps: [
          { type: 'info', after: '1. e4 e6 2. d4 d6 3. Nf3 Nd7 4. Bd3 Ne7 5. O-O Ng6 6. c4 Be7 7. Nc3 O-O', hl: { info: CL.rect('a1', 'h4'), bad: CL.rect('a6', 'h8') }, title: 'Count the ranks',
            text: 'White’s pawns stand on the fourth rank; Black’s have barely left home. So White’s pieces have four ranks to move around in, and Black’s have three.\n\nThat is a **space advantage**. White’s pieces can switch from one wing to the other quickly. Black’s get in one another’s way: look at the bishop on `c8` and the knight on `d7`.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'If you have more space',
            text: 'You have a big space advantage. Your opponent offers to trade a pair of knights. In general, should you?',
            choices: ['Yes: fewer pieces is always simpler', 'No: every trade gives their remaining pieces more room'], answer: 1,
            explain: 'A cramped position holds, say, six pieces badly but three pieces comfortably. Keep the pieces on and the cramp gets worse. (The exception is when a trade wins something concrete.)' },
          { type: 'quiz', fen: CL.EMPTY, title: 'If you have less',
            text: 'You are the one who is cramped. Besides trading pieces, what else frees your game?',
            choices: ['A pawn break that challenges their centre', 'Moving your king to the centre', 'Putting all your pawns on the same colour', 'Waiting'], answer: 0,
            explain: 'A **pawn break** such as `...c5` or `...e5` attacks their pawn centre and opens lines for your pieces. Part 5 covers breaks in detail.' }
        ]
      },

      {
        id: 'trades', title: 'What to trade, and when',
        blurb: 'Four rules that decide most exchanges.',
        takeaway: '**Ahead in material: trade pieces. Behind: trade pawns. Attacking: keep the queens on. Always: swap your bad piece for their good one.**',
        steps: [
          { type: 'info', fen: CL.EMPTY, title: 'Trades are not neutral',
            text: 'A trade of equal value changes the position even though the count stays level. Four rules cover most cases:\n\n- **When you are ahead in material, trade pieces.** An extra knight with queens and rooks on is one piece among many. An extra knight in an endgame is the whole game.\n- **When you are behind, trade pawns, not pieces.** With no pawns left, an extra piece often cannot win.\n- **When you are attacking, avoid trades.** Each attacker you swap off is one fewer.\n- **Trade your worst piece for their best one.** Bad bishop for good knight, passive rook for active rook.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Rule one',
            text: 'You are a rook ahead. Your opponent offers to trade queens. Do you accept?',
            choices: ['Yes', 'No'], answer: 0,
            explain: 'Yes. Every trade brings you closer to an endgame in which the extra rook simply wins. The player who is behind is the one who needs to keep things complicated.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Rule three',
            text: 'Your pieces are swarming around the enemy king and you are close to breaking through. Your opponent offers a queen trade. Do you accept?',
            choices: ['Yes', 'Usually not'], answer: 1,
            explain: 'The queen is your main attacker. Offering a queen trade is the defender’s best friend, so decline unless the trade wins material.' },
          { type: 'quiz', fen: '6k1/pp1b1p1p/2p1p1p1/3pP3/3P1P2/2PB4/PP4PP/6K1 w - - 0 1', title: 'Rule four, from the other side',
            text: 'You are White here, with the good bishop. Black plays `...b6` and brings the bishop round to `a6`, offering a trade. Should you be happy to swap?',
            choices: ['Yes, a bishop is a bishop', 'No, keep your good bishop if you can'], answer: 1,
            explain: 'Your bishop is far better than theirs, so the trade favours Black. Step aside (for instance to `c2`) and keep the advantage.' }
        ]
      },

      {
        id: 'plan', title: 'How to choose a move',
        blurb: 'A checklist for every turn, and what to do when you don’t know what to do.',
        takeaway: 'Every move: **What does their move threaten? What are the checks, captures and threats? Which is my worst piece? After my move, what can they do to me?**',
        steps: [
          { type: 'info', fen: CL.EMPTY, title: 'Five things to weigh',
            text: 'To judge a position, look at five things, roughly in this order:\n\n- **King safety.** A king in danger outweighs everything else.\n- **Material.** Count it.\n- **Piece activity.** Whose pieces are on better squares?\n- **Pawn structure.** Who has weak pawns, or a passed pawn?\n- **Space.** Who has more room?\n\nThe side that is better on more of these, especially the first three, stands better. Your plan is then simple: fix your worst item on the list, or press on their worst.' },
          { type: 'info', after: RUY_10, arrows: [['b1', 'd2', 'green'], ['d2', 'f1', 'green'], ['f1', 'g3', 'green']], title: 'Improve your worst piece',
            text: 'When there is nothing to attack and nothing to defend, ask: **which of my pieces is doing the least?** Then find it a better square, even if it takes several moves.\n\nThis is the Ruy López. White’s knight on `b1` has not moved. Its route is famous: `d2`, then `f1`, then `g3`, where it eyes `f5` and `h5` and joins a kingside attack.\n\nThree quiet moves, no threats, and White’s position gets steadily better. That is what a plan looks like.' },
          { type: 'info', fen: CL.EMPTY, title: 'A checklist for every move',
            text: 'Before each move, run through this. With practice it takes seconds.\n\n- **What did their last move do?** What does it attack, and what did it stop defending?\n- **Checks, captures, threats.** Look at all of yours, then all of theirs. Forcing moves first.\n- **Pick a candidate move**, the one that improves your position most.\n- **Blunder check.** Picture the board after your move. What checks and captures do they have now? Is anything of yours unprotected?\n\nMost games below master level are decided by the last step being skipped.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'The habit that saves the most games',
            text: 'You have chosen your move and your hand is on the piece. What is the last question to ask?',
            choices: ['Is this the most aggressive move?', 'After this move, what checks and captures does my opponent have?', 'Have I moved this piece before?', 'Does this move look natural?'], answer: 1,
            explain: 'The blunder check. One look at their forcing replies before you let go of the piece.' }
        ]
      },

      {
        id: 'endgame', title: 'Endgame principles',
        blurb: 'Activate the king, push passed pawns, put rooks behind them.',
        takeaway: 'In the endgame: **king to the centre, passed pawns forward, rooks behind passed pawns** (yours or theirs). And when ahead, trade pieces but keep pawns.',
        steps: [
          { type: 'info', fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1', arrows: [['g1', 'f1', 'green'], ['f1', 'e2', 'green'], ['e2', 'd3', 'green'], ['d3', 'd4', 'green']], title: 'The king comes out',
            text: 'Once the queens are gone, the king is no longer something to hide. It is a strong piece that attacks every square around it.\n\nThe first moves of most endgames are king moves towards the centre. From there it can go to either wing, attack enemy pawns and escort its own.' },
          { type: 'info', fen: 'r5k1/5ppp/P7/8/8/8/5PPP/R5K1 w - - 0 1', hl: { good: ['a1'], bad: ['a8'] }, arrows: [['a1', 'a6', 'green']], title: 'Rooks belong behind passed pawns',
            text: 'A **passed pawn** has no enemy pawns in front of it or on the files either side. Nothing but pieces can stop it.\n\nWhite’s rook is **behind** the pawn. Every step the pawn takes gives the rook more room. Black’s rook is **in front** of it: stuck on `a8`, unable to leave or the pawn runs.\n\nThe rule works both ways. If the passed pawn is theirs, your rook also belongs behind it.' },
          { type: 'quiz', fen: CL.EMPTY, title: 'An old saying',
            text: 'Complete the proverb: "Passed pawns must be…"',
            choices: ['protected', 'pushed', 'traded', 'doubled'], answer: 1,
            explain: 'Pushed. Each step forward makes the pawn more dangerous and ties down more enemy pieces. (Push it when it is safe to, with support.)' },
          { type: 'quiz', fen: CL.EMPTY, title: 'Converting an extra pawn',
            text: 'You are one pawn ahead in an endgame with a knight each. Which trade helps you most?',
            choices: ['Trading the knights', 'Trading all the pawns'], answer: 0,
            explain: 'Trade pieces, keep pawns. A king-and-pawn endgame a pawn up is usually winning. If all the pawns come off, you have nothing left to promote.' }
        ]
      }
    ]
  };
})();
