import { useEffect, useRef, type ReactNode } from "react";
import { useBuildEffects } from "@/lib/build-effects";

/** Cursors work on measured, rendered content. Each visible element is built once. */
export function BuildReveal({ variant, children }: { variant?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useBuildEffects();
  useEffect(() => {
    const stage = ref.current;
    if (!stage || !enabled || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const built = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const overlays = new Set<HTMLElement>();
    const selector = 'h2,h3,h4,p,img,button,a[href],.atlas-chip,.atlas-pill';
    let sequence = 0;
    const build = (target: HTMLElement) => {
      if (built.has(target) || target.closest('[aria-hidden="true"],.build-overlay')) return;
      const rect = target.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 10 || rect.width > stage.clientWidth || getComputedStyle(target).visibility === 'hidden') return;
      built.add(target);
      const base = stage.getBoundingClientRect();
      const x = rect.left - base.left, y = rect.top - base.top;
      const w = rect.width, h = rect.height;
      const isImage = target.tagName === 'IMG';
      const isControl = target.matches('button,a,.atlas-chip,.atlas-pill');
      const kind = isImage ? 'image' : isControl ? 'shape' : 'text';
      const rtl = getComputedStyle(target).direction === 'rtl';
      const start = rtl ? w : 0, end = rtl ? 0 : w;
      // Text follows its actual lines; images use a diagonal scan; controls trace their actual edges.
      let points = kind === 'text'
        ? [[start, 0], [end, h * .24], [start, h * .5], [end, h * .75], [start, h]]
        : kind === 'image'
          ? [[0, 0], [w, h * .25], [0, h * .5], [w, h * .75], [w, h]]
          : [[0, 0], [w, 0], [w, h], [0, h], [0, 0]];
      if (kind === 'text') {
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
        const lines: DOMRect[] = [];
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          lines.push(...Array.from(range.getClientRects()));
        }
        if (lines.length) points = lines.flatMap(line => {
          const left = line.left - rect.left, right = line.right - rect.left;
          const baseline = line.bottom - rect.top;
          return rtl ? [[right, baseline], [left, baseline]] : [[left, baseline], [right, baseline]];
        });
      }
      const layer = document.createElement('div');
      layer.className = 'build-overlay';
      layer.dataset.kind = kind;
      layer.setAttribute('aria-hidden', 'true');
      layer.style.setProperty('--c', `var(--build-c${sequence++ % 4 + 1})`);
      const outline = document.createElement('div');
      outline.className = 'build-outline';
      Object.assign(outline.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, borderRadius: getComputedStyle(target).borderRadius });
      const cursor = document.createElement('div');
      cursor.className = 'build-cursor';
      cursor.innerHTML = '<svg width="20" height="24" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="currentColor" stroke="var(--cover-highlight)" stroke-width="1.2"/></svg>';
      layer.append(outline, cursor);
      stage.append(layer);
      overlays.add(layer);
      const duration = kind === 'text' ? 1750 : kind === 'image' ? 2100 : 1550;
      const track = (animation: Animation) => {
        animations.add(animation);
        animation.addEventListener('finish', () => animations.delete(animation), { once: true });
        return animation;
      };
      const movement = track(cursor.animate(points.map(([px, py], i) => ({ transform: `translate(${x + px}px, ${y + py}px)`, opacity: i === 0 || i === points.length - 1 ? .6 : 1 })), { duration, easing: 'linear' }));
      track(outline.animate([{ opacity: .8, clipPath: 'inset(0 100% 0 0)' }, { opacity: .55, clipPath: 'inset(0 0 0 0)', offset: .7 }, { opacity: 0, clipPath: 'inset(0 0 0 0)' }], { duration }));
      track(target.animate([
        { clipPath: kind === 'shape' ? 'inset(45% 45% 45% 45%)' : 'inset(0 0 100% 0)', opacity: .2 },
        { clipPath: 'inset(0 0 0 0)', opacity: 1 },
      ], { duration, easing: 'linear' }));
      movement.onfinish = () => { layer.remove(); overlays.delete(layer); };
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          build(entry.target);
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .25, rootMargin: '-85px 0px -8% 0px' });
    const collect = () => {
      stage.querySelectorAll<HTMLElement>(selector).forEach(el => {
        // Country chips are constructed as complete units, never also animate their children.
        if (el.closest('.build-overlay,[aria-hidden="true"]') || el.parentElement?.closest('.atlas-chip,.atlas-pill,button,a[href]') || built.has(el)) return;
        observer.observe(el);
      });
    };
    collect();
    const mutation = new MutationObserver(collect);
    mutation.observe(stage, { childList: true, subtree: true });
    const cancel = () => { animations.forEach(a => a.cancel()); overlays.forEach(el => el.remove()); };
    window.addEventListener('resize', cancel);
    return () => { observer.disconnect(); mutation.disconnect(); window.removeEventListener('resize', cancel); cancel(); };
  }, [enabled, variant]);
  return <div ref={ref} className="build-stage" data-build-section={variant}>{children}</div>;
}
