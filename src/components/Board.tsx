import { onCleanup, onMount } from "solid-js";
import * as sim from "../sim";

export default function Board() {
  let canvas!: HTMLCanvasElement;
  onMount(() => sim.attach(canvas));
  onCleanup(() => sim.detach());
  return <canvas ref={canvas} class="fixed inset-0 block" style={{ "touch-action": "none" }} />;
}
