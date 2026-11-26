import { ArrowLeft, CalendarDays, Clock3, ShieldCheck, TicketCheck, Users, BookOpen, GraduationCap, Wallet, CircleAlert } from "lucide-react";
import { StatCardNext } from "@/components/portal-next/PortalHome";

export type AdminOverviewDestination = "enrollments" | "bookings" | "tickets" | "activations" | "courses" | "coupons" | "packages" | "methods";

export type RecentEnrollment = { id: string; name: string; course: string; status: string; date: string };

export function AdminOverview({
  lang, pendingEnrollments, pendingActivations, attention, approved, courses, bookings, tickets, onNavigate, recentEnrollments,
}: {
  lang: string;
  pendingEnrollments: number;
  pendingActivations: number;
  attention: { label: string; value: number; tone: "gold" | "teal" }[];
  approved: number;
  courses: number;
  bookings: number | null;
  tickets: number | null;
  onNavigate: (d: AdminOverviewDestination) => void;
  recentEnrollments?: RecentEnrollment[];
}) {
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);
  const today = new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-GB", { dateStyle: "full" }).format(new Date());

  const queue = [
    { key: "enrollments" as const, icon: Users, label: t("طلبات الانضمام", "Enrollment requests"), detail: t("بانتظار المراجعة والقبول", "Awaiting review"), count: pendingEnrollments, tone: "gold" as const },
    { key: "activations" as const, icon: ShieldCheck, label: t("تفعيل الحسابات", "Account activations"), detail: t("حسابات جديدة بانتظار التفعيل", "New accounts awaiting activation"), count: pendingActivations, tone: "gold" as const },
    { key: "bookings" as const, icon: CalendarDays, label: t("الحجوزات القادمة", "Upcoming bookings"), detail: t("جلسات استشارية محجوزة", "Scheduled sessions"), count: bookings, tone: "teal" as const },
    { key: "tickets" as const, icon: TicketCheck, label: t("تذاكر الدعم", "Support tickets"), detail: t("تحتاج إلى رد من الإدارة", "Need a reply"), count: tickets, tone: "teal" as const },
  ];

  return (
    <section className="space-y-6" aria-label={t("نظرة عامة تنفيذية", "Executive overview")}>
      {/* Executive header */}
      <div className="relative nx-card nx-rise nx-admin-hero px-5 py-5 sm:px-8 sm:py-7">
        <span className="nx-hero-line" />
        <div className="pointer-events-none absolute -top-24 -end-24 w-72 h-72 rounded-full bg-[var(--nx-teal)]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="nx-eyebrow">{t("لوحة الإدارة", "Administration")}</p>
            <h1 className="nx-display text-2xl sm:text-[34px] mt-1.5">{t("نظرة عامة تنفيذية", "Executive overview")}</h1>
            <p className="flex items-center gap-2 text-xs text-white/50 mt-3"><Clock3 className="w-3.5 h-3.5" />{today}</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
            <span className="nx-chip nx-chip-emerald self-start sm:self-end"><span className="nx-live-dot" /> {t("البيانات مباشرة", "Live data")}</span>
            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-3">
              <p className="text-[11px] font-bold opacity-70 mb-2 flex items-center gap-2"><span className="nx-live-dot" /> {t("يحتاج انتباهك الآن", "Needs attention now")}</p>
              <div className="grid grid-cols-3 gap-2">
                {attention.map((a) => (
                  <div key={a.label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-center sm:min-w-[84px]">
                    <p className="text-lg font-bold nx-display" style={{ color: a.tone === "gold" ? "var(--nx-gold)" : "var(--nx-teal)" }}>{a.value}</p>
                    <p className="text-[10px] opacity-60 font-semibold leading-tight mt-0.5">{a.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardNext icon={GraduationCap} tone="teal" label={t("متدربون مقبولون", "Approved trainees")} value={approved} />
        <StatCardNext icon={BookOpen} tone="teal" label={t("الكورسات", "Courses")} value={courses} />
        <StatCardNext icon={CalendarDays} tone="gold" label={t("حجوزات قادمة", "Upcoming bookings")} value={bookings ?? "—"} />
        <StatCardNext icon={Wallet} tone="gold" label={t("تذاكر مفتوحة", "Open tickets")} value={tickets ?? "—"} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 nx-rise nx-rise-1">
        {[
          { id: "courses" as const, icon: BookOpen, label: t("إدارة الكورسات", "Manage courses") },
          { id: "coupons" as const, icon: TicketCheck, label: t("كوبون جديد", "New coupon") },
          { id: "packages" as const, icon: Wallet, label: t("باقات الاستشارات", "Consulting packages") },
          { id: "methods" as const, icon: CalendarDays, label: t("طرق الدفع", "Payment methods") },
        ].map((a) => (
          <button key={a.id} onClick={() => onNavigate(a.id)} className="nx-card nx-card-hover p-4 flex items-center gap-3 text-start">
            <span className="w-9 h-9 rounded-xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/25 flex items-center justify-center shrink-0">
              <a.icon className="w-4 h-4 text-[var(--nx-teal)]" />
            </span>
            <span className="text-[12.5px] font-bold flex-1 leading-snug line-clamp-2">{a.label}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-white/30 rtl:rotate-0 rotate-180 shrink-0" />
          </button>
        ))}
      </div>

      {/* Attention queue */}
      <div className="nx-card p-5 sm:p-6 nx-rise nx-rise-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[var(--nx-gold)]/10 border border-[var(--nx-gold)]/30 flex items-center justify-center">
              <CircleAlert className="w-4.5 h-4.5 text-[var(--nx-gold)]" />
            </span>
            {t("قائمة الانتباه", "Attention queue")}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {queue.map((q) => {
            const Icon = q.icon;
            const empty = !q.count;
            return (
              <button
                key={q.key}
                onClick={() => onNavigate(q.key)}
                className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05] hover:border-[var(--nx-teal)]/35 p-4 text-start transition"
              >
                <span className="nx-stat-icon" style={{ ["--nx-stat-tone" as any]: q.tone === "gold" ? "var(--nx-gold)" : "var(--nx-teal)" }}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13.5px] font-bold leading-snug line-clamp-2">{q.label}</span>
                  <span className="block text-[11px] text-white/50 mt-0.5">{q.detail}</span>
                </span>
                <span className={`nx-display text-2xl font-bold ${empty ? "text-white/25" : q.tone === "gold" ? "text-[var(--nx-gold)]" : "text-[var(--nx-teal)]"}`}>
                  {q.count ?? "—"}
                </span>
                <ArrowLeft className="w-4 h-4 text-white/30 group-hover:text-[var(--nx-teal)] rtl:rotate-0 rotate-180 transition" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Latest enrollment activity (real rows, no invented metrics) */}
      {recentEnrollments && recentEnrollments.length > 0 && (
        <div className="nx-card p-5 sm:p-6 nx-rise nx-rise-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/25 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-[var(--nx-teal)]" />
              </span>
              {t("أحدث طلبات الانضمام", "Latest enrollment requests")}
            </h2>
            <button onClick={() => onNavigate("enrollments")} className="text-[12px] font-bold text-[var(--nx-teal)] hover:underline">
              {t("عرض الكل", "View all")}
            </button>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {recentEnrollments.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-9 h-9 rounded-xl bg-[var(--nx-teal)]/10 border border-[var(--nx-teal)]/20 flex items-center justify-center text-[13px] font-bold text-[var(--nx-teal)] shrink-0">
                  {r.name.trim().charAt(0)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-bold truncate">{r.name}</span>
                  <span className="block text-[11px] text-white/50 truncate">{r.course}</span>
                </span>
                <span className="text-[11px] text-white/40 shrink-0">{r.date}</span>
                {r.status === "pending"
                  ? <span className="nx-chip nx-chip-gold shrink-0">{t("معلّق", "Pending")}</span>
                  : r.status === "approved"
                    ? <span className="nx-chip nx-chip-emerald shrink-0">{t("مقبول", "Approved")}</span>
                    : <span className="nx-chip nx-chip-rose shrink-0">{t("مرفوض", "Rejected")}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
