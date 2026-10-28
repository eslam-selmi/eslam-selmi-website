import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Globe2, Linkedin, Mail, TrendingUp, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import etecLicenseAsset from "@/assets/etec-license.png.asset.json";
import { useSiteProfile } from "@/lib/site-profile";
import { portraitSources } from "@/lib/optimized-images";
import { Button } from "@/components/ui/button";

export function Hero() {
  const { profile, links } = useSiteProfile();
  const portrait = portraitSources(profile.portrait);
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const [licenseOpen, setLicenseOpen] = useState(false);

  const nameEn = "Eslam Selmi";
  const nameAr = "إسلام سلمي";

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen pt-28 pb-16 lg:pt-32 overflow-hidden"
    >
      {/* Soft background wash */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 85% 12%, oklch(0.72 0.13 180 / 0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 5% 90%, oklch(0.22 0.06 252 / 0.10), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
          opacity: 0.4,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left: Copy */}
        <motion.div style={{ y: isMobile || reduceMotion ? 0 : y }} className="lg:col-span-7 order-2 lg:order-1 space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em]"
            style={{ color: "var(--accent)" }}
          >
            <span className="h-px w-8" style={{ background: "var(--accent)" }} />
            {lang === "ar" ? "استشارات التعلم والتطوير وإدارة المواهب" : "Learning & Development and Talent Consulting"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display font-extrabold text-balance leading-[1.05] text-[clamp(2rem,4.6vw,4.25rem)] text-foreground"
          >
            {lang === "ar"
              ? "تطوير الكفاءات وإدارة الأداء"
              : "Capability Development & Performance Management"}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            {t("hero_intro")}
          </motion.p>

          {/* ETEC certified trainer credential — opens license popup */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="max-w-xl"
          >
            <Button
              variant="ghost"
              onClick={() => setLicenseOpen(true)}
              className="group inline-flex h-auto w-auto max-w-full items-center gap-2.5 rounded-full border border-foreground/10 bg-card/70 px-2.5 py-2 text-start shadow-none transition-colors hover:border-accent/40 hover:bg-secondary/70 hover:text-foreground"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <BadgeCheck className="!size-5" />
              </span>
              <span className="min-w-0 text-sm leading-snug">
                <span className="font-bold text-foreground">
                  {lang === "ar" ? "مدرب معتمد" : "Certified Trainer"}
                </span>
                <span className="text-muted-foreground">
                  {lang === "ar"
                    ? " · هيئة تقويم التعليم والتدريب"
                    : " · Education & Training Evaluation Commission"}
                </span>
              </span>
              <span className="mx-0.5 hidden h-4 w-px bg-foreground/15 sm:block" />
              <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-accent">
                {lang === "ar" ? "عرض الشهادة" : "View license"}
                {lang === "ar" ? (
                  <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                ) : (
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                )}
              </span>
            </Button>
          </motion.div>

          <Dialog open={licenseOpen} onOpenChange={setLicenseOpen}>
            <DialogContent className="max-w-3xl p-2 sm:p-3 bg-card">
              <img
                src={etecLicenseAsset.url}
                alt={lang === "ar" ? "رخصة مدرب مهنية — هيئة تقويم التعليم والتدريب" : "Professional Trainer License — ETEC"}
                className="w-full h-auto rounded-lg"
              />
            </DialogContent>
          </Dialog>

          {/* Social row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3 pt-3"
          >
            <a
              href={links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition"
            >
              <Linkedin className="size-4" />
            </a>
            <a
              href={links.email}
              aria-label="Email"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition"
            >
              <Mail className="size-4" />
            </a>
          </motion.div>
        </motion.div>

        {/* Right: Portrait — bare cutout, no frame or background, orbiting glass accents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 order-1 lg:order-2 relative"
        >
          <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[440px] lg:max-w-[480px]">
            {/* soft ambient glow — light only, no frame */}
            <div
              className="pointer-events-none absolute -inset-10 -z-10"
              style={{
                background:
                  "radial-gradient(ellipse 55% 50% at 50% 42%, color-mix(in oklab, var(--accent) 24%, transparent), transparent 70%), radial-gradient(ellipse 45% 40% at 50% 92%, color-mix(in oklab, var(--navy) 30%, transparent), transparent 75%)",
              }}
              aria-hidden
            />

            {/* rotating dashed orbit with a travelling light dot */}
            <motion.div
              className="pointer-events-none absolute inset-x-2 top-2 aspect-square"
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              aria-hidden
            >
              <svg viewBox="0 0 100 100" className="h-full w-full opacity-60">
                <circle cx="50" cy="50" r="48.5" fill="none" stroke="var(--accent)" strokeOpacity="0.35" strokeWidth="0.35" strokeDasharray="1.5 3" />
              </svg>
              <span
                className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent)" }}
              />
            </motion.div>

            {/* counter-rotating inner arc */}
            <motion.div
              className="pointer-events-none absolute inset-x-10 top-10 aspect-square"
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
              aria-hidden
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle cx="50" cy="50" r="48" fill="none" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="0.6" strokeDasharray="20 282" strokeLinecap="round" />
              </svg>
            </motion.div>

            {/* portrait — transparent cutout, floating */}
            <motion.img
              src={portrait.src}
              srcSet={portrait.srcSet}
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 440px, 400px"
              loading="eager"
              alt={lang === "ar" ? nameAr : nameEn}
              width={1024}
              height={1024}
              fetchPriority="high"
              decoding="async"
              className="relative z-10 mx-auto w-full"
              style={{
                filter: "drop-shadow(0 34px 44px color-mix(in oklab, var(--navy-deep) 55%, transparent))",
              }}
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* floating glass stat chips */}
            {[
              { icon: Users, n: "3000+", l: t("stat_trainees"), pos: "top-[14%] start-1 sm:-start-6", delay: 0 },
              { icon: Globe2, n: "12+", l: t("nav_clients"), pos: "top-[40%] end-1 sm:-end-6", delay: 1.4 },
              { icon: TrendingUp, n: "15+", l: t("stat_programs"), pos: "bottom-[30%] start-2 sm:-start-8", delay: 2.4 },
            ].map(({ icon: Icon, n, l, pos, delay }) => (
              <motion.div
                key={l}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + delay * 0.15, duration: 0.5 }}
                className={`absolute z-20 ${pos}`}
              >
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay }}
                  className="glass-panel flex items-center gap-2 rounded-2xl px-3 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                    <Icon className="size-4" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-display text-sm font-bold text-foreground">{n}</span>
                    <span className="block text-[10px] text-muted-foreground">{l}</span>
                  </span>
                </motion.div>
              </motion.div>
            ))}

            {/* signature name plate */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="relative z-20 -mt-6 text-center sm:-mt-8"
            >
              <span className="hero-name-shine font-display font-extrabold leading-none text-[clamp(1.9rem,4vw,3rem)]">
                {lang === "ar" ? nameAr : nameEn}
              </span>
              <div
                className="mx-auto mt-3 h-px w-40"
                style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
                aria-hidden
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
