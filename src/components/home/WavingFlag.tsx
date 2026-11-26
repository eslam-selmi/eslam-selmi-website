import { useEffect, useRef } from "react";

/** Crisp waving flag: the vector flag is rasterised once at device resolution, then redrawn
 *  as thin vertical slices with a travelling sine offset and soft shading. No frame, no border. */
export function WavingFlag({ code, width }: { code: string; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.round(width * dpr), H = Math.round(width * 0.66 * dpr);
    const A = Math.round(H * 0.045), pad = A + 2;
    cv.width = W; cv.height = H + pad * 2;
    cv.style.width = `${width}px`; cv.style.height = `${(H + pad * 2) / dpr}px`;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, stopped = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (stopped) return;
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d")!;
      o.imageSmoothingQuality = "high";
      o.drawImage(img, 0, 0, W, H);
      const draw = (t: number) => {
        ctx.clearRect(0, 0, cv.width, cv.height);
        const step = Math.max(1, Math.round(dpr));
        for (let x = 0; x < W; x += step) {
          const p = x / W;
          const ph = p * Math.PI * 2.2 - t;
          const dy = Math.sin(ph) * A * (0.35 + 0.65 * p);
          ctx.drawImage(off, x, 0, step + 1, H, x, pad + dy, step + 1, H);
          const sh = Math.cos(ph) * 0.16 * (0.4 + 0.6 * p);
          ctx.fillStyle = sh > 0 ? `rgba(255,255,255,${sh * 0.8})` : `rgba(0,0,0,${-sh})`;
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillRect(x, 0, step + 1, cv.height);
          ctx.globalCompositeOperation = "source-over";
        }
      };
      if (reduced) { draw(0); return; }
      const loop = (ms: number) => { draw(ms / 420); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    };
    img.src = `https://flagcdn.com/${code}.svg`;
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [code, width]);
  return <canvas ref={ref} className="cm-flag-canvas" aria-hidden />;
}
