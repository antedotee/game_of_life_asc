import { mergeProps } from "solid-js";

// SolidJS port of cult-ui's SquiggleArrow. Same props (variant / direction / size / strokeWidth).
// Inherits color from `currentColor`. Optional draw-on animation for the explanation diagrams.

type Variant = "wavy" | "bouncy" | "smooth";
type Direction = "right" | "left" | "up" | "down";

const DEG: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 };
// Gentle, legible squiggles — enough hand-drawn character to read as an arrow, not a scribble.
const SHAPE: Record<Variant, { amp: number; waves: number }> = {
  wavy: { amp: 0.1, waves: 1.5 },
  bouncy: { amp: 0.14, waves: 2 },
  smooth: { amp: 0.06, waves: 1 },
};

function wavePath(W: number, H: number, amp: number, waves: number) {
  const cy = H / 2;
  const left = H * 0.22;
  const right = W - H * 0.5;
  const span = right - left;
  const N = Math.max(14, waves * 9);
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push([left + span * t, cy + amp * Math.sin(t * Math.PI * 2 * waves)]);
  }
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  const ah = H * 0.24;
  d += ` M ${right.toFixed(2)} ${cy} L ${(right - ah).toFixed(2)} ${(cy - ah).toFixed(2)}`;
  d += ` M ${right.toFixed(2)} ${cy} L ${(right - ah).toFixed(2)} ${(cy + ah).toFixed(2)}`;
  return d;
}

export default function SquiggleArrow(props: {
  width?: number;
  height?: number;
  strokeWidth?: number;
  direction?: Direction;
  variant?: Variant;
  class?: string;
  animate?: boolean;
  delay?: number;
}) {
  const p = mergeProps(
    { width: 200, height: 100, strokeWidth: 2.5, direction: "right" as Direction, variant: "wavy" as Variant, animate: false, delay: 0 },
    props,
  );
  const shape = SHAPE[p.variant];
  const d = wavePath(p.width, p.height, p.height * shape.amp, shape.waves);
  return (
    <svg
      width={p.width}
      height={p.height}
      viewBox={`0 0 ${p.width} ${p.height}`}
      fill="none"
      class={p.class}
      style={{ overflow: "visible" }}
    >
      <g transform={`rotate(${DEG[p.direction]} ${p.width / 2} ${p.height / 2})`}>
        <path
          d={d}
          stroke="currentColor"
          stroke-width={p.strokeWidth}
          stroke-linecap="round"
          stroke-linejoin="round"
          class={p.animate ? "gol-draw" : undefined}
          style={p.animate ? { "animation-delay": `${p.delay}ms` } : undefined}
        />
      </g>
    </svg>
  );
}
