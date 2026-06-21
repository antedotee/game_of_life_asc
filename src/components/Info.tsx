import { For } from "solid-js";
import * as S from "../store";
import SquiggleArrow from "./SquiggleArrow";

// Humanized copy (researched + written by a sub-agent applying humanize-writing principles).
const EXPLANATION = `
<h3>So, what even is this thing?</h3>
<p>Welcome. What you're looking at is Conway's Game of Life, and the first thing to know is that it isn't really a game. There's no winning, no score, nobody to play against. A mathematician named John Conway cooked it up in 1970, and it spread to the world through Martin Gardner's column in <em>Scientific American</em> that October.</p>
<p>The whole universe is a grid of squares. Each square is either alive or dead. You set up a starting pattern, press go, and then the grid updates itself over and over by four tiny rules. That's it. You're not steering anything. You're just watching what those rules decide to do.</p>

<h3>Four rules, and not one more</h3>
<p>Every cell looks at its eight neighbours and asks a very small question: am I too lonely, too crowded, or just right?</p>
<p>A living cell with two or three neighbours is comfortable, so it stays alive. Fewer than two and it dies of loneliness. More than three and it dies of overcrowding, smothered by its own friends. And an empty square with <strong>exactly</strong> three neighbours springs to life, as if three was the magic number for getting something started.</p>
<p>Read them again and notice how dumb they are. No memory, no plan, no sense of the bigger picture. Each cell only knows its own little neighbourhood. Somehow that's enough.</p>

<h3>Why I can't stop watching</h3>
<p>Here's where it gets strange. Out of those four boring rules, <em>things</em> start to appear. Little shapes that hold together. Blinkers that flip back and forth forever. And gliders, my favourite: a five-cell arrowhead that crawls diagonally across the grid, frame by frame, like it's actually going somewhere.</p>
<p>Nobody designed the glider. It was discovered, the way you discover a beetle under a rock. In 1970 a hacker named Bill Gosper found something wilder still, a "glider gun" that sits there spitting out a fresh glider every thirty steps, on and on. Conway had bet fifty dollars that nothing in Life could grow forever. Gosper won the fifty.</p>
<p>The honest word for what you feel watching this is <strong>aliveness</strong>. You know it's just bits flipping on a grid. Your brain refuses to believe it anyway. People have lost whole evenings to it, and there's a forum at conwaylife.com where folks still hunt for new creatures decades later, naming them like they're cataloguing wildlife. Pufferfish. Spaceships. Rakes. The Gemini.</p>

<h3>Okay, now the part that breaks your brain</h3>
<p>Because gliders can carry information and crash into each other in predictable ways, you can use them as wires and logic gates. And once you have logic gates, you can build, well, anything a computer can do.</p>
<p>I mean that literally. People have built working computers inside the Game of Life. There's a pattern that runs Tetris. There's a version of Life running <em>inside</em> Life. The grid of dumb cells is Turing-complete, which is the same fancy stamp your laptop carries. Four rules about lonely squares, and you get a machine that can, in principle, compute the same things any machine can. Sit with that for a second.</p>

<h3>A word about the man who made it</h3>
<p>John Conway had a complicated thing with all of this. He was a serious, dazzling mathematician with deep work to his name, the surreal numbers, the Monster group, knot theory. And Life, this little doodle he'd half-invented on a Go board with a friend, became the thing everyone wanted to talk about. He found that annoying. For years he'd groan a bit when people brought it up, wishing they'd ask about the maths he was actually proud of.</p>
<p>He came around to it eventually. The Game of Life made his name travel further than any theorem could, and it pulled a lot of people into mathematics who never thought they'd care. Conway died on 11 April 2020, of COVID-19, early in the pandemic. The grid he left behind is still running, still surprising people. Go on, draw something and press play. See what it does without you.</p>
`;

type Rule = {
  caption: string;
  before: [number, number][];
  after: [number, number][];
  variant: "wavy" | "bouncy" | "smooth";
};

const RULES: Rule[] = [
  { caption: "Fewer than 2 — dies of loneliness", before: [[1, 1], [1, 0]], after: [], variant: "wavy" },
  { caption: "2 or 3 — lives on", before: [[1, 1], [1, 0], [1, 2]], after: [[1, 1]], variant: "smooth" },
  { caption: "More than 3 — dies of crowding", before: [[1, 1], [0, 0], [2, 0], [0, 2], [2, 2]], after: [], variant: "bouncy" },
  { caption: "Empty + exactly 3 — a cell is born", before: [[1, 0], [0, 1], [2, 1]], after: [[1, 1]], variant: "wavy" },
];

function MiniGrid(props: { live: [number, number][] }) {
  const cell = 18;
  const gap = 4;
  const dim = 3 * cell + 2 * gap;
  const has = (x: number, y: number) => props.live.some(([a, b]) => a === x && b === y);
  const coords = [0, 1, 2];
  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} style={{ display: "block", "flex-shrink": 0 }}>
      <For each={coords}>
        {(y) => (
          <For each={coords}>
            {(x) => (
              <rect
                x={x * (cell + gap)}
                y={y * (cell + gap)}
                width={cell}
                height={cell}
                rx="4"
                fill={has(x, y) ? "var(--accent)" : "var(--chip-bg)"}
                stroke={has(x, y) ? "transparent" : "var(--hairline)"}
                stroke-width="1"
              />
            )}
          </For>
        )}
      </For>
    </svg>
  );
}

function RuleCard(props: { rule: Rule; index: number }) {
  return (
    <div
      class="gol-stagger flex flex-col items-center gap-3 p-4"
      style={{ background: "var(--surface-2)", "border-radius": "16px", "animation-delay": `${props.index * 60}ms` }}
    >
      <div class="flex items-center gap-1" style={{ color: "var(--accent)" }}>
        <MiniGrid live={props.rule.before} />
        <SquiggleArrow
          width={64}
          height={40}
          strokeWidth={2.5}
          variant={props.rule.variant}
          animate
          delay={200 + props.index * 80}
        />
        <MiniGrid live={props.rule.after} />
      </div>
      <div class="text-[13px] text-center" style={{ color: "var(--text-2)", "text-wrap": "balance" }}>
        {props.rule.caption}
      </div>
    </div>
  );
}

export default function Info(props: { closing?: boolean }) {
  return (
    <div
      class="gol-backdrop fixed inset-0 z-40 flex items-start justify-center p-4 sm:p-6 overflow-auto"
      classList={{ closing: props.closing }}
      onClick={() => S.setInfoOpen(false)}
    >
      <div
        class="gol-card w-full max-w-[760px] my-6 p-6 sm:p-8"
        style={{ "border-radius": "24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-start justify-between mb-6">
          <div
            style={{
              "font-family": '"Source Serif 4", Georgia, serif',
              "font-size": "44px",
              "line-height": 1.05,
              "letter-spacing": "-0.02em",
              color: "var(--text-1)",
              "text-wrap": "balance",
            }}
          >
            The Game of Life
          </div>
          <button
            class="pressable w-10 h-10 flex items-center justify-center text-[18px] shrink-0"
            style={{ "border-radius": "9999px", color: "var(--text-2)", background: "var(--surface-2)" }}
            aria-label="Close"
            onClick={() => S.setInfoOpen(false)}
          >
            ✕
          </button>
        </div>

        <div class="grid gap-3 mb-8" style={{ "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <For each={RULES}>{(rule, i) => <RuleCard rule={rule} index={i()} />}</For>
        </div>

        <div class="gol-prose" innerHTML={EXPLANATION} />

        <div
          class="mt-8 pt-5 text-[14px]"
          style={{ "border-top": "1px solid var(--hairline)", color: "var(--text-3)", "line-height": 1.6 }}
        >
          A fresh AssemblyScript + SolidJS rebuild, inspired by{" "}
          <a
            href="https://github.com/edwinm/game-of-life"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", "text-decoration": "underline", "text-underline-offset": "3px" }}
          >
            Edwin Martin's Game of Life
          </a>
          . Thank you, Edwin.
        </div>
      </div>
    </div>
  );
}
