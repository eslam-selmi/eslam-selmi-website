import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpLeft, CalendarDays, CircleAlert, Clock3, ShieldCheck, TicketCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { StatCard } from "@/components/portal/StatCard";

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
  const queryClient = useQueryClient();
  const counts = useQuery({
    queryKey: ["admin", "overview-counts"],
    staleTime: 30_000,
    queryFn: async () => {
      const [b, s] = await Promise.all([
        supabase.from("consultation_slots").select("id", { count: "exact", head: true }).eq("status", "booked").gte("starts_at", new Date().toISOString()),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending_admin"]),
      ]);
      return { bookings: b.error ? null : b.count ?? 0, tickets: s.error ? null : s.count ?? 0, error: Boolean(b.error || s.error) };
    },
  });
  const bookings = counts.data?.bookings ?? null;
  const tickets = counts.data?.tickets ?? null;
  const error = counts.isError || Boolean(counts.data?.error);
  const load = () => counts.refetch();

  useEffect(() => {
    const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["admin", "overview-counts"] }); };
    const channel = supabase.channel("admin-overview-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultation_slots" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, refresh)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);

  const tasks = [
    { key: "enrollments" as const, icon: Users, label: t("طلبات الانضمام", "Enrollment requests"), detail: t("بانتظار المراجعة", "Awaiting review"), count: pendingEnrollments },
    { key: "bookings" as const, icon: CalendarDays, label: t("الحجوزات القادمة", "Upcoming bookings"), detail: t("جلسات محجوزة", "Scheduled sessions"), count: bookings },
    { key: "tickets" as const, icon: TicketCheck, label: t("تذاكر الدعم", "Support tickets"), detail: t("تحتاج إلى رد", "Need a reply"), count: tickets },
    { key: "activations" as const, icon: ShieldCheck, label: t("تفعيل الحسابات", "Account activations"), detail: t("بانتظار التفعيل", "Awaiting activation"), count: pendingActivations },
  ];

  return <section className="space-y-7" aria-label={t("نظرة عامة تنفيذية", "Executive overview")}>
    <header className="dash-card p-7 sm:p-9 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{t("لوحة الإدارة / الرئيسية", "Administration / Home")}</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{t("نظرة عامة تنفيذية", "Executive overview")}</h1>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-4" />{new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", { dateStyle: "full" }).format(new Date())}</p>
    </header>

    <div>
      <div className="mb-3 flex items-center gap-2"><CircleAlert className="size-4 text-accent" /><h2 className="text-sm font-bold text-foreground">{t("ما يحتاج انتباهك", "Needs your attention")}</h2></div>
      {error && <p role="alert" className="mb-3 text-sm text-muted-foreground">{t("تعذر تحميل بعض الأرقام. حاول التحديث.", "Some counts could not be loaded. Try refreshing.")} <Button variant="link" size="sm" onClick={() => void load()}>{t("تحديث", "Refresh")}</Button></p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tasks.map(({ key, icon: Icon, label, detail, count }) => <Button key={key} type="button" variant="ghost" onClick={() => onNavigate(key)} className="dash-card dash-card-hover h-auto min-h-32 w-full min-w-0 flex-col items-stretch justify-between p-4 text-start text-foreground">
          <span className="flex w-full items-start justify-between gap-2"><Icon className="size-5 text-accent" /><ArrowUpLeft className="size-4 text-muted-foreground rtl:rotate-[-90deg]" /></span>
          <span className="flex w-full items-end justify-between gap-2"><span className="min-w-0 whitespace-normal"><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{detail}</span></span><span className="shrink-0 text-3xl font-bold tabular-nums">{count === null ? "—" : count}</span></span>
        </Button>)}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={Users} label={t("متدربون مقبولون", "Approved trainees")} value={approved} accent="emerald" />
      <StatCard icon={CalendarDays} label={t("إجمالي الكورسات", "Total courses")} value={courses} accent="sky" />
      <StatCard icon={Clock3} label={t("طلبات قيد المراجعة", "Pending requests")} value={pendingEnrollments} accent="amber" />
      <StatCard icon={ShieldCheck} label={t("حسابات بانتظار التفعيل", "Pending activations")} value={pendingActivations} accent="gold" />
    </div>
  </section>;
}