import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { safeHref } from "@/lib/safe-url";
import { toast } from "sonner";
import {
  X, Calendar, Clock, Video, Sparkles, Check, Loader2, LogIn, ChevronLeft, ChevronRight,
  Sun, Moon, User as UserIcon, Phone, Mail, MessageSquare, CalendarPlus, Download, RefreshCw, Ban, ListChecks,
} from "lucide-react";
import { googleCalUrl, outlookCalUrl, downloadIcs, type CalEvent } from "./calendar-links";

type Slot = { id: string; starts_at: string; duration_minutes: number };
type MyBooking = Slot & { status: string; meeting_url: string | null; topic: string | null; details: string | null };

const TOPICS = [
  { ar: "إدارة المواهب", en: "Talent management" },
  { ar: "تطوير القدرات والتدريب", en: "Capability development & training" },
  { ar: "التطوير المهني الشخصي", en: "Personal career development" },
  { ar: "بناء برنامج تدريبي لشركة", en: "Corporate training program" },
  { ar: "أخرى", en: "Other" },
];

const gold = "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))";
const field = {
  background: "color-mix(in oklab, var(--background) 60%, transparent)",
  border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
};
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function BookingDialog() {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const tx = (a: string, b: string) => (isAr ? a : b);
  const loc = isAr ? "ar-EG" : "en-US";

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"book" | "mine">("book");
  const [step, setStep] = useState<1 | 2>(1);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mine, setMine] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState<string | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", topic: "", details: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<MyBooking | null>(null);
  const [rescheduling, setRescheduling] = useState<MyBooking | null>(null);

  useEffect(() => {
    const h = () => { setOpen(true); setView("book"); };
    window.addEventListener("open-calendly", h);
    return () => window.removeEventListener("open-calendly", h);
  }, []);

  async function refresh(uid = user?.id) {
    setLoading(true);
    const now = new Date().toISOString();
    const [o, m] = await Promise.all([
      supabase.from("consultation_slots").select("id,starts_at,duration_minutes")
        .gte("starts_at", now).is("booked_by", null).eq("status", "scheduled").order("starts_at"),
      uid
        ? supabase.from("consultation_slots").select("id,starts_at,duration_minutes,status,meeting_url,topic,details")
            .eq("booked_by", uid).order("starts_at", { ascending: false }).limit(30)
        : Promise.resolve({ data: [] as MyBooking[] }),
    ]);
    setSlots(o.data ?? []);
    setMine(m.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    setDone(null); setSelected(null); setStep(1); setRescheduling(null);
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? "" });
        const { data: p } = await supabase.from("profiles").select("full_name, phone").eq("id", u.id).maybeSingle();
        setForm((f) => ({ ...f, name: f.name || p?.full_name || "", phone: f.phone || p?.phone || "", email: f.email || u.email || "" }));
      } else setUser(null);
      refresh(u?.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of slots) { const k = dayKey(new Date(s.starts_at)); m.set(k, [...(m.get(k) ?? []), s]); }
    return m;
  }, [slots]);

  useEffect(() => {
    if (!day && slots.length) {
      const first = new Date(slots[0].starts_at);
      setDay(dayKey(first));
      setMonth(new Date(first.getFullYear(), first.getMonth(), 1));
    }
  }, [slots, day]);

  const grid = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);

  const daySlots = day ? byDay.get(day) ?? [] : [];
  const morning = daySlots.filter((s) => new Date(s.starts_at).getHours() < 12);
  const evening = daySlots.filter((s) => new Date(s.starts_at).getHours() >= 12);
  const upcoming = mine.filter((b) => b.status === "scheduled" && new Date(b.starts_at) > new Date());

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  const fmtFull = (iso: string) => new Date(iso).toLocaleString(loc, { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  function calEvent(b: MyBooking): CalEvent {
    return {
      id: b.id, title: tx("استشارة ١:١ مع إسلام سلمي", "1:1 Consultation with Eslam Selmi"),
      startsAt: b.starts_at, durationMinutes: b.duration_minutes, url: b.meeting_url, details: b.topic ?? undefined,
    };
  }

  async function pickSlot(s: Slot) {
    if (rescheduling) {
      setBusy(true);
      const { data, error } = await supabase.rpc("reschedule_my_booking", { _slot_id: rescheduling.id, _new_slot_id: s.id });
      setBusy(false);
      const res = data as { ok?: boolean; error?: string } | null;
      if (error || !res?.ok) {
        toast.error(res?.error === "too_late"
          ? tx("لا يمكن التعديل قبل الموعد بأقل من ٣ ساعات", "Changes are not allowed within 3 hours of the session")
          : tx("تعذّرت إعادة الجدولة — جرّب موعداً آخر", "Could not reschedule — try another time"));
        refresh(); return;
      }
      toast.success(tx("تم نقل موعدك ✅", "Your session was moved ✅"));
      setRescheduling(null); setView("mine"); refresh(); return;
    }
    setSelected(s); setStep(2);
  }

  async function confirm() {
    if (!user || !selected) return;
    const name = form.name.trim(), phone = form.phone.trim(), email = form.email.trim();
    if (name.length < 2) return toast.error(tx("الاسم مطلوب", "Name is required"));
    if (!/^\+?[\d\s-]{6,20}$/.test(phone)) return toast.error(tx("رقم تواصل صحيح مطلوب", "Valid phone is required"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return toast.error(tx("بريد إلكتروني صحيح مطلوب", "Valid email is required"));
    if (!form.topic) return toast.error(tx("اختر موضوع الاستشارة", "Choose a topic"));
    if (form.details.trim().length < 10) return toast.error(tx("اكتب تفاصيل أكثر (١٠ أحرف على الأقل)", "Add more details (min 10 chars)"));
    setBusy(true);
    const { data, error } = await supabase.from("consultation_slots").update({
      booked_by: user.id, booker_name: name.slice(0, 120), booker_phone: phone.slice(0, 30),
      topic: form.topic.slice(0, 200), details: `${form.details.trim().slice(0, 1500)}\n— ${email}`,
    }).eq("id", selected.id).is("booked_by", null).select("id,starts_at,duration_minutes,status,meeting_url,topic,details").maybeSingle();
    setBusy(false);
    if (error || !data) {
      const msg = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`;
      toast.error(msg.includes("COOLDOWN")
        ? tx("لا يمكن حجز أكثر من استشارة مجانية خلال ٢٤ ساعة 🙏", "Only one free consultation per 24 hours 🙏")
        : tx("تعذّر الحجز — قد يكون الموعد حُجز للتو", "Could not book — the slot may have just been taken"), { duration: 6000 });
      setStep(1); refresh(); return;
    }
    setDone(data); setForm((f) => ({ ...f, details: "", topic: "" })); refresh();
  }

  async function cancel(b: MyBooking) {
    if (!window.confirm(tx("إلغاء هذا الموعد؟", "Cancel this session?"))) return;
    const { data, error } = await supabase.rpc("cancel_my_booking", { _slot_id: b.id });
    const res = data as { ok?: boolean; error?: string } | null;
    if (error || !res?.ok) {
      toast.error(res?.error === "too_late"
        ? tx("لا يمكن الإلغاء قبل الموعد بأقل من ٣ ساعات", "Cancellation is not allowed within 3 hours of the session")
        : tx("تعذّر الإلغاء", "Could not cancel"));
      return;
    }
    toast.success(tx("تم إلغاء الموعد", "Session cancelled"));
    refresh();
  }

  if (!open) return null;

  const statusLabel: Record<string, string> = {
    scheduled: tx("مؤكد", "Confirmed"), attended: tx("حضر", "Attended"), no_show: tx("لم يحضر", "No-show"),
    cancelled: tx("ملغي", "Cancelled"), completed: tx("مكتمل", "Completed"),
  };

  const SessionSummary = ({ b }: { b: MyBooking }) => {
    const e = calEvent(b);
    const link = b.meeting_url ? safeHref(b.meeting_url) : null;
    return (
      <div className="space-y-3">
        <div className="text-sm font-semibold">{fmtFull(b.starts_at)} <span className="text-muted-foreground text-xs">({b.duration_minutes} {tx("دقيقة", "min")})</span></div>
        <div className="rounded-xl p-3 text-sm flex items-start gap-2" style={field}>
          <Video className="size-4 mt-0.5 shrink-0" style={{ color: "var(--gold)" }} />
          {link ? (
            <div className="min-w-0">
              <div className="font-bold">{tx("رابط الاجتماع", "Meeting link")}</div>
              <a href={link} target="_blank" rel="noreferrer" className="underline break-all text-xs" dir="ltr">{b.meeting_url}</a>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">{tx("سيُضاف رابط الاجتماع (Google Meet / Zoom) هنا قبل الموعد.", "The meeting link (Google Meet / Zoom) will appear here before the session.")}</div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a href={googleCalUrl(e)} target="_blank" rel="noreferrer" className="h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-foreground/5" style={field}>
            <CalendarPlus className="size-3.5" /> Google
          </a>
          <button onClick={() => downloadIcs(e)} className="h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-foreground/5" style={field}>
            <Download className="size-3.5" /> Apple (.ics)
          </button>
          <a href={outlookCalUrl(e)} target="_blank" rel="noreferrer" className="h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-foreground/5" style={field}>
            <CalendarPlus className="size-3.5" /> Outlook
          </a>
        </div>
      </div>
    );
  };

  const TimeGroup = ({ label, icon: I, items }: { label: string; icon: typeof Sun; items: Slot[] }) =>
    items.length ? (
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-2 flex items-center gap-1.5"><I className="size-3.5" />{label}</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((s) => (
            <button key={s.id} disabled={busy} onClick={() => pickSlot(s)}
              className="h-10 rounded-xl text-sm font-bold transition hover:scale-[1.04] active:scale-[0.97] disabled:opacity-50"
              style={selected?.id === s.id ? { background: gold, color: "var(--accent-foreground)" } : field}>
              {fmtTime(s.starts_at)}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md" onClick={() => setOpen(false)} dir={dir}>
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden bg-card shadow-2xl border border-foreground/10" onClick={(e) => e.stopPropagation()}>
        <div className="relative px-6 pt-6 pb-4 shrink-0" style={{
          background: "linear-gradient(135deg, color-mix(in oklab, var(--gold) 22%, var(--card)), color-mix(in oklab, var(--gold) 6%, var(--card)))",
          borderBottom: "1px solid color-mix(in oklab, var(--gold) 25%, transparent)",
        }}>
          <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-3 end-3 size-9 grid place-items-center rounded-full bg-foreground/5 hover:bg-foreground/10"><X className="size-4" /></button>
          <div className="flex items-start gap-4">
            <div className="size-12 grid place-items-center rounded-2xl shrink-0" style={{ background: gold, color: "var(--accent-foreground)" }}><Calendar className="size-6" /></div>
            <div className="min-w-0 flex-1">
              <div className="font-display font-extrabold text-lg sm:text-xl">{tx("احجز استشارة ١:١", "Book a 1:1 Consultation")}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[{ i: Clock, t: tx("٣٠ دقيقة", "30 minutes") }, { i: Video, t: "Google Meet / Zoom" }, { i: Sparkles, t: tx("مجاناً", "Free") }].map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)", color: "var(--accent)" }}>
                    <b.i className="size-3" />{b.t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {user && (
            <div className="mt-4 inline-flex p-1 rounded-xl" style={field}>
              {(["book", "mine"] as const).map((v) => (
                <button key={v} onClick={() => { setView(v); setDone(null); setStep(1); setRescheduling(null); }}
                  className="px-4 h-8 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                  style={view === v ? { background: gold, color: "var(--accent-foreground)" } : undefined}>
                  {v === "book" ? <><Calendar className="size-3.5" />{tx("حجز جديد", "New booking")}</> : <><ListChecks className="size-3.5" />{tx("حجوزاتي", "My bookings")}{upcoming.length ? ` (${upcoming.length})` : ""}</>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {done ? (
            <div className="rounded-3xl p-6 space-y-4" style={{ background: "color-mix(in oklab, var(--gold) 10%, var(--card))", border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)" }}>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full grid place-items-center" style={{ background: gold, color: "var(--accent-foreground)" }}><Check className="size-6" strokeWidth={3} /></div>
                <div className="font-display font-extrabold text-xl">{tx("تم تأكيد حجزك ✨", "Booking confirmed ✨")}</div>
              </div>
              <SessionSummary b={done} />
              <div className="flex gap-2">
                <button onClick={() => { setDone(null); setView("mine"); }} className="flex-1 h-11 rounded-xl text-sm font-semibold" style={field}>{tx("إدارة حجوزاتي", "Manage my bookings")}</button>
                <button onClick={() => setOpen(false)} className="flex-1 h-11 rounded-xl text-sm font-bold" style={{ background: gold, color: "var(--accent-foreground)" }}>{tx("تم", "Done")}</button>
              </div>
            </div>
          ) : view === "mine" ? (
            loading ? <div className="py-12 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
            : mine.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">{tx("لا توجد حجوزات بعد", "No bookings yet")}</div>
            : (
              <div className="space-y-3">
                {mine.map((b) => {
                  const active = b.status === "scheduled" && new Date(b.starts_at) > new Date();
                  return (
                    <div key={b.id} className="rounded-2xl p-4 space-y-3" style={field}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-muted-foreground">{b.topic}</div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: "color-mix(in oklab, var(--gold) 14%, transparent)" }}>{statusLabel[b.status] ?? b.status}</span>
                      </div>
                      {active ? <SessionSummary b={b} /> : <div className="text-sm">{fmtFull(b.starts_at)}</div>}
                      {active && (
                        <div className="flex gap-2">
                          <button onClick={() => { setRescheduling(b); setView("book"); setStep(1); }} className="flex-1 h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5" style={field}>
                            <RefreshCw className="size-3.5" />{tx("إعادة جدولة", "Reschedule")}
                          </button>
                          <button onClick={() => cancel(b)} className="flex-1 h-10 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 text-destructive" style={field}>
                            <Ban className="size-3.5" />{tx("إلغاء الموعد", "Cancel")}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <p className="text-[11px] text-muted-foreground">{tx("يمكن الإلغاء أو إعادة الجدولة حتى ٣ ساعات قبل الموعد.", "You can cancel or reschedule up to 3 hours before the session.")}</p>
              </div>
            )
          ) : (
            <>
              {!user && (
                <div className="p-4 rounded-2xl text-sm flex items-center gap-3" style={{ background: "color-mix(in oklab, var(--gold) 12%, transparent)", border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)" }}>
                  <LogIn className="size-4 shrink-0" />
                  <div>{tx("لإكمال الحجز، ", "To complete booking, ")}<Link to="/auth" className="font-bold underline" onClick={() => setOpen(false)}>{tx("سجّل دخول هنا", "sign in here")}</Link>{tx(" أو أنشئ حساباً.", " or create an account.")}</div>
                </div>
              )}
              {rescheduling && (
                <div className="p-3 rounded-xl text-xs flex items-center justify-between gap-2" style={field}>
                  <span>{tx("اختر موعداً جديداً بدلاً من:", "Pick a new time to replace:")} <b>{fmtFull(rescheduling.starts_at)}</b></span>
                  <button onClick={() => { setRescheduling(null); setView("mine"); }} className="underline">{tx("تراجع", "Back")}</button>
                </div>
              )}

              {step === 1 ? (
                loading ? <div className="py-12 grid place-items-center"><Loader2 className="size-5 animate-spin" /></div>
                : slots.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center text-sm text-muted-foreground" style={field}>
                    <Clock className="size-8 mx-auto mb-3 opacity-50" />{tx("لا توجد مواعيد متاحة حالياً. سيتم فتح مواعيد جديدة قريباً.", "No open times right now — check back soon.")}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-[1fr_1fr] gap-5">
                    <div className="rounded-2xl p-4" style={field}>
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="size-8 grid place-items-center rounded-lg hover:bg-foreground/5" aria-label="prev">{isAr ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
                        <div className="font-bold text-sm">{month.toLocaleDateString(loc, { month: "long", year: "numeric" })}</div>
                        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="size-8 grid place-items-center rounded-lg hover:bg-foreground/5" aria-label="next">{isAr ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
                        {grid.slice(0, 7).map((d) => <div key={d.getDay()}>{d.toLocaleDateString(loc, { weekday: "narrow" })}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {grid.map((d) => {
                          const k = dayKey(d); const n = byDay.get(k)?.length ?? 0;
                          const inMonth = d.getMonth() === month.getMonth(); const sel = k === day;
                          return (
                            <button key={k} disabled={!n} onClick={() => setDay(k)}
                              className={`relative aspect-square rounded-lg text-xs font-bold transition ${!inMonth ? "opacity-30" : ""} ${n ? "hover:scale-105" : "opacity-40 cursor-not-allowed"}`}
                              style={sel ? { background: gold, color: "var(--accent-foreground)" } : n ? { background: "color-mix(in oklab, var(--gold) 12%, transparent)" } : undefined}>
                              {d.getDate()}
                              {n > 0 && !sel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full" style={{ background: "var(--gold)" }} />}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3">{tx("الأوقات معروضة بتوقيتك المحلي", "Times shown in your local time")} {tz && `(${tz})`}</p>
                    </div>
                    <div className="space-y-4">
                      {day ? (
                        <>
                          <div className="font-bold text-sm">{daySlots[0] && new Date(daySlots[0].starts_at).toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" })}</div>
                          <TimeGroup label={tx("صباحاً", "Morning")} icon={Sun} items={morning} />
                          <TimeGroup label={tx("مساءً", "Afternoon / Evening")} icon={Moon} items={evening} />
                          {!daySlots.length && <p className="text-sm text-muted-foreground">{tx("لا مواعيد في هذا اليوم", "No times on this day")}</p>}
                        </>
                      ) : <p className="text-sm text-muted-foreground">{tx("اختر يوماً من التقويم", "Pick a day")}</p>}
                    </div>
                  </div>
                )
              ) : selected && (
                <div className="space-y-4">
                  <button onClick={() => setStep(1)} className="text-xs underline">{tx("← تغيير الموعد", "← Change time")}</button>
                  <div className="rounded-xl p-3 text-sm font-bold" style={{ background: "color-mix(in oklab, var(--gold) 12%, transparent)" }}>{fmtFull(selected.starts_at)}</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { k: "name", l: tx("الاسم الكامل", "Full name"), i: UserIcon, t: "text", d: undefined },
                      { k: "phone", l: tx("رقم واتساب", "WhatsApp number"), i: Phone, t: "tel", d: "ltr" },
                      { k: "email", l: tx("البريد الإلكتروني", "Email"), i: Mail, t: "email", d: "ltr" },
                    ].map((f) => (
                      <label key={f.k} className={`block ${f.k === "email" ? "sm:col-span-2" : ""}`}>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{f.l} *</span>
                        <div className="relative">
                          <f.i className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground" />
                          <input type={f.t} dir={f.d} maxLength={f.k === "phone" ? 30 : 160} value={form[f.k as "name"]}
                            onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                            className="w-full rounded-xl ps-9 pe-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--gold)]/40" style={field} />
                        </div>
                      </label>
                    ))}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{tx("موضوع الاستشارة", "Consultation topic")} *</span>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((tp) => {
                        const v = isAr ? tp.ar : tp.en;
                        return (
                          <button key={tp.en} onClick={() => setForm({ ...form, topic: v })} className="px-3 h-9 rounded-xl text-xs font-bold"
                            style={form.topic === v ? { background: gold, color: "var(--accent-foreground)" } : field}>{v}</button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{tx("تفاصيل الاستشارة", "Consultation details")} *</span>
                    <div className="relative">
                      <MessageSquare className="absolute top-3 start-3 size-4 text-muted-foreground" />
                      <textarea rows={4} maxLength={1500} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })}
                        placeholder={tx("ما التحدي الذي تواجهه؟ وما الذي تريد الخروج به من الجلسة؟", "What challenge are you facing, and what do you want to take away?")}
                        className="w-full rounded-xl ps-9 pe-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[var(--gold)]/40" style={field} />
                    </div>
                  </label>
                  <button onClick={confirm} disabled={busy || !user} className="w-full h-12 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: gold, color: "var(--accent-foreground)" }}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={3} />}{tx("تأكيد الحجز", "Confirm booking")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
