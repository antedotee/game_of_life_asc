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
export const SPEEDS = [1, 2, 4, 6, 9, 13, 18, 24, 30];
const [speedIndex, setSpeedIndex] = createSignal(2);
export { speedIndex };
export const speed = () => SPEEDS[speedIndex()];
export function speedUp() {
  setSpeedIndex((i) => Math.min(SPEEDS.length - 1, i + 1));
}
export function speedDown() {
  setSpeedIndex((i) => Math.max(0, i - 1));
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
