import { motion } from "motion/react";
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
        className="relative h-16 w-36 md:h-20 md:w-44 rounded-xl bg-white border border-border/30 overflow-hidden flex items-center justify-center px-4 py-2 transition-all duration-500 group-hover:-translate-y-1"
        style={{
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.08)",
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
      <p className="mt-2 text-center text-[12px] font-semibold tracking-wide text-foreground/85">
        {lang === "ar" ? b.nameAr : b.name}
      </p>
      <p className="text-center text-[10px] tracking-widest uppercase text-muted-foreground/70 mt-0.5">
        {lang === "ar" ? b.specAr : b.specEn}
      </p>
    </div>
  );

  return (
    <Section id="brands" eyebrow={t("brands_eyebrow")} title={t("brands_title")}>
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end mb-6">
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
  // Split snapshots across two tracks so the rows don't show the same images
  const half = Math.ceil(shots.length / 2);
  const setA = shots.slice(0, half);
  const setB = shots.slice(half);
  const trackA = [setA, setA, setA];
  const trackBSet = setB.slice().reverse();
  const trackB = [trackBSet, trackBSet, trackBSet];
  const marqueeClass = dir === "rtl" ? "marquee-track-rtl" : "marquee-track";
  const marqueeSlowClass = dir === "rtl" ? "marquee-track-rtl" : "marquee-track";

  const Card = ({ src, originalIndex }: { src: string; i: number; originalIndex: number }) => (
    <div
      role="img"
      aria-label={`Snapshot ${originalIndex + 1}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className="snap-card relative shrink-0 w-[200px] sm:w-[240px] lg:w-[260px] aspect-[4/5] overflow-hidden rounded-2xl border border-foreground/10 shadow-[0_18px_50px_-30px_var(--foreground)] bg-foreground/[0.04]"
    >
      <img
        src={snapshotThumbnail(src)}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        width={260}
        height={325}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>
  );

  return (
    <Section id="snapshots" eyebrow={t("snapshots_eyebrow")} title={t("snapshots_title")}>
      <div className="space-y-6 marquee-mask">
        <div className="mobile-swipe-rail overflow-hidden" dir="ltr">
          <div
            className={`flex gap-7 w-max ${marqueeClass} hover:[animation-play-state:paused]`}
            style={{ animationDuration: "34s" }}
          >
            {trackA.map((set, copy) => (
              <div key={`a-copy-${copy}`} className="flex shrink-0 gap-7" aria-hidden={copy > 0}>
                {set.map((src, idx) => (
                  <Card
                    key={`a-${copy}-${idx}`}
                    src={snapshotThumbnail(src)}
                    i={idx}
                    originalIndex={shots.indexOf(src)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mobile-swipe-rail overflow-hidden" dir="ltr">
          <div
            className={`flex gap-7 w-max ${marqueeSlowClass} hover:[animation-play-state:paused]`}
            style={{ animationDuration: "44s" }}
          >
            {trackB.map((set, copy) => (
              <div key={`b-copy-${copy}`} className="flex shrink-0 gap-7" aria-hidden={copy > 0}>
                {set.map((src, idx) => (
                  <Card
                    key={`b-${copy}-${idx}`}
                    src={snapshotThumbnail(src)}
                    i={idx}
                    originalIndex={shots.indexOf(src)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

    </Section>
  );
}

/* ---------- TESTIMONIALS (admin-managed) ---------- */
