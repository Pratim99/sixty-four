/* Part 3 — Openings */
(function () {
  'use strict';
  var CL = window.CL;

  var E4 = 'Takes a centre square and opens lines for the queen and the f1-bishop.';
  var E5 = 'Black claims an equal share of the centre.';
  var NF3 = 'Develops a piece and attacks e5: a move with a threat.';
  var NC6 = 'Defends e5 by developing.';
  var D4 = 'Takes the centre. Unlike the e-pawn, this pawn is protected by the queen from the start.';

  CL.content.openings = {
    id: 'openings', num: 3, title: 'Openings', short: 'The first ten moves',
    tagline: 'You do not need to memorise openings. You need three principles, and a feel for the dozen or so structures that almost every game begins with. Each line here explains every move, then lets you play it from memory.',

    lessons: [
      {
        id: 'principles', title: 'The three opening principles',
        blurb: 'Centre, development, king safety. Everything else is detail.',
        takeaway: '**Control the centre. Develop your knights and bishops. Castle.** If a move in the first ten does none of these, you need a very good reason to play it.',
        steps: [
          { type: 'info', after: '1. e4 e5 2. Nf3 Nc6', hl: { good: ['d4', 'e4', 'd5', 'e5'] }, title: '1. Fight for the centre',
            text: 'The four centre squares are the high ground. Pieces placed there, or aimed there, reach both wings.\n\nSo the opening starts with a centre pawn (`1. e4` or `1. d4`), and the first pieces out are the ones that bear on the centre. Count: after these four moves, every piece and pawn that has moved is fighting for `d4`, `e4`, `d5` or `e5`.' },
          { type: 'info', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. Nc3 Nf6', title: '2. Develop your pieces',
            text: 'A piece on its starting square is doing nothing. **Development** means bringing knights and bishops to squares where they work.\n\nSome rules of thumb:\n\n- Knights before bishops: the knights’ best squares (`f3`, `c3`) are known in advance.\n- Move each piece once. Moving the same piece twice lets your opponent bring out two pieces to your one.\n- Do not bring the queen out early. She will be chased around by smaller pieces, each of which develops with gain of time.\n- Only make the pawn moves you need to let the pieces out.' },
          { type: 'info', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O', hl: { good: ['g1', 'g8'], note: ['f1', 'f8'] }, title: '3. Castle',
            text: 'Castling does two jobs in one move: the king leaves the centre, where files are about to open, and a rook comes towards the middle.\n\nOnce you have castled and your queen, knights and bishops have left the back rank, your two rooks defend each other. That is called **connecting the rooks**, and it is a good sign that your opening is finished.' },
          { type: 'line', title: 'What breaking the rules looks like',
            text: 'White brings the queen out on move two. Watch what happens.',
            moves: [
              ['e4', ''], ['e5', ''],
              ['Qh5', 'Attacks e5 and eyes f7. It looks aggressive.'],
              ['Nc6', 'Defends e5 and develops.'],
              ['Bc4', 'Threatens Qxf7 mate.'],
              ['g6', 'Blocks the threat and hits the queen. Black develops with gain of time.'],
              ['Qf3', 'Threatens f7 again.'],
              ['Nf6', 'Blocks again, with another developing move.'],
              ['Qb3', 'A third queen move, still chasing f7.'],
              ['Nd4', 'Now the knight attacks the queen, and White has to move her a fourth time. Black has both knights in play; White’s queen has used up three moves and achieved nothing.']
            ] },
          { type: 'quiz', after: '1. e4 e5', title: 'Choose a second move',
            text: 'White to play. Which move best follows the principles?',
            choices: ['`2. Qh5` — attack at once', '`2. Nf3` — develop and attack e5', '`2. a4` — gain space on the wing', '`2. h3` — stop anything coming to g4'], answer: 1,
            explain: '`2. Nf3` develops a piece towards the centre and creates a threat, so Black must respond. Two principles in one move.' },
          { type: 'quiz', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O', title: 'A checklist for move ten',
            text: 'Which of these is **not** a sign that your opening went well?',
            choices: ['You have a pawn in the centre', 'Your knights and bishops are off the back rank', 'Your king is castled', 'Your queen has captured a pawn on the far side of the board'], answer: 3,
            explain: 'Pawn-grabbing with the queen in the opening is the classic way to fall behind in development. The other three are the checklist.' }
        ]
      }
    ],

    groups: [
      { title: 'Open games: 1. e4 e5', blurb: 'Both sides put a pawn in the centre and develop fast. The best place to start.', ids: ['italian', 'ruy', 'scotch'] },
      { title: 'Black fights back against 1. e4', blurb: 'Instead of mirroring, Black unbalances the game from the first move.', ids: ['najdorf', 'dragon', 'french', 'caro', 'scandi'] },
      { title: 'Queen’s pawn games: 1. d4 d5', blurb: 'Slower and more strategic. The fight is over the d5 square.', ids: ['qgd', 'qga', 'slav', 'london'] },
      { title: 'Indian defences and the English', blurb: 'Black controls the centre with pieces first, pawns later. And White’s flank alternative.', ids: ['kid', 'nimzo', 'english'] },
      { title: 'Three traps worth knowing', blurb: 'Not to play them, but so nobody plays them on you.', ids: ['scholars', 'elephant', 'noahs'] }
    ],

    lines: [
      {
        id: 'italian', name: 'Italian Game', tag: 'Fast development aimed at f7.',
        idea: 'The most natural opening there is: centre pawn, knight, bishop, castle. White’s bishop goes to the diagonal that points at `f7`. **Learn this one first**, because every move is one of the three principles in action.',
        white: 'Play c3 and d4 at the right moment. Reroute the queen’s knight via d2 and f1 to g3. Keep the c4-bishop alive with a4 or Bb3.',
        black: 'Keep the bishop with ...a6 and ...Ba7. Challenge the centre with ...d5 when it is safe. Offer a trade of the Italian bishop with ...Be6.',
        moves: [
          ['e4', E4], ['e5', E5], ['Nf3', NF3], ['Nc6', NC6],
          ['Bc4', 'The Italian bishop. It lands on the a2–g8 diagonal, staring at f7, the square only Black’s king defends.'],
          ['Bc5', 'Black mirrors, eyeing f2. This is the Giuoco Piano, the "quiet game".'],
          ['c3', 'Prepares d4, to build a two-pawn centre with gain of time on the c5-bishop.'],
          ['Nf6', 'Develops and attacks e4, so White must decide how to protect it.'],
          ['d3', 'The modern, slow treatment: e4 is solid and the d4 break is saved for later.'],
          ['d6', 'Supports e5 and frees the c8-bishop.'],
          ['O-O', 'King to safety, rook towards the centre.'],
          ['O-O', 'Both sides have ticked every box: centre, pieces, castle.']
        ]
      },
      {
        id: 'ruy', name: 'Ruy López (Spanish)', tag: 'Slow pressure on e5.',
        idea: 'Instead of attacking f7, White’s bishop pressures the knight that defends e5. The threats are slower and deeper, and the positions reward patience. It has been played at the top level for well over a century.',
        white: 'c3 and d4 to build the centre. The knight tour Nbd2–f1–g3. Drop the bishop back to c2 and attack on the kingside.',
        black: 'Hold e5. Expand on the queenside with ...b5, ...Na5 and ...c5. Regroup with ...Re8 and ...Bf8.',
        moves: [
          ['e4', E4], ['e5', E5], ['Nf3', NF3], ['Nc6', NC6],
          ['Bb5', 'The Spanish bishop. It attacks the defender of e5 rather than the pawn itself.'],
          ['a6', 'Asks the bishop a question. Taking on c6 and then e5 does not win a pawn, because ...Qd4 forks knight and pawn.'],
          ['Ba4', 'Keeps the pressure on.'],
          ['Nf6', 'Counter-attacks e4.'],
          ['O-O', 'White ignores it: if Black takes on e4, Re1 or d4 wins the pawn back with a strong initiative.'],
          ['Be7', 'Develops, blocks the e-file and prepares to castle. Now ...Nxe4 is a real threat.'],
          ['Re1', 'Protects e4. Now White does threaten Bxc6 followed by Nxe5.'],
          ['b5', 'Drives the bishop away to end that threat.'],
          ['Bb3', 'A fine diagonal all the same: now it aims at f7, Italian-style.'],
          ['d6', 'Supports e5 for good.'],
          ['c3', 'Prepares d4 and gives the bishop a retreat on c2.'],
          ['O-O', 'The main line of the Closed Ruy López.'],
          ['h3', 'Stops ...Bg4, which would pin the knight just as White wants to play d4.']
        ]
      },
      {
        id: 'scotch', name: 'Scotch Game', tag: 'Open the centre at once.',
        idea: 'White plays d4 on move three instead of preparing it. The centre opens immediately, both sides get free piece play, and there is far less theory to know than in the Ruy López.',
        white: 'Use the space the e5 pawn gives you. Develop fast and castle either side.',
        black: 'Hit back at the e-pawn. Use the half-open b-file and the bishop pair.',
        moves: [
          ['e4', E4], ['e5', E5], ['Nf3', NF3], ['Nc6', NC6],
          ['d4', 'The Scotch: White opens the centre immediately.'],
          ['exd4', 'Best. Black cannot comfortably keep a pawn on e5.'],
          ['Nxd4', 'White has a centralised knight and open lines.'],
          ['Nf6', 'Attacks e4 and develops.'],
          ['Nxc6', 'Trades in order to damage Black’s pawns before pushing e5.'],
          ['bxc6', 'Captures towards the centre and opens the b-file.'],
          ['e5', 'Gains space and attacks the knight.'],
          ['Qe7', 'Pins the e5 pawn against White’s king.'],
          ['Qe2', 'Unpins. Both queens now block their own bishops.'],
          ['Nd5', 'The knight finds a central post.'],
          ['c4', 'Challenges the knight again. A sharp, unbalanced fight follows.']
        ]
      },
      {
        id: 'najdorf', name: 'Sicilian Defence: Najdorf', tag: 'The fighting reply to 1. e4.',
        idea: 'With `1...c5` Black fights for d4 using a wing pawn and keeps both centre pawns. The game is unbalanced from move one, which is why the Sicilian is the most popular defence to `1. e4`.',
        white: 'Attack on the kingside, often castling queenside and storming with f3, g4 and h4.',
        black: 'Counter-attack on the queenside: ...b5, a rook on the c-file, and the central break ...d5.',
        moves: [
          ['e4', E4],
          ['c5', 'The Sicilian. Black contests d4 from the side and keeps the d- and e-pawns at home for now.'],
          ['Nf3', 'Prepares d4.'],
          ['d6', 'Controls e5 and opens the c8-bishop.'],
          ['d4', 'The Open Sicilian: White gives up a centre pawn for a lead in development.'],
          ['cxd4', 'Black trades a wing pawn for a centre pawn. That is the whole point of 1...c5.'],
          ['Nxd4', 'White has more space; Black has a half-open c-file and an extra centre pawn.'],
          ['Nf6', 'Attacks e4, so that White must block the c-pawn with a knight.'],
          ['Nc3', 'Defends e4.'],
          ['a6', 'The Najdorf. A quiet move that keeps everything out of b5 and prepares ...e5 or ...b5.'],
          ['Be3', 'The English Attack set-up: Be3, f3, Qd2, castle long.'],
          ['e5', 'Seizes the centre and kicks the knight, at the cost of a hole on d5.'],
          ['Nb3', 'The knight retreats and stays out of trouble.'],
          ['Be6', 'Covers d5 and prepares ...Nbd7 and ...b5.']
        ]
      },
      {
        id: 'dragon', name: 'Sicilian Defence: Dragon', tag: 'A fianchetto and a pawn race.',
        idea: 'Black fianchettoes the king’s bishop onto the long diagonal `a1–h8`. White usually castles on the opposite side, and both players throw pawns at the other’s king. Whoever gets there first wins.',
        white: 'Trade off the Dragon bishop with Bh6. Open the h-file with h4–h5.',
        black: 'Rook to c8, knight to c4 or e5, and sacrifices on c3 to rip open the white king.',
        moves: [
          ['e4', E4], ['c5', 'The Sicilian.'], ['Nf3', 'Prepares d4.'], ['d6', 'Controls e5.'],
          ['d4', 'Opens the centre.'], ['cxd4', 'Wing pawn for centre pawn.'], ['Nxd4', ''], ['Nf6', 'Attacks e4.'], ['Nc3', 'Defends it.'],
          ['g6', 'The Dragon. The bishop is going to g7.'],
          ['Be3', 'The start of the Yugoslav Attack.'],
          ['Bg7', 'On the long diagonal, bearing down on d4, c3 and b2.'],
          ['f3', 'Supports e4 and g4, and stops ...Ng4 harassing the bishop.'],
          ['O-O', 'Black castles short…'],
          ['Qd2', 'Lines up Bh6 to trade off Black’s best piece.'],
          ['Nc6', 'Develops with pressure on d4.'],
          ['O-O-O', '…and White castles long. Opposite-side castling: the pawn race is on.']
        ]
      },
      {
        id: 'french', name: 'French Defence: Advance', tag: 'A pawn chain, and how to attack it.',
        idea: 'Black prepares `...d5` with `...e6`. After White advances, the centre is locked into two **pawn chains**. Black’s whole game is aimed at one square: d4, the base of White’s chain. (More on chains in Part 5.)',
        white: 'Keep the chain intact. Use the extra space on the kingside to attack.',
        black: 'Undermine with ...c5 and later ...f6. Find a job for the c8-bishop, which is shut in by its own pawn on e6.',
        moves: [
          ['e4', E4],
          ['e6', 'The French. Black supports ...d5 in advance, accepting a blocked c8-bishop.'],
          ['d4', 'The ideal two-pawn centre.'],
          ['d5', 'Now e4 must decide: advance, exchange or be defended.'],
          ['e5', 'The Advance: White gains space and builds the chain d4–e5.'],
          ['c5', 'The key idea in every French: strike the base of the chain.'],
          ['c3', 'Reinforces the base.'],
          ['Nc6', 'A second attacker on d4.'],
          ['Nf3', 'A second defender.'],
          ['Qb6', 'A third attacker, which also eyes b2.'],
          ['a3', 'Prepares b4 to gain space on the queenside.'],
          ['Nh6', 'Heading for f5, to attack d4 a fourth time.'],
          ['b4', 'Asks the c-pawn to declare itself.'],
          ['cxd4', 'Trades, so the d4 pawn is now a fixed target.'],
          ['cxd4', ''],
          ['Nf5', 'Everything Black owns is pointed at d4. Understand this square and you understand the French.']
        ]
      },
      {
        id: 'caro', name: 'Caro-Kann Defence', tag: 'Solid, with no bad bishop.',
        idea: 'Like the French, Black supports `...d5`, but with the c-pawn, so the c8-bishop is not shut in. The result is one of the most solid defences in chess.',
        white: 'Use the extra space and the advanced h-pawn. Often castle queenside.',
        black: 'Develop with ...e6, ...Ngf6 and ...Be7, castle, and later break with ...c5.',
        moves: [
          ['e4', E4],
          ['c6', 'The Caro-Kann. It prepares ...d5 while keeping the c8-bishop’s diagonal open.'],
          ['d4', ''], ['d5', 'Challenges e4.'],
          ['Nc3', 'Defends e4 by developing.'],
          ['dxe4', 'Black gives up the centre pawn to get the pieces out smoothly.'],
          ['Nxe4', ''],
          ['Bf5', 'The point: the bishop comes out before ...e6 closes the door.'],
          ['Ng3', 'Gains time on the bishop.'],
          ['Bg6', ''],
          ['h4', 'Threatens h5, trapping the bishop.'],
          ['h6', 'Makes a home for it on h7.'],
          ['Nf3', ''],
          ['Nd7', 'Stops the knight landing on e5.'],
          ['h5', 'Gains space and fixes Black’s kingside pawns.'],
          ['Bh7', ''],
          ['Bd3', 'Offers to trade off Black’s good bishop.'],
          ['Bxd3', ''],
          ['Qxd3', 'A typical Caro-Kann: Black is solid, White has a little more space.']
        ]
      },
      {
        id: 'scandi', name: 'Scandinavian Defence', tag: 'Challenge e4 on move one.',
        idea: 'Black attacks the e-pawn immediately. The price is that the queen comes out early and loses a move, but the resulting structure is simple and there is little to memorise.',
        white: 'Use the lead in development. Harass the queen with Bd2 ideas and plant a knight on e5.',
        black: 'A Caro-Kann-style set-up: ...c6, ...Bf5, ...e6, ...Nbd7.',
        moves: [
          ['e4', E4],
          ['d5', 'The Scandinavian: a direct challenge.'],
          ['exd5', ''],
          ['Qxd5', 'Black recovers the pawn, but the queen is out early…'],
          ['Nc3', '…and White develops with tempo by attacking her.'],
          ['Qa5', 'The safest square: active, and out of the knights’ reach.'],
          ['d4', 'Takes the centre.'],
          ['Nf6', ''], ['Nf3', ''],
          ['c6', 'Gives the queen a way home via c7 or d8, and controls d5.'],
          ['Bc4', ''],
          ['Bf5', 'The bishop gets out before ...e6, just as in the Caro-Kann.']
        ]
      },
      {
        id: 'qgd', name: 'Queen’s Gambit Declined', tag: 'The classical answer to 1. d4.',
        idea: 'White offers a wing pawn to pull Black’s d-pawn out of the centre. It is not a real sacrifice. By declining with `...e6`, Black keeps a firm grip on d5 and gets a rock-solid position.',
        white: 'Pressure d5. Rook to c1, bishop to d3. Often cxd5 followed by the minority attack with b4–b5.',
        black: 'Free the position with ...c5 or ...e5, or with ...dxc4 and ...Nd5 to trade pieces.',
        moves: [
          ['d4', D4], ['d5', 'Black takes an equal share.'],
          ['c4', 'The Queen’s Gambit. White attacks d5 from the side.'],
          ['e6', 'Declined. Black holds d5, at the cost of shutting in the c8-bishop.'],
          ['Nc3', 'More pressure on d5.'],
          ['Nf6', 'And another defender.'],
          ['Bg5', 'Pins the knight that defends d5.'],
          ['Be7', 'Breaks the pin.'],
          ['e3', 'Opens the f1-bishop and supports d4.'],
          ['O-O', ''], ['Nf3', ''],
          ['Nbd7', 'Supports the f6-knight and prepares ...c5 or ...c6. (Both knights could reach d7, hence the `b`.)'],
          ['Rc1', 'The rook takes the file most likely to open.'],
          ['c6', 'A solid triangle of pawns. A classic strategic battle begins.']
        ]
      },
      {
        id: 'qga', name: 'Queen’s Gambit Accepted', tag: 'Take the pawn, give it back.',
        idea: 'Black takes on c4 but does not try to keep the pawn (attempts to hold it with `...b5` usually backfire). The time White spends winning it back is time Black uses to develop freely and hit the centre with `...c5`.',
        white: 'A central majority, and often an isolated d-pawn with attacking chances.',
        black: '...c5, ...a6, ...b5 and ...Bb7, then play against an isolated d-pawn.',
        moves: [
          ['d4', D4], ['d5', ''], ['c4', 'The Queen’s Gambit.'],
          ['dxc4', 'Accepted.'],
          ['Nf3', 'Stops ...e5 and develops.'],
          ['Nf6', ''],
          ['e3', 'Opens the bishop’s path to c4.'],
          ['e6', ''],
          ['Bxc4', 'White has the pawn back and a free game.'],
          ['c5', 'The freeing move, striking at d4.'],
          ['O-O', ''],
          ['a6', 'Prepares ...b5, gaining time on the bishop.']
        ]
      },
      {
        id: 'slav', name: 'Slav Defence', tag: 'Hold d5 and keep the bishop free.',
        idea: 'Black supports d5 with the c-pawn instead of the e-pawn. The centre is just as solid as in the Queen’s Gambit Declined, but the c8-bishop can still come out.',
        white: 'Play e4 at the right moment. Queen to e2, rook to d1.',
        black: 'Control e4. Develop with ...Nbd7. Break with ...c5 or ...e5.',
        moves: [
          ['d4', D4], ['d5', ''], ['c4', 'The Queen’s Gambit.'],
          ['c6', 'The Slav. d5 is supported and the c8-bishop stays free.'],
          ['Nf3', ''], ['Nf6', ''], ['Nc3', ''],
          ['dxc4', 'Now this capture gains time: White must spend a move stopping ...b5.'],
          ['a4', 'Prevents ...b5, which would hold on to the extra pawn.'],
          ['Bf5', 'The bishop comes out before ...e6.'],
          ['e3', ''], ['e6', ''],
          ['Bxc4', 'Pawn regained.'],
          ['Bb4', 'Pins the knight and fights for the e4 square.'],
          ['O-O', ''], ['O-O', 'A balanced position where both sides have a healthy game.']
        ]
      },
      {
        id: 'london', name: 'London System', tag: 'One set-up against everything.',
        idea: 'A system rather than a sequence: White plays the same pyramid of pawns and the same piece squares against almost any defence. Low on memorisation, high on understanding, and very popular at club level.',
        white: 'The pawn pyramid c3–d4–e3. A knight on e5. A kingside attack with the queen and bishop.',
        black: 'Pressure with ...c5 and ...Qb6. Trade off the f4-bishop. Break with ...e5.',
        moves: [
          ['d4', D4], ['d5', ''],
          ['Bf4', 'The London bishop. It comes out before e3 shuts it in.'],
          ['Nf6', ''],
          ['e3', 'Solid support for d4.'],
          ['c5', 'The most challenging reply: hit d4 and prepare ...Qb6 against b2.'],
          ['c3', 'The London pyramid: c3, d4, e3.'],
          ['Nc6', ''],
          ['Nd2', 'Covers c4 and e4, and leaves f3 for the other knight.'],
          ['e6', ''],
          ['Ngf3', 'Notice the `g`: both knights could reach f3, so the notation says which.'],
          ['Bd6', 'Offers to trade White’s best piece.'],
          ['Bg3', 'If Black takes, hxg3 opens the h-file for White’s rook.'],
          ['O-O', ''],
          ['Bd3', 'Aims at h7. White’s set-up is complete.']
        ]
      },
      {
        id: 'kid', name: 'King’s Indian Defence', tag: 'Let White build, then strike.',
        idea: 'A hypermodern defence: Black lets White occupy the whole centre with pawns, then attacks it. Once the centre locks, each side attacks on the wing its pawn chain points towards.',
        white: 'The queenside: the c5 break and play down the c-file.',
        black: 'The kingside: move the f6-knight, then ...f5, ...f4 and a pawn storm.',
        moves: [
          ['d4', D4],
          ['Nf6', 'Stops e4 for the moment and commits to nothing.'],
          ['c4', ''],
          ['g6', 'Preparing a fianchetto.'],
          ['Nc3', ''],
          ['Bg7', 'The bishop takes the long diagonal.'],
          ['e4', 'White is allowed the full centre…'],
          ['d6', '…and Black plans to attack it later.'],
          ['Nf3', ''], ['O-O', ''], ['Be2', ''],
          ['e5', 'The counter-strike.'],
          ['O-O', ''],
          ['Nc6', 'Pressures d4 and invites White to close the centre.'],
          ['d5', 'Closed. From now on the pawn chains tell each side where to play.'],
          ['Ne7', 'The knight heads for the kingside, where Black’s attack will come.']
        ]
      },
      {
        id: 'nimzo', name: 'Nimzo-Indian Defence', tag: 'Control the centre with pieces.',
        idea: 'Black pins the knight that supports `e4`, fighting for the centre with pieces instead of pawns. Black is willing to give up the bishop pair in exchange for doubling White’s c-pawns.',
        white: 'The bishop pair and central expansion with e4.',
        black: 'Play against the doubled c-pawns. Blockade, then pressure with ...c5 and ...d5.',
        moves: [
          ['d4', D4], ['Nf6', ''], ['c4', ''],
          ['e6', 'Opens the f8-bishop.'],
          ['Nc3', 'Threatens to take the whole centre with e4.'],
          ['Bb4', 'The Nimzo-Indian. The pin stops e4 without Black touching a centre pawn.'],
          ['e3', 'The solid Rubinstein System.'],
          ['O-O', ''],
          ['Bd3', ''],
          ['d5', 'Now Black takes a share of the centre.'],
          ['Nf3', ''],
          ['c5', 'Both centre pawns are under fire.'],
          ['O-O', 'A rich middlegame with chances for both sides.']
        ]
      },
      {
        id: 'english', name: 'English Opening', tag: 'Control the centre from the wing.',
        idea: 'White controls d5 with a wing pawn. This line is a Sicilian Defence with colours reversed and an extra move for White. The English is flexible, and often turns into a queen’s pawn opening by a different route.',
        white: 'Pressure down the long diagonal. Queenside expansion with a3 and b4.',
        black: 'Classical development, and sometimes kingside space with ...f5.',
        moves: [
          ['c4', 'The English. The pawn controls d5 from the side.'],
          ['e5', 'Black takes the centre: a reversed Sicilian.'],
          ['Nc3', ''], ['Nf6', ''], ['Nf3', 'Attacks e5.'], ['Nc6', 'Defends it.'],
          ['g3', 'The bishop is going to g2, on the long light diagonal.'],
          ['d5', 'Black opens the centre.'],
          ['cxd5', ''], ['Nxd5', ''],
          ['Bg2', 'Now the knight on d5 feels the pressure down the diagonal.'],
          ['Nb6', 'Steps out of the line of fire.'],
          ['O-O', ''],
          ['Be7', 'Both sides finish developing.']
        ]
      },
      {
        id: 'scholars', name: 'Scholar’s Mate, and how to stop it', tag: 'The four-move mate everyone tries.',
        idea: 'Queen and bishop gang up on `f7`, threatening mate on move four. It only works if Black ignores the threat. Defend correctly and White is left with a misplaced queen. **Never rely on it; always recognise it.**',
        white: 'If you play this way and Black defends, you are already worse. Develop knights first instead.',
        black: 'Block the queen with ...g6, then ...Nf6. Each defensive move also develops a piece.',
        moves: [
          ['e4', ''], ['e5', ''],
          ['Bc4', 'Aims at f7.'],
          ['Nc6', ''],
          ['Qh5', 'Now queen and bishop both attack f7. The threat is Qxf7 mate. (If Black plays ...Nf6 here, that is exactly what happens.)'],
          ['g6', 'Blocks the queen’s path and attacks her.'],
          ['Qf3', 'Threatens mate on f7 a second time.'],
          ['Nf6', 'Blocks again. Black has developed two pieces; White’s queen is in the way of her own knight.']
        ]
      },
      {
        id: 'elephant', name: 'The Elephant Trap', tag: 'A pinned knight that isn’t really pinned.',
        idea: 'In the Queen’s Gambit Declined, White sees a "pinned" knight on f6 and grabs a pawn on d5. But a pin against the queen is only a **relative** pin: the knight is allowed to move, and here it does, with decisive effect.',
        white: 'Do not take on d5 with the knight. Play e3 or Nf3 first.',
        black: 'If White grabs the pawn, give up the queen for a moment and win a piece.',
        moves: [
          ['d4', ''], ['d5', ''], ['c4', ''], ['e6', ''], ['Nc3', ''], ['Nf6', ''],
          ['Bg5', 'Pins the knight to the queen.'],
          ['Nbd7', 'Sets the trap. It looks as though d5 is now short of defenders.'],
          ['cxd5', ''], ['exd5', ''],
          ['Nxd5', 'The mistake. White thinks the f6-knight cannot recapture.'],
          ['Nxd5', 'But it can! Black lets the queen go…'],
          ['Bxd8', ''],
          ['Bb4+', '…because of this check. White’s only way to block is with the queen.'],
          ['Qd2', 'Forced.'],
          ['Bxd2+', ''],
          ['Kxd2', ''],
          ['Kxd8', 'When the dust settles Black has won a knight for a pawn.']
        ]
      },
      {
        id: 'noahs', name: 'Noah’s Ark Trap', tag: 'A bishop walled in by pawns.',
        idea: 'In the Ruy López, White’s bishop on b3 can be buried alive by Black’s queenside pawns. It is the classic example of a **trapped piece**.',
        white: 'After ...b5 and ...Nxd4, do not recapture on d4 with the queen. Play Bd5 or c3 instead.',
        black: 'Chase the queen with ...c5, then shut the door with ...c4.',
        moves: [
          ['e4', ''], ['e5', ''], ['Nf3', ''], ['Nc6', ''], ['Bb5', ''], ['a6', ''], ['Ba4', ''],
          ['d6', ''], ['d4', ''],
          ['b5', 'Drives the bishop back.'],
          ['Bb3', ''],
          ['Nxd4', ''], ['Nxd4', ''], ['exd4', ''],
          ['Qxd4', 'The mistake. It looks natural to take the pawn back.'],
          ['c5', 'Attacks the queen and starts closing the net.'],
          ['Qd5', 'Threatens mate on f7 and the rook on a8.'],
          ['Be6', 'Blocks both threats and hits the queen.'],
          ['Qc6+', ''],
          ['Bd7', ''],
          ['Qd5', 'Threatening mate on f7 again…'],
          ['c4', '…but this pawn blocks the bishop’s diagonal and traps it. The bishop on b3 has no squares and will be lost.']
        ]
      }
    ]
  };
})();
