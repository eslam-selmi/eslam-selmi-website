import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { Award, ExternalLink, Mic, Linkedin, Mail } from "lucide-react";
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
            {lang === "ar" ? "حلول مبتكرة لبناء القدرات" : "Innovative Solutions for Building"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display font-extrabold text-balance leading-[1.05] text-[clamp(2rem,4.6vw,4.25rem)] text-foreground"
          >
            {lang === "ar" ? (
              <>
                إطلاق إمكانات المواهب مع <span style={{ color: "var(--accent)" }}>{nameAr}</span>
              </>
            ) : (
              <>
                Unlocking Talent Potential With{" "}
                <span style={{ color: "var(--accent)" }}>{nameEn}</span>
              </>
            )}
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
              className="group grid h-auto w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-3 rounded-none border-s-2 border-accent/60 px-3 py-2 text-start whitespace-normal hover:bg-accent/5 hover:text-foreground"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-foreground/10 bg-secondary/70 text-foreground">
                <Award className="!size-5" />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block text-sm font-bold leading-snug">
                  {lang === "ar" ? "مدرب معتمد" : "Certified Trainer"}
                </span>
                <span className="block text-xs font-normal leading-relaxed text-muted-foreground">
                  {lang === "ar"
                    ? "هيئة تقويم التعليم والتدريب · المملكة العربية السعودية"
                    : "Education & Training Evaluation Commission · Saudi Arabia"}
                </span>
              </span>
              <ExternalLink className="text-muted-foreground transition-colors group-hover:text-accent" />
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

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex max-w-xl gap-3 pt-1"
          >
            <Button asChild variant="outline" className="h-auto min-h-12 rounded-xl border-foreground/10 bg-card/50 px-4 py-3 font-semibold shadow-none hover:bg-secondary hover:text-foreground">
            <a
              href="#podcast"
            >
              <Mic className="size-4 text-accent" />
              <span className="min-w-0 whitespace-normal text-center text-xs sm:text-sm leading-snug">{t("listen_podcast")}</span>
            </a>
            </Button>
          </motion.div>


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

        {/* Right: Portrait — editorial squircle with offset accents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 order-1 lg:order-2 relative"
        >
          <div className="relative mx-auto w-full max-w-[400px] sm:max-w-[440px] lg:max-w-[500px]">
            {/* soft ambient light behind the frame */}
            <div
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[999px] blur-3xl opacity-70"
              style={{
                background:
                  "radial-gradient(ellipse 60% 55% at 50% 40%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)",
              }}
              aria-hidden
            />
            {/* offset editorial frame */}
            <div
              className="pointer-events-none absolute inset-0 translate-x-4 translate-y-4 rounded-[2.5rem] border border-foreground/12 sm:translate-x-5 sm:translate-y-5"
              aria-hidden
            />

            <div
              className="relative overflow-hidden rounded-[2.5rem] ring-1 ring-foreground/10"
              style={{
                background:
                  "linear-gradient(165deg, color-mix(in oklab, var(--navy) 92%, transparent), color-mix(in oklab, var(--navy-deep) 96%, transparent))",
                boxShadow: "0 40px 90px -40px color-mix(in oklab, var(--navy-deep) 65%, transparent)",
              }}
            >
              <div className="relative aspect-[4/5] w-full">
                <img
                  src={portrait.src}
                  srcSet={portrait.srcSet}
                  sizes="(min-width: 1024px) 500px, (min-width: 640px) 440px, 400px"
                  loading="eager"
                  alt="Eslam Selmi"
                  width={1024}
                  height={1024}
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-top"
                />
                {/* gentle top light + bottom depth so the frame reads premium */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, color-mix(in oklab, var(--navy-deep) 55%, transparent) 0%, transparent 42%), radial-gradient(ellipse 70% 40% at 50% 0%, oklch(1 0 0 / 0.14), transparent 70%)",
                  }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-[2.5rem]"
                  style={{ boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.16)" }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
