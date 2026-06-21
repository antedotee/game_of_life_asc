// Bloom — Game of Life engine (AssemblyScript).
// Sparse infinite plane, Conway B3/S23. Live cells are (i32 x, i32 y) packed into a u64 key.
// ponytail: hash-count over a live Set, O(population) per generation. Deliberately distinct from the
// gol C version's linear-scan push(). If a huge board ever stutters, the upgrade path is a tiled bitset.

let live = new Set<u64>();
let counts = new Map<u64, u32>();
let out = new Int32Array(2048); // flat (x,y) pairs exported to JS; grows as needed
let outLen: i32 = 0;

// @inline
function pack(x: i32, y: i32): u64 {
  return ((<u64>(<u32>x)) << 32) | (<u64>(<u32>y));
}
// @inline
function ux(k: u64): i32 { return <i32>(<u32>(k >>> 32)); }
// @inline
function uy(k: u64): i32 { return <i32>(<u32>(k & 0xffffffff)); }

export function clearField(): void {
  live.clear();
  outLen = 0;
}

export function setCell(x: i32, y: i32, alive: bool): void {
  const k = pack(x, y);
  if (alive) live.add(k); else live.delete(k);
}

export function getCell(x: i32, y: i32): bool {
  return live.has(pack(x, y));
}

export function population(): i32 { return live.size; }

// @inline
function bump(x: i32, y: i32): void {
  const k = pack(x, y);
  if (counts.has(k)) counts.set(k, counts.get(k) + 1);
  else counts.set(k, 1);
}

export function step(): i32 {
  counts.clear();
  const keys = live.values();
  const n = keys.length;
  for (let i = 0; i < n; i++) {
    const k = unchecked(keys[i]);
    const x = ux(k), y = uy(k);
    bump(x - 1, y - 1); bump(x, y - 1); bump(x + 1, y - 1);
    bump(x - 1, y);                     bump(x + 1, y);
    bump(x - 1, y + 1); bump(x, y + 1); bump(x + 1, y + 1);
  }
  const next = new Set<u64>();
  const ck = counts.keys();
  const cn = ck.length;
  for (let i = 0; i < cn; i++) {
    const k = unchecked(ck[i]);
    const c = counts.get(k);
    if (c == 3 || (c == 2 && live.has(k))) next.add(k);
  }
  live = next;
  return live.size;
}

// Serialize the live set into the export buffer and return a pointer to its data.
// JS reads cellsLen() i32s starting at this pointer as (x,y) pairs.
export function cellsPtr(): usize {
  const need = live.size * 2;
  if (out.length < need) {
    let cap = out.length;
    while (cap < need) cap = cap << 1;
    out = new Int32Array(cap);
  }
  const keys = live.values();
  const n = keys.length;
  let j = 0;
  for (let i = 0; i < n; i++) {
    const k = unchecked(keys[i]);
    unchecked(out[j++] = ux(k));
    unchecked(out[j++] = uy(k));
  }
  outLen = need;
  return out.dataStart;
}

export function cellsLen(): i32 { return outLen; }

// Deterministic xorshift32 — keeps the module free-standing (no env.seed / Math.random import).
let rng: u32 = 0x9e3779b9;
// @inline
function nextRand(): u32 {
  let x = rng;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  rng = x;
  return x;
}

export function randomize(x0: i32, y0: i32, x1: i32, y1: i32, density: f64, seed: u32): void {
  rng = seed == 0 ? 1 : seed;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if ((<f64>nextRand()) / 4294967296.0 < density) live.add(pack(x, y));
    }
  }
}
