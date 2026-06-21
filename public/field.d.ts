declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * assembly/field/clearField
   */
  export function clearField(): void;
  /**
   * assembly/field/setCell
   * @param x `i32`
   * @param y `i32`
   * @param alive `bool`
   */
  export function setCell(x: number, y: number, alive: boolean): void;
  /**
   * assembly/field/getCell
   * @param x `i32`
   * @param y `i32`
   * @returns `bool`
   */
  export function getCell(x: number, y: number): boolean;
  /**
   * assembly/field/population
   * @returns `i32`
   */
  export function population(): number;
  /**
   * assembly/field/step
   * @returns `i32`
   */
  export function step(): number;
  /**
   * assembly/field/cellsPtr
   * @returns `usize`
   */
  export function cellsPtr(): number;
  /**
   * assembly/field/cellsLen
   * @returns `i32`
   */
  export function cellsLen(): number;
  /**
   * assembly/field/randomize
   * @param x0 `i32`
   * @param y0 `i32`
   * @param x1 `i32`
   * @param y1 `i32`
   * @param density `f64`
   * @param seed `u32`
   */
  export function randomize(x0: number, y0: number, x1: number, y1: number, density: number, seed: number): void;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  env: unknown,
}): Promise<typeof __AdaptedExports>;
