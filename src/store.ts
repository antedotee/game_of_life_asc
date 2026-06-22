import { createSignal } from "solid-js";
import type { Spore } from "./types";

export type Theme = "light" | "dark";

export const [running, setRunning] = createSignal(false);
export const [generation, setGeneration] = createSignal(0);
export const [population, setPopulation] = createSignal(0);

export const [ghost, setGhost] = createSignal<Spore[] | null>(null);
export const [libraryOpen, setLibraryOpen] = createSignal(false);
export const [infoOpen, setInfoOpen] = createSignal(false);
export const [toast, setToast] = createSignal("");

// Speed ladder in generations/second. Default ~4/s matches the original playgameoflife.com feel
// (its midpoint ≈ 293ms/gen). Capped at 30 — past that the cells live <33ms and there's nothing to see.
// Generations per second. Free value (the user can type any number); the −/+ buttons snap through
// these convenient rungs for quick coarse changes. 60 is the ceiling — that's one step per frame.
export const SPEEDS = [1, 2, 4, 6, 9, 13, 18, 24, 30, 45, 60, 120, 250, 500, 1000];
export const MIN_SPEED = 1;
export const MAX_SPEED = 1000;
const [speed, setSpeed] = createSignal(4);
export { speed };
export function setSpeedClamped(n: number) {
  if (!Number.isFinite(n)) return;
  setSpeed(Math.max(MIN_SPEED, Math.min(MAX_SPEED, Math.round(n))));
}
export function speedUp() {
  const cur = speed();
  setSpeedClamped(SPEEDS.find((v) => v > cur) ?? MAX_SPEED);
}
export function speedDown() {
  const cur = speed();
  setSpeedClamped([...SPEEDS].reverse().find((v) => v < cur) ?? MIN_SPEED);
}

// Camera is plain mutable state — the render loop reads it every frame, so it needs no reactivity.
export const camera = { x: 0, y: 0, scale: 16 };

// Theme: light = Steep, dark = Airtable.
function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}
const storedTheme = (localStorage.getItem("gol:theme") as Theme) || "light";
export const [theme, setTheme] = createSignal<Theme>(storedTheme);
applyTheme(storedTheme);
export function toggleTheme() {
  setTheme((t) => {
    const next: Theme = t === "light" ? "dark" : "light";
    localStorage.setItem("gol:theme", next);
    applyTheme(next);
    return next;
  });
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function flash(msg: string) {
  setToast(msg);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setToast(""), 1700);
}
