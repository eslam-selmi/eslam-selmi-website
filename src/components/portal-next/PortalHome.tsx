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
  welcomeLine?: string;
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
          {welcomeLine && <p className="text-white/60 text-[15px] leading-relaxed mt-3 max-w-lg">{welcomeLine}</p>}
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

/** Letters for the typographic cover: the first Latin acronym in the real title (e.g. "TNA"); otherwise the course number. */
export function coverLabel(title: string | undefined | null, index: number): { text: string; latin: boolean } {
  const m = (title ?? "").match(/\b[A-Z][A-Z0-9]{1,5}\b/);
  return m ? { text: m[0], latin: true } : { text: String(index + 1).padStart(2, "0"), latin: false };
}
const COVER_TONES = [
  { bg: "oklch(0.3 0.09 258)", fg: "oklch(0.8 0.13 190)", no: "oklch(0.86 0.07 190)" },
  { bg: "oklch(0.3 0.06 205)", fg: "oklch(0.78 0.1 255)", no: "oklch(0.88 0.04 250)" },
];

/** Overview: greeting, current course + overall summary, then the trainee's own courses as cards. Real data only. */
export function PortalOverviewClean({
  lang, greeting, firstName, welcomeLine, continueTarget, hoursEarned, hoursTotal, hoursPct, certs, courseRows,
  availableCount, onOpenCourse, onBrowse, onGoMyCourses, onGoCertificates,
}: {
  lang: string; greeting: string; firstName: string; welcomeLine?: string;
  continueTarget: { en: Enrollment; progress: number; done: number; total: number } | null;
  hoursEarned: number; hoursTotal: number; hoursPct: number; certs: number;
  courseRows: CourseRowVM[]; availableCount: number;
  onOpenCourse: (e: Enrollment) => void; onBrowse: () => void; onGoMyCourses: () => void; onGoCertificates: () => void;
  supportNode?: React.ReactNode;
}) {
  const ar = lang === "ar";
  const approvedRows = courseRows.filter((r) => r.en.status === "approved");
  const unitsDone = approvedRows.reduce((a, r) => a + r.done, 0);
  const unitsTotal = approvedRows.reduce((a, r) => a + r.total, 0);
  const useHours = hoursTotal > 0;
  const pct = unitsTotal > 0 ? Math.round((unitsDone / unitsTotal) * 100) : hoursPct;
  const rows = [
    { k: ar ? "الوحدات المكتملة" : "Units completed", v: ar ? `${unitsDone} من ${unitsTotal}` : `${unitsDone} of ${unitsTotal}` },
    ...(useHours ? [{ k: ar ? "الساعات" : "Hours", v: ar ? `${hoursEarned} من ${hoursTotal}` : `${hoursEarned} of ${hoursTotal}` }] : []),
    { k: ar ? "شهادات صادرة" : "Certificates issued", v: String(certs), onClick: onGoCertificates },
    { k: ar ? "الكورسات" : "Courses", v: String(approvedRows.length) },
  ];
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="nx-display font-black text-[34px] sm:text-[52px] leading-[1.15]">
          {ar ? `${greeting}، ` : `${greeting}, `}<span className="text-[var(--nx-teal)]">{firstName}</span>
        </h1>
        {welcomeLine && <p className="text-white/55 text-sm sm:text-[15px] mt-1.5 leading-relaxed">{welcomeLine}</p>}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 sm:gap-6">
        <section className="nx-card p-6 sm:p-8 flex flex-col justify-center gap-5 min-h-[200px]">
          {continueTarget ? (
            <>
              <h2 className="text-2xl sm:text-[32px] font-bold leading-snug">{continueTarget.en.courses?.title}</h2>
              <div>
                <div className="flex items-center justify-between text-sm text-white/70 mb-2.5">
                  <span>{ar ? `أكملت ${continueTarget.done} من ${continueTarget.total} وحدة` : `${continueTarget.done} of ${continueTarget.total} units completed`}</span>
                  <bdi dir="ltr" className="font-bold text-[var(--nx-teal)]">{continueTarget.progress}%</bdi>
                </div>
                <div className="nx-track h-2.5 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--nx-teal)]" style={{ width: `${continueTarget.progress}%` }} /></div>
              </div>
              <div><button onClick={() => onOpenCourse(continueTarget.en)} className="nx-btn nx-btn-primary"><PlayCircle className="w-4 h-4" /> {ar ? "أكمل التعلّم" : "Resume"}</button></div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold leading-snug">{ar ? "لا يوجد كورس جارٍ حاليًا" : "No course in progress"}</h2>
              <p className="text-sm text-white/55">{ar ? "اختر كورسًا من المتاح وقدّم طلب الالتحاق." : "Pick an available course and request to join."}</p>
              <div><button onClick={onBrowse} className="nx-btn nx-btn-primary"><GraduationCap className="w-4 h-4" /> {ar ? "استكشف الكورسات المتاحة" : "Browse available courses"}</button></div>
            </>
          )}
        </section>

        <section className="nx-card p-5 sm:p-6 flex items-center gap-5">
          <ProgressRing value={pct} size={128} stroke={11} tone="teal">
            <p className="nx-display font-black text-[30px] leading-none"><bdi dir="ltr">{pct}%</bdi></p>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <h5 className="text-[15px] text-white/60 mb-2.5">{ar ? "إجمالي التقدم في كل الكورسات" : "Overall progress across all courses"}</h5>
            {rows.map((r) => (
              <div key={r.k} className="flex items-center justify-between gap-3 py-2 text-[15px] border-t border-white/10 text-white/80">
                {r.onClick ? <button onClick={r.onClick} className="hover:underline text-start">{r.k}</button> : <span>{r.k}</span>}
                <b className="text-white font-bold">{r.v}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-3.5">
          <h2 className="text-xl sm:text-2xl font-bold">{ar ? "كورساتي" : "My courses"}</h2>
          {courseRows.length > 0 && <button onClick={onGoMyCourses} className="text-sm font-medium text-[var(--nx-teal)] inline-flex items-center gap-1">{ar ? "عرض الكل" : "View all"} <ArrowRight className="w-3.5 h-3.5 rtl-flip" /></button>}
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {courseRows.slice(0, 5).map(({ en, progress, done, total }, i) => {
            const approved = en.status === "approved";
            const cv = coverLabel(en.courses?.title, i);
            const tone = COVER_TONES[i % COVER_TONES.length];
            return (
              <button key={en.id} onClick={() => (approved ? onOpenCourse(en) : onGoMyCourses())} className="nx-card nx-card-hover p-4 pb-5 text-start">
                <div className="nx-cover mb-4" style={{ background: tone.bg }} aria-hidden="true">
                  <span className="absolute top-3 end-4 text-[13px] font-medium" style={{ color: tone.no }}>{ar ? `كورس ${String(i + 1).padStart(2, "0")}` : `Course ${String(i + 1).padStart(2, "0")}`}</span>
                  <span className="absolute start-3 -bottom-5 font-black leading-none" dir="ltr" style={{ color: tone.fg, fontSize: cv.latin ? 112 : 96, letterSpacing: -3 }}>{cv.text}</span>
                </div>
                <div className="flex items-start justify-between gap-3 px-1.5">
                  <p className="font-medium text-[17px] leading-snug">{en.courses?.title}</p>
                  {!approved && <span className="nx-chip shrink-0">{ar ? "قيد المراجعة" : "Under review"}</span>}
                </div>
                {approved && progress !== null && (
                  <div className="mt-3.5 px-1.5">
                    <div className="flex items-center justify-between text-[13px] text-white/65 mb-2">
                      <span>{ar ? `${done} من ${total} وحدة` : `${done} of ${total} units`}</span>
                      <bdi dir="ltr">{progress}%</bdi>
                    </div>
                    <div className="nx-track h-2 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--nx-teal)]" style={{ width: `${progress}%` }} /></div>
                  </div>
                )}
              </button>
            );
          })}
          {availableCount > 0 && (
            <button onClick={onBrowse} className="nx-card nx-card-hover !border-dashed min-h-[200px] flex flex-col items-center justify-center gap-2 text-white/80">
              <span className="text-5xl font-light leading-none text-[var(--nx-teal)]">+</span>
              <span className="text-[17px]">{ar ? "كورسات متاحة" : "Available courses"}</span>
              <span className="text-xs text-white/50"><bdi dir="ltr">{availableCount}</bdi></span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
