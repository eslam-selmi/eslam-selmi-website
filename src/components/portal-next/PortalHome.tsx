import { ArrowRight, GraduationCap, Hourglass, Clock, Award, PlayCircle, Send } from "lucide-react";
import { ProgressRing } from "@/components/shell/ProgressRing";
import type { Enrollment } from "@/components/portal/types";


/** Single slim nudge for states the hero and alert stack do not cover:
 *  a finished course awaiting a certificate request, or a pending enrollment under review.
 *  Wording preserved from the legacy PersonalMessage card. */
export function PortalNudge({ lang, firstName, readyForCert, hasPending, onOpenCourse, onGoMyCourses }: {
  lang: string;
  firstName: string;
  readyForCert: Enrollment | null;
  hasPending: boolean;
  onOpenCourse: (e: Enrollment) => void;
  onGoMyCourses: () => void;
}) {
  const ar = lang === "ar";
  if (!readyForCert && !hasPending) return null;
  const isCert = !!readyForCert;
  const Icon = isCert ? Send : Hourglass;
  const title = isCert
    ? (ar ? `خلّصت يا ${firstName}! 👏` : `You finished, ${firstName}! 👏`)
    : (ar ? `طلبك قيد المراجعة يا ${firstName}` : `Your request is under review, ${firstName}`);
  const body = isCert
    ? (ar ? `أنهيت «${readyForCert!.courses?.title ?? ""}». اطلب شهادتك دلوقتي عشان نصدرهالك.` : `You completed "${readyForCert!.courses?.title ?? ""}". Request your certificate now.`)
    : (ar ? "هنراجع طلب انضمامك قريباً، وهيوصلك إشعار أول ما يتفعّل." : "We'll review your enrollment soon and notify you once it's active.");
  const cta = isCert ? (ar ? "اطلب الشهادة" : "Request certificate") : (ar ? "تابع كورساتي" : "View my courses");
  const action = () => (isCert ? onOpenCourse(readyForCert!) : onGoMyCourses());
  return (
    <section className="nx-card nx-card-hover p-4 sm:p-5 flex items-center gap-3.5 nx-rise nx-rise-1">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${isCert ? "bg-[var(--nx-gold)]/10 border-[var(--nx-gold)]/30 text-[var(--nx-gold)]" : "bg-[var(--nx-teal)]/10 border-[var(--nx-teal)]/25 text-[var(--nx-teal)]"}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{body}</p>
      </div>
      <button
        onClick={action}
        className={isCert
          ? "shrink-0 h-10 px-4 rounded-xl text-sm font-bold bg-[var(--nx-gold)] text-[oklch(0.17_0.05_260)] hover:brightness-110 transition"
          : "shrink-0 h-10 px-4 rounded-xl text-sm font-bold border border-[var(--nx-teal)]/40 text-[var(--nx-teal)] hover:bg-[var(--nx-teal)]/10 transition"}
      >
        {cta}
      </button>
    </section>
  );
}

export function StatCardNext({ icon: Icon, label, value, suffix, tone }: {
  icon: any; label: string; value: number | string; suffix?: string;
  tone: "teal" | "gold" | "emerald" | "amber";
}) {
  const toneVal = { teal: "var(--nx-teal)", gold: "var(--nx-gold)", emerald: "oklch(0.8 0.15 165)", amber: "oklch(0.82 0.13 70)" }[tone];
  return (
    <div className="nx-card nx-card-hover p-5" style={{ ["--nx-stat-tone" as any]: toneVal }}>
      <div className="nx-stat-glow" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-white/50">{label}</p>
          <p className="text-[28px] leading-none font-bold mt-2.5 truncate nx-display">
            <bdi dir="ltr">{value}</bdi>{suffix && <span className="text-[13px] font-semibold text-white/45 ms-1">{suffix}</span>}
          </p>
        </div>
        <div className="nx-stat-icon"><Icon className="w-5 h-5" /></div>
      </div>
    </div>
  );
}

export function SectionHeader({ icon: Icon, title, hint, action }: {
  icon: any; title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <p className="nx-eyebrow mb-1.5">{hint}</p>
        <h2 className="text-xl font-bold flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/25 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-[var(--nx-teal)]" />
          </span>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export function PortalHero({
  lang, greeting, firstName, fullName, welcomeLine, countryFlag, countryName, avatarSrc,
  hoursEarned, hoursTotal, hoursPct, continueTarget, onOpenCourse, onBrowse, onAccount, supportNode,
}: {
  lang: string;
  greeting: string;
  firstName: string;
  fullName: string;
  welcomeLine: string;
  countryFlag?: string | null;
  countryName?: string | null;
  avatarSrc?: string | null;
  hoursEarned: number;
  hoursTotal: number;
  hoursPct?: number;
  continueTarget: { en: Enrollment; progress: number; done: number; total: number } | null;
  onOpenCourse: (en: Enrollment) => void;
  onBrowse: () => void;
  onAccount: () => void;
  supportNode?: React.ReactNode;
}) {
  const isAr = lang === "ar";
  // Use the unrounded share so the ring matches the per-course percentages (rounded hours would give 30% for 33%).
  const pct = hoursPct ?? (hoursTotal > 0 ? Math.round((hoursEarned / hoursTotal) * 100) : 0);
  return (
    <section className="nx-card relative overflow-hidden p-6 sm:p-9 nx-rise">
      <span className="nx-hero-line" />
      <div className="pointer-events-none absolute -top-24 -start-24 w-72 h-72 rounded-full bg-[var(--nx-teal)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -end-20 w-72 h-72 rounded-full bg-[var(--nx-gold)]/[0.07] blur-3xl" />

      <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        <div className="flex-1 min-w-0">
          <div className="min-w-0">
            <p className="nx-eyebrow">{greeting}</p>
            <h1 className="nx-display text-3xl sm:text-[40px] leading-[1.15] mt-2 truncate">{firstName}</h1>
          </div>
          <p className="text-white/60 text-[15px] leading-relaxed mt-3 max-w-lg">{welcomeLine}</p>
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            {continueTarget ? (
              <button onClick={() => onOpenCourse(continueTarget.en)} className="nx-btn nx-btn-primary">
                <PlayCircle className="w-4 h-4" />
                {isAr ? "أكمل من حيث توقفت" : "Resume where you left off"}
              </button>
            ) : (
              <button onClick={onBrowse} className="nx-btn nx-btn-primary">
                <GraduationCap className="w-4 h-4" />
                {isAr ? "استكشف الكورسات المتاحة" : "Browse available courses"}
              </button>
            )}
            {supportNode}
          </div>
        </div>

        <div className="shrink-0 flex md:flex-col items-center gap-4 md:gap-3 md:ps-10 md:border-s border-white/[0.07]">
          <ProgressRing value={pct} size={118} stroke={9} tone="gold">
            <div className="text-center">
              <p className="nx-display text-2xl leading-none">{pct}%</p>
              <p className="text-[10px] text-white/50 font-bold mt-1">{isAr ? "إنجاز" : "done"}</p>
            </div>
          </ProgressRing>
          <div className="text-start md:text-center">
            <p className="text-sm font-bold"><span className="text-[11px] text-white/50 font-semibold">{isAr ? `أكملت ${hoursEarned} من ${hoursTotal} ساعة` : `${hoursEarned} of ${hoursTotal} hours completed`}</span></p>
            {continueTarget && (
              <p className="text-[11px] text-white/50 mt-1 max-w-[170px] truncate">
                {isAr ? "الحالي:" : "Current:"} {continueTarget.en.courses?.title}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PortalStatsRow({ lang, stats }: {
  lang: string;
  stats: { active: number; pending: number; certs: number; hoursEarned: number; hoursTotal: number };
}) {
  const isAr = lang === "ar";
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCardNext icon={GraduationCap} tone="teal" label={isAr ? "كورسات نشطة" : "Active courses"} value={stats.active} />
      <StatCardNext icon={Hourglass} tone="amber" label={isAr ? "طلبات معلّقة" : "Pending requests"} value={stats.pending} />
      <StatCardNext icon={Clock} tone="teal" label={isAr ? "ساعة مكتملة" : "Hours completed"} value={`${stats.hoursEarned}/${stats.hoursTotal}`} />
      <StatCardNext icon={Award} tone="gold" label={isAr ? "شهادات صادرة" : "Certificates"} value={stats.certs} />
    </section>
  );
}

export function PortalQuickLinks({ items, onSelect, lang }: {
  items: { id: string; label: string; icon: any; badge?: number; alert?: boolean }[];
  onSelect: (id: any) => void;
  lang: string;
}) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => onSelect(it.id)} className={`nx-card nx-card-hover p-4 flex items-center gap-3 text-start nx-rise nx-rise-${(i % 4) + 1}`}>
            <span className="w-10 h-10 rounded-xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/25 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-[var(--nx-teal)]" />
            </span>
            <span className="flex-1 text-[13px] font-bold truncate">{it.label}</span>
            {it.badge
              ? <span className="nx-nav-badge" data-tone={it.alert ? "alert" : undefined}>{it.badge}</span>
              : <ArrowRight className="w-4 h-4 text-white/35 rtl-flip shrink-0" />}
          </button>
        );
      })}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: {
  icon: any; title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="nx-card border-dashed p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/25 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[var(--nx-teal)]" />
      </div>
      <p className="font-bold mt-4">{title}</p>
      {hint && <p className="text-sm text-white/50 mt-1.5 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export type CourseRowVM = { en: Enrollment; progress: number | null; done: number; total: number };

/** Course-first overview: one "continue" card, one progress card, then the trainee's own courses. Real data only. */
export function PortalOverviewClean({
  lang, firstName, welcomeLine, continueTarget, hoursEarned, hoursTotal, hoursPct, certs, courseRows,
  availableCount, onOpenCourse, onBrowse, onGoMyCourses, onGoCertificates, supportNode,
}: {
  lang: string; firstName: string; welcomeLine: string;
  continueTarget: { en: Enrollment; progress: number; done: number; total: number } | null;
  hoursEarned: number; hoursTotal: number; hoursPct: number; certs: number;
  courseRows: CourseRowVM[]; availableCount: number;
  onOpenCourse: (e: Enrollment) => void; onBrowse: () => void; onGoMyCourses: () => void; onGoCertificates: () => void;
  supportNode?: React.ReactNode;
}) {
  const ar = lang === "ar";
  // Prefer hours when the course durations are set; otherwise show real completed units instead of a meaningless 0/0 hours.
  const unitsDone = courseRows.filter((r) => r.en.status === "approved").reduce((a, r) => a + r.done, 0);
  const unitsTotal = courseRows.filter((r) => r.en.status === "approved").reduce((a, r) => a + r.total, 0);
  const useHours = hoursTotal > 0;
  const pct = unitsTotal > 0 ? Math.round((unitsDone / unitsTotal) * 100) : hoursPct;
  return (
    <div className="space-y-5 sm:space-y-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="nx-display text-[26px] sm:text-[34px] leading-tight truncate">{ar ? `أهلاً، ${firstName}` : `Welcome, ${firstName}`}</h1>
          <p className="text-white/55 text-sm sm:text-[15px] mt-1.5 leading-relaxed">{welcomeLine}</p>
        </div>
        {supportNode && <div className="lg:hidden shrink-0">{supportNode}</div>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <section className="nx-card p-5 sm:p-7 lg:col-span-2 flex flex-col justify-between gap-5">
          {continueTarget ? (
            <>
              <div>
                <p className="nx-eyebrow">{ar ? "كمّل من حيث وقفت" : "Continue learning"}</p>
                <h2 className="text-xl sm:text-2xl font-bold leading-snug mt-2.5">{continueTarget.en.courses?.title}</h2>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-white/55 mb-2">
                  <span>{ar ? `أكملت ${continueTarget.done} من ${continueTarget.total} وحدة` : `${continueTarget.done} of ${continueTarget.total} units completed`}</span>
                  <bdi dir="ltr" className="font-bold text-[var(--nx-teal)]">{continueTarget.progress}%</bdi>
                </div>
                <div className="nx-track h-2 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--nx-teal)]" style={{ width: `${continueTarget.progress}%` }} /></div>
                <button onClick={() => onOpenCourse(continueTarget.en)} className="nx-btn nx-btn-primary mt-5">
                  <PlayCircle className="w-4 h-4" /> {ar ? "أكمل التعلّم" : "Resume"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="nx-eyebrow">{ar ? "ابدأ من هنا" : "Start here"}</p>
                <h2 className="text-xl sm:text-2xl font-bold leading-snug mt-2.5">{ar ? "لا يوجد كورس جارٍ حاليًا" : "No course in progress"}</h2>
                <p className="text-sm text-white/55 mt-2">{ar ? "اختر كورسًا من المتاح وقدّم طلب الالتحاق." : "Pick an available course and request to join."}</p>
              </div>
              <div><button onClick={onBrowse} className="nx-btn nx-btn-primary"><GraduationCap className="w-4 h-4" /> {ar ? "استكشف الكورسات المتاحة" : "Browse available courses"}</button></div>
            </>
          )}
        </section>

        <section className="nx-card p-4 sm:p-6 flex lg:flex-col items-center lg:justify-center gap-5 lg:gap-4">
          <ProgressRing value={pct} size={88} stroke={8} tone="teal">
            <p className="nx-display text-xl leading-none"><bdi dir="ltr">{pct}%</bdi></p>
          </ProgressRing>
          <div className="lg:text-center min-w-0">
            <p className="text-sm font-bold"><span className="text-xs text-white/70 font-semibold">{ar ? `أكملت ${unitsDone} من ${unitsTotal} وحدة` : `${unitsDone} of ${unitsTotal} units completed`}</span></p>
            {useHours && <p className="text-[11px] text-white/45 mt-0.5">{ar ? `${hoursEarned} من ${hoursTotal} ساعة (للكورسات المحدد لها ساعات)` : `${hoursEarned} of ${hoursTotal} hours (courses with set hours)`}</p>}
            <button onClick={onGoCertificates} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--nx-teal)] hover:underline">
              <Award className="w-3.5 h-3.5" /> {ar ? `شهادات صادرة: ${certs}` : `Certificates: ${certs}`}
            </button>
          </div>
        </section>
      </div>

      {courseRows.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold">{ar ? "كورساتي" : "My courses"}</h2>
            <button onClick={onGoMyCourses} className="text-xs font-bold text-[var(--nx-teal)] inline-flex items-center gap-1">{ar ? "عرض الكل" : "View all"} <ArrowRight className="w-3.5 h-3.5 rtl-flip" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {courseRows.slice(0, 4).map(({ en, progress, done, total }) => {
              const approved = en.status === "approved";
              return (
                <button key={en.id} onClick={() => (approved ? onOpenCourse(en) : onGoMyCourses())} className="nx-card nx-card-hover p-4 sm:p-5 text-start">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold text-sm sm:text-[15px] leading-snug">{en.courses?.title}</p>
                    {!approved && <span className="nx-chip shrink-0">{ar ? "قيد المراجعة" : "Under review"}</span>}
                  </div>
                  {approved && progress !== null && (
                    <div className="mt-3.5">
                      <div className="nx-track h-1.5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--nx-teal)]" style={{ width: `${progress}%` }} /></div>
                      <p className="text-[11px] text-white/50 font-semibold mt-1.5">{ar ? `${done} من ${total} وحدة` : `${done} of ${total} units`} · <bdi dir="ltr">{progress}%</bdi></p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {availableCount > 0 && (
        <button onClick={onBrowse} className="nx-card nx-card-hover w-full p-4 flex items-center gap-3 text-start">
          <span className="w-10 h-10 rounded-xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/25 flex items-center justify-center shrink-0"><GraduationCap className="w-5 h-5 text-[var(--nx-teal)]" /></span>
          <span className="flex-1 text-sm font-bold">{ar ? `كورسات متاحة للالتحاق (${availableCount})` : `Courses open to join (${availableCount})`}</span>
          <ArrowRight className="w-4 h-4 text-white/35 rtl-flip" />
        </button>
      )}
    </div>
  );
}
