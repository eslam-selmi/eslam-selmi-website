import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Globe2, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES, SNAPSHOTS, fadeUp } from "@/components/home/data";
import { Section } from "@/components/home/shared";
import { CountriesMap } from "@/components/home/CountriesMap";
import { snapshotThumbnail } from "@/lib/optimized-images";

export function Clients() {
  const { t, lang } = useI18n();
  return (
    <Section id="clients" eyebrow={t("clients_eyebrow")} title={t("clients_title")}>
      <motion.div {...fadeUp} className="world-panel">
        <div className="world-stage-frame">
          <CountriesMap />
        </div>
      </motion.div>
    </Section>
  );
}

/* ---------- BRANDS / LOGO MARQUEE ---------- */

export function Brands() {
  const { t, lang } = useI18n();
  const { data: brands = [] } = useQuery({
    queryKey: ["home", "active-partners"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("partners")
        .select("logo_url,name_en,name_ar,industry_en,industry_ar")
        .eq("is_active", true).order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter(r => r.logo_url).map(r => ({
        src: r.logo_url ?? "", name: r.name_en || r.name_ar, nameAr: r.name_ar,
        specEn: r.industry_en || r.industry_ar || "", specAr: r.industry_ar || "",
      }));
    },
  });
  const row1 = brands;
  const row2 = [...brands].reverse();

  const Chip = ({
    b,
  }: {
    b: { src: string; name: string; nameAr: string; specEn: string; specAr: string };
  }) => (
    <div className="shrink-0 group">
      <div
        className="relative h-24 w-44 md:h-28 md:w-52 rounded-2xl bg-white border border-border/30 overflow-hidden flex items-center justify-center px-5 py-3 transition-all duration-500 group-hover:-translate-y-1.5"
        style={{
          boxShadow:
            "0 18px 40px -12px color-mix(in oklab, var(--primary) 35%, transparent), 0 6px 16px -6px rgba(0,0,0,0.25)",
        }}
      >
        <img
          src={b.src}
          alt={lang === "ar" ? b.nameAr : b.name}
          loading="lazy"
          decoding="async"
          width={180}
          height={90}
          className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <p className="mt-3 text-center text-[12px] font-semibold tracking-wide text-foreground/85">
        {lang === "ar" ? b.nameAr : b.name}
      </p>
      <p className="text-center text-[10px] tracking-widest uppercase text-muted-foreground/70 mt-0.5">
        {lang === "ar" ? b.specAr : b.specEn}
      </p>
    </div>
  );

  return (
    <Section id="brands" eyebrow={t("brands_eyebrow")} title={t("brands_title")}>
      <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-end mb-10">
        <p className="text-muted-foreground max-w-2xl">{t("brands_desc")}</p>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-display text-4xl font-bold text-gradient-gold leading-none">
            {brands.length}+
          </span>
          <span className="text-muted-foreground uppercase tracking-widest text-xs leading-tight">
            {t("brands_meta")}
          </span>
        </div>
      </div>

      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 py-2">
        {/* edge fades */}
        <div className="mobile-rail-fade pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="mobile-rail-fade pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

        {/* row 1 */}
        <div className="mobile-swipe-rail overflow-hidden" dir="ltr">
          <div className="flex w-max gap-8 marquee-track py-2" style={{ animationDuration: "45s" }}>
            {[0, 1, 2].map((copy) => (
              <div key={`r1-copy-${copy}`} className="flex shrink-0 gap-8" aria-hidden={copy > 0}>
                {row1.map((b) => (
                  <Chip key={`r1-${copy}-${b.name}`} b={b} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* row 2 — opposite direction */}
        <div className="mobile-swipe-rail overflow-hidden mt-4" dir="ltr">
          <div
            className="flex w-max gap-8 marquee-track-reverse py-2"
            style={{ animationDuration: "55s" }}
          >
            {[0, 1, 2].map((copy) => (
              <div key={`r2-copy-${copy}`} className="flex shrink-0 gap-8" aria-hidden={copy > 0}>
                {row2.map((b) => (
                  <Chip key={`r2-${copy}-${b.name}`} b={b} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- SNAPSHOTS w/ LIGHTBOX ---------- */

export function Snapshots() {
  const { data: dbShots = [] } = useQuery({
    queryKey: ["home", "visible-snapshots"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("snapshots")
        .select("image_url").eq("is_visible", true)
        .order("display_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(r => r.image_url).filter(Boolean);
    },
  });
  const shots = dbShots.length > 0 ? dbShots : SNAPSHOTS;
  const { t, dir } = useI18n();
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (active === null) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight")
        setActive((a) => (a === null ? null : (a + 1) % shots.length));
      if (e.key === "ArrowLeft")
        setActive((a) => (a === null ? null : (a - 1 + shots.length) % shots.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, shots.length]);

  const [cur, setCur] = useState(0);
  const [hover, setHover] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (reduced || hover || active !== null || shots.length < 2) return;
    const id = window.setInterval(() => setCur((c) => (c + 1) % shots.length), 5500);
    return () => window.clearInterval(id);
  }, [reduced, hover, active, shots.length]);
  const go = (d: number) => setCur((c) => (c + d + shots.length) % shots.length);
  const isAr = dir === "rtl";

  return (
    <Section id="snapshots" eyebrow={t("snapshots_eyebrow")} title={t("snapshots_title")}>
      <div className="snap-gallery" dir="ltr" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <div className="snap-stage">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.button
              key={cur}
              type="button"
              onClick={() => setActive(cur)}
              className="snap-frame cursor-zoom-in"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.7, ease: "easeOut" }}
              aria-label={isAr ? `فتح الصورة ${cur + 1}` : `Open photo ${cur + 1}`}
            >
              <img src={shots[cur]} alt={isAr ? `صورة ${cur + 1} من ${shots.length}` : `Photo ${cur + 1} of ${shots.length}`} className="snap-img" decoding="async" />
              <span className="snap-expand" aria-hidden="true"><Maximize2 className="size-4" /></span>
            </motion.button>
          </AnimatePresence>
          <button type="button" className="snap-arrow snap-prev" onClick={() => go(-1)} aria-label={isAr ? "السابقة" : "Previous"}><ChevronLeft className="size-5" /></button>
          <button type="button" className="snap-arrow snap-next" onClick={() => go(1)} aria-label={isAr ? "التالية" : "Next"}><ChevronRight className="size-5" /></button>
          <span className="snap-count" dir="ltr">{String(cur + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}</span>
        </div>
        <div className="snap-thumbs" role="tablist">
          {shots.map((src, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === cur} aria-label={isAr ? `الصورة ${i + 1}` : `Photo ${i + 1}`} onClick={() => setCur(i)} className="snap-thumb" data-on={i === cur}>
              <img src={snapshotThumbnail(src)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(<AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop fixed inset-0 z-[100] backdrop-blur-md grid place-items-center p-4"
            onClick={() => setActive(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive(null);
              }}
              className="absolute top-5 end-5 size-10 grid place-items-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <motion.img
              key={active}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={shots[active]}
              alt=""
              className="max-h-[88vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-5 inset-x-0 flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) =>
                    a === null ? null : (a - 1 + shots.length) % shots.length,
                  );
                }}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm">
                {active + 1} / {shots.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a === null ? null : (a + 1) % shots.length));
                }}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </Section>
  );
}

/* ---------- TESTIMONIALS (admin-managed) ---------- */
