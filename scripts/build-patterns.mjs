// Builds public/patterns.json: keeps the curated patterns, decodes the inline RLE additions from
// data/rle/, appends the on-demand (heavy) ones, and sorts everything by category.
// Run: node scripts/build-patterns.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;

function decode(str) {
  const lines = str.split(/\r?\n/).filter((l) => !l.trimStart().startsWith("#"));
  let body = "";
  for (const l of lines) {
    if (/^\s*x\s*=/.test(l)) continue;
    body += l;
  }
  body = body.replace(/\s+/g, "");
  const cells = [];
  let x = 0,
    y = 0,
    num = "";
  for (const ch of body) {
    if (ch >= "0" && ch <= "9") {
      num += ch;
      continue;
    }
    const n = num ? parseInt(num, 10) : 1;
    num = "";
    if (ch === "b") x += n;
    else if (ch === "o") for (let i = 0; i < n; i++) cells.push([x++, y]);
    else if (ch === "$") {
      y += n;
      x = 0;
    } else if (ch === "!") break;
  }
  let minX = Infinity,
    minY = Infinity;
  for (const [cx, cy] of cells) {
    if (cx < minX) minX = cx;
    if (cy < minY) minY = cy;
  }
  return cells.map(([cx, cy]) => [cx - minX, cy - minY]);
}

const INLINE = [
  { slug: "pentadecathlon", name: "Pentadecathlon", file: "pentadecathlon.rle", category: ["oscillator"], description: "Period-15 oscillator — ten cells in a row settle into this. The most natural oscillator with a period above three." },
  { slug: "queen-bee-shuttle", name: "Queen bee shuttle", file: "queenbeeshuttle.rle", category: ["oscillator"], description: "A period-30 shuttle: a queen bee glides out, two blocks turn her back, and the cycle repeats forever (Bill Gosper)." },
  { slug: "copperhead", name: "Copperhead", file: "copperhead.rle", category: ["spaceship"], description: "A small c/10 orthogonal spaceship, discovered in 2016." },
  { slug: "loafer", name: "Loafer", file: "loafer.rle", category: ["spaceship"], description: "A slow c/7 orthogonal spaceship that pushes a loaf ahead of it (Josh Ball, 2013)." },
  { slug: "garden-of-eden", name: "Garden of Eden 1", file: "gardenofeden1.rle", category: ["garden of eden"], description: "A configuration with no possible predecessor. Nothing in Life evolves into it, so it can only ever be a starting state (Roger Banks, 1971)." },
];

const ORDER = ["still-life", "oscillator", "spaceship", "gun", "methuselah", "garden of eden"];

const existing = JSON.parse(readFileSync(ROOT + "public/patterns.json", "utf8"));
const newSlugs = new Set(INLINE.map((p) => p.slug));
const base = existing.filter((p) => !newSlugs.has(p.slug) && !p.src);

const inlineEntries = INLINE.map((p) => ({
  slug: p.slug,
  name: p.name,
  category: p.category,
  description: p.description,
  cells: decode(readFileSync(ROOT + "data/rle/" + p.file, "utf8")),
}));

const all = [...base, ...inlineEntries];
const sorted = all
  .map((p, i) => ({ p, i }))
  .sort((a, b) => (ORDER.indexOf(a.p.category[0]) - ORDER.indexOf(b.p.category[0])) || a.i - b.i)
  .map((x) => x.p);

const out = "[\n" + sorted.map((p) => "  " + JSON.stringify(p)).join(",\n") + "\n]\n";
writeFileSync(ROOT + "public/patterns.json", out);
console.log(`Wrote ${sorted.length} patterns (${inlineEntries.reduce((n, p) => n + p.cells.length, 0)} inline cells).`);
