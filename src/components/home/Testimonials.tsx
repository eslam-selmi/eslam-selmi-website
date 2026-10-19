import { BookingDialog } from "@/components/booking/BookingDialog";
import { TraineeReviews } from "@/components/TraineeReviews";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform, MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Globe2,
  Layers,
  MessageCircle,
  Mail,
  Linkedin,
  Phone,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Calendar,
  Target,
  Lightbulb,
  HeartHandshake,
  GraduationCap,
  Award,
  Users,
  TrendingUp,
  BarChart3,
  UserCheck,
  Languages,
  ArrowUp,
  Loader2,
  Briefcase,
  BadgeCheck,
  
  Presentation,
  Moon,
  Sun,
  Mic,
  BookOpen,
  Library as LibraryIcon,
  FileText,
  Download,
  ExternalLink,
  Rocket,
  Wand2,
  Mail as MailIcon,
  Palette,
  Trello,
  Table2,
  Bot,
  Quote,
  ShieldCheck,
  KeyRound,
  LogIn,
  Clock,
  User as UserIcon,
  MessageSquare,
  Check,
  Video,
  PlayCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LatestAdditionsSection } from "@/components/LatestAdditions";
import { useSiteContent } from "@/lib/site-content";
import { SitePopup } from "@/components/SitePopup";
import { UniversalEmbedModal } from "@/components/UniversalEmbedModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  COUNTRIES as PHONE_COUNTRIES,
  findCountry as findDialCountry,
  sanitizeNationalNumber,
  validatePhoneForCountry,
} from "@/lib/countries";
import headshotAsset from "@/assets/portfolio/headshot-cutout.png.asset.json";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import snap1Asset from "@/assets/snapshots/snap-1.jpg.asset.json";
import snap2Asset from "@/assets/snapshots/snap-2.jpg.asset.json";
import snap3Asset from "@/assets/snapshots/snap-3.jpg.asset.json";
import snap4Asset from "@/assets/snapshots/snap-4.jpg.asset.json";
import snap5Asset from "@/assets/snapshots/snap-5.jpg.asset.json";
import snap6Asset from "@/assets/snapshots/snap-6.jpg.asset.json";
import snap7Asset from "@/assets/snapshots/snap-7.jpg.asset.json";
import etecLicenseAsset from "@/assets/etec-license.png.asset.json";
import snap8Asset from "@/assets/snapshots/snap-8.jpg.asset.json";
import logoAramexAsset from "@/assets/clients/aramex.jpg.asset.json";
import logoG4sAsset from "@/assets/clients/g4s.jpg.asset.json";
import logoAllerAquaAsset from "@/assets/clients/aller-aqua.jpg.asset.json";
import logoEvnoAsset from "@/assets/clients/evno.jpg.asset.json";
import logoBadreldinAsset from "@/assets/clients/badreldin.jpg.asset.json";
import logoAmazonEgAsset from "@/assets/clients/amazon-eg.jpg.asset.json";
import logoAlmajarahAsset from "@/assets/clients/almajarah.jpg.asset.json";
import logoImtenanAsset from "@/assets/clients/imtenan.jpg.asset.json";
import logoDaralnokbaAsset from "@/assets/clients/daralnokba.jpg.asset.json";
import logoMallOfEgyptAsset from "@/assets/clients/mall-of-egypt.jpg.asset.json";
import logoNewBrandAsset from "@/assets/clients/new-brand.jpg.asset.json";
import snap10Asset from "@/assets/snapshots/snap-10.jpg.asset.json";
import snap11Asset from "@/assets/snapshots/snap-11.jpg.asset.json";
import snap12Asset from "@/assets/snapshots/snap-12.jpg.asset.json";
import snap13Asset from "@/assets/snapshots/snap-13.jpg.asset.json";
import snap15Asset from "@/assets/snapshots/snap-15.jpg.asset.json";
import snap16Asset from "@/assets/snapshots/snap-16.jpg.asset.json";
import { TestimonialRow, WHATSAPP, fadeUp, openCalendly } from "@/components/home/data";
import { useSiteProfile } from "@/lib/site-profile";
import { Section } from "@/components/home/shared";
import { Button } from "@/components/ui/button";

export function Testimonials() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("testimonials" as any)
        .select("id,name,role,company,quote,avatar_url,rating")
        .eq("is_visible", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      setItems(((data as unknown) as TestimonialRow[]) ?? []);
      setLoaded(true);
    })();
  }, []);

  if (loaded && items.length === 0) return null;

  return (
    <Section
      id="testimonials"
      eyebrow={tt("شهادات", "Testimonials")}
      title={tt("شهادات نعتز بها", "Testimonials We Cherish")}
    >
      {!loaded ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          {tt("جارٍ التحميل…", "Loading…")}
        </div>
      ) : (
        <TestimonialsScroller items={items} isAr={isAr} />
      )}
    </Section>
  );
}

export function TestimonialsScroller({ items, isAr }: { items: TestimonialRow[]; isAr: boolean }) {
  const tt = (a: string, b: string) => (isAr ? a : b);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ down: boolean; startX: number; startScroll: number; moved: boolean }>(
    { down: false, startX: 0, startScroll: 0, moved: false },
  );

  function onMouseDown(e: React.MouseEvent) {
    const el = scrollerRef.current;
    if (!el) return;
    dragState.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false };
    el.classList.add("cursor-grabbing");
  }
  function onMouseMove(e: React.MouseEvent) {
    const el = scrollerRef.current;
    const s = dragState.current;
    if (!el || !s.down) return;
    const dx = e.pageX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    el.scrollLeft = s.startScroll - dx;
  }
  function endDrag() {
    const el = scrollerRef.current;
    if (!el) return;
    dragState.current.down = false;
    el.classList.remove("cursor-grabbing");
  }
  function scrollByCards(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("article");
    const step = card ? (card as HTMLElement).offsetWidth + 24 : 360;
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  }

  return (
    <div className="relative -mx-4 sm:-mx-6">
      {/* Arrow controls (desktop) */}
      <div className="hidden md:flex absolute inset-y-0 start-2 z-10 items-center">
        <button
          type="button"
          onClick={() => scrollByCards(isAr ? 1 : -1)}
          aria-label={tt("السابق", "Previous")}
          className="size-11 grid place-items-center rounded-full bg-background/80 backdrop-blur border border-foreground/15 shadow-lg hover:scale-105 hover:bg-background transition"
        >
          <ArrowRight className="size-4 rotate-180 rtl-flip" />
        </button>
      </div>
      <div className="hidden md:flex absolute inset-y-0 end-2 z-10 items-center">
        <button
          type="button"
          onClick={() => scrollByCards(isAr ? -1 : 1)}
          aria-label={tt("التالي", "Next")}
          className="size-11 grid place-items-center rounded-full bg-background/80 backdrop-blur border border-foreground/15 shadow-lg hover:scale-105 hover:bg-background transition"
        >
          <ArrowRight className="size-4 rtl-flip" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={endDrag}
        onMouseUp={endDrag}
        className="flex gap-6 overflow-x-auto px-4 sm:px-12 pb-6 pt-2 snap-x snap-mandatory cursor-grab select-none scroll-smooth"
        style={{
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 4%, #000 96%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 4%, #000 96%, transparent 100%)",
        }}
      >
        <style>{`.cursor-grab::-webkit-scrollbar{display:none}`}</style>
        {items.map((it) => (
          <article
            key={it.id}
            onDragStart={(e) => e.preventDefault()}
            className="group relative w-[300px] sm:w-[360px] lg:w-[400px] shrink-0 snap-center flex flex-col rounded-[2rem] overflow-hidden border border-foreground/10 bg-gradient-to-br from-card via-card to-card/80 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] transition-all duration-500 md:hover:-translate-y-2 md:hover:border-[var(--gold)]/45 md:hover:shadow-[0_40px_100px_-40px_color-mix(in_oklab,var(--gold)_45%,transparent)]"
          >
            <div className="h-[3px] w-full bg-gradient-to-r from-[var(--gold)] via-[#E8C77C] to-[var(--gold)]" />
            <div className="pointer-events-none absolute -top-24 -end-24 size-64 rounded-full blur-3xl bg-[var(--gold)]/12 opacity-0 md:group-hover:opacity-100 transition duration-700" />

            <div className="relative p-7 lg:p-8 flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <div
                  className="size-12 grid place-items-center rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10"
                  aria-hidden
                >
                  <Quote className="size-5" style={{ color: "var(--gold)" }} />
                </div>
                {it.rating != null && it.rating > 0 && (
                  <div className="flex items-center gap-0.5" aria-label={`${it.rating}/5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${i < (it.rating ?? 0) ? "text-[var(--gold)]" : "text-foreground/15"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-5 text-[15px] leading-[2] text-foreground/90 whitespace-pre-line flex-1 line-clamp-7">
                {it.quote}
              </p>

              <div className="mt-7 pt-5 border-t border-foreground/10 flex items-center gap-3.5">
                {it.avatar_url ? (
                  <img
                    src={it.avatar_url}
                    alt={it.name}
                    loading="lazy"
                    draggable={false}
                    className="size-12 rounded-full object-cover border border-[var(--gold)]/30 shadow"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-gradient-to-br from-[var(--gold)]/40 to-[var(--accent)]/30 grid place-items-center font-display font-bold text-base text-foreground border border-[var(--gold)]/30">
                    {it.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-display font-bold text-[15px] truncate text-foreground">{it.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {[it.role, it.company].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


/* ---------- BOOK CTA ---------- */

export function BookCTA() {
  const { lang } = useI18n();
  return (
    <section id="book" className="booking-reference-section px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-[1400px]">
        <motion.div {...fadeUp} className="booking-reference-banner relative isolate grid min-h-[188px] items-center gap-8 overflow-hidden rounded-[48px] border px-7 py-8 sm:px-12 lg:grid-cols-[1fr_210px] lg:gap-14 lg:px-[70px] lg:py-10">
          <span aria-hidden="true" dir="ltr" className="booking-reference-watermark pointer-events-none absolute bottom-[-62px] left-5 -z-10 select-none font-display text-[200px] font-extrabold leading-none">1:1</span>
          <div className="min-w-0">
            <p className="booking-reference-muted text-sm font-semibold">{lang === "ar" ? "مجانًا · بدون التزام" : "Free · No commitment"}</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">{lang === "ar" ? "احجز جلسة استشارية مجانية الآن." : "Book your free consultation now."}</h2>
            <p className="booking-reference-muted mt-4 text-base font-semibold leading-relaxed lg:text-lg">{lang === "ar" ? "دقائق قليلة نتحدث فيها عن فريقك وأهدافك، لنخرج بخطة تدريب واضحة قبل أن تنفق أي شيء." : "A few minutes to discuss your team and goals, and create a clear training plan before you spend anything."}</p>
          </div>
          <Button onClick={openCalendly} size="lg" className="booking-reference-button group h-14 w-[164px] justify-center gap-3 rounded-full text-base font-bold lg:justify-self-end">
            {lang === "ar" ? "احجز الآن" : "Book now"}<ArrowRight className="size-5 rtl-flip transition-transform motion-safe:group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
