import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

let ex: any;
let mem: WebAssembly.Memory;

beforeAll(async () => {
  const bytes = readFileSync(new URL("../public/field.wasm", import.meta.url));
  const imports = { env: { abort() { throw new Error("wasm abort"); } } };
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  ex = instance.exports;
  mem = ex.memory;
});

const set = (x: number, y: number) => ex.setCell(x, y, 1);
function cells(): [number, number][] {
  const ptr = ex.cellsPtr();
  const len = ex.cellsLen();
  const v = new Int32Array(mem.buffer, ptr, len);
  const out: [number, number][] = [];
  for (let i = 0; i < len; i += 2) out.push([v[i], v[i + 1]]);
  return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
const sorted = (c: [number, number][]) => [...c].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

describe("field engine (B3/S23)", () => {
  it("blinker oscillates with period 2", () => {
    ex.clearField();
    set(0, 0); set(1, 0); set(2, 0);
    ex.step();
    expect(cells()).toEqual([[1, -1], [1, 0], [1, 1]]);
    ex.step();
    expect(cells()).toEqual([[0, 0], [1, 0], [2, 0]]);
  });

  it("block is a still life", () => {
    ex.clearField();
    set(0, 0); set(1, 0); set(0, 1); set(1, 1);
    ex.step();
    expect(cells()).toEqual([[0, 0], [0, 1], [1, 0], [1, 1]]);
  });

  it("glider translates by (1,1) after 4 generations", () => {
    ex.clearField();
    for (const [x, y] of [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]) set(x, y);
    for (let i = 0; i < 4; i++) ex.step();
    expect(cells()).toEqual(sorted([[2, 1], [3, 2], [1, 3], [2, 3], [3, 3]]));
  });
});
