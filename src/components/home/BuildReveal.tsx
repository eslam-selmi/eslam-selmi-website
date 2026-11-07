import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Bot = { name: string; c: string; box: [number, number, number, number]; a: string; delay: number };

const C1 = "var(--build-c1)";
const C2 = "var(--build-c2)";
const C3 = "var(--build-c3)";
const C4 = "var(--build-c4)";
const C5 = "var(--build-c5)";
const C6 = "var(--build-c6)";

/**
 * Wireframe blocks per section type. Each cursor flies in, then traces the
 * perimeter of the block it "builds", so the movement mirrors the real layout:
 * card grids get cards, the brands strip gets logo chips, the banner gets a
 * headline and a button, and so on.
 */
const VARIANTS: Record<string, Bot[]> = {
  cards: [
    { name: "Title", c: C1, box: [6, 7, 38, 9], a: "-10% 8%", delay: 0 },
    { name: "Copy", c: C2, box: [6, 18, 24, 5], a: "110% 10%", delay: 0.1 },
    { name: "Card 1", c: C3, box: [6, 30, 26, 56], a: "-10% 90%", delay: 0.18 },
    { name: "Card 2", c: C5, box: [37, 30, 26, 56], a: "50% 112%", delay: 0.26 },
    { name: "Card 3", c: C4, box: [68, 30, 26, 56], a: "110% 85%", delay: 0.34 },
    { name: "Image", c: C6, box: [9, 33, 20, 20], a: "60% -10%", delay: 0.42 },
    { name: "Text", c: C2, box: [40, 62, 20, 4], a: "-10% 50%", delay: 0.5 },
  ],
  marquee: [
    { name: "Title", c: C1, box: [6, 14, 32, 8], a: "-10% 12%", delay: 0 },
    { name: "Strip", c: C5, box: [4, 38, 92, 26], a: "110% 50%", delay: 0.1 },
    { name: "Logo 1", c: C3, box: [8, 44, 14, 14], a: "-10% 90%", delay: 0.2 },
    { name: "Logo 2", c: C4, box: [26, 44, 14, 14], a: "30% 112%", delay: 0.28 },
    { name: "Logo 3", c: C6, box: [44, 44, 14, 14], a: "60% -10%", delay: 0.36 },
    { name: "Logo 4", c: C2, box: [62, 44, 14, 14], a: "110% 10%", delay: 0.44 },
    { name: "Logo 5", c: C3, box: [80, 44, 14, 14], a: "110% 90%", delay: 0.5 },
  ],
  atlas: [
    { name: "Panel", c: C1, box: [4, 8, 92, 84], a: "-10% 50%", delay: 0 },
    { name: "Pill", c: C4, box: [10, 14, 22, 7], a: "110% 10%", delay: 0.12 },
    { name: "Lead", c: C2, box: [10, 25, 46, 6], a: "-10% 20%", delay: 0.2 },
    { name: "Chip 1", c: C3, box: [10, 38, 20, 12], a: "20% 112%", delay: 0.28 },
    { name: "Chip 2", c: C5, box: [34, 38, 20, 12], a: "50% -10%", delay: 0.36 },
    { name: "Chip 3", c: C6, box: [58, 38, 20, 12], a: "110% 60%", delay: 0.44 },
    { name: "Chip 4", c: C4, box: [22, 56, 20, 12], a: "-10% 80%", delay: 0.5 },
  ],
  quotes: [
    { name: "Title", c: C1, box: [6, 8, 36, 9], a: "-10% 8%", delay: 0 },
    { name: "Stars", c: C4, box: [10, 24, 18, 5], a: "110% 15%", delay: 0.12 },
    { name: "Quote 1", c: C3, box: [8, 32, 40, 50], a: "-10% 90%", delay: 0.2 },
    { name: "Quote 2", c: C5, box: [54, 40, 40, 50], a: "110% 85%", delay: 0.3 },
    { name: "Copy", c: C2, box: [12, 40, 30, 4], a: "40% -10%", delay: 0.38 },
    { name: "Name", c: C6, box: [58, 78, 24, 5], a: "60% 112%", delay: 0.46 },
  ],
  banner: [
    { name: "Banner", c: C1, box: [6, 22, 88, 56], a: "-10% 50%", delay: 0 },
    { name: "Mark", c: C5, box: [74, 30, 14, 40], a: "110% 20%", delay: 0.15 },
    { name: "Headline", c: C3, box: [14, 36, 42, 10], a: "-10% 15%", delay: 0.25 },
    { name: "Copy", c: C2, box: [14, 50, 30, 5], a: "40% 112%", delay: 0.35 },
    { name: "Button", c: C4, box: [14, 60, 20, 10], a: "110% 90%", delay: 0.45 },
  ],
  timeline: [
    { name: "Title", c: C1, box: [6, 7, 34, 8], a: "-10% 8%", delay: 0 },
    { name: "Spine", c: C5, box: [49, 16, 2, 72], a: "50% -10%", delay: 0.12 },
    { name: "Step 1", c: C3, box: [12, 20, 30, 14], a: "-10% 25%", delay: 0.2 },
    { name: "Step 2", c: C4, box: [58, 40, 30, 14], a: "110% 45%", delay: 0.28 },
    { name: "Step 3", c: C2, box: [12, 60, 30, 14], a: "-10% 65%", delay: 0.36 },
    { name: "Check", c: C6, box: [58, 78, 30, 10], a: "110% 90%", delay: 0.44 },
  ],
  footer: [
    { name: "Brand", c: C1, box: [8, 18, 24, 46], a: "-10% 30%", delay: 0 },
    { name: "Links", c: C3, box: [38, 18, 20, 46], a: "45% -10%", delay: 0.12 },
    { name: "Contact", c: C5, box: [64, 18, 26, 46], a: "110% 40%", delay: 0.24 },
    { name: "Bar", c: C4, box: [8, 76, 82, 8], a: "50% 112%", delay: 0.36 },
    { name: "Social", c: C2, box: [68, 24, 18, 8], a: "110% 90%", delay: 0.46 },
  ],
};

/** Section id → wireframe layout. Anything unlisted uses the card grid. */
const SECTION_VARIANT: Record<string, string> = {
  brands: "marquee",
  clients: "atlas",
  testimonials: "quotes",
  "trainee-reviews": "quotes",
  book: "banner",
  pillars: "timeline",
  journey: "timeline",
  footer: "footer",
};

/** One-time "being built" sequence: collaborating cursors draw the section's own wireframe before it fills in. */
export function BuildReveal({ variant, children }: { variant?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "building" | "done">("idle");
  const bots = VARIANTS[SECTION_VARIANT[variant ?? ""] ?? "cards"] ?? VARIANTS.cards;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const skip =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) ||
      el.getBoundingClientRect().top < window.innerHeight * 0.6;
    if (skip) { setState("done"); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        io.disconnect();
        setState("building");
        window.setTimeout(() => setState("done"), 3200);
      }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="build-stage" data-build={state}>
      {children}
      {state === "building" && (
        <div className="build-overlay" aria-hidden="true">
          <div className="build-view">
            <div className="build-grid" />
            {bots.map((bot) => (
              <div
                key={bot.name}
                className="build-box"
                style={{
                  left: `${bot.box[0]}%`, top: `${bot.box[1]}%`, width: `${bot.box[2]}%`, height: `${bot.box[3]}%`,
                  "--c": bot.c, "--dl": `${bot.delay + 0.55}s`,
                } as CSSProperties}
              ><span>{bot.name.toLowerCase()}</span></div>
            ))}
            {bots.map((bot) => {
              const [x, y, w, h] = bot.box;
              return (
                <div
                  key={bot.name}
                  className="build-cursor"
                  style={{
                    "--a": bot.a, "--x": bot.a, "--c": bot.c, "--dl": `${bot.delay}s`,
                    "--p1": `${x}% ${y}%`, "--p2": `${x + w}% ${y}%`,
                    "--p3": `${x + w}% ${y + h}%`, "--p4": `${x}% ${y + h}%`,
                  } as CSSProperties}
                >
                  <span className="build-pointer">
                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="currentColor" stroke="white" strokeWidth="1.2" /></svg>
                    <b>{bot.name}</b>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
