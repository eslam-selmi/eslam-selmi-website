import type { CSSProperties } from "react";
import { useBuildEffects } from "@/lib/build-effects";

/**
 * Background showpiece for the maintenance page: collaborating cursors
 * repeatedly trace a "site under construction" mark (frame, lens, wrench)
 * behind the card, each stroke glowing in a site color while it is drawn.
 */
const SQUARE =
  "M 96 40 H 424 Q 480 40 480 96 V 424 Q 480 480 424 480 H 96 Q 40 480 40 424 V 96 Q 40 40 96 40 Z";
const RING = "M 260 150 A 110 110 0 1 1 259.5 150 Z";
const WRENCH = "M 185 340 L 245 280 L 278 246 L 338 186";

const STROKES = [
  { d: SQUARE, c: "var(--accent)", dur: "8s", delay: "0s", label: "design", width: 2.5 },
  { d: RING, c: "var(--cover-silver)", dur: "10s", delay: "1.4s", label: "build", width: 2.5 },
  { d: WRENCH, c: "var(--lavender-soft)", dur: "7s", delay: "2.6s", label: "fix", width: 3.5 },
];

export function MaintenanceCanvas() {
  const { enabled } = useBuildEffects();
  if (!enabled) return null;
  return (
    <div aria-hidden className="maint-canvas">
      <div className="maint-stage">
        <svg width={520} height={520} viewBox="0 0 520 520" fill="none">
          {STROKES.map((s) => (
            <path
              key={s.label}
              d={s.d}
              pathLength={100}
              className="maint-path"
              style={{ "--c": s.c, "--dur": s.dur, "--dl": s.delay, strokeWidth: s.width } as CSSProperties}
            />
          ))}
        </svg>
        {STROKES.map((s) => (
          <div
            key={s.label}
            className="maint-cursor"
            style={{ "--c": s.c, "--dur": s.dur, "--dl": s.delay, "--op": `path("${s.d}")` } as CSSProperties}
          >
            <span className="build-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M3 2l7 19 2.5-7.5L20 11z" fill="currentColor" stroke="var(--cover-highlight)" strokeWidth="1.2" />
              </svg>
              <b>{s.label}</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
