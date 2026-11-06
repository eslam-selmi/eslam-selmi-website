import { useEffect, useRef, useState, type ReactNode } from "react";

const CURSORS = [
  { name: "Design", color: "var(--build-c1)", from: "-10% 20%", to: "18% 30%" },
  { name: "Copy", color: "var(--build-c2)", from: "110% 10%", to: "72% 22%" },
  { name: "Layout", color: "var(--build-c3)", from: "50% 120%", to: "46% 64%" },
  { name: "Review", color: "var(--build-c4)", from: "110% 90%", to: "82% 70%" },
];

/** Plays a one-time "being built" sequence (wireframe + collaborating cursors) as a section scrolls into view. */
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
        window.setTimeout(() => setState("done"), 1900);
      }
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="build-stage" data-build={state}>
      {children}
      {state === "building" && (
        <div className="build-overlay" aria-hidden="true">
          <div className="build-grid" />
          <div className="build-select"><span>section</span><i /><i /><i /><i /></div>
          {CURSORS.map((c) => (
            <div
              key={c.name}
              className="build-cursor"
              style={{ "--from": c.from, "--to": c.to, "--c": c.color } as React.CSSProperties}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="currentColor" /></svg>
              <b>{c.name}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
