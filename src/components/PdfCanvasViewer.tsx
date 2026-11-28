import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * In-app PDF renderer (pdf.js). Draws every page to a canvas so the PDF shows
 * inline in any browser, without relying on the browser's built-in viewer.
 * Calls onFail() if the document cannot be parsed so the caller can fall back.
 */
export function PdfCanvasViewer({ data, onFail, label }: { data: ArrayBuffer; onFail: () => void; label: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready">("loading");
  const [pages, setPages] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;
    let doc: import("pdfjs-dist").PDFDocumentProxy | null = null;
    let task: { destroy: () => unknown } | null = null;
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const lt = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
        task = lt;
        doc = await lt.promise;
        if (cancelled) return;
        setPages({ done: 0, total: doc.numPages });
        const host = hostRef.current;
        if (!host) return;
        host.innerHTML = "";
        const cssWidth = Math.max(280, host.clientWidth - 16);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scroller = host.parentElement;
        const slots: { n: number; slot: HTMLDivElement; canvas: HTMLCanvasElement; w: number; h: number; scale: number; busy: boolean; drawn: boolean }[] = [];
        const draw = async (e: (typeof slots)[number]) => {
          if (e.busy || e.drawn || cancelled || !doc) return;
          e.busy = true;
          try {
            const page = await doc.getPage(e.n);
            const vp = page.getViewport({ scale: e.scale * dpr });
            e.canvas.width = Math.floor(vp.width);
            e.canvas.height = Math.floor(vp.height);
            await page.render({ canvas: e.canvas, viewport: vp }).promise;
            e.drawn = true;
          } catch { /* a page that fails stays blank */ }
          e.busy = false;
        };
        const release = (e: (typeof slots)[number]) => {
          if (!e.drawn || e.busy) return;
          e.canvas.width = 0; e.canvas.height = 0; e.drawn = false;
        };
        const io = new IntersectionObserver((entries) => {
          for (const en of entries) {
            const e = slots.find((x) => x.slot === en.target);
            if (!e) continue;
            if (en.isIntersecting) void draw(e); else release(e);
          }
        }, { root: scroller, rootMargin: "800px 0px" });
        cleanup = () => io.disconnect();
        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return;
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const scale = cssWidth / base.width;
          const h = base.height * scale;
          const slot = document.createElement("div");
          slot.style.cssText = `width:${cssWidth}px;height:${h.toFixed(1)}px;margin:8px auto;background:#fff;border-radius:4px;overflow:hidden`;
          const canvas = document.createElement("canvas");
          canvas.style.cssText = `width:${cssWidth}px;height:${h.toFixed(1)}px;display:block`;
          canvas.setAttribute("aria-label", `${label} ${n}/${doc.numPages}`);
          slot.appendChild(canvas);
          host.appendChild(slot);
          const e = { n, slot, canvas, w: cssWidth, h, scale, busy: false, drawn: false };
          slots.push(e);
          io.observe(slot);
          if (n === 1) setState("ready");
        }
        setPages({ done: doc.numPages, total: doc.numPages });
      } catch {
        if (!cancelled) onFail();
      }
    })();
    return () => { cancelled = true; try { cleanup?.(); task?.destroy(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="w-full h-full overflow-auto bg-neutral-800 relative" dir="ltr">
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-white/70"><Loader2 className="w-6 h-6 animate-spin" /></div>
      )}
      <div ref={hostRef} className="py-2" />
      {state === "ready" && pages.done < pages.total && (
        <div className="text-center text-xs text-white/60 pb-3">{pages.done}/{pages.total}</div>
      )}
    </div>
  );
}
