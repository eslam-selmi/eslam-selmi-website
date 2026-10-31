import { DeferredBookingDialog } from "@/components/booking/DeferredBookingDialog";
import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { fadeUp } from "@/components/home/data";
import { useSiteProfile } from "@/lib/site-profile";
export function CalendlyDialog() {
  return <DeferredBookingDialog />;
}
/* ---------- BRAND MARK ---------- */
export function BrandMark({ size = 62 }: { size?: number }) {
  const { lang } = useI18n();
  const { profile } = useSiteProfile();
  const displayName = lang === "ar" ? "إسلام سلمي" : "Eslam Selmi";
  return (
    <div className="flex items-center gap-2">
      <img
        src={profile.logo}
        alt={displayName}
        width={size}
        height={size}
        className="shrink-0 object-contain drop-shadow-[0_1px_3px_rgba(80,120,255,0.2)] dark:[filter:drop-shadow(0_0_3px_rgba(255,255,255,0.25))_drop-shadow(0_0_8px_rgba(160,190,255,0.28))_brightness(1.08)]"
        style={{ width: size, height: size }}
        suppressHydrationWarning
      />
      <span className="flex items-center leading-none">
        <span
          className="font-display text-[15px] sm:text-[17px] font-bold tracking-tight text-foreground whitespace-nowrap"
          suppressHydrationWarning
        >
          {displayName}
        </span>
      </span>
    </div>
  );
}
export function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="font-display text-3xl sm:text-4xl text-foreground">{n}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{l}</div>
    </div>
  );
}
export function CompactStat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-3 text-center min-w-0">
      <div
        className="font-display text-xl sm:text-2xl font-extrabold leading-none truncate"
        style={{ color: "var(--accent)" }}
      >
        {n}
      </div>
      <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground truncate">
        {l}
      </div>
    </div>
  );
}
/* ---------- PILLARS ---------- */
export function isEmpowermentCourse(title: string | null | undefined): boolean {
  if (!title) return false;
  const t = title.trim().toLowerCase();
  return t.includes("أدوات التمكين") || t.includes("empowerment tools");
}
export function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="px-4 sm:px-6 py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      <div className="absolute -end-40 top-20 size-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className={title ? "mb-12 lg:mb-16" : "mb-0"}>
          {eyebrow && (
            <div className="inline-flex items-center gap-2 rounded-full bg-foreground/[0.06] border border-foreground/10 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.28em] text-foreground font-bold mb-5">
              <span className="size-1.5 rounded-full bg-accent" />
              {eyebrow}
            </div>
          )}
          {title && (
            <h2 className="font-display leading-[1.05] tracking-tight text-foreground text-[clamp(1.9rem,4.4vw,3.75rem)] whitespace-normal lg:whitespace-nowrap">
              {title}
            </h2>
          )}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
/* ---------- WHATSAPP FLOAT ---------- */
