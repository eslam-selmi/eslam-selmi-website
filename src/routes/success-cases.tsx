import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, X, Sparkles, Target, Wrench, Trophy, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Nav, Footer, WhatsAppFloat, AskSelmiFloat, CalendlyDialog } from "./index";

type SuccessCase = {
  id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  challenges_ar: string | null;
  challenges_en: string | null;
  solutions_ar: string | null;
  solutions_en: string | null;
  results_ar: string | null;
  results_en: string | null;
  tools: string[] | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  external_url: string | null;
  display_order: number;
};

export const Route = createFileRoute("/success-cases")({
  head: () => ({
    meta: [
      { title: "Success Cases — Eslam Selmi" },
      {
        name: "description",
        content:
          "حالات نجاح فعلية في التعلم والتطوير وإدارة المواهب والأداء — التحديات، الحلول، والنتائج.",
      },
      { property: "og:title", content: "Success Cases — Eslam Selmi" },
      {
        property: "og:description",
        content:
          "Real-world L&D, Talent and Performance success cases — challenges, solutions, and measurable results.",
      },
    ],
    links: [{ rel: "canonical", href: "https://eslam-selmi.lovable.app/success-cases" }],
  }),
  component: SuccessCasesPage,
});

function SuccessCasesPage() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tt = (a: string, b: string) => (isAr ? a : b);
  const [items, setItems] = useState<SuccessCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SuccessCase | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("success_cases" as any)
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      setItems(((data as unknown) as SuccessCase[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <Nav />
      <main className="pt-24 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-start mb-12">
            <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.32em] uppercase text-[var(--gold)] font-bold">
              <span className="h-px w-8 bg-[var(--gold)]/70" />
              {tt("حالات نجاح", "Success Cases")}
            </span>
            <h1 className="mt-4 font-display font-extrabold text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.1]">
              {tt("تجارب وممارسات من الواقع المهني", "Real-world experiences and practices")}
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
              {tt(
                "كل حالة تروي قصة تحدٍّ وحلول مدروسة ونتائج قابلة للقياس.",
                "Every case tells a story of challenge, deliberate solutions, and measurable results.",
              )}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">{tt("جارٍ التحميل…", "Loading…")}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-dashed border-foreground/15 text-muted-foreground">
              {tt("لا توجد حالات منشورة بعد.", "No published cases yet.")}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((c, i) => {
                const name = isAr ? c.name_ar : c.name_en || c.name_ar;
                const desc = isAr ? c.description_ar : c.description_en;
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelected(c)}
                    className="group relative text-start flex flex-col rounded-[2.25rem] overflow-hidden border border-[#CD853F]/55 bg-gradient-to-br from-[#CD853F]/[0.14] via-[#8B4513]/[0.05] to-background shadow-[0_24px_70px_-30px_rgba(205,133,63,0.55)] transition-all duration-500 hover:-translate-y-1.5"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#CD853F] via-[#E8A87C] to-[#8B4513]" />
                    {c.cover_image_url && (
                      <img
                        src={c.cover_image_url}
                        alt={name}
                        className="w-full aspect-[16/10] object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="p-6 lg:p-7 flex flex-col flex-1">
                      <h3 className="font-display font-bold text-xl leading-tight">{name}</h3>
                      {desc && (
                        <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                          {desc}
                        </p>
                      )}
                      {c.tools && c.tools.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {c.tools.slice(0, 4).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-[#CD853F]/15 text-[#E8A87C] border border-[#CD853F]/30 font-semibold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-5 pt-4 border-t border-foreground/10 inline-flex items-center gap-2 text-xs font-bold" style={{ color: "#E8A87C" }}>
                        {tt("اقرأ التفاصيل", "Read case")}
                        <ArrowRight className="size-3 rtl-flip group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFloat />
      <AskSelmiFloat />
      <CalendlyDialog />

      {selected && (
        <SuccessCaseModal item={selected} isAr={isAr} dir={dir} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function SuccessCaseModal({
  item,
  isAr,
  dir,
  onClose,
}: {
  item: SuccessCase;
  isAr: boolean;
  dir: string;
  onClose: () => void;
}) {
  const tt = (a: string, b: string) => (isAr ? a : b);
  const name = isAr ? item.name_ar : item.name_en || item.name_ar;
  const desc = isAr ? item.description_ar : item.description_en;
  const ch = isAr ? item.challenges_ar : item.challenges_en;
  const sol = isAr ? item.solutions_ar : item.solutions_en;
  const res = isAr ? item.results_ar : item.results_en;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      dir={dir}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-auto rounded-3xl bg-card shadow-2xl border border-foreground/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative p-7 sm:p-10 text-white"
          style={{
            background:
              "linear-gradient(135deg, #0b1736 0%, #14224d 50%, #1f2a5a 100%)",
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 end-4 size-9 grid place-items-center rounded-full bg-white/15 hover:bg-white/25 text-white transition"
          >
            <X className="size-4" />
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em]">
            <Sparkles className="size-3" /> {tt("حالة نجاح", "Success Case")}
          </span>
          <h2 className="mt-4 font-display font-extrabold text-2xl sm:text-3xl leading-tight">{name}</h2>
          {desc && <p className="mt-4 text-white/85 leading-relaxed">{desc}</p>}
        </div>

        {item.cover_image_url && (
          <img src={item.cover_image_url} alt={name} className="w-full aspect-[16/8] object-cover" />
        )}

        <div className="p-7 sm:p-10 space-y-5">
          {ch && <CaseBlock icon={AlertTriangle} title={tt("التحديات", "Challenges")} body={ch} tone="amber" />}
          {sol && <CaseBlock icon={Target} title={tt("الحلول والتنفيذ", "Solutions & Execution")} body={sol} tone="blue" />}
          {res && <CaseBlock icon={Trophy} title={tt("النتائج", "Results")} body={res} tone="gold" />}

          {item.tools && item.tools.length > 0 && (
            <div className="rounded-2xl bg-foreground/[0.04] border border-foreground/10 p-5">
              <div className="flex items-center gap-2 text-xs font-bold mb-3" style={{ color: "var(--gold)" }}>
                <Wrench className="size-4" /> {tt("الأدوات المستخدمة", "Tools used")}
              </div>
              <div className="flex flex-wrap gap-2">
                {item.tools.map((t) => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full bg-foreground/10 font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.gallery_urls && item.gallery_urls.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3">
              {item.gallery_urls.map((u, i) => (
                <img key={i} src={u} alt="" className="w-full aspect-video object-cover rounded-2xl border border-foreground/10" loading="lazy" />
              ))}
            </div>
          )}

          {item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-bold hover:opacity-90 transition"
            >
              {tt("المزيد من التفاصيل", "More details")}
              <ArrowRight className="size-4 rtl-flip" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CaseBlock({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: any;
  title: string;
  body: string;
  tone: "amber" | "blue" | "gold";
}) {
  const toneStyles =
    tone === "amber"
      ? { color: "#E8A87C", border: "rgba(232,168,124,0.3)", bg: "rgba(232,168,124,0.08)" }
      : tone === "blue"
        ? { color: "#7DB4FF", border: "rgba(125,180,255,0.3)", bg: "rgba(125,180,255,0.08)" }
        : { color: "var(--gold)", border: "color-mix(in oklab, var(--gold) 30%, transparent)", bg: "color-mix(in oklab, var(--gold) 8%, transparent)" };
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: toneStyles.bg, borderColor: toneStyles.border }}
    >
      <div className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: toneStyles.color }}>
        <Icon className="size-4" /> {title}
      </div>
      <p className="text-sm text-foreground/85 leading-[1.95] whitespace-pre-wrap">{body}</p>
    </div>
  );
}
