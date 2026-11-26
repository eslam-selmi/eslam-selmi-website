import { Link } from "@tanstack/react-router";
import { BarChart3, Target, GraduationCap, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";
import { TOOLS, TOOL_IDS } from "@/lib/tools";

const ICONS = { tna: BarChart3, perf: Target, exam: GraduationCap } as const;

/** Home-page entry for the interactive tools. Each card follows its own site_content flag. */
export function ToolsSection() {
  const { lang } = useI18n();
  const { isVisible } = useSiteContent();
  const ids = TOOL_IDS.filter((id) => isVisible(TOOLS[id].siteKeys.home));
  if (ids.length === 0) return null;
  const ar = lang === "ar";
  return (
    <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
      <div className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] border border-foreground/10 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.28em] text-foreground font-bold mb-5"><span className="size-1.5 rounded-full bg-accent" />{ar ? "الأدوات" : "Tools"}</div>
      <h2 className="font-display leading-[1.05] tracking-tight text-foreground section-title">{ar ? "أدوات تفاعلية" : "Interactive tools"}</h2>
      <p className="mt-4 text-foreground/70 max-w-2xl">{ar ? "أدوات تعمل مباشرة في الموقع، وبياناتك تُحفظ على حسابك. تحتاج تسجيل دخول وصلاحية من الإدارة." : "Tools that run on the site, with your data saved to your account. Requires sign-in and access from the administrator."}</p>
      <div className="mt-10 lg:mt-12 grid gap-4 sm:grid-cols-2">
        {ids.map((id) => {
          const Icon = ICONS[id];
          const m = TOOLS[id];
          return (
            <Link key={id} to="/tools" search={{ t: id }} className="group rounded-2xl border border-foreground/10 bg-card/70 p-6 flex gap-4 items-start hover:-translate-y-0.5 transition">
              <span className="size-11 rounded-xl grid place-items-center bg-[var(--gold)]/15 text-[var(--accent)] shrink-0"><Icon className="size-5" /></span>
              <span className="flex-1">
                <b className="block text-lg">{ar ? m.ar : m.en}</b>
                <span className="block text-sm text-foreground/70 mt-1">{ar ? m.descAr : m.descEn}</span>
              </span>
              <ArrowRight className="size-4 rtl-flip opacity-60 mt-1" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
