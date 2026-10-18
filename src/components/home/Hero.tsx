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
      className="editorial-hero relative pt-32 pb-16 lg:pt-44 lg:pb-24 overflow-hidden"
    >
      {/* Soft background wash */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 45% 55% at 20% 30%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 65%), radial-gradient(ellipse 40% 40% at 90% 85%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 60%)",
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
        <motion.div style={{ y: isMobile || reduceMotion ? 0 : y }} className="lg:col-span-7 order-1 space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-card px-4 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-accent shadow-sm"
          >
            <span className="size-2 rounded-full bg-accent animate-pulse" />
            {lang === "ar" ? "حلول مبتكرة لبناء القدرات" : "Innovative Solutions for Building"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display font-extrabold tracking-tight text-balance leading-[1.02] text-[clamp(2.8rem,6.4vw,5.6rem)] text-foreground"
          >
            {lang === "ar" ? (
              <>
                إطلاق إمكانات المواهب مع <span className="text-accent">{nameAr}</span>
              </>
            ) : (
              <>
                Unlocking Talent Potential With{" "}
                <span className="text-accent">{nameEn}</span>
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
            className="group inline-flex items-center gap-2.5 rounded-full border border-foreground/10 bg-card/60 backdrop-blur-sm px-3.5 py-2 w-fit cursor-pointer hover:border-[var(--accent)]/50 hover:shadow-[0_10px_30px_-12px_var(--accent)] transition"
          >
            <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent)] p-1.5 shadow">
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
              <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-[var(--accent)] transition" />
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
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-bold text-primary-foreground shadow-[0_18px_40px_-14px_oklch(0.22_0.06_252/0.5)] hover:translate-y-[-2px] transition cursor-pointer"
            >
              <Calendar className="size-4" /> {t("hero_btn_book")}
              <ArrowRight className="size-4 group-hover:translate-x-1 rtl-flip transition" />
            </button>
            <a
              href={links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-7 py-4 text-sm font-bold text-foreground hover:border-foreground/30 hover:bg-foreground/[0.03] transition"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a
              href="#podcast"
              aria-label="Listen to the L&D Podcast"
              className="group relative inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-bold text-white overflow-hidden shadow-[0_18px_40px_-14px_oklch(0.55_0.2_290/0.55)] hover:translate-y-[-2px] transition"
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

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="hero-stats grid max-w-xl grid-cols-1 divide-x divide-foreground/10 rtl:divide-x-reverse rounded-2xl border border-foreground/10 bg-card/50 py-4"
          >
            {[
              ["12", lang === "ar" ? "دولة" : "Countries"],
            ].map(([n, l]) => (
              <div key={l} className="px-3 text-center">
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-accent">{n}</div>
                <div className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Portrait — squircle with floating status cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 order-2 relative"
        >
          <div className="relative mx-auto w-full max-w-[380px] sm:max-w-[440px] lg:max-w-[520px]">
            <div className="pointer-events-none absolute -end-6 -top-6 size-40 rounded-full border-2 border-dashed border-accent/40" aria-hidden />
            <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[3rem] border border-accent/40" aria-hidden />
            <div
              className="relative overflow-hidden rounded-[3rem] rounded-tr-[7rem]"
              style={{
                background: "linear-gradient(165deg, var(--navy), var(--navy-deep))",
                boxShadow: "0 50px 100px -40px color-mix(in oklab, var(--navy-deep) 70%, transparent)",
              }}
            >
              <div className="relative aspect-[4/5] w-full">
                <img
                  src={portrait.src}
                  srcSet={portrait.srcSet}
                  sizes="(min-width: 1024px) 520px, (min-width: 640px) 440px, 380px"
                  loading="eager"
                  alt="Eslam Selmi"
                  width={1024}
                  height={1024}
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 h-full w-full scale-[1.04] object-cover object-top"
                />
              </div>
            </div>
            <div className="absolute -start-4 top-[52%] flex items-center gap-3 rounded-2xl border border-foreground/10 bg-card px-4 py-3 shadow-xl sm:-start-10">
              <span className="grid size-9 place-items-center rounded-xl bg-accent/15"><Calendar className="size-4 text-accent" /></span>
              <span className="text-start leading-tight">
                <span className="block text-xs font-bold text-foreground">{lang === "ar" ? "جلسة 1:1 مجانية" : "Free 1:1 session"}</span>
                <span className="block text-[11px] text-muted-foreground">{lang === "ar" ? "احجز موعدك اليوم" : "Book your slot today"}</span>
              </span>
            </div>
            <div className="absolute -end-3 bottom-8 flex items-center gap-3 rounded-2xl border border-foreground/10 bg-card px-4 py-3 shadow-xl sm:-end-8">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10"><Award className="size-4 text-primary" /></span>
              <span className="text-start leading-tight">
                <span className="block text-xs font-bold text-foreground">{lang === "ar" ? "شهادة معتمدة" : "Certificate issued"}</span>
                <span className="block text-[11px] text-muted-foreground">{lang === "ar" ? "قابلة للتحقق بمسح واحد" : "Verifiable with one scan"}</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
