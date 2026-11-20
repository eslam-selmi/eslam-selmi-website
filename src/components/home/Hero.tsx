import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, Linkedin, Mail } from "lucide-react";
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
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em]"
            style={{ color: "var(--accent)" }}
          >
            <span className="h-px w-8" style={{ background: "var(--accent)" }} />
            {lang === "ar" ? "استشارات التعلم والتطوير وإدارة المواهب" : "Learning & Development and Talent Consulting"}
          </motion.div>

          <motion.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display font-extrabold text-balance leading-[1.05] text-[clamp(2rem,4.6vw,4.25rem)] text-foreground"
          >
            {lang === "ar"
              ? "تطوير الكفاءات وإدارة الأداء"
              : "Capability Development & Performance Management"}
          </motion.h1>

          <motion.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground"
          >
            {t("hero_intro")}
          </motion.p>

          {/* ETEC certified trainer credential — opens license popup */}
          <motion.div
            initial={false}
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
            initial={false}
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

        {/* Transparent portrait with open editorial linework, no statistics or frame. */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 order-1 lg:order-2 relative"
        >
          <div className="hero-portrait-stage relative mx-auto w-full max-w-[400px] sm:max-w-[440px] lg:max-w-[480px]">
            <svg className="hero-portrait-lines" viewBox="0 0 480 480" fill="none" aria-hidden="true">
              <g className="hero-line-guides">
                <path d="M22 355V205Q22 185 42 185H106M374 110H420Q448 110 448 138V288" />
                <path d="M46 389L112 323M366 326L431 391M66 145V119M53 132H79M399 66V90M387 78H411" />
              </g>
              <path className="hero-line-trace hero-line-trace-first" pathLength="100" d="M18 335V229Q18 197 50 197H94" />
              <path className="hero-line-trace hero-line-trace-second" pathLength="100" d="M386 122H417Q436 122 436 141V270" />
              <path className="hero-line-trace hero-line-trace-third" pathLength="100" d="M40 404L90 354M388 352L440 404" />
              <path className="hero-line-detail" d="M12 360H32M12 367H26M438 293H458M444 300H458" />
            </svg>

            {/* portrait — transparent cutout, floating */}
            <motion.img
              src={portrait.src}
              srcSet={portrait.srcSet}
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 440px, (min-width: 432px) 400px, calc(100vw - 32px)"
              loading="eager"
              alt={lang === "ar" ? nameAr : nameEn}
              width={1024}
              height={1024}
              fetchPriority="high"
              decoding="async"
              className="hero-portrait relative z-10 mx-auto w-full"
            />

            {/* signature name plate */}
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="relative z-20 -mt-6 text-center sm:-mt-8"
            >
              <span className="hero-name-shine font-display font-extrabold leading-none text-[clamp(1.9rem,4vw,3rem)]">
                {lang === "ar" ? nameAr : nameEn}
              </span>
              <svg className="hero-signature-rule" viewBox="0 0 180 14" fill="none" aria-hidden="true"><path pathLength="100" d="M4 10Q52 2 94 7T176 4" /></svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
