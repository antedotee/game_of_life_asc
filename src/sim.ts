// Bloom's imperative core: owns the canvas, render loop, input handling, cell ages, and the actions
// the chrome calls. Keeps all the non-reactive machinery out of the Solid components.

import { batch } from "solid-js";
import { engine } from "./engine";
import { ageColor, boardTokens } from "./render/color";
import * as S from "./store";

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let w = 0,
  h = 0,
  dpr = 1;
const cam = S.camera;

// ponytail: ages/bornAt keyed by "x,y" strings — simplest correct option across the full i32 range.
let ages = new Map<string, number>();
let bornAt = new Map<string, number>();
let dying = new Map<string, { x: number; y: number; age: number; at: number }>();
let raf = 0;
let lastFrame = 0;
let acc = 0; // accumulated fractional generations to run this frame

const hover = { x: 0, y: 0, inside: false };
let lastCursor = "";

// input state
let spaceDown = false,
  pannedWhileSpace = false,
  panning = false,
  drawing = false,
  drawAdd = true;
let lastPx = 0,
  lastPy = 0,
  lastCX = 0,
  lastCY = 0;
let touchMode: "" | "draw" | "pan" | "gesture" = "";
let tMidX = 0,
  tMidY = 0,
  tDist = 0;

const K = (x: number, y: number) => x + "," + y;
const s2c = (px: number, py: number) => ({
  x: Math.floor((px - cam.x) / cam.scale),
  y: Math.floor((py - cam.y) / cam.scale),
});

export function attach(c: HTMLCanvasElement) {
  canvas = c;
  ctx = c.getContext("2d", { alpha: false })!;
  resize();
  recenter();

  window.addEventListener("resize", resize);
  canvas.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKeyUp);

  raf = requestAnimationFrame(frame);
}

export function detach() {
  cancelAnimationFrame(raf);
  window.removeEventListener("resize", resize);
  window.removeEventListener("mousemove", onMove);
  window.removeEventListener("mouseup", onUp);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("keyup", onKeyUp);
}

function resize() {
  dpr = window.devicePixelRatio || 1;
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// --- generation / state bookkeeping ------------------------------------------------------------

function afterChange(stepped: boolean) {
  const v = engine.cells();
  const now = performance.now();
  const animate = S.speed() < 15;
  const next = new Map<string, number>();
  for (let i = 0; i < v.length; i += 2) {
    const k = K(v[i], v[i + 1]);
    const age = stepped ? (ages.has(k) ? ages.get(k)! + 1 : 0) : (ages.get(k) ?? 0);
    next.set(k, age);
    if (!bornAt.has(k)) {
      bornAt.set(k, now);
      if (dying.size) dying.delete(k); // reborn — cancel any pending death fade
    }
  }
  for (const k of bornAt.keys()) {
    if (!next.has(k)) {
      // ponytail: cap the exit-animation set so a massive die-off can't stall the frame.
      if (animate && dying.size < 6000) {
        const c = k.indexOf(",");
        dying.set(k, { x: +k.slice(0, c), y: +k.slice(c + 1), age: ages.get(k) ?? 0, at: now });
      }
      bornAt.delete(k);
    }
  }
  ages = next;
  S.setPopulation(v.length / 2);
}

function doStep() {
  engine.step();
  S.setGeneration((g) => g + 1);
  afterChange(true);
}

// --- render loop -------------------------------------------------------------------------------

function frame(now: number) {
  const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0; // clamp so a stalled tab can't queue thousands
  lastFrame = now;
  if (S.running() && !S.ghost()) {
    acc += dt * S.speed();
    if (acc >= 1) {
      let budget = 60; // cap steps per frame so a high speed can't freeze the tab
      batch(() => {
        while (acc >= 1 && budget > 0) {
          doStep();
          acc -= 1;
          budget--;
        }
      });
      if (budget === 0) acc = 0; // hit the cap — drop the backlog rather than spiral
    }
  } else {
    acc = 0;
  }
  draw(now);
  raf = requestAnimationFrame(frame);
}

// emil-kow: strong ease-out + a gentle overshoot, so cells bloom into life rather than blink on.
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.3;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const BIRTH_MS = 180;
const DEATH_MS = 220;
const BIRTH_SCALE = 0.62; // start visibly smaller (never scale 0) + opacity fade
const DEATH_SCALE = 0.5;

function paintCell(sx: number, sy: number, sz: number) {
  if (sz < 3 || !ctx.roundRect) {
    ctx.fillRect(sx, sy, sz, sz);
    return;
  }
  ctx.beginPath();
  ctx.roundRect(sx, sy, sz, sz, Math.min(2, sz / 4));
  ctx.fill();
}

// One cell with opacity + a scale about its centre (used for birth / death transitions).
function cellAt(cx: number, cy: number, color: string, alpha: number, scale: number) {
  const sz = cam.scale;
  const bx = cx * sz + cam.x;
  const by = cy * sz + cam.y;
  if (bx > w || by > h || bx + sz < 0 || by + sz < 0) return;
  const gap = sz > 4 ? 1 : 0;
  const inner = sz - gap;
  const drawn = inner * scale;
  const off = gap * 0.5 + (inner - drawn) / 2;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  paintCell(bx + off, by + off, drawn);
}

function draw(now: number) {
  const theme = S.theme();
  const t = boardTokens[theme];

  ctx.fillStyle = t.canvas;
  ctx.fillRect(0, 0, w, h);

  if (S.population() === 0) {
    const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.45);
    g.addColorStop(0, t.glow);
    g.addColorStop(1, t.glow2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  if (cam.scale > 6) {
    ctx.strokeStyle = t.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const x0 = Math.floor(-cam.x / cam.scale);
    const x1 = Math.ceil((w - cam.x) / cam.scale);
    for (let cx = x0; cx <= x1; cx++) {
      const sx = Math.round(cx * cam.scale + cam.x) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    const y0 = Math.floor(-cam.y / cam.scale);
    const y1 = Math.ceil((h - cam.y) / cam.scale);
    for (let cy = y0; cy <= y1; cy++) {
      const sy = Math.round(cy * cam.scale + cam.y) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();
  }

  const v = engine.cells();
  const fade = S.speed() < 15; // birth/death animation only when slow enough to see it

  // exit: cells that just died fade + shrink out, drawn under the live layer
  if (fade) {
    for (const [k, d] of dying) {
      const t = (now - d.at) / DEATH_MS;
      if (t >= 1) {
        dying.delete(k);
        continue;
      }
      const e = easeOutCubic(t);
      cellAt(d.x, d.y, ageColor(theme, d.age), 1 - e, 1 - (1 - DEATH_SCALE) * e);
    }
  } else if (dying.size) {
    dying.clear();
  }

  // live cells, with a birth pop (scale + opacity) for the freshly born
  for (let i = 0; i < v.length; i += 2) {
    const cx = v[i],
      cy = v[i + 1];
    const k = K(cx, cy);
    let alpha = 1;
    let scale = 1;
    if (fade) {
      const b = bornAt.get(k);
      if (b !== undefined) {
        const t = (now - b) / BIRTH_MS;
        if (t < 1) {
          const tc = t < 0 ? 0 : t;
          alpha = easeOutCubic(tc);
          scale = BIRTH_SCALE + (1 - BIRTH_SCALE) * easeOutBack(tc);
        }
      }
    }
    cellAt(cx, cy, ageColor(theme, ages.get(k) ?? 0), alpha, scale);
  }
  ctx.globalAlpha = 1;

  const gh = S.ghost();
  if (gh && hover.inside) {
    for (const s of gh) cellAt(hover.x + s.x, hover.y + s.y, ageColor(theme, 0), 0.4, 1);
    ctx.globalAlpha = 1;
  }

  // cursor reflects the board's current mode
  const want = gh ? "copy" : panning ? "grabbing" : spaceDown || S.running() ? "grab" : "crosshair";
  if (want !== lastCursor) {
    canvas.style.cursor = want;
    lastCursor = want;
  }
}

// --- mouse -------------------------------------------------------------------------------------

function rel(e: MouseEvent) {
  const r = canvas.getBoundingClientRect();
  return { px: e.clientX - r.left, py: e.clientY - r.top };
}

function startPan(px: number, py: number) {
  panning = true;
  pannedWhileSpace = true;
  lastPx = px;
  lastPy = py;
}

function onDown(e: MouseEvent) {
  const { px, py } = rel(e);
  if (S.ghost()) {
    stampGhostAt(px, py);
    return;
  }
  if (spaceDown || e.button === 1) {
    startPan(px, py);
    e.preventDefault();
    return;
  }
  if (e.button !== 0) return;
  // While playing the board is read-only: left-drag pans, nothing gets marked.
  if (S.running()) {
    startPan(px, py);
    return;
  }
  const c = s2c(px, py);
  drawAdd = !engine.get(c.x, c.y);
  engine.set(c.x, c.y, drawAdd);
  lastCX = c.x;
  lastCY = c.y;
  drawing = true;
  afterChange(false);
}

function onMove(e: MouseEvent) {
  const { px, py } = rel(e);
  const c = s2c(px, py);
  hover.x = c.x;
  hover.y = c.y;
  hover.inside = px >= 0 && py >= 0 && px <= w && py <= h;
  if (panning) {
    cam.x += px - lastPx;
    cam.y += py - lastPy;
    lastPx = px;
    lastPy = py;
    return;
  }
  if (drawing) {
    line(lastCX, lastCY, c.x, c.y, (x, y) => engine.set(x, y, drawAdd));
    lastCX = c.x;
    lastCY = c.y;
    afterChange(false);
  }
}

function onUp() {
  drawing = false;
  panning = false;
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const { px, py } = rel(e);
  zoomAt(px, py, e.deltaY < 0 ? 1.12 : 1 / 1.12);
}

function zoomAt(px: number, py: number, f: number) {
  const wx = (px - cam.x) / cam.scale;
  const wy = (py - cam.y) / cam.scale;
  cam.scale = Math.max(0.5, Math.min(48, cam.scale * f)); // 0.5 floor so huge patterns fit
  cam.x = px - wx * cam.scale;
  cam.y = py - wy * cam.scale;
}

function stampGhostAt(px: number, py: number) {
  const c = s2c(px, py);
  for (const s of S.ghost()!) engine.set(c.x + s.x, c.y + s.y, true);
  afterChange(false);
  S.setGhost(null);
}

function line(x0: number, y0: number, x1: number, y1: number, plot: (x: number, y: number) => void) {
  const dx = Math.abs(x1 - x0),
    dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1,
    sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    plot(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// --- touch -------------------------------------------------------------------------------------

function tRel(t: Touch) {
  const r = canvas.getBoundingClientRect();
  return { px: t.clientX - r.left, py: t.clientY - r.top };
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    const { px, py } = tRel(e.touches[0]);
    if (S.ghost()) {
      stampGhostAt(px, py);
      e.preventDefault();
      return;
    }
    if (S.running()) {
      touchMode = "pan";
      lastPx = px;
      lastPy = py;
      e.preventDefault();
      return;
    }
    touchMode = "draw";
    const c = s2c(px, py);
    drawAdd = !engine.get(c.x, c.y);
    engine.set(c.x, c.y, drawAdd);
    lastCX = c.x;
    lastCY = c.y;
    afterChange(false);
  } else if (e.touches.length === 2) {
    touchMode = "gesture";
    const a = tRel(e.touches[0]),
      b = tRel(e.touches[1]);
    tMidX = (a.px + b.px) / 2;
    tMidY = (a.py + b.py) / 2;
    tDist = Math.hypot(a.px - b.px, a.py - b.py);
  }
  e.preventDefault();
}

function onTouchMove(e: TouchEvent) {
  if (touchMode === "draw" && e.touches.length === 1) {
    const { px, py } = tRel(e.touches[0]);
    const c = s2c(px, py);
    hover.x = c.x;
    hover.y = c.y;
    hover.inside = true;
    line(lastCX, lastCY, c.x, c.y, (x, y) => engine.set(x, y, drawAdd));
    lastCX = c.x;
    lastCY = c.y;
    afterChange(false);
  } else if (touchMode === "pan" && e.touches.length === 1) {
    const { px, py } = tRel(e.touches[0]);
    cam.x += px - lastPx;
    cam.y += py - lastPy;
    lastPx = px;
    lastPy = py;
  } else if (touchMode === "gesture" && e.touches.length === 2) {
    const a = tRel(e.touches[0]),
      b = tRel(e.touches[1]);
    const mx = (a.px + b.px) / 2,
      my = (a.py + b.py) / 2,
      d = Math.hypot(a.px - b.px, a.py - b.py);
    cam.x += mx - tMidX;
    cam.y += my - tMidY;
    if (tDist > 0) zoomAt(mx, my, d / tDist);
    tMidX = mx;
    tMidY = my;
    tDist = d;
  }
  e.preventDefault();
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length === 0) touchMode = "";
}

// --- keyboard ----------------------------------------------------------------------------------

function typing(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
}

function onKey(e: KeyboardEvent) {
  if (typing(e)) return;
  if (e.code === "Space") {
    if (!spaceDown) {
      spaceDown = true;
      pannedWhileSpace = false;
    }
    e.preventDefault();
    return;
  }
  if (e.key === "ArrowRight") {
    doStep();
    e.preventDefault();
  } else if (e.key === "c" || e.key === "C") {
    clear();
  } else if (e.key === "r" || e.key === "R") {
    randomizeView();
  } else if (e.key === "/") {
    S.setLibraryOpen(true);
    e.preventDefault();
  } else if (e.key === "+" || e.key === "=") {
    S.speedUp();
  } else if (e.key === "-" || e.key === "_") {
    S.speedDown();
  } else if (e.key === "Home") {
    recenter();
  } else if (e.key === "Escape") {
    S.setGhost(null);
    S.setLibraryOpen(false);
    S.setInfoOpen(false);
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.code === "Space") {
    spaceDown = false;
    if (!pannedWhileSpace && !typing(e)) S.setRunning((r) => !r);
  }
}

// --- actions (called by the chrome) ------------------------------------------------------------

export function togglePlay() {
  S.setRunning((r) => !r);
}

export function stepOnce() {
  S.setRunning(false);
  doStep();
}

export function clear() {
  engine.clear();
  ages.clear();
  bornAt.clear();
  dying.clear();
  S.setRunning(false);
  S.setGeneration(0);
  S.setPopulation(0);
}

export function recenter() {
  cam.x = w / 2;
  cam.y = h / 2;
  cam.scale = 16;
}

export function randomizeView() {
  const x0 = Math.floor(-cam.x / cam.scale),
    y0 = Math.floor(-cam.y / cam.scale);
  const x1 = Math.ceil((w - cam.x) / cam.scale),
    y1 = Math.ceil((h - cam.y) / cam.scale);
  engine.randomize(x0, y0, x1, y1, 0.32, (Math.random() * 0xffffffff) >>> 0);
  S.setGeneration(0);
  afterChange(false);
}
