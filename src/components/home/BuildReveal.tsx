import { useEffect, useRef, useState, type ReactNode } from "react";

type Bot = { name: string; c: string; a: string; b: string; d: string; box: [number, number, number, number]; delay: number };

// Each cursor flies in, visits a waypoint, then draws its own block (x%, y%, w%, h%).
const BOTS: Bot[] = [
  { name: "Design", c: "var(--build-c1)", a: "-8% 10%", b: "20% 40%", d: "12% 18%", box: [12, 18, 34, 22], delay: 0 },
  { name: "Copy", c: "var(--build-c2)", a: "108% 6%", b: "70% 30%", d: "56% 16%", box: [56, 16, 32, 10], delay: 0.08 },
  { name: "Layout", c: "var(--build-c3)", a: "50% 110%", b: "40% 70%", d: "10% 50%", box: [10, 50, 24, 30], delay: 0.16 },
  { name: "Grid", c: "var(--build-c4)", a: "108% 96%", b: "80% 60%", d: "38% 50%", box: [38, 50, 24, 30], delay: 0.05 },
  { name: "Media", c: "var(--build-c5)", a: "-8% 90%", b: "30% 80%", d: "66% 50%", box: [66, 50, 24, 30], delay: 0.22 },
  { name: "Type", c: "var(--build-c6)", a: "60% -10%", b: "50% 20%", d: "56% 30%", box: [56, 30, 22, 8], delay: 0.12 },
  { name: "QA", c: "var(--build-c2)", a: "-8% 50%", b: "60% 85%", d: "40% 86%", box: [40, 86, 20, 6], delay: 0.3 },
];

/** One-time "being built" sequence: several collaborating cursors draw the section's wireframe before it fills in. */
export function BuildReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "building" | "done">("idle");

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
        window.setTimeout(() => setState("done"), 2600);
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
            {BOTS.map((bot) => (
              <div
                key={bot.name}
                className="build-box"
                style={{
                  left: `${bot.box[0]}%`, top: `${bot.box[1]}%`, width: `${bot.box[2]}%`, height: `${bot.box[3]}%`,
                  "--c": bot.c, "--dl": `${bot.delay + 0.75}s`,
                } as React.CSSProperties}
              ><span>{bot.name.toLowerCase()}</span></div>
            ))}
            {BOTS.map((bot) => (
              <div
                key={bot.name}
                className="build-cursor"
                style={{ "--a": bot.a, "--b": bot.b, "--d": bot.d, "--c": bot.c, "--dl": `${bot.delay}s`,
                  "--e": `${bot.box[0] + bot.box[2]}% ${bot.box[1] + bot.box[3]}%` } as React.CSSProperties}
              >
                <span className="build-pointer">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="currentColor" stroke="white" strokeWidth="1.2" /></svg>
                  <b>{bot.name}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
