import { createMemo, createSignal, For, onMount } from "solid-js";
import * as S from "../store";
import type { Pattern } from "../types";

let cache: Pattern[] | null = null;

function thumb(canvas: HTMLCanvasElement, cells: [number, number][]) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width,
    H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!cells.length) return;
  let maxX = 0,
    maxY = 0;
  for (const [x, y] of cells) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const pad = 12;
  const s = Math.max(1.5, Math.min((W - 2 * pad) / (maxX + 1), (H - 2 * pad) / (maxY + 1), 11));
  const ox = (W - (maxX + 1) * s) / 2,
    oy = (H - (maxY + 1) * s) / 2;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5d2a1a";
  for (const [x, y] of cells) ctx.fillRect(ox + x * s, oy + y * s, Math.max(1, s - 1), Math.max(1, s - 1));
}

function Card(props: { p: Pattern; onPick: () => void; index: number }) {
  let cv!: HTMLCanvasElement;
  onMount(() => thumb(cv, props.p.cells));
  return (
    <button
      class="gol-stagger pressable text-left p-3"
      style={{
        background: "var(--surface-2)",
        "border-radius": "16px",
        "animation-delay": `${Math.min(props.index, 16) * 28}ms`,
      }}
      onClick={props.onPick}
    >
      <canvas
        ref={cv}
        width="220"
        height="130"
        class="w-full"
        style={{
          "border-radius": "12px",
          background: "var(--surface)",
          display: "block",
          "box-shadow": "0 0 0 1px var(--img-outline)",
        }}
      />
      <div class="mt-2 text-[15px]" style={{ color: "var(--text-1)", "font-weight": 480 }}>
        {props.p.name}
      </div>
      <div class="text-[13px] mt-0.5 line-clamp-2" style={{ color: "var(--text-3)" }}>
        {props.p.description}
      </div>
    </button>
  );
}

export default function Library(props: { closing?: boolean }) {
  const [items, setItems] = createSignal<Pattern[]>(cache ?? []);
  const [q, setQ] = createSignal("");
  const [cat, setCat] = createSignal("all");

  onMount(async () => {
    if (!cache) {
      try {
        cache = await (await fetch(import.meta.env.BASE_URL + "patterns.json")).json();
      } catch {
        cache = [];
      }
      setItems(cache!);
    }
  });

  const cats = createMemo(() => ["all", ...new Set(items().flatMap((p) => p.category))]);
  const filtered = createMemo(() => {
    const term = q().toLowerCase();
    return items().filter(
      (p) =>
        (cat() === "all" || p.category.includes(cat())) &&
        (term === "" || (p.name + " " + p.description).toLowerCase().includes(term)),
    );
  });

  const pick = (p: Pattern) => {
    S.setRunning(false); // board is read-only while playing — pause so the pattern can be placed
    S.setGhost(p.cells.map(([x, y]) => ({ x, y })));
    S.setLibraryOpen(false);
    S.flash(`Click to place “${p.name}”`);
  };

  return (
    <div
      class="gol-backdrop fixed inset-0 z-40 flex items-start justify-center p-4 sm:p-6"
      classList={{ closing: props.closing }}
      onClick={() => S.setLibraryOpen(false)}
    >
      <div
        class="gol-card w-full max-w-[1000px] mt-6 sm:mt-10 p-5 sm:p-6 flex flex-col"
        style={{ "border-radius": "24px", "max-height": "86vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between mb-4">
          <div
            style={{
              "font-family": '"Source Serif 4", Georgia, serif',
              "font-size": "40px",
              "line-height": 1.1,
              "letter-spacing": "-0.015em",
              color: "var(--text-1)",
              "text-wrap": "balance",
            }}
          >
            Pattern library
          </div>
          <button
            class="pressable w-10 h-10 flex items-center justify-center text-[18px]"
            style={{ "border-radius": "9999px", color: "var(--text-2)", background: "var(--surface-2)" }}
            aria-label="Close"
            onClick={() => S.setLibraryOpen(false)}
          >
            ✕
          </button>
        </div>

        <input
          placeholder="Search patterns…"
          value={q()}
          onInput={(e) => setQ(e.currentTarget.value)}
          class="w-full mb-4 text-[15px] outline-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--input-border)",
            "border-radius": "16px",
            padding: "12px 16px",
            color: "var(--text-1)",
          }}
        />

        <div class="flex gap-2 flex-wrap mb-4">
          <For each={cats()}>
            {(c) => (
              <button
                class="pressable text-[13px] px-3 py-1.5 capitalize transition-colors"
                style={{
                  "border-radius": "9999px",
                  background: cat() === c ? "var(--btn-bg)" : "var(--chip-bg)",
                  color: cat() === c ? "var(--btn-fg)" : "var(--text-2)",
                  "font-weight": 450,
                }}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            )}
          </For>
        </div>

        <div
          class="grid gap-4 overflow-auto pr-1"
          style={{ "grid-template-columns": "repeat(auto-fill, minmax(180px, 1fr))" }}
        >
          <For
            each={filtered()}
            fallback={
              <div class="text-[14px] py-8" style={{ color: "var(--text-3)" }}>
                No patterns match.
              </div>
            }
          >
            {(p, i) => <Card p={p} onPick={() => pick(p)} index={i()} />}
          </For>
        </div>
      </div>
    </div>
  );
}
