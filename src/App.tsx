import { createSignal, onMount, Show } from "solid-js";
import Board from "./components/Board";
import Dock from "./components/Dock";
import Library from "./components/Library";
import Info from "./components/Info";
import * as S from "./store";
import { initEngine } from "./engine";

function Wordmark() {
  return (
    <div
      class="fixed top-5 left-6 z-20 select-none"
      style={{ color: "var(--text-1)", "font-size": "20px", "font-weight": 500, "letter-spacing": "-0.01em" }}
    >
      GOL
    </div>
  );
}

function Counters() {
  return (
    <div class="fixed top-4 right-6 z-20 flex gap-8 text-right select-none">
      <div>
        <div class="text-[13px]" style={{ color: "var(--text-3)" }}>
          generation
        </div>
        <div class="text-[22px] tabular-nums" style={{ color: "var(--text-1)", "font-weight": 480 }}>
          {S.generation().toLocaleString()}
        </div>
      </div>
      <div>
        <div class="text-[13px]" style={{ color: "var(--text-3)" }}>
          population
        </div>
        <div class="text-[22px] tabular-nums" style={{ color: "var(--text-1)", "font-weight": 480 }}>
          {S.population().toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function Toast() {
  return (
    <Show when={S.toast()}>
      <div
        class="gol-toast fixed left-1/2 -translate-x-1/2 bottom-28 z-30 text-[14px] px-4 py-2"
        style={{ background: "var(--text-1)", color: "var(--surface)", "border-radius": "9999px", "font-weight": 450 }}
      >
        {S.toast()}
      </div>
    </Show>
  );
}

function Splash() {
  return (
    <div class="fixed inset-0 flex items-center justify-center" style={{ background: "var(--surface)" }}>
      <div
        style={{
          "font-family": '"Source Serif 4", Georgia, serif',
          "font-size": "64px",
          "letter-spacing": "-0.025em",
          color: "var(--text-1)",
          opacity: 0.9,
        }}
      >
        Game of Life
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = createSignal(false);
  onMount(async () => {
    await initEngine();
    setReady(true);
  });

  return (
    <Show when={ready()} fallback={<Splash />}>
      <Board />
      <Wordmark />
      <Counters />
      <Dock />
      <Toast />
      <Show when={S.libraryOpen()}>
        <Library />
      </Show>
      <Show when={S.infoOpen()}>
        <Info />
      </Show>
    </Show>
  );
}
