<div align="center">

<img src="public/favicon.svg" width="88" alt="GOL logo — a glider" />

# GOL

### An infinite Game of Life that runs its rules in WebAssembly, compiled from AssemblyScript.

No winning, no score, nobody to play against. You draw a few cells, press play, and then four tiny rules take over and surprise you. This is a from-scratch rebuild of Conway's Game of Life — the whole simulation lives in a tiny `.wasm` module, and the interface around it tries very hard to feel nice.

<br/>

![AssemblyScript](https://img.shields.io/badge/engine-AssemblyScript-007ACC?style=flat-square&logo=assemblyscript&logoColor=white)
![WebAssembly](https://img.shields.io/badge/runs%20in-WebAssembly-654FF0?style=flat-square&logo=webassembly&logoColor=white)
![SolidJS](https://img.shields.io/badge/UI-SolidJS-2C4F7C?style=flat-square&logo=solid&logoColor=white)
![Vite](https://img.shields.io/badge/build-Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/-Tailwind%20v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

<br/>

<table>
<tr>
<td width="50%" align="center">
<img src="docs/images/board-light.png" alt="A busy board in light mode — stable structures cooled to blue, active cells warm rust" />
<br/><sub><b>Light</b> — the Steep theme</sub>
</td>
<td width="50%" align="center">
<img src="docs/images/board-dark.png" alt="The same board in dark mode — peach active cells, mint stable structures on navy" />
<br/><sub><b>Dark</b> — the Airtable theme</sub>
</td>
</tr>
</table>

<sub>Generation 90 of the same random soup. Notice the colour: things that have been alive a long time cool to blue; fresh churn stays warm.</sub>

</div>

---

## So, what is this?

It's [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life). The universe is an endless grid of squares, each one alive or dead. Every tick, each cell looks at its eight neighbours and decides its fate by four rules — and that's the entire program. You're not steering anything. You set up a starting pattern and then watch what the rules decide to do.

The thing that makes it worth a whole repo is that those four dumb rules produce *creatures*. Blinkers that flip forever. Gliders that crawl diagonally across the plane like they're actually going somewhere. Guns that spit out a new glider every thirty steps, on and on. Nobody designs these — you discover them, the way you'd find a beetle under a rock.

<details>
<summary><b>The four rules, if you've never met them</b></summary>

<br/>

A cell looks at its eight neighbours and asks: am I too lonely, too crowded, or just right?

- **Fewer than 2** live neighbours → it dies of loneliness.
- **2 or 3** → it lives on, perfectly content.
- **More than 3** → it dies of overcrowding, smothered by its own friends.
- An **empty** square with **exactly 3** neighbours → a new cell is born, as if three were the magic number for getting something started.

No memory, no plan. Each cell only knows its own little neighbourhood. Somehow that's enough to build a computer (really — Life is Turing-complete).

</details>

## The bit I'm proud of

The engine is written **exclusively in [AssemblyScript](https://www.assemblyscript.org/)** and compiled to a ~8 KB WebAssembly module. The TypeScript never computes a single generation — it just draws cells and listens for your mouse. All the actual *life* happens in `field.wasm`.

It runs on an **infinite plane**, so there's no edge to bump into. Live cells live in a hash set keyed by their `(x, y)` packed into a 64-bit integer; each step tallies neighbours in a map and applies `B3/S23`. Pan forever, zoom from a single pixel out to a whole colony.

```
assembly/field.ts   →   asc   →   public/field.wasm   ←  loaded & called by  src/engine.ts → src/sim.ts
   (the rules)              (compiler)   (~8 KB)                                    (the shell)
```

## The cells are the chart

The interface is deliberately quiet — almost monochrome, lots of white space, one editorial serif for the headlines. Colour is treated as something precious, and it's spent in exactly one place: **the cells themselves**.

Each cell is coloured by **age**. The moment it's born it's warm — rust in light mode, peach in the dark. The longer it survives, the cooler it gets, drifting toward blue. So a glider gun's exhaust trails off into colour, and a still life that's sat there for a hundred generations glows a calm, settled blue.

<div align="center">
<img src="docs/images/board-gliders.png" width="60%" alt="A glider gun firing a diagonal stream of gliders; the oldest glider has aged to blue" />
<br/><sub>A few gliders mid-flight. The one on the left has been travelling long enough to turn blue.</sub>
</div>

## Things to try

- Scribble some cells with your mouse and hit **space**. Start on an empty cell to draw, start on a live one to erase.
- Open the **library** (the grid icon) and stamp a Gosper glider gun. Watch it never stop.
- Drop an **R-pentomino** — five cells — and let it run. It thrashes around for *1,103* generations before it finally settles.
- Flip to **dark mode** (the moon) and do it all again. The whole thing turns into a different painting.
- Hit the **ⓘ** button if you want the longer, nerdier story.

## Play with it

You'll need [Node](https://nodejs.org/) 18+.

<details open>
<summary><b>Run it locally</b></summary>

<br/>

```bash
npm install        # grab the deps
npm run asbuild     # compile assembly/field.ts → public/field.wasm
npm run dev         # start Vite, open the printed localhost URL
```

After that, `npm run dev` is all you need day-to-day. If you change the engine (`assembly/field.ts`), re-run `npm run asbuild` to recompile the wasm — Vite doesn't do that step for you.

</details>

<details>
<summary><b>Other commands</b></summary>

<br/>

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run asbuild` | Compile the AssemblyScript engine → `public/field.wasm` |
| `npm run build` | Compile the wasm **and** bundle for production (`dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the engine + RLE tests (blinker, block, glider) |
| `npm run patterns` | Rebuild `public/patterns.json` from `data/rle/` |

</details>

## Under the hood

| Piece | What it's doing |
| --- | --- |
| **AssemblyScript** | The Game of Life rules, compiled to `field.wasm` — the only thing that computes generations |
| **SolidJS** | Fine-grained reactive UI — the dock, the modals, the counters |
| **Canvas 2D** | Draws the board every frame, with a birth pop and a death fade per cell |
| **Vite + Tailwind v4** | Build tooling and styling, themed by [Steep](https://getdesign.md) (light) and Airtable (dark) |
| **Vitest** | Proves the engine: a blinker oscillates, a block holds, a glider travels |

## Deploying

It's a static site — anything that serves files works. On Vercel: import the repo, set the **root directory** to `game_of_life_wasm`, and you're done. The build command (`npm run build`) already recompiles the wasm from source on every deploy, so a plain `git push` ships both engine and UI changes.

## Standing on shoulders

Inspired by [Edwin Martin's Game of Life](https://github.com/edwinm/game-of-life) — the lovely original at [playgameoflife.com](https://playgameoflife.com/) that started this whole thing. Thank you, Edwin.

And, of course, to John Conway, who half-invented this on a Go board with some friends in 1970 and then spent years mildly annoyed that it became the thing everyone wanted to talk about. The grid he left behind is still running, still surprising people.

> Go on — draw something and press play. See what it does without you.
