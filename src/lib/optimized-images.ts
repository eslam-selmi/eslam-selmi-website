import original0 from "@/assets/portfolio/headshot-cutout.png.asset.json";
import optimized0 from "@/assets/optimized/portrait-640.webp.asset.json";
import original1 from "@/assets/portfolio/headshot-cutout.png.asset.json";
import optimized1 from "@/assets/optimized/portrait-960.webp.asset.json";
import original2 from "@/assets/snapshots/snap-1.jpg.asset.json";
import optimized2 from "@/assets/optimized/snap-1-520.webp.asset.json";
import original3 from "@/assets/snapshots/snap-10.jpg.asset.json";
import optimized3 from "@/assets/optimized/snap-10-520.webp.asset.json";
import original4 from "@/assets/snapshots/snap-11.jpg.asset.json";
import optimized4 from "@/assets/optimized/snap-11-520.webp.asset.json";
import original5 from "@/assets/snapshots/snap-12.jpg.asset.json";
import optimized5 from "@/assets/optimized/snap-12-520.webp.asset.json";
import original6 from "@/assets/snapshots/snap-13.jpg.asset.json";
import optimized6 from "@/assets/optimized/snap-13-520.webp.asset.json";
import original7 from "@/assets/snapshots/snap-15.jpg.asset.json";
import optimized7 from "@/assets/optimized/snap-15-520.webp.asset.json";
import original8 from "@/assets/snapshots/snap-16.jpg.asset.json";
import optimized8 from "@/assets/optimized/snap-16-520.webp.asset.json";
import original9 from "@/assets/snapshots/snap-2.jpg.asset.json";
import optimized9 from "@/assets/optimized/snap-2-520.webp.asset.json";
import original10 from "@/assets/snapshots/snap-3.jpg.asset.json";
import optimized10 from "@/assets/optimized/snap-3-520.webp.asset.json";
import original11 from "@/assets/snapshots/snap-4.jpg.asset.json";
import optimized11 from "@/assets/optimized/snap-4-520.webp.asset.json";
import original12 from "@/assets/snapshots/snap-5.jpg.asset.json";
import optimized12 from "@/assets/optimized/snap-5-520.webp.asset.json";
import original13 from "@/assets/snapshots/snap-6.jpg.asset.json";
import optimized13 from "@/assets/optimized/snap-6-520.webp.asset.json";
import original14 from "@/assets/snapshots/snap-7.jpg.asset.json";
import optimized14 from "@/assets/optimized/snap-7-520.webp.asset.json";
import original15 from "@/assets/snapshots/snap-8.jpg.asset.json";
import optimized15 from "@/assets/optimized/snap-8-520.webp.asset.json";

const thumbnails = new Map<string, string>([
  [original2.url, optimized2.url],
  [original3.url, optimized3.url],
  [original4.url, optimized4.url],
  [original5.url, optimized5.url],
  [original6.url, optimized6.url],
  [original7.url, optimized7.url],
  [original8.url, optimized8.url],
  [original9.url, optimized9.url],
  [original10.url, optimized10.url],
  [original11.url, optimized11.url],
  [original12.url, optimized12.url],
  [original13.url, optimized13.url],
  [original14.url, optimized14.url],
  [original15.url, optimized15.url],
]);

function assetPath(src: string): string {
  try { return new URL(src, "https://eslam-selmi.com").pathname; } catch { return src; }
}

export function snapshotThumbnail(src: string): string {
  return thumbnails.get(assetPath(src)) ?? src;
}

export function portraitSources(src: string) {
  // Only substitute the known original; never replace administrator-uploaded portraits.
  if (assetPath(src) !== original0.url) return { src, srcSet: undefined };
  return { src: optimized0.url, srcSet: `${optimized0.url} 640w, ${optimized1.url} 960w` };
}
