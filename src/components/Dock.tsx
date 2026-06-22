import { type Component, createEffect, For, onCleanup, onMount } from "solid-js";
import { Dynamic } from "solid-js/web";
import * as S from "../store";
import * as sim from "../sim";
import {
  IconInfo,
  IconLibrary,
  IconMinus,
  IconMoon,
  IconPause,
  IconPencil,
  IconPlay,
  IconPlus,
  IconRandom,
  IconStep,
  IconSun,
  IconTarget,
  IconTrash,
} from "./icons";

// macOS-style magnifying dock (Magic UI behavior), ported to Solid. Magnification is a per-frame
// lerp toward a cursor-distance target — buttery, interruptible, no motion library needed.

// Two icons stacked, cross-faded (opacity + scale + blur) instead of an instant swap.
function IconSwap(props: { show: boolean; on: Component; off: Component }) {
  return (
    <span style={{ position: "relative", display: "block", width: "22px", height: "22px" }}>
      <span class="gol-iconswap" classList={{ on: props.show }}>
        <Dynamic component={props.on} />
      </span>
      <span class="gol-iconswap" classList={{ on: !props.show }}>
        <Dynamic component={props.off} />
      </span>
    </span>
  );
}
const PlayPause = () => <IconSwap show={S.running()} on={IconPause} off={IconPlay} />;
const ThemeIcon = () => <IconSwap show={S.theme() === "dark"} on={IconSun} off={IconMoon} />;

type Item = { icon: Component; label: () => string; onClick: () => void; primary?: boolean };

const ITEMS: Item[] = [
  { icon: PlayPause, label: () => (S.running() ? "Pause" : "Play"), onClick: () => sim.togglePlay(), primary: true },
  { icon: IconStep, label: () => "Step", onClick: () => sim.stepOnce() },
  { icon: IconMinus, label: () => "Slower", onClick: () => S.speedDown() },
  { icon: IconPlus, label: () => "Faster", onClick: () => S.speedUp() },
  { icon: IconRandom, label: () => "Random", onClick: () => sim.randomizeView() },
  { icon: IconTrash, label: () => "Clear", onClick: () => sim.clear() },
  { icon: IconLibrary, label: () => "Library", onClick: () => S.setLibraryOpen(true) },
  { icon: IconInfo, label: () => "About", onClick: () => S.setInfoOpen(true) },
  { icon: IconTarget, label: () => "Recenter", onClick: () => sim.recenter() },
  { icon: ThemeIcon, label: () => (S.theme() === "light" ? "Dark mode" : "Light mode"), onClick: () => S.toggleTheme() },
];

// Grow the gps input to fit however many digits it holds (+2px for the caret).
function sizeGps(el: HTMLInputElement) {
  el.style.width = `calc(${Math.max(1, el.value.length)}ch + 2px)`;
}

export default function Dock() {
  let dockEl!: HTMLDivElement;
  const refs: (HTMLButtonElement | undefined)[] = [];
  const mag: (HTMLElement | undefined)[] = []; // the icon wrappers that actually scale
  const scales: number[] = ITEMS.map(() => 1);
  let centers: number[] = [];
  let mouseX: number | null = null;
  let raf = 0;

  const measure = () => {
    if (!dockEl) return;
    const dr = dockEl.getBoundingClientRect();
    centers = refs.map((el) => (el ? dr.left + el.offsetLeft + el.offsetWidth / 2 : 0));
  };

  onMount(() => {
    requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    const loop = () => {
      for (let i = 0; i < refs.length; i++) {
        const el = refs[i];
        const m = mag[i];
        if (!el || !m) continue;
        let target = 1;
        if (mouseX != null && centers[i]) {
          const d = Math.abs(mouseX - centers[i]);
          const inf = 130;
          if (d < inf) target = 1 + 0.5 * Math.cos((d / inf) * (Math.PI / 2));
        }
        const cur = scales[i] + (target - scales[i]) * 0.22;
        scales[i] = cur;
        m.style.transform = `translateY(${(-(cur - 1) * 12).toFixed(2)}px) scale(${cur.toFixed(3)})`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
  onCleanup(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", measure);
  });

  // Keep the gps input in sync with the speed signal (e.g. when −/+ change it), but never fight
  // the user while they're typing into it.
  let gpsInput: HTMLInputElement | undefined;
  createEffect(() => {
    const s = S.speed();
    if (gpsInput && document.activeElement !== gpsInput) {
      gpsInput.value = String(s);
      sizeGps(gpsInput);
    }
  });

  return (
    <div class="fixed left-1/2 bottom-5 -translate-x-1/2 z-20 flex flex-col items-center gap-2 select-none">
      <div class="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-3)" }}>
        <label class="gol-gps-wrap" title={`Type a speed (${S.MIN_SPEED}–${S.MAX_SPEED})`}>
          <span class="gol-gps-pencil" aria-hidden="true">
            <IconPencil />
          </span>
          <input
            ref={gpsInput}
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            aria-label="Generations per second"
            class="gol-gps"
            onInput={(e) => {
              const el = e.currentTarget;
              el.value = el.value.replace(/[^0-9]/g, ""); // digits only
              sizeGps(el);
            }}
            onChange={(e) => {
              const el = e.currentTarget;
              S.setSpeedClamped(parseInt(el.value, 10)); // clamps to 1..MAX, ignores blanks
              el.value = String(S.speed()); // snap back to the value that took
              sizeGps(el);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </label>
        <span>generations / sec</span>
      </div>
      <div
        ref={dockEl}
        class="flex items-end gap-1.5 px-3 py-2"
        style={{
          background: "var(--elevated)",
          "border-radius": "24px",
          "box-shadow": "var(--card-shadow)",
          "max-width": "96vw",
        }}
        onPointerMove={(e) => (mouseX = e.clientX)}
        onPointerLeave={() => (mouseX = null)}
      >
        <For each={ITEMS}>
          {(item, i) => (
            <button
              ref={(el) => (refs[i()] = el)}
              class="group relative grid place-items-center pressable"
              style={{
                width: "46px",
                height: "46px",
                "transform-origin": "bottom center",
                "border-radius": "16px",
                background: item.primary ? "var(--btn-bg)" : "transparent",
                color: item.primary ? "var(--btn-fg)" : "var(--text-2)",
              }}
              aria-label={item.label()}
              onClick={item.onClick}
            >
              <span
                ref={(el) => (mag[i()] = el)}
                style={{ width: "22px", height: "22px", display: "block", "transform-origin": "bottom center" }}
              >
                <Dynamic component={item.icon} />
              </span>
              <span
                class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: "var(--text-1)", color: "var(--surface)", "border-radius": "8px" }}
              >
                {item.label()}
              </span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
