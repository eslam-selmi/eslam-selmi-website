import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { Award, ExternalLink, Calendar, ArrowRight, MessageCircle, Mic, Linkedin, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import etecLicenseAsset from "@/assets/etec-license.png.asset.json";
import { openCalendly } from "@/components/home/data";
import { useSiteProfile } from "@/lib/site-profile";
import { portraitSources } from "@/lib/optimized-images";

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
          <motion.button
            type="button"
            onClick={() => setLicenseOpen(true)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="group inline-flex items-center gap-2.5 rounded-full border border-foreground/10 bg-card/60 backdrop-blur-sm px-3.5 py-2 w-fit cursor-pointer hover:border-[var(--gold)]/50 hover:shadow-[0_10px_30px_-12px_var(--gold)] transition"
          >
            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--gold)] to-[var(--gold-soft)] p-1.5 shadow">
              <Award className="size-4 text-accent-foreground" />
            </span>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground">
              <img
                src="https://flagcdn.com/sa.svg"
                alt=""
                loading="lazy"
                className="w-4 h-3 rounded-sm object-cover"
              />
              {lang === "ar"
                ? "مدرب معتمد من هيئة تقويم التعليم والتدريب بالمملكة العربية السعودية"
                : "Certified Trainer by ETEC, Saudi Arabia"}
              <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-[var(--gold)] transition" />
            </span>
          </motion.button>

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
            className="flex flex-wrap gap-3 pt-2"
          >
            <button
              onClick={openCalendly}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-sm font-bold text-primary-foreground shadow-[0_18px_40px_-14px_oklch(0.22_0.06_252/0.5)] hover:translate-y-[-2px] transition cursor-pointer"
            >
              <Calendar className="size-4" /> {t("hero_btn_book")}
              <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
            </button>
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 bg-card px-7 py-4 text-sm font-bold text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] transition"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a
              href="#podcast"
              aria-label="Listen to the L&D Podcast"
              className="group relative inline-flex items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white overflow-hidden shadow-[0_18px_40px_-14px_oklch(0.55_0.2_290/0.55)] hover:translate-y-[-2px] transition"
              style={{
                background: "linear-gradient(135deg, oklch(0.32 0.13 280), oklch(0.55 0.18 200))",
              }}
            >
              <span className="relative grid place-items-center size-6 rounded-full bg-white/15 backdrop-blur-sm">
                <Mic className="size-3.5" />
                <span className="absolute inset-0 rounded-full ring-2 ring-white/40 animate-ping" />
              </span>
              <span className="relative">{t("listen_podcast")}</span>
              <ArrowRight className="relative size-4 group-hover:translate-x-1 rtl-flip transition" />
            </a>
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
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="size-10 rounded-full border border-foreground/15 grid place-items-center text-foreground/70 hover:text-foreground hover:border-foreground/30 transition"
            >
              <MessageCircle className="size-4" />
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
