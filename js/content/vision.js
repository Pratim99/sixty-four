/* Part 1 — See the Board */
(function () {
  'use strict';
  var CL = window.CL, E = CL.EMPTY;

  CL.content.vision = {
    id: 'vision', num: 1, title: 'See the Board', short: 'Squares, colours, lines',
    tagline: 'Before pieces and plans, learn the map: sixty-four named squares, two colours, the diagonals that hide in plain sight, and the fields of force that pieces project across them.',

    lessons: [
      {
        id: 'squares', title: 'Every square has a name',
        blurb: 'Files, ranks and coordinates, from both sides of the board.',
        takeaway: 'A square is **file letter + rank number**, always counted from White’s side: `a1` is White’s near-left corner. The names never change, whichever side you sit on.',
        steps: [
          { type: 'widget', widget: 'coords', fen: E, title: 'A grid with an address system',
            text: 'The eight columns are **files**, lettered `a` to `h` from White’s left. The eight rows are **ranks**, numbered `1` to `8` starting at White’s side.\n\nA square’s name is its file, then its rank. Where the `e`-file crosses rank `4` is `e4`.\n\nSweep your pointer across the board and say each name as it appears. Click to pin one.' },
          { type: 'info', title: 'Where everything starts',
            hl: { note: ['d1', 'd8'], info: ['e1', 'e8'] },
            text: 'White’s army fills ranks `1` and `2`. Black’s fills ranks `7` and `8`.\n\nBoth queens start on the `d`-file, both kings on the `e`-file. The rooks own the corners: `a1`, `h1`, `a8`, `h8`.\n\nWhen a book says "the knight on `g1`" or "the `c`-pawn", this is the picture it assumes you can see.' },
          { type: 'widget', widget: 'coords', fen: E, orient: 'b', title: 'Now sit in Black’s chair',
            text: 'Same board, same names. But from here `h8` is at your near left, the files run `h` to `a`, and the ranks count _down_ as they come towards you.\n\nNotation never changes with your point of view. It is always written from White’s side. Being fluent from both chairs is one of the quiet differences between beginners and club players.' },
          { type: 'find', fen: E, title: 'Find them', targets: ['e4', 'd5', 'g7', 'b2', 'h8', 'c6'],
            text: 'Click each square as it is named. The edge labels are there to help.',
            explain: 'Notice how you found them: probably by running a finger along to the file, then up to the rank. With practice the two steps merge into one.' },
          { type: 'find', fen: E, coords: false, title: 'And without the labels', targets: ['a1', 'e5', 'f3', 'c7', 'h4'],
            text: 'The labels are gone. Anchor yourself: `a1` is the bottom-left corner, and `d` and `e` are the two middle files.',
            explain: 'This is exactly what the **Find the square** drill trains. Thirty seconds at a time is all it takes.' },
          { type: 'quiz', fen: E, title: 'One to remember',
            text: 'You are White, sitting at the board. Which square is the corner by your **right** hand?',
            choices: ['`a1`', '`h1`', '`a8`', '`h8`'], answer: 1,
            explain: '`h1`. It is also a light square. That is how you check a board is set up the right way round: _light on the right_.' }
        ]
      },

      {
        id: 'colours', title: 'Light and dark',
        blurb: 'Know any square’s colour without looking, and why bishops and knights care.',
        takeaway: '`a1` is dark, `h1` is light. A bishop is locked to one colour for life; a knight changes colour every move. Half the board is invisible to each of your bishops.',
        steps: [
          { type: 'widget', widget: 'colors', fen: E, title: 'A strict checkerboard',
            text: 'Every step along a file or rank flips the colour. Every step along a diagonal keeps it.\n\nTwo anchors: `a1` is **dark** and `h1` is **light**.\n\nClick any square to see its colour and the arithmetic behind it.' },
          { type: 'info', fen: E, title: 'A faster trick than adding',
            hl: { info: CL.fileSquares('a').concat(CL.fileSquares('c'), CL.fileSquares('e'), CL.fileSquares('g')),
                  note: CL.fileSquares('b').concat(CL.fileSquares('d'), CL.fileSquares('f'), CL.fileSquares('h')) },
            text: 'Split the files into two families.\n\nOn the **blue** files (`a`, `c`, `e`, `g`) the **odd** ranks are dark. They all behave like `a1`.\n\nOn the **yellow** files (`b`, `d`, `f`, `h`) the **even** ranks are dark.\n\nSo `c3`: blue file, odd rank, dark. And `f5`: yellow file, odd rank, light.' },
          { type: 'info', title: 'Why it matters: bishops',
            hl: { note: ['f1', 'c8'], info: ['c1', 'f8'] },
            text: 'A bishop never leaves the colour it starts on. You begin with one **light-squared** bishop (`f1` for White) and one **dark-squared** bishop (`c1`).\n\nThis has consequences everywhere:\n\n- If your pawns are fixed on dark squares, your dark-squared bishop stares at its own pawns. That is a _bad bishop_.\n- If your opponent’s dark-squared bishop is traded off, the dark squares near their king can never again be defended by a bishop.\n- Two bishops together cover every square. One bishop covers exactly half.' },
          { type: 'info', fen: '8/8/8/8/4N3/8/8/8 w - - 0 1', title: 'And knights',
            hl: { reach: ['d6', 'f6', 'c5', 'g5', 'c3', 'g3', 'd2', 'f2'] },
            text: 'A knight changes colour with every move. This knight stands on a light square, so every square it attacks is dark.\n\nA practical use: a knight can only attack pieces standing on the **opposite** colour to itself. So a knight can only fork two pieces that stand on the same colour as each other. If your king and queen are on squares of different colours, no knight can ever attack both at once.' },
          { type: 'quiz', fen: E, blind: true, title: 'Eyes closed',
            text: 'Without looking at a board: what colour is `d4`?',
            choices: ['Light', 'Dark'], answer: 1,
            explain: '`d` is a yellow-family file (b, d, f, h), where even ranks are dark. Or: d is file 4, and 4 + 4 = 8 is even.' },
          { type: 'quiz', fen: E, blind: true, title: 'One more',
            text: 'And `f7`, the weak spot in Black’s camp?',
            choices: ['Light', 'Dark'], answer: 0,
            explain: 'Light. That is why White’s light-squared bishop, the one from `f1`, is the piece that attacks it.' }
        ]
      },

      {
        id: 'diagonals', title: 'Diagonals: the hidden roads',
        blurb: 'The lines beginners don’t see, and the ones that point at the king.',
        takeaway: 'Every square lies on two diagonals, each a single colour. Learn the landmarks: the long diagonals `a1–h8` and `h1–a8`, and the three roads to a castled king: `a2–g8`, `b1–h7`, `c1–h6`.',
        steps: [
          { type: 'widget', widget: 'diagonals', fen: E, title: 'Two through every square',
            text: 'Files and ranks are easy to see. Diagonals are where beginners go blind, and where bishops, queens and pawn captures live.\n\nClick any square to light up its two diagonals. Each one is a single colour from end to end.' },
          { type: 'info', fen: '8/8/8/8/8/8/1B4B1/8 w - - 0 1', title: 'The long diagonals',
            hl: { d1: CL.ray('a1', 'h8'), d2: CL.ray('h1', 'a8') },
            text: 'Two diagonals run corner to corner: `a1–h8` (dark) and `h1–a8` (light). Between them they cross all four centre squares.\n\nA bishop developed to `g2` or `b2` sits on one of them and rakes the whole board. That set-up is called a **fianchetto**, and you will meet it in the King’s Indian, the Dragon and the English.' },
          { type: 'info', fen: '5rk1/5ppp/8/8/8/8/8/6K1 w - - 0 1', title: 'Three roads to the king',
            arrows: [['a2', 'f7', 'red'], ['b1', 'h7', 'red'], ['c1', 'h6', 'red']],
            text: 'A castled black king lives on `g8` behind three pawns. Three diagonals lead straight to its doorstep:\n\n- `a2–g8` strikes `f7`\n- `b1–h7` strikes `h7`\n- `c1–h6` strikes the dark squares in front of it\n\nThis is why White’s bishops go to `c4`, `d3` and `g5` in so many openings. They are not random squares. They are stations on these three lines.' },
          { type: 'find', fen: E, title: 'Trace one', answers: CL.ray('c1', 'h6'),
            text: 'Click **every square** on the diagonal that runs from `c1` to `h6`.',
            explain: '`c1`, `d2`, `e3`, `f4`, `g5`, `h6`. This is the home diagonal of White’s dark-squared bishop.' },
          { type: 'quiz', fen: E, blind: true, title: 'Eyes closed',
            text: 'Are `b2` and `f6` on the same diagonal?',
            choices: ['Yes', 'No'], answer: 0,
            explain: 'Yes, both are on the long dark diagonal `a1–h8`. From `b2` to `f6` is four files across and four ranks up: equal steps means a diagonal.' },
          { type: 'quiz', fen: E, blind: true, title: 'And these?',
            text: 'Are `c1` and `f5` on the same diagonal?',
            choices: ['Yes', 'No'], answer: 1,
            explain: 'No. Three files across (c to f) but four ranks up (1 to 5). The steps must match.' }
        ]
      },

      {
        id: 'geography', title: 'The geography of the board',
        blurb: 'Centre, wings, the seventh rank, and the two weakest squares.',
        takeaway: 'Think in regions, not squares: the **centre** is worth fighting for, the **seventh rank** is where rooks feast, the **rim** is where pieces go dim, and `f2`/`f7` are where early attacks land.',
        steps: [
          { type: 'widget', widget: 'regions', fen: E, title: 'Regions with meanings',
            text: 'Strong players do not see sixty-four separate squares. They see a handful of regions, each with its own meaning. Press each one.' },
          { type: 'quiz', fen: '6k1/3R1ppp/8/8/8/8/5PPP/6K1 b - - 0 1', title: 'Name the place',
            hl: { good: CL.rankSquares(7) },
            text: 'White’s rook has just landed on `d7`. A chess player would say the rook has reached…',
            choices: ['the back rank', 'the seventh rank', 'the extended centre', 'the queenside'], answer: 1,
            explain: 'The seventh rank. From there it attacks the pawn on `f7` from the side and keeps the king on the back rank.' },
          { type: 'quiz', title: 'The soft spot',
            text: 'Look at the starting position. Which black pawn is defended by the king and by **nothing else**?',
            choices: ['`d7`', '`e7`', '`f7`', '`g7`'], answer: 2,
            explain: '`f7`. The `d7` pawn has four defenders and `e7` has four too; `g7` has the bishop. Only `f7` relies on the king alone, which is why so many opening traps aim there.' }
        ]
      },

      {
        id: 'reach', title: 'Squares are not equal',
        blurb: 'Count what each piece attacks from each square, and see why the centre matters.',
        takeaway: 'A knight in the corner attacks 2 squares; in the centre, 8. "Control the centre" is not a slogan: a centralised piece is simply a bigger piece.',
        steps: [
          { type: 'widget', widget: 'reach', fen: E, title: 'Count the squares',
            text: 'Put a piece on an empty board and count how many squares it attacks. Now move it. The number changes, sometimes a lot.\n\nChoose a piece, sweep the pointer around, and then turn on the **heat map** to see every square’s score at once.' },
          { type: 'info', fen: '8/8/8/8/3N4/8/8/N7 w - - 0 1', title: 'What the numbers say',
            hl: { good: CL.reach('n', 'd4'), bad: CL.reach('n', 'a1') },
            text: 'On an empty board:\n\n- **Knight**: 2 in a corner, 8 in the centre. Four times as strong.\n- **Bishop**: 7 on the edge, 13 in the centre.\n- **Queen**: 21 on the edge, 27 in the centre.\n- **King**: 3 in a corner, 8 in the middle. This is why the king walks to the centre in the endgame.\n- **Rook**: 14 from anywhere. A rook does not need the centre. It needs an **open file**.\n\nSame piece, same value on paper, completely different power.' },
          { type: 'quiz', fen: E, title: 'Check yourself',
            text: 'How many squares does a knight on `a1` attack?',
            choices: ['2', '3', '4', '8'], answer: 0,
            explain: 'Two: `b3` and `c2`. Six of its eight possible jumps fall off the board.' },
          { type: 'quiz', fen: E, title: 'And this',
            text: 'On an empty board, which piece attacks the same number of squares wherever it stands?',
            choices: ['The bishop', 'The knight', 'The rook', 'The queen'], answer: 2,
            explain: 'The rook: always 7 along its rank and 7 along its file. In a real game, of course, pawns get in the way, which is why rooks crave open files.' }
        ]
      },

      {
        id: 'knight', title: 'The knight’s strange geometry',
        blurb: 'Rings, colour-flips, and the squares a knight finds hardest to reach.',
        takeaway: 'A knight reaches the squares diagonally next to it in **two** moves, the squares directly next to it in **three**, and the squares two steps away on a diagonal in **four**. To stay safe from a knight, stand on a diagonal from it.',
        steps: [
          { type: 'widget', widget: 'knightDistance', fen: E, title: 'How far is far?',
            text: 'The knight is the only piece that does not move in a straight line, and the only one that jumps. Its reach is a ring of up to eight squares, always of the opposite colour.\n\nClick any square to drop the knight there. Each number is how many moves it needs to reach that square. Try the centre, then an edge, then a corner.' },
          { type: 'info', fen: '8/8/8/8/3N4/8/8/8 w - - 0 1', title: 'Three surprises',
            labels: { e4: '3', d5: '3', e5: '2', c3: '2', f6: '4', b2: '4' },
            hl: { note: ['e4', 'd5'], good: ['e5', 'c3'], bad: ['f6', 'b2'] },
            text: 'From `d4`:\n\n- The squares **right beside** the knight (yellow) take **three** moves.\n- The squares **diagonally beside** it (green) take **two**.\n- The squares **two steps away on a diagonal** (red) take **four**. They are among the hardest squares on the whole board for it to reach.\n\nSo a king or queen standing two squares diagonally from an enemy knight is about as safe from it as it is possible to be.' },
          { type: 'find', fen: '8/8/8/8/8/5N2/8/8 w - - 0 1', title: 'See the ring', answers: CL.reach('n', 'f3'),
            text: 'This knight is on `f3`, where White’s king’s knight goes in most openings. **Click every square it attacks.**',
            explain: 'Eight squares: `e5`, `g5`, `d4`, `h4`, `d2`, `h2`, `e1`, `g1`. From `f3` the knight watches both centre squares `d4` and `e5`, which is exactly why it goes there.' },
          { type: 'quiz', fen: E, blind: true, title: 'Eyes closed',
            text: 'A knight stands on a dark square. After it has made three moves, what colour is it standing on?',
            choices: ['Dark', 'Light', 'It depends on the moves'], answer: 1,
            explain: 'Light. Each move flips the colour: dark, light, dark, light. An odd number of moves always ends on the opposite colour.' }
        ]
      },

      {
        id: 'force', title: 'Fields of force',
        blurb: 'Stop seeing pieces. Start seeing the squares they control.',
        takeaway: 'Every piece projects control over the squares it attacks. Before each move, ask: **what did that move stop guarding, what does it now attack, and which lines did it open or close?**',
        steps: [
          { type: 'widget', widget: 'control', title: 'The map behind the pieces',
            text: 'This is the idea that changes how the whole game looks. A piece is not just an object on a square. It projects **control** over every square it attacks, and those are squares where enemy pieces cannot safely land.\n\nBlue squares have more white attackers, red have more black, purple are contested. Step through the positions and watch a single pawn move redraw the map. Hover any square to see who is watching it.' },
          { type: 'info', after: '1. e4', title: 'One move, four changes',
            arrows: [['e4', 'd5', 'blue'], ['e4', 'f5', 'blue'], ['f1', 'a6', 'green'], ['d1', 'h5', 'green']],
            text: 'Look at what `1. e4` actually does:\n\n- The pawn now attacks `d5` and `f5` (blue).\n- It opened the diagonal `f1–a6` for the bishop and `d1–h5` for the queen (green).\n- And it stopped guarding nothing that mattered, because a pawn on `e2` guarded `d3` and `f3`, which nobody was attacking.\n\nEvery move is a small bundle of changes like this. Reading them is what "seeing the board" means.' },
          { type: 'find', after: '1. e4 e5 2. Nf3', title: 'Count attackers and defenders', answers: ['e5'],
            text: 'White has just played `Nf3`. **Click the black pawn the knight is attacking.**',
            explain: 'The pawn on `e5`. Right now it has one attacker (the knight) and no defenders, so Black must do something about it. `2...Nc6` adds a defender; one attacker against one defender means the pawn is safe.' },
          { type: 'find', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4', title: 'Follow the line', answers: ['f7'],
            text: 'White’s bishop has landed on `c4`. Follow its diagonal towards the black king. **Click the pawn at the end of it.**',
            explain: '`f7` again: the pawn only the king defends. The bishop cannot take it yet (the king would recapture), but the moment a second attacker arrives, a queen on `f3` or `h5`, or a knight on `g5`, Black has a real problem.' },
          { type: 'quiz', after: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5', title: 'Now count',
            arrows: [['c4', 'f7', 'red'], ['g5', 'f7', 'red']],
            text: 'White has played `Ng5`. How many white pieces attack `f7`, and how many black pieces defend it?',
            choices: ['1 attacker, 1 defender', '2 attackers, 1 defender', '2 attackers, 2 defenders', '1 attacker, 2 defenders'], answer: 1,
            explain: 'Two attackers (bishop and knight) against one defender (the king). When attackers outnumber defenders, something falls. Black has to break the pattern at once, and the main move is `4...d5`, blocking the bishop’s diagonal.' }
        ]
      }
    ],

    drills: [
      { id: 'find', title: 'Find the square', desc: 'A name appears; click the square. The core drill.', timed: 30 },
      { id: 'name', title: 'Name the square', desc: 'A square lights up; type its name. No labels.', timed: 30 },
      { id: 'color', title: 'Light or dark?', desc: 'Blindfold: give a square’s colour from its name alone.', timed: 30 },
      { id: 'diagonal', title: 'Same diagonal?', desc: 'Blindfold: do two named squares share a diagonal?', timed: 45 },
      { id: 'knight', title: 'Knight sight', desc: 'Click every square a knight attacks, as fast as you can.', timed: 45 }
    ]
  };
})();
