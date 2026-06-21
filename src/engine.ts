// Thin bridge over field.wasm (the AssemblyScript engine). No glue framework — we instantiate the
// raw module and read its linear memory directly.

type Exports = {
  memory: WebAssembly.Memory;
  clearField(): void;
  setCell(x: number, y: number, alive: number): void;
  getCell(x: number, y: number): number;
  population(): number;
  step(): number;
  cellsPtr(): number;
  cellsLen(): number;
  randomize(x0: number, y0: number, x1: number, y1: number, density: number, seed: number): void;
};

let ex: Exports;
let mem: WebAssembly.Memory;

export async function initEngine(): Promise<void> {
  const imports = {
    env: {
      abort(_msg: number, _file: number, line: number, col: number) {
        throw new Error(`field.wasm abort @ ${line}:${col}`);
      },
    },
  };
  const url = import.meta.env.BASE_URL + "field.wasm";
  const bytes = await (await fetch(url)).arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, imports as WebAssembly.Imports);
  ex = instance.exports as unknown as Exports;
  mem = ex.memory;
}

export const engine = {
  clear() {
    ex.clearField();
  },
  set(x: number, y: number, alive: boolean) {
    ex.setCell(x | 0, y | 0, alive ? 1 : 0);
  },
  get(x: number, y: number): boolean {
    return ex.getCell(x | 0, y | 0) !== 0;
  },
  step(): number {
    return ex.step();
  },
  population(): number {
    return ex.population();
  },
  // A fresh Int32Array view of the live cells as flat (x,y) pairs. Re-read every call: the buffer
  // pointer can move when the export array grows.
  cells(): Int32Array {
    const ptr = ex.cellsPtr();
    const len = ex.cellsLen();
    return new Int32Array(mem.buffer, ptr, len);
  },
  randomize(x0: number, y0: number, x1: number, y1: number, density: number, seed: number) {
    ex.randomize(x0 | 0, y0 | 0, x1 | 0, y1 | 0, density, seed >>> 0);
  },
};
