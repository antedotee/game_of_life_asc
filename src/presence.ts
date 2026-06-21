import { createEffect, createSignal, onCleanup, untrack } from "solid-js";

// Keeps an element mounted briefly after `open` flips to false, so it can play an exit transition.
// Solid's <Show> removes the DOM immediately; this bridges that gap.
export function createPresence(open: () => boolean, duration = 240) {
  const [present, setPresent] = createSignal(open());
  const [closing, setClosing] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  createEffect(() => {
    if (open()) {
      clearTimeout(timer);
      setClosing(false);
      setPresent(true);
    } else if (untrack(present)) {
      setClosing(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setPresent(false);
        setClosing(false);
      }, duration);
    }
  });

  onCleanup(() => clearTimeout(timer));
  return { present, closing };
}
