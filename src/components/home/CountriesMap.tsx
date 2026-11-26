import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { COUNTRIES } from "@/components/home/data";
import { useI18n } from "@/lib/i18n";
import { OUTLINES } from "@/components/home/country-outlines";

// One country at a time: its real outline draws itself, its flag and name appear beside it, then it fades and the next follows.
const ORDER = ["eg", "sa", "ae", "qa", "om", "jo", "ps", "lb", "dz", "ma", "tn"];
const CYCLE_MS = 4200;

export function CountriesMap() {
  const { lang } = useI18n();
  const rootRef = useRef<HTMLDivElement>(null);
  const list = ORDER.filter((c) => COUNTRIES.some((x) => x.code === c) && OUTLINES[c]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const nameOf = (code: string) => COUNTRIES.find((c) => c.code === code)?.name[lang] ?? code;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) setPaused(true);
  }, []);
  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    const io = new IntersectionObserver((e) => setVisible(e[0]?.isIntersecting ?? true), { rootMargin: "50px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (paused || !visible || list.length < 2) return;
    const id = window.setTimeout(() => setI((v) => (v + 1) % list.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [i, paused, visible, list.length]);

  const code = list[i % list.length];
  const o = OUTLINES[code];
  const live = !reduced && !paused;

  return (
    <div className="world-globe" ref={rootRef}>
      <div className="cm-stage" data-live={live ? "true" : "false"}>
        <div className="cm-scene" key={`${code}-${paused}-${reduced}`} dir="ltr" style={{ ["--cm-dur" as string]: `${CYCLE_MS}ms` }}>
          <svg className="cm-shape" viewBox={`-4 -4 ${o.w + 8} ${o.h + 8}`} role="img" aria-label={nameOf(code)}>
            <path d={o.d} pathLength={1} className="cm-outline" />
          </svg>
          <div className="cm-label" dir={lang === "ar" ? "rtl" : "ltr"}>
            <img className="cm-flag" src={`https://flagcdn.com/${code}.svg`} alt="" draggable={false} />
            <span className="cm-name">{nameOf(code)}</span>
          </div>
        </div>
      </div>
      <div className="cm-ctrl" dir="ltr">
        <button type="button" className="cm-btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? (lang === "ar" ? "تشغيل" : "Play") : (lang === "ar" ? "إيقاف مؤقت" : "Pause")}>
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </button>
        <div className="cm-dots">
          {list.map((c, n) => (
            <button key={c} type="button" className="cm-dot" data-on={n === i ? "true" : undefined} onClick={() => setI(n)} aria-label={nameOf(c)} aria-current={n === i ? "true" : undefined}><span /></button>
          ))}
        </div>
      </div>
      <ul className="sr-only">
        {COUNTRIES.map((c) => <li key={c.code}>{c.name[lang]}</li>)}
      </ul>
    </div>
  );
}
