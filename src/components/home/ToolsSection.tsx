import { Link } from "@tanstack/react-router";
import { BarChart3, Target, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSiteContent } from "@/lib/site-content";
import { TOOLS, TOOL_IDS } from "@/lib/tools";

const ICONS = { tna: BarChart3, perf: Target } as const;

/** Home-page entry for the interactive tools. Each card follows its own site_content flag. */
export function ToolsSection() {
  const { lang } = useI18n();
  const { isVisible } = useSiteContent();
  const ids = TOOL_IDS.filter((id) => isVisible(TOOLS[id].siteKeys.home));
  if (ids.length === 0) return null;
  const ar = lang === "ar";
  return (
    <section id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
      <h2 className="text-2xl sm:text-3xl font-extrabold">{ar ? "أدوات تفاعلية" : "Interactive tools"}</h2>
      <p className="mt-2 text-foreground/70 max-w-2xl">{ar ? "أدوات تعمل مباشرة في الموقع، وبياناتك تُحفظ على حسابك. تحتاج تسجيل دخول وصلاحية من الإدارة." : "Tools that run on the site, with your data saved to your account. Requires sign-in and access from the administrator."}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
