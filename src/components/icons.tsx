import type { JSX } from "solid-js";

// Minimal outline icon set. Stroke uses currentColor so icons inherit theme + magnify color.
type P = JSX.SvgSVGAttributes<SVGSVGElement>;

function Svg(props: P & { children: JSX.Element }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      {props.children}
    </svg>
  );
}

export const IconPlay = (p: P) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5z" />
  </Svg>
);
export const IconPause = (p: P) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <rect x="6.5" y="5.5" width="3.4" height="13" rx="1" />
    <rect x="14.1" y="5.5" width="3.4" height="13" rx="1" />
  </Svg>
);
export const IconStep = (p: P) => (
  <Svg {...p}>
    <path d="M7 5l9 7-9 7z" fill="currentColor" stroke="none" />
    <line x1="18" y1="5" x2="18" y2="19" />
  </Svg>
);
export const IconMinus = (p: P) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);
export const IconPlus = (p: P) => (
  <Svg {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);
export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7" />
  </Svg>
);
export const IconRandom = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconLibrary = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.4" />
    <rect x="13" y="4" width="7" height="7" rx="1.4" />
    <rect x="4" y="13" width="7" height="7" rx="1.4" />
    <rect x="13" y="13" width="7" height="7" rx="1.4" />
  </Svg>
);
export const IconInfo = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
  </Svg>
);
export const IconTarget = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    <line x1="12" y1="1.5" x2="12" y2="4.5" />
    <line x1="12" y1="19.5" x2="12" y2="22.5" />
    <line x1="1.5" y1="12" x2="4.5" y2="12" />
    <line x1="19.5" y1="12" x2="22.5" y2="12" />
  </Svg>
);
export const IconSun = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="5.1" y1="5.1" x2="6.8" y2="6.8" />
    <line x1="17.2" y1="17.2" x2="18.9" y2="18.9" />
    <line x1="18.9" y1="5.1" x2="17.2" y2="6.8" />
    <line x1="6.8" y1="17.2" x2="5.1" y2="18.9" />
  </Svg>
);
export const IconMoon = (p: P) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" fill="currentColor" stroke="none" />
  </Svg>
);
