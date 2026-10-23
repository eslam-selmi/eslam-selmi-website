import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { PILLARS, PROGRAMS, SERVICES, fadeUp } from "./data";
import { Section } from "./shared";
import { useSiteProfile } from "@/lib/site-profile";
import { useSiteMedia } from "@/lib/site-media";
import { programMedia, mediaImage } from "@/lib/site-media-data";
import { Button } from "@/components/ui/button";

export function Pillars() {
 const { t } = useI18n();
 return <Section id="pillars" eyebrow={t("pillars_eyebrow")} title={t("pillars_title")}><div className="edition-pillars">{PILLARS.map((p,i)=><motion.article {...fadeUp} key={p.key} className="edition-pillar"><div className="edition-pillar-top"><span>0{i+1}</span><p.icon className="size-7" strokeWidth={1.3}/></div><h3>{t(`pillar_${p.key}`)}</h3><p>{t(`pillar_${p.key}_desc`)}</p></motion.article>)}</div></Section>;
}
export function Journey() {
 const {t,lang}=useI18n();
 const {data:items=[]}=useQuery({queryKey:["home","active-contracts"],staleTime:300_000,queryFn:async()=>{const {data,error}=await supabase.from("contracts").select("id,year,role_en,role_ar,org_en,org_ar,industry_en,industry_ar,country_en,country_ar,is_current").eq("is_active",true).order("display_order",{ascending:true});if(error)throw error;return data??[];}});
 return <Section id="journey" eyebrow={t("journey_eyebrow")} title={t("journey_title")}><div className="edition-timeline">{items.map((j)=><motion.article {...fadeUp} key={j.id}><div className="edition-year">{j.is_current ? (lang==="ar"?"حالياً":"Present"):j.year}</div><div><h3>{lang==="ar"?j.org_ar:j.org_en||j.org_ar}</h3><p>{lang==="ar"?j.role_ar:j.role_en||j.role_ar}</p></div><div className="edition-timeline-meta"><span>{lang==="ar"?j.industry_ar:j.industry_en||j.industry_ar}</span><span>{lang==="ar"?j.country_ar:j.country_en||j.country_ar}</span></div></motion.article>)}</div></Section>;
}
export function Services(){
 const {t,lang}=useI18n();const {links}=useSiteProfile();
 return <Section id="services" eyebrow={t("services_eyebrow")} title={t("services_title")}><p className="edition-section-description">{t("services_subtitle")}</p><div className="edition-services">{SERVICES.map((s,i)=><motion.article {...fadeUp} key={s.key}><span className="edition-service-number">0{i+1}</span><s.icon className="size-6 text-accent"/><div><h3>{s.title[lang]}</h3><p>{s.desc[lang]}</p></div><Button asChild variant="outline" size="icon" className="rounded-full shrink-0"><a href={`${links.whatsapp}?text=${encodeURIComponent(lang==="ar"?`مرحبًا إسلام، أرغب في طلب خدمة: ${s.title.ar}. هل يمكننا التحدث؟`:`Hi Eslam, I'd like to request the "${s.title.en}" service. Can we chat?`)}`} target="_blank" rel="noopener noreferrer" aria-label={`${t("svc_request_btn")} — ${s.title[lang]}`} title={t("svc_request_btn")}><ArrowUpRight className="size-5 rtl-flip"/></a></Button></motion.article>)}</div></Section>;
}
export function Programs(){
 const {t,lang}=useI18n();const {data:media}=useSiteMedia();
 return <Section id="programs" eyebrow={t("programs_eyebrow")} title={t("programs_title")}><div className="edition-programs">{PROGRAMS.map((p,i)=><motion.article {...fadeUp} key={p.track.en}><div className="edition-program-image"><img src={mediaImage(media?.media??{},`program:${programMedia[i]?.key}`,programMedia[i]?.image??programMedia[0].image)} alt={p.track[lang]} width={1280} height={720} loading="lazy" decoding="async"/><span>0{i+1}</span></div><div className="edition-program-body"><div className="flex justify-between items-center text-accent text-xs"><span>{t("programs_track")}</span><GraduationCap className="size-5"/></div><h3>{p.track[lang]}</h3><p>{p.intro[lang]}</p><ol>{p.items.map((it,idx)=><li key={it.name.en}><span>0{idx+1}</span><div><h4>{it.name[lang]}</h4><p>{it.desc[lang]}</p></div></li>)}</ol><div className="edition-program-meta">{p.items.length} {lang==="ar"?"محاور":"modules"}</div></div></motion.article>)}</div></Section>;
}
