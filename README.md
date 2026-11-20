# Sixty-Four

A self-contained chess course that starts with the board itself, plus a bot to play, a review of your games, and puzzles.

**Use it now: https://pratim99.github.io/sixty-four/** on any phone, tablet or computer. Nothing to install.

To keep it on a phone like an app (it then also works without a connection):

- **iPhone or iPad:** open the address in Safari, tap Share, then "Add to Home Screen".
- **Android:** open the address in Chrome, tap the menu (⋮), then "Add to Home screen" or "Install app".

## Three ways to give it to people

Run `node tools/build-exe.js` and then `node tools/build-site.js`. That produces everything in `dist/`:

| What | For whom | How they use it |
| --- | --- | --- |
| `dist/site/` | Everyone: Windows, Mac, iPhone, iPad, Android | Upload the folder to any static web host (GitHub Pages, Netlify, Cloudflare Pages). People open the address; nothing to download. On a phone they can add it to the home screen and it behaves like an app, including offline. |
| `dist/Sixty-Four-Windows.zip` | Windows users who want a download | Unzip, double-click `Sixty-Four.exe`. It includes a short read-me. |
| `dist/Sixty-Four.exe` | The same program on its own | One file, nothing to install. |

### Where progress is saved

- **The .exe** keeps progress in a file, `%APPDATA%\Sixty-Four\progress.json`. It is loaded at every start and written after every change, so it survives clearing or switching browsers. The app opens in its own window (Edge or Chrome in app mode), and the program closes itself a few minutes after that window is closed.
- **The website** keeps progress in the browser's storage on that device, and asks the browser to treat it as permanent. It is there on every return visit. Clearing the browser's site data erases it.
- **Both** have "Download a backup" and "Restore from a backup" on the home page, which is also how to move progress between devices.

Nothing is ever sent anywhere: there is no account and no server-side storage.

## Developing

Run the small local server (needs Node):

```
node tools/serve.js
```

then open http://localhost:5173. Each address keeps its own progress, so the development server, the .exe and a hosted site do not share it.

Double-clicking `index.html` also opens the app, but browsers will not load Stockfish from a plain file, so it falls back to the smaller built-in engine (bot up to 1800, lighter game review).

## What is in it

**The course (7 parts, 46 lessons)**

1. **See the Board** — coordinates, square colours, diagonals, regions, piece reach, knight geometry, control maps. Five timed drills.
2. **Speak the Language** — algebraic notation, with read-and-play and watch-and-write drills.
3. **Openings** — the three principles, 15 main openings and 3 traps, each explained move by move and playable from memory.
4. **Strategy** — piece values, activity, king safety, space, trades, choosing a move, endgame principles.
5. **Pawns** — structure vocabulary, chains and breaks, passed pawns, the isolated pawn, majorities, the opposition.
6. **Checkmates** — the named mating patterns, each with puzzles.
7. **Tactics** — forks, pins, skewers, discoveries, removing the defender, deflection, decoys, trapped pieces.

**Practice**

- **Training** — 24 short, repeatable exercises that make fresh questions every time, grouped by course part, with best scores, a daily five-exercise workout and a day streak:
  - *Board vision:* find the square, name the square, light or dark, same diagonal, knight sight, loose pieces, count the attackers.
  - *Notation:* read and play, watch and write.
  - *Openings:* name the opening, play the next book move.
  - *Strategy:* find the outpost, count the material.
  - *Pawns:* pawn spotter (passed, isolated, doubled, backward), rule of the square.
  - *Checkmates and tactics:* mate mix, puzzle mix, puzzle rush (three strikes against the clock), rated puzzles (your own puzzle rating).
  - *Endgames:* play out the two-rook ladder, queen mate, rook mate, escorting a pawn and holding a drawn pawn ending, against the engine.
- **Play the bot** — rating slider from 400 to 2800. Up to 1300 it is the built-in bot, which makes human-looking mistakes; from 1350 it is Stockfish 19 held back to the chosen rating, and the top of the slider is Stockfish with no limit. The numbers are approximate. It plays the openings from Part 3.
- **Your games** — every finished game is saved. The review (by Stockfish when available) marks blunders, mistakes and inaccuracies, shows what the engine preferred, graphs the evaluation, and points at the lesson that fits each habit. You can also paste a game played elsewhere.
- **Puzzles** — a bank of engine-checked puzzles, and puzzles made from the mistakes in your own games.

## Files

```
index.html            the page
css/style.css         all styling
js/chess.js           rules engine: legal moves, FEN, notation
js/ai.js              built-in search engine: low-rated bot, fallback review, puzzle generation
js/board.js           the board component and piece artwork
js/core.js            helpers, progress storage, board geometry
js/lesson.js          lesson player (diagrams, move lists, puzzles, quizzes)
js/widgets.js         the board explorers used in Part 1
js/drills.js          timed drills, notation drills, puzzle mix
js/openings-view.js   opening explorer
js/play.js            play against the bot
js/review.js          saved games and game review
js/puzzles-view.js    puzzles hub
js/train.js           training hub, daily workout, practice log
js/train-spot.js      trainers generated from real positions (loose pieces, pawns, outposts...)
js/train-endgame.js   endgame play-outs against the engine, with an exact king-and-pawn solver
js/train-puzzle.js    puzzle rush, rated puzzles, opening trainers
js/engine-client.js   runs the engines (built-in and Stockfish) in background workers
js/content/*.js       all lesson text, positions and the puzzle bank
vendor/stockfish/     Stockfish 19 lite WebAssembly build (GPL-3.0, see NOTICE.md)
manifest.webmanifest  app name, colours and icons for "add to home screen"
icons/                app icons
dist/                 what you hand to other people (see the top of this file)
tools/                developer scripts (below)
```

## Checking and extending

```
node tools/perft.js          tests the rules engine against known move counts
node tools/validate.js       checks every position, move list and puzzle in the course
node tools/make-puzzles.js   generates a fresh puzzle bank (takes a few minutes)
node tools/test-train-*.js   tests for the trainers' question generators (run each file)
node tools/build-exe.js      rebuilds dist/Sixty-Four.exe after any change to the app
node tools/build-site.js     rebuilds dist/site and the Windows zip (run after build-exe)
node tools/make-icons.js     redraws the app icons
node tools/publish-site.js   rebuilds the website and puts it online (GitHub Pages, "gh-pages" branch)
```

After changing the app, `node tools/publish-site.js` is all it takes to update the live site; phones pick up the new version the next time they open it with a connection.

The .exe is built with the C# compiler that ships with Windows, so building it needs no downloads. It is not code-signed, so Windows may show an "unknown publisher" warning if you send it to another computer.

Lessons are plain data in `js/content/`. Add a step to a lesson, run `validate.js`, and it will tell you if a position is illegal or a puzzle's solution is not the best move.

## Licence note

`vendor/stockfish/` contains Stockfish, which is licensed under the GNU GPL version 3. That does not affect using the app yourself. If you give the app to someone else, the GPL's terms apply: keep that folder's licence files with it and make the source available.
