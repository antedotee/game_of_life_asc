// Cell color by age — the board is the one chromatic surface in the app.
// Light (Steep): warm rust → apricot → cool sky. Dark (Airtable): warm peach → mint → cool teal.
// Both are smooth multi-stop ramps so the "blooming → settling" read is legible without being loud.

import type { Theme } from "../store";

type Stop = [number, number, number];
const OLD = 30;

function lerp(a: Stop, b: Stop, t: number): Stop {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function ramp(stops: Stop[], steps: number): string[] {
  const out: string[] = [];
  const seg = stops.length - 1;
  for (let i = 0; i <= steps; i++) {
    const p = (i / steps) * seg;
    const idx = Math.min(Math.floor(p), seg - 1);
    const c = lerp(stops[idx], stops[idx + 1], p - idx);
    out.push(`rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`);
  }
  return out;
}

// rust → terracotta → warm → apricot → pale sky → sky
const LIGHT: Stop[] = [
  [93, 42, 26],
  [154, 74, 42],
  [207, 138, 94],
  [243, 200, 158],
  [188, 210, 241],
  [148, 182, 234],
];
// peach → soft amber → sage → mint → cool teal
const DARK: Stop[] = [
  [252, 171, 121],
  [244, 197, 150],
  [205, 217, 191],
  [168, 216, 196],
  [134, 192, 214],
];

export const palettes: Record<Theme, string[]> = {
  light: ramp(LIGHT, OLD),
  dark: ramp(DARK, OLD),
};

export const boardTokens: Record<Theme, { canvas: string; grid: string; glow: string; glow2: string }> = {
  light: {
    canvas: "#ffffff",
    grid: "rgba(163,166,175,0.26)",
    glow: "rgba(251,225,209,0.55)",
    glow2: "rgba(251,225,209,0)",
  },
  dark: {
    canvas: "#181d26",
    grid: "rgba(255,255,255,0.06)",
    glow: "rgba(252,171,121,0.14)",
    glow2: "rgba(252,171,121,0)",
  },
};

export function ageColor(theme: Theme, age: number): string {
  const p = palettes[theme];
  return p[age < 0 ? 0 : age > OLD ? OLD : age];
}
