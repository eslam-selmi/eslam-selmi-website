import { useEffect, useRef, useState } from "react";
import { COUNTRIES } from "@/components/home/data";
import { useI18n } from "@/lib/i18n";
import { MAP_BOUNDS, MAP_CODES, MAP_ROWS } from "@/components/home/map-land";

// Country anchor points [lon, lat].
const POS: Record<string, [number, number]> = {
  ma: [-7.5, 31.5], dz: [2.6, 28.1], tn: [9.6, 34.1], eg: [29.9, 26.5], lb: [35.9, 33.9], ps: [35.2, 31.9],
  jo: [36.8, 31.2], sa: [44.7, 24.1], qa: [51.2, 25.3], ae: [54.3, 23.9], om: [56.1, 20.6],
};
// Reveal order: Saudi Arabia, then Egypt, then the rest. Flags appear one after another and stay, fluttering.
const REVEAL = ["sa", "eg", "jo", "ps", "lb", "tn", "dz", "ma", "om", "ae", "qa"];
const STEP = 0.85; // seconds between reveals
const IN = 0.8; // fade-in of one flag
const HOLD = 5.5; // all flags flutter together
const OUT = 1.1; // everything fades out together
const GAP = 0.7; // short empty beat, then the loop restarts
const KX = 0.9; // horizontal squeeze for the latitude band

const sm = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c); };

export function CountriesMap() {
  const { lang } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const reveal = useRef(REVEAL.filter((c) => COUNTRIES.some((x) => x.code === c))).current;
  // left-to-right slots follow geography so the tethers do not cross
  const slotOf = useRef(Object.fromEntries([...reveal].sort((a, b) => POS[a][0] - POS[b][0]).map((c, j) => [c, j]))).current;
  const [reduced, setReduced] = useState(false);
  const nameOf = (code: string) => COUNTRIES.find((c) => c.code === code)?.name[lang] ?? code;

  useEffect(() => { setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);

  useEffect(() => {
    const canvas = cv.current, box = wrap.current;
    if (!canvas || !box) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const n = reveal.length;
    const tOut = (n - 1) * STEP + IN + HOLD, total = tOut + OUT + GAP;
    const imgs = reveal.map((c) => { const im = new Image(); im.decoding = "async"; im.src = `https://flagcdn.com/${c}.svg`; return im; });
    const { lon0, lon1, lat0, lat1, step } = MAP_BOUNDS;
    const cellOf = reveal.map((c) => String.fromCharCode(97 + MAP_CODES.indexOf(c)));
    let W = 0, H = 0, mapH = 0, dpr = 1, raf = 0, visible = true, last = performance.now();
    let t = reduced ? tOut - 1 : 0;
    let ROOM = 110, FW = 60, FH = 40, NS = 13, ROWS = 2, RO = 22, EX = 0;

    const resize = () => {
      W = Math.max(260, Math.round(box.getBoundingClientRect().width));
      const narrow = W < 520; FW = Math.round(Math.max(40, Math.min(74, (W / n) * 2 * (narrow ? 0.88 : 0.56)))); FH = Math.round(FW * 0.68); NS = Math.round(Math.max(11, Math.min(15, W * 0.024)));
      RO = narrow ? FH + NS + 12 : Math.round(FH * 0.55); EX = narrow ? 0 : FH + 4; ROOM = 0;
      mapH = W * ((lat1 - lat0) / ((lon1 - lon0) * KX));
      H = Math.round(mapH + ROOM);
      dpr = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      box.style.height = `${H}px`;
    };
    const px = (lon: number, lat: number) => ({ x: ((lon - lon0) / (lon1 - lon0)) * W, y: ROOM + ((lat1 - lat) / (lat1 - lat0)) * mapH });

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
            const rv = reveal.map(() => 1);
      const cw = W / ((lon1 - lon0) / step), ch = mapH / ((lat1 - lat0) / step);
      const r0 = Math.max(0.8, Math.min(cw, ch) * 0.34);
      MAP_ROWS.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const k = row[c];
          if (k === ".") continue;
          const x = (c + 0.5) * cw, y = ROOM + (r + 0.5) * ch;
          const idx = k === "#" ? -1 : cellOf.indexOf(k);
          if (idx < 0) { ctx.fillStyle = "rgba(120, 220, 224, 0.2)"; ctx.beginPath(); ctx.arc(x, y, r0, 0, 7); ctx.fill(); continue; }
          const g = rv[idx];
          ctx.fillStyle = `rgba(${Math.round(94 + 80 * g)}, ${Math.round(220 + 20 * g)}, ${Math.round(214 + 20 * g)}, ${0.34 + 0.6 * g})`;
          ctx.beginPath(); ctx.arc(x, y, r0 * (1.05 + 0.45 * g), 0, 7); ctx.fill();
        }
      });
    };

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
      if (visible && !document.hidden) { t += dt; draw(); }
      raf = requestAnimationFrame(tick);
    };
    resize(); draw();
    const ro = new ResizeObserver(() => { resize(); draw(); }); ro.observe(box);
    const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; }, { rootMargin: "100px" }); io.observe(box);
    imgs.forEach((im) => im.addEventListener("load", draw));
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [reveal, slotOf, reduced, lang]);

  const order = ["eg", "sa", ...COUNTRIES.map((c) => c.code).filter((c) => c !== "eg" && c !== "sa")];
  return (
    <div className="world-globe">
      <div ref={wrap} className="world-map-stage" aria-hidden="true">
        <canvas ref={cv} />
      </div>
      <ul className="world-chips">
        {order.map((code) => {
          const c = COUNTRIES.find((x) => x.code === code);
          if (!c) return null;
          return (
            <li key={code} className="world-chip" data-lead={code === "eg" || code === "sa" ? "true" : undefined}>
              <img src={`https://flagcdn.com/${code}.svg`} alt="" width={22} height={22} loading="lazy" draggable={false} />
              <span>{c.name[lang]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
