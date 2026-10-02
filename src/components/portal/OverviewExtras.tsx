import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Award, Wallet, X, PlayCircle, Sparkles, ArrowRight } from "lucide-react";
import type { Enrollment } from "./types";

type PayAlert = { id: string; amount: number; currency: string; courseTitle: string };
type CertAlert = { id: string; courseTitle: string };

export type PortalAlertsState = {
  payments: PayAlert[];
  certs: CertAlert[];
  paymentCount: number;
  certCount: number;
  markSeen: (kind: "payments" | "certs" | "all") => void;
};

const key = (uid: string) => `portal-seen-alerts-${uid}`;
function readSeen(uid: string): { p: string[]; c: string[]; init?: boolean } {
  try { return JSON.parse(localStorage.getItem(key(uid)) || "") ; } catch { return { p: [], c: [], init: false }; }
}

export function usePortalAlerts(userId: string | undefined, enrollments: Enrollment[]): PortalAlertsState {
  const [approvedPayments, setApprovedPayments] = useState<PayAlert[]>([]);
  const [seen, setSeen] = useState<{ p: string[]; c: string[]; init?: boolean } | null>(null);

  useEffect(() => { if (userId) setSeen(readSeen(userId)); }, [userId]);

  const ids = enrollments.map((e) => e.id).join(",");
  useEffect(() => {
    if (!userId || !ids) { setApprovedPayments([]); return; }
    let cancel = false;
    const load = () => supabase.from("payments").select("id,amount,currency,enrollment_id,status")
      .in("enrollment_id", ids.split(",")).eq("status", "approved")
      .then(({ data }) => {
        if (cancel) return;
        setApprovedPayments((data ?? []).map((p: any) => ({
          id: p.id, amount: Number(p.amount), currency: p.currency,
          courseTitle: enrollments.find((e) => e.id === p.enrollment_id)?.courses?.title ?? "",
        })));
      });
    load();
    const ch = supabase.channel(`alerts-pay-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => load())
      .subscribe();
    return () => { cancel = true; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ids]);

  const issued: CertAlert[] = enrollments.filter((e) => e.certificate_issued)
    .map((e) => ({ id: e.id, courseTitle: e.courses?.title ?? "" }));

  // First visit: treat everything existing as already seen (no flood of old alerts)
  useEffect(() => {
    if (!userId || !seen || seen.init !== false) return;
    if (!ids) return;
    const next = { p: approvedPayments.map((p) => p.id), c: issued.map((c) => c.id), init: true };
    // wait until payments had a chance to load
    const t = setTimeout(() => { localStorage.setItem(key(userId), JSON.stringify(next)); setSeen(next); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, seen, ids, approvedPayments.length]);

  const ready = !!seen && seen.init !== false;
  const payments = ready ? approvedPayments.filter((p) => !seen!.p.includes(p.id)) : [];
  const certs = ready ? issued.filter((c) => !seen!.c.includes(c.id)) : [];

  const markSeen = useCallback((kind: "payments" | "certs" | "all") => {
    if (!userId || !seen) return;
    const next = {
      p: kind === "certs" ? seen.p : Array.from(new Set([...seen.p, ...approvedPayments.map((p) => p.id)])),
      c: kind === "payments" ? seen.c : Array.from(new Set([...seen.c, ...issued.map((c) => c.id)])),
      init: true,
    };
    localStorage.setItem(key(userId), JSON.stringify(next));
    setSeen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, seen, approvedPayments, ids, enrollments]);

  return { payments, certs, paymentCount: payments.length, certCount: certs.length, markSeen };
}

export function PortalAlerts({ alerts, lang, onGo }: { alerts: PortalAlertsState; lang: string; onGo: (tab: "my-courses" | "certificates") => void }) {
  const isAr = lang === "ar";
  if (!alerts.paymentCount && !alerts.certCount) return null;
  return (
    <div className="space-y-3">
      {alerts.certCount > 0 && (
        <div className="dash-card p-4 flex items-center gap-3 border-[var(--gold)]/50 shadow-[0_0_30px_-10px_var(--gold)]">
          <div className="w-11 h-11 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/40 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{isAr ? "شهادتك جاهزة للتحميل 🎉" : "Your certificate is ready 🎉"}</p>
            <p className="text-xs text-white/60 truncate">{alerts.certs.map((c) => c.courseTitle).join(" · ")}</p>
          </div>
          <button onClick={() => { alerts.markSeen("certs"); onGo("certificates"); }} className="text-xs px-3 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold shrink-0">
            {isAr ? "عرض" : "View"}
          </button>
          <button onClick={() => alerts.markSeen("certs")} aria-label="dismiss" className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50"><X className="w-4 h-4" /></button>
        </div>
      )}
      {alerts.paymentCount > 0 && (
        <div className="dash-card p-4 flex items-center gap-3 border-emerald-400/40">
          <div className="w-11 h-11 rounded-xl bg-emerald-400/15 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{isAr ? `تم اعتماد دفعتك (${alerts.paymentCount})` : `Your payment was approved (${alerts.paymentCount})`}</p>
            <p className="text-xs text-white/60 truncate">
              {alerts.payments.map((p) => `${p.amount.toLocaleString()} ${p.currency}${p.courseTitle ? ` — ${p.courseTitle}` : ""}`).join(" · ")}
            </p>
          </div>
          <button onClick={() => { alerts.markSeen("payments"); onGo("my-courses"); }} className="text-xs px-3 h-9 rounded-lg border border-emerald-400/40 text-emerald-200 font-semibold shrink-0">
            {isAr ? "كورساتي" : "My courses"}
          </button>
          <button onClick={() => alerts.markSeen("payments")} aria-label="dismiss" className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

export function ContinueLearningCard({ target, hasCourses, lang, onOpen, onBrowse }: {
  target: { en: Enrollment; progress: number; done: number; total: number } | null;
  hasCourses: boolean; lang: string; onOpen: (en: Enrollment) => void; onBrowse: () => void;
}) {
  const isAr = lang === "ar";
  if (!target) {
    return (
      <div className="dash-card p-5 flex items-center gap-4 flex-wrap">
        <Sparkles className="w-6 h-6 text-[var(--gold)]" />
        <p className="flex-1 text-sm text-white/70">
          {hasCourses
            ? (isAr ? "أحسنت! لا توجد وحدات متبقية حالياً — استكشف كورساً جديداً." : "Great work! Nothing left right now — explore a new course.")
            : (isAr ? "ابدأ رحلتك التعليمية باختيار أول كورس." : "Start your learning journey by picking your first course.")}
        </p>
        <button onClick={onBrowse} className="text-xs px-4 h-9 rounded-lg border border-[var(--gold)]/40 text-[var(--gold)] font-semibold inline-flex items-center gap-1.5">
          {isAr ? "الكورسات المتاحة" : "Available courses"} <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
        </button>
      </div>
    );
  }
  const c = target.en.courses;
  return (
    <div className="dash-card relative overflow-hidden p-6 border-[var(--gold)]/40">
      <div className="pointer-events-none absolute -top-20 -end-20 w-64 h-64 rounded-full bg-[var(--gold)]/15 blur-3xl" />
      <div className="relative flex items-center gap-5 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/40 flex items-center justify-center text-3xl shrink-0">
          {c?.cover_emoji || "🎓"}
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-[11px] tracking-widest text-[var(--gold)] font-bold">{isAr ? "استكمل التعلّم" : "CONTINUE LEARNING"}</p>
          <h3 className="text-lg font-bold mt-1 truncate">{c?.title}</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${target.progress}%`, background: "linear-gradient(90deg, var(--gold), #b8923f)" }} />
            </div>
            <span className="text-xs font-semibold text-[var(--gold)]">{target.progress}% · {target.done}/{target.total}</span>
          </div>
        </div>
        <button onClick={() => onOpen(target.en)}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-to-r from-[var(--gold)] to-[#e8c870] text-[#0b1736] font-bold text-sm hover:brightness-110 transition">
          <PlayCircle className="w-4 h-4" /> {isAr ? "استكمال التعلّم" : "Continue learning"}
        </button>
      </div>
    </div>
  );
}
