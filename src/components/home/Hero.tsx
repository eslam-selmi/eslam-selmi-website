import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ArrowDown, ArrowUpRight, Award, Linkedin, Mail, Mic } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import etecLicenseAsset from "@/assets/etec-license.png.asset.json";
import { openCalendly } from "@/components/home/data";
import { useSiteProfile } from "@/lib/site-profile";
import { portraitSources } from "@/lib/optimized-images";

export function Hero() {
  const { profile, links } = useSiteProfile();
  const portrait = portraitSources(profile.portrait);
  const { t, lang } = useI18n();
  const reduced = useReducedMotion();
  const [licenseOpen, setLicenseOpen] = useState(false);
  return (
    <section id="home" className="edition-cover">
      <div className="edition-cover-top"><span>{lang === "ar" ? "حلول مبتكرة لبناء القدرات" : "Innovative Solutions for Building"}</span><span dir="ltr">L&D / TALENT / PERFORMANCE</span></div>
      <motion.h1 initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }} className="edition-name">{lang === "ar" ? "إسلام سلمي" : "Eslam Selmi"}<span className="edition-name-period">.</span></motion.h1>
      <div className="edition-cover-stage">
        <div className="edition-cover-copy">
          <p className="edition-position">{lang === "ar" ? "نُنمّي القدرات البشرية لصناعة المستقبل" : "Unlocking Talent Potential"}</p>
          <p className="edition-intro">{t("hero_intro")}</p>
          <Button onClick={openCalendly} className="edition-primary rounded-full h-12 px-6">{t("hero_btn_book")}<ArrowUpRight className="size-4 rtl-flip" /></Button>
          <div className="edition-social"><a href={links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><Linkedin className="size-4"/></a><a href={links.email} aria-label="Email"><Mail className="size-4"/></a><a href={links.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp<ArrowUpRight className="size-3"/></a></div>
        </div>
        <motion.div className="edition-portrait" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          <img src={portrait.src} srcSet={portrait.srcSet} sizes="(min-width: 1024px) 600px, 90vw" alt="Eslam Selmi" width={960} height={960} fetchPriority="high" loading="eager" decoding="async"/>
        </motion.div>
        <div className="edition-cover-aside">
          <span className="edition-aside-label">{lang === "ar" ? "التعلّم يصنع الفارق." : "Learning makes the difference."}</span>
          <Button variant="ghost" onClick={()=>setLicenseOpen(true)} className="edition-credential"><Award className="size-6 shrink-0"/><span>{lang === "ar" ? "مدرب معتمد من هيئة تقويم التعليم والتدريب بالمملكة العربية السعودية" : "Certified Trainer by ETEC, Saudi Arabia"}<ArrowUpRight className="inline size-3 ms-1"/></span></Button>
          <a href="#podcast" className="edition-podcast"><Mic className="size-4"/>{t("listen_podcast")}<ArrowUpRight className="size-4 rtl-flip"/></a>
        </div>
      </div>
      <div className="edition-cover-bottom"><span>{lang === "ar" ? "المواهب · الأداء · الأثر" : "PEOPLE. PERFORMANCE. IMPACT."}</span><a href="#pillars">{lang === "ar" ? "اكتشف المسيرة" : "Explore the story"}<ArrowDown className="size-4"/></a><span dir="ltr">01 — ES</span></div>
      <Dialog open={licenseOpen} onOpenChange={setLicenseOpen}><DialogContent className="max-w-3xl p-3 bg-card"><img src={etecLicenseAsset.url} alt={lang === "ar" ? "رخصة مدرب مهنية — هيئة تقويم التعليم والتدريب" : "Professional Trainer License — ETEC"} className="w-full h-auto rounded-lg"/></DialogContent></Dialog>
    </section>
  );
}
