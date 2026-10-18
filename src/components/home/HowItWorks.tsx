import { Search, SlidersHorizontal, GraduationCap, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SectionHeader } from "@/components/home/shared";
import { openCalendly } from "@/components/home/data";

export function HowItWorks() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const steps = [
    { icon: Search, t: ar ? "التحليل" : "Analysis", d: ar ? "نحلل احتياجاتك التدريبية مجانًا ونحدد أفضل البرامج المناسبة لأهدافك." : "We assess your training needs — free — and map the best programs for your goals." },
    { icon: SlidersHorizontal, t: ar ? "التخطيط والتخصيص" : "Plan & customize", d: ar ? "نصمم معًا تجربة تعلم مخصصة وتفاعلية بالأسلوب الذي يناسب فريقك." : "Together we design an expert-led, interactive learning experience that fits your team." },
    { icon: GraduationCap, t: ar ? "التطبيق والاعتماد" : "Implement & certify", d: ar ? "يطبّق فريقك المعرفة ويطوّر المهارة ويحصل على شهادة معتمدة قابلة للتحقق." : "Your team applies the skill and earns a verifiable certificate to prove it." },
  ];
  return (
    <section className="editorial-section process-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow={ar ? "كيف نعمل" : "How it works"} title={ar ? "من الاحتياج التدريبي إلى شهادة معتمدة." : "From training need to recognized credential."} />
        <div className="relative mt-16 grid gap-12 md:grid-cols-3">
          <div className="pointer-events-none absolute inset-x-[16%] top-10 hidden border-t-2 border-dashed border-foreground/10 md:block" aria-hidden />
          {steps.map((s, i) => (
            <div key={s.t} className="process-card relative text-start">
              <div className="relative grid size-20 place-items-center rounded-3xl border border-accent/25 bg-card shadow-[0_20px_40px_-24px_color-mix(in_oklab,var(--navy-deep)_45%,transparent)]">
                <s.icon className="size-7 text-accent" />
                <span className="absolute -top-3 -end-3 grid size-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground ring-4 ring-background">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-foreground">{s.t}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-24 overflow-hidden rounded-[2.5rem] border border-accent/25 px-8 py-14 text-foreground sm:px-14" style={{ background: "radial-gradient(ellipse 60% 120% at 100% 0%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 60%), linear-gradient(135deg, var(--card), color-mix(in oklab, var(--card) 70%, var(--navy-deep)))", boxShadow: "0 40px 120px -50px color-mix(in oklab, var(--accent) 60%, transparent)" }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "22px 22px" }} aria-hidden />
          <span className="pointer-events-none absolute -bottom-10 end-4 select-none font-display text-[9rem] font-extrabold leading-none text-accent opacity-[0.1] sm:text-[13rem]" aria-hidden>1:1</span>
          <div className="relative grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-70">{ar ? "مجانًا · بدون التزام" : "Free · No commitment"}</p>
              <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight">
                {ar ? "احجز جلسة استشارية مجانية الآن." : "Book a free 1:1 session. Right now."}
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed opacity-80">
                {ar ? "دقائق قليلة نتحدث فيها عن فريقك وأهدافك، لنخرج بخطة تدريب واضحة قبل أن تنفق أي شيء." : "A short conversation about your team and goals — you leave with a clear training plan before spending anything."}
              </p>
            </div>
            <button onClick={openCalendly} className="group inline-flex w-fit items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-bold text-accent-foreground shadow-[0_18px_50px_-15px_var(--accent)] transition hover:-translate-y-0.5 cursor-pointer">
              {ar ? "احجز الآن" : "Book now"} <ArrowRight className="size-4 rtl-flip transition group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
