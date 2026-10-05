import { useCallback, useEffect, useState } from "react";
import { ArrowUpLeft, CalendarDays, CircleAlert, Clock3, ShieldCheck, TicketCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

type Destination = "enrollments" | "bookings" | "tickets" | "activations";

export function ExecutiveOverview({ pendingEnrollments, pendingActivations, approved, courses, onNavigate }: {
  pendingEnrollments: number;
  pendingActivations: number;
  approved: number;
  courses: number;
  onNavigate: (destination: Destination) => void;
}) {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const [bookings, setBookings] = useState<number | null>(null);
  const [tickets, setTickets] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const [b, s] = await Promise.all([
      supabase.from("consultation_slots").select("id", { count: "exact", head: true }).eq("status", "booked").gte("starts_at", new Date().toISOString()),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending_admin"]),
    ]);
    setError(Boolean(b.error || s.error));
    setBookings(b.error ? null : b.count ?? 0);
    setTickets(s.error ? null : s.count ?? 0);
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase.channel("admin-overview-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultation_slots" }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load]);

  const tasks = [
    { key: "enrollments" as const, icon: Users, label: t("طلبات الانضمام", "Enrollment requests"), detail: t("بانتظار المراجعة", "Awaiting review"), count: pendingEnrollments },
    { key: "bookings" as const, icon: CalendarDays, label: t("الحجوزات القادمة", "Upcoming bookings"), detail: t("جلسات محجوزة", "Scheduled sessions"), count: bookings },
    { key: "tickets" as const, icon: TicketCheck, label: t("تذاكر الدعم", "Support tickets"), detail: t("تحتاج إلى رد", "Need a reply"), count: tickets },
    { key: "activations" as const, icon: ShieldCheck, label: t("تفعيل الحسابات", "Account activations"), detail: t("بانتظار التفعيل", "Awaiting activation"), count: pendingActivations },
  ];

  return <section className="space-y-7" aria-label={t("نظرة عامة تنفيذية", "Executive overview")}>
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{t("لوحة الإدارة / الرئيسية", "Administration / Home")}</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{t("نظرة عامة تنفيذية", "Executive overview")}</h1>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-4" />{new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", { dateStyle: "full" }).format(new Date())}</p>
    </header>

    <div>
      <div className="mb-3 flex items-center gap-2"><CircleAlert className="size-4 text-accent" /><h2 className="text-sm font-bold text-foreground">{t("ما يحتاج انتباهك", "Needs your attention")}</h2></div>
      {error && <p role="alert" className="mb-3 text-sm text-muted-foreground">{t("تعذر تحميل بعض الأرقام. حاول التحديث.", "Some counts could not be loaded. Try refreshing.")} <Button variant="link" size="sm" onClick={() => void load()}>{t("تحديث", "Refresh")}</Button></p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tasks.map(({ key, icon: Icon, label, detail, count }) => <Button key={key} type="button" variant="outline" onClick={() => onNavigate(key)} className="h-auto min-h-32 w-full min-w-0 flex-col items-stretch justify-between rounded-md border-border bg-card p-4 text-start text-card-foreground shadow-none hover:bg-secondary">
          <span className="flex w-full items-start justify-between gap-2"><Icon className="size-5 text-accent" /><ArrowUpLeft className="size-4 text-muted-foreground rtl:rotate-[-90deg]" /></span>
          <span className="flex w-full items-end justify-between gap-2"><span className="min-w-0 whitespace-normal"><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{detail}</span></span><span className="shrink-0 text-3xl font-bold tabular-nums">{count === null ? "—" : count}</span></span>
        </Button>)}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        [t("متدربون مقبولون", "Approved trainees"), approved],
        [t("إجمالي الكورسات", "Total courses"), courses],
        [t("طلبات قيد المراجعة", "Pending requests"), pendingEnrollments],
        [t("حسابات بانتظار التفعيل", "Pending activations"), pendingActivations],
      ].map(([label, count]) => <div key={String(label)} className="border-s-2 border-accent bg-secondary/50 px-4 py-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{count}</p></div>)}
    </div>
  </section>;
}