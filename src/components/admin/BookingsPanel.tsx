import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/lib/i18n";
import { safeHref } from "@/lib/safe-url";
import { toast } from "sonner";
import {
  Trash2, Plus, Loader2, Calendar, Clock, User, Phone, MessageSquare, X, Settings2, Download,
  ChevronLeft, ChevronRight, Video, Wand2, List, CalendarDays, CalendarRange, Save,
} from "lucide-react";

type Slot = Database["public"]["Tables"]["consultation_slots"]["Row"];
type Settings = Database["public"]["Tables"]["booking_settings"]["Row"];
type Status = "scheduled" | "attended" | "no_show" | "cancelled" | "completed";

const goldBtn = "bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736]";
const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50";
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function kind(s: Slot): "open" | Status {
  if (s.status === "cancelled") return "cancelled";
  if (!s.booked_by) return "open";
  return s.status as Status;
}
const kindCls: Record<string, string> = {
  open: "border-white/15 bg-white/[0.04] text-white/70",
  scheduled: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  attended: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  completed: "border-emerald-400/40 bg-emerald-400/15 text-emerald-100",
  no_show: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  cancelled: "border-rose-400/30 bg-rose-400/10 text-rose-200 line-through",
};

export function BookingsPanel() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);
  const loc = isAr ? "ar-EG" : "en-US";

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"week" | "month" | "list">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [filter, setFilter] = useState<"all" | "open" | "booked" | "cancelled">("all");
  const [active, setActive] = useState<Slot | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const labels: Record<string, string> = {
    open: t("متاح", "Open"), scheduled: t("محجوز", "Booked"), attended: t("حضر", "Attended"),
    completed: t("مكتمل", "Completed"), no_show: t("لم يحضر", "No-show"), cancelled: t("ملغي", "Cancelled"),
  };

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.from("consultation_slots").select("*").order("starts_at");
    setSlots(data ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => slots.filter((s) => {
    const k = kind(s);
    if (filter === "open") return k === "open";
    if (filter === "cancelled") return k === "cancelled";
    if (filter === "booked") return k !== "open" && k !== "cancelled";
    return true;
  }), [slots, filter]);

  const stats = useMemo(() => {
    const c = (k: string) => slots.filter((s) => kind(s) === k).length;
    const booked = slots.filter((s) => s.booked_by).length;
    const done = c("attended") + c("completed");
    return {
      total: slots.length, open: c("open"), booked, cancelled: c("cancelled"), noShow: c("no_show"), done,
      rate: done + c("no_show") ? Math.round((done / (done + c("no_show"))) * 100) : 0,
    };
  }, [slots]);

  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of filtered) { const k = dayKey(new Date(s.starts_at)); m.set(k, [...(m.get(k) ?? []), s]); }
    return m;
  }, [filtered]);

  const days = useMemo(() => {
    if (view === "week") {
      const s = new Date(anchor); s.setHours(0, 0, 0, 0); s.setDate(s.getDate() - s.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
    }
    const s = new Date(anchor.getFullYear(), anchor.getMonth(), 1); s.setDate(1 - s.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
  }, [view, anchor]);

  function shift(n: number) {
    const d = new Date(anchor);
    if (view === "week") d.setDate(d.getDate() + 7 * n); else d.setMonth(d.getMonth() + n);
    setAnchor(d);
  }

  function exportCsv() {
    const head = ["Date", "Time", "Duration", "Status", "Name", "Phone", "Email", "Topic", "Details", "Meeting link", "Admin notes", "Cancel reason"];
    const cell = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = filtered.map((s) => { const d = new Date(s.starts_at); return [
      d.toLocaleDateString("en-CA"), d.toTimeString().slice(0, 5), s.duration_minutes, labels[kind(s)], s.booker_name, s.booker_phone,
      s.booker_email, s.topic, s.details, s.meeting_url, s.admin_notes, s.cancel_reason,
    ].map(cell).join(","); });
    const blob = new Blob(["\uFEFF" + [head.join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  const Chip = ({ s }: { s: Slot }) => (
    <button onClick={() => setActive(s)} className={`w-full text-start rounded-md border px-1.5 py-1 text-[10px] font-semibold truncate ${kindCls[kind(s)]}`}>
      {new Date(s.starts_at).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })} {s.booker_name ? `· ${s.booker_name}` : ""}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          [t("إجمالي المواعيد", "Total slots"), stats.total], [t("متاحة", "Open"), stats.open], [t("محجوزة", "Booked"), stats.booked],
          [t("مكتملة / حضر", "Attended"), stats.done], [t("لم يحضر", "No-show"), stats.noShow], [t("نسبة الحضور", "Attendance"), `${stats.rate}%`],
        ].map(([l, v]) => (
          <div key={String(l)} className="dash-card p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{l}</div>
            <div className="text-xl font-extrabold text-white mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="dash-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display font-extrabold text-lg text-white">{t("حجوزات الاستشارات", "Consultation bookings")}</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowSettings(true)} className="px-3 h-10 rounded-xl text-sm font-semibold inline-flex items-center gap-2 bg-white/5 text-white border border-white/10"><Settings2 className="size-4" />{t("ساعات العمل والتوليد", "Hours & generate")}</button>
            <button onClick={exportCsv} className="px-3 h-10 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border border-[var(--gold)]/40 text-[var(--gold)]"><Download className="size-4" />CSV</button>
            <button onClick={() => setShowAdd(true)} className={`px-4 h-10 rounded-xl text-sm font-bold inline-flex items-center gap-2 ${goldBtn}`}><Plus className="size-4" />{t("موعد يدوي", "Manual slots")}</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5">
            {([["week", CalendarRange, t("أسبوعي", "Week")], ["month", CalendarDays, t("شهري", "Month")], ["list", List, t("قائمة", "List")]] as const).map(([v, I, l]) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 h-8 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${view === v ? goldBtn : "text-white/60"}`}><I className="size-3.5" />{l}</button>
            ))}
          </div>
          {view !== "list" && (
            <div className="flex items-center gap-2 text-white">
              <button onClick={() => shift(-1)} className="size-8 grid place-items-center rounded-lg bg-white/5">{isAr ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</button>
              <span className="text-sm font-bold min-w-36 text-center">
                {view === "week" ? `${days[0].toLocaleDateString(loc, { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString(loc, { day: "numeric", month: "short" })}` : anchor.toLocaleDateString(loc, { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => shift(1)} className="size-8 grid place-items-center rounded-lg bg-white/5">{isAr ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</button>
              <button onClick={() => setAnchor(new Date())} className="px-2 h-8 rounded-lg bg-white/5 text-xs">{t("اليوم", "Today")}</button>
            </div>
          )}
          <div className="flex gap-1 text-xs">
            {(["all", "open", "booked", "cancelled"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 h-8 rounded-lg font-semibold ${filter === f ? "bg-white/15 text-white" : "bg-white/5 text-white/60"}`}>
                {f === "all" ? t("الكل", "All") : f === "open" ? t("متاحة", "Open") : f === "booked" ? t("محجوزة", "Booked") : t("ملغاة", "Cancelled")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-white/60">
          {Object.keys(kindCls).map((k) => <span key={k} className="inline-flex items-center gap-1"><span className={`size-2.5 rounded-sm border ${kindCls[k]}`} />{labels[k]}</span>)}
        </div>

        {loading ? <div className="py-12 grid place-items-center text-white/60"><Loader2 className="size-6 animate-spin" /></div>
        : view === "list" ? (
          filtered.length === 0 ? <div className="py-10 text-center text-white/60 text-sm">{t("لا توجد مواعيد", "No slots")}</div> : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <button key={s.id} onClick={() => setActive(s)} className={`w-full text-start rounded-xl p-3 border flex items-center gap-3 flex-wrap ${kindCls[kind(s)].replace("line-through", "")}`}>
                  <Calendar className="size-4 opacity-60" />
                  <span className="text-sm font-bold">{new Date(s.starts_at).toLocaleString(loc, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-xs flex-1 truncate">{s.booker_name ?? ""} {s.topic ? `· ${s.topic}` : ""}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/20">{labels[kind(s)]}</span>
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <div className={`grid grid-cols-7 gap-1.5 ${view === "week" ? "min-w-[760px]" : "min-w-[640px]"}`}>
              {days.slice(0, 7).map((d) => <div key={`h${d.getDay()}`} className="text-center text-[10px] font-bold text-white/50 uppercase">{d.toLocaleDateString(loc, { weekday: "short" })}</div>)}
              {days.map((d) => {
                const items = byDay.get(dayKey(d)) ?? [];
                const today = dayKey(d) === dayKey(new Date());
                const dim = view === "month" && d.getMonth() !== anchor.getMonth();
                return (
                  <div key={dayKey(d)} className={`rounded-xl border p-1.5 space-y-1 ${view === "week" ? "min-h-64" : "min-h-24"} ${today ? "border-[var(--gold)]/60" : "border-white/10"} ${dim ? "opacity-40" : ""}`}>
                    <div className={`text-[11px] font-bold ${today ? "text-[var(--gold)]" : "text-white/70"}`}>{d.getDate()}</div>
                    {(view === "month" ? items.slice(0, 3) : items).map((s) => <Chip key={s.id} s={s} />)}
                    {view === "month" && items.length > 3 && (
                      <button onClick={() => { setAnchor(d); setView("week"); }} className="text-[10px] text-white/50 underline">+{items.length - 3}</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {active && <SlotModal slot={active} labels={labels} onClose={() => setActive(null)} onSaved={() => { setActive(null); refresh(); }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onGenerated={refresh} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); refresh(); }} />}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0c1224] border border-white/10 p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-extrabold text-base text-white">{title}</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-md text-white/60 hover:bg-white/5"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Lbl({ l, children }: { l: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">{l}</span>{children}</label>;
}

function SlotModal({ slot, labels, onClose, onSaved }: { slot: Slot; labels: Record<string, string>; onClose: () => void; onSaved: () => void }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [status, setStatus] = useState<Status>(slot.status as Status);
  const [notes, setNotes] = useState(slot.admin_notes ?? "");
  const [url, setUrl] = useState(slot.meeting_url ?? "");
  const [busy, setBusy] = useState(false);
  const booked = !!slot.booked_by;
  const link = slot.meeting_url ? safeHref(slot.meeting_url) : null;

  async function save() {
    if (url && !/^https:\/\/.+/.test(url.trim())) return toast.error(t("رابط الاجتماع يجب أن يبدأ بـ https://", "Meeting link must start with https://"));
    setBusy(true);
    const patch: Database["public"]["Tables"]["consultation_slots"]["Update"] = {
      status, admin_notes: notes.trim().slice(0, 2000) || null, meeting_url: url.trim() || null,
    };
    if (status === "cancelled" && slot.status !== "cancelled") patch.cancelled_at = new Date().toISOString();
    const { error } = await supabase.from("consultation_slots").update(patch).eq("id", slot.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
  }
  async function reopen() {
    if (!window.confirm(t("إلغاء الحجز وإتاحة الموعد من جديد؟", "Clear booking and reopen this slot?"))) return;
    const { error } = await supabase.from("consultation_slots").update({
      booked_by: null, booked_at: null, booker_name: null, booker_phone: null, booker_email: null, topic: null, details: null, status: "scheduled", cancelled_at: null, cancel_reason: null,
    }).eq("id", slot.id);
    if (error) return toast.error(error.message);
    onSaved();
  }
  async function del() {
    if (!window.confirm(t("حذف هذا الموعد نهائياً؟", "Delete this slot permanently?"))) return;
    const { error } = await supabase.from("consultation_slots").delete().eq("id", slot.id);
    if (error) return toast.error(error.message);
    onSaved();
  }

  return (
    <Modal title={new Date(slot.starts_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} onClose={onClose}>
      <div className="text-xs text-white/60 flex items-center gap-2"><Clock className="size-3.5" />{slot.duration_minutes} {t("دقيقة", "min")} · {labels[kind(slot)]}</div>
      {booked && (
        <div className="rounded-xl bg-white/5 p-3 space-y-1.5 text-sm text-white/85">
          <div className="flex items-center gap-2"><User className="size-3.5 text-white/50" />{slot.booker_name}</div>
          <div className="flex items-center gap-2" dir="ltr"><Phone className="size-3.5 text-white/50" />{slot.booker_phone} {slot.booker_email ? `· ${slot.booker_email}` : ""}</div>
          {slot.topic && <div className="flex items-start gap-2"><MessageSquare className="size-3.5 text-white/50 mt-1" /><b>{slot.topic}</b></div>}
          {slot.details && <p className="text-xs text-white/60 whitespace-pre-wrap">{slot.details}</p>}
          {slot.cancel_reason && <p className="text-xs text-rose-300">{t("سبب الإلغاء:", "Cancel reason:")} {slot.cancel_reason}</p>}
          {link && <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[var(--gold)] underline"><Video className="size-3.5" />{t("فتح الاجتماع", "Open meeting")}</a>}
        </div>
      )}
      {booked && (
        <Lbl l={t("حالة الجلسة", "Session status")}>
          <div className="grid grid-cols-3 gap-2">
            {(["scheduled", "attended", "completed", "no_show", "cancelled"] as Status[]).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={`h-9 rounded-lg text-xs font-bold border ${status === s ? goldBtn + " border-transparent" : "border-white/10 text-white/70"}`}>{labels[s]}</button>
            ))}
          </div>
        </Lbl>
      )}
      <Lbl l={t("رابط الاجتماع (Google Meet / Zoom)", "Meeting link (Google Meet / Zoom)")}>
        <input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/..." className={inputCls} />
      </Lbl>
      <Lbl l={t("ملاحظات الأدمن الخاصة", "Private admin notes")}>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} className={inputCls + " resize-none"} />
      </Lbl>
      <div className="flex flex-wrap gap-2 justify-between pt-2">
        <div className="flex gap-2">
          <button onClick={del} className="px-3 h-10 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 inline-flex items-center gap-1.5"><Trash2 className="size-3.5" />{t("حذف", "Delete")}</button>
          {booked && <button onClick={reopen} className="px-3 h-10 rounded-xl text-xs font-semibold text-white/70 bg-white/5">{t("إتاحة من جديد", "Reopen")}</button>}
        </div>
        <button onClick={save} disabled={busy} className={`px-5 h-10 rounded-xl text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50 ${goldBtn}`}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{t("حفظ", "Save")}
        </button>
      </div>
    </Modal>
  );
}

function SettingsModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);
  const [s, setS] = useState<Settings | null>(null);
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const dayNames = isAr ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => { supabase.from("booking_settings").select("*").limit(1).maybeSingle().then(({ data }) => setS(data)); }, []);
  if (!s) return <Modal title={t("ساعات العمل", "Working hours")} onClose={onClose}><Loader2 className="size-5 animate-spin text-white mx-auto" /></Modal>;

  const hm = (v: string | null) => (v ? v.slice(0, 5) : "");

  async function save() {
    if (!s) return false;
    if (s.start_time >= s.end_time) { toast.error(t("وقت البداية يجب أن يسبق النهاية", "Start must be before end")); return false; }
    if (s.slot_minutes < 10 || s.slot_minutes > 240) { toast.error(t("مدة الجلسة بين ١٠ و٢٤٠ دقيقة", "Session length 10–240 min")); return false; }
    if (s.default_meeting_url && !/^https:\/\/.+/.test(s.default_meeting_url)) { toast.error(t("الرابط يجب أن يبدأ بـ https://", "Link must start with https://")); return false; }
    const { error } = await supabase.from("booking_settings").update({
      work_days: s.work_days, start_time: s.start_time, end_time: s.end_time, slot_minutes: s.slot_minutes,
      buffer_minutes: s.buffer_minutes, break_start: s.break_start || null, break_end: s.break_end || null,
      default_meeting_url: s.default_meeting_url?.trim() || null, timezone: s.timezone,
    }).eq("id", s.id);
    if (error) { toast.error(error.message); return false; }
    return true;
  }
  async function generate() {
    setBusy(true);
    if (!(await save())) { setBusy(false); return; }
    const { data, error } = await supabase.rpc("generate_booking_slots", { _from: from, _to: to });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t(`تم توليد ${data} موعد ✅`, `${data} slots generated ✅`));
    onGenerated(); onClose();
  }

  return (
    <Modal title={t("ساعات وأيام العمل", "Working hours & days")} onClose={onClose}>
      <Lbl l={t("أيام العمل", "Working days")}>
        <div className="flex flex-wrap gap-1.5">
          {dayNames.map((n, i) => {
            const on = s.work_days.includes(i);
            return <button key={i} onClick={() => setS({ ...s, work_days: on ? s.work_days.filter((x) => x !== i) : [...s.work_days, i].sort() })}
              className={`px-3 h-9 rounded-lg text-xs font-bold border ${on ? goldBtn + " border-transparent" : "border-white/10 text-white/60"}`}>{n}</button>;
          })}
        </div>
      </Lbl>
      <div className="grid grid-cols-2 gap-3">
        <Lbl l={t("من", "From")}><input type="time" value={hm(s.start_time)} onChange={(e) => setS({ ...s, start_time: e.target.value })} className={inputCls} /></Lbl>
        <Lbl l={t("إلى", "To")}><input type="time" value={hm(s.end_time)} onChange={(e) => setS({ ...s, end_time: e.target.value })} className={inputCls} /></Lbl>
        <Lbl l={t("مدة الجلسة (دقيقة)", "Session length (min)")}><input type="number" min={10} max={240} value={s.slot_minutes} onChange={(e) => setS({ ...s, slot_minutes: Number(e.target.value) })} className={inputCls} /></Lbl>
        <Lbl l={t("فاصل بين الجلسات (دقيقة)", "Buffer between sessions (min)")}><input type="number" min={0} max={120} value={s.buffer_minutes} onChange={(e) => setS({ ...s, buffer_minutes: Number(e.target.value) })} className={inputCls} /></Lbl>
        <Lbl l={t("بداية الاستراحة", "Break start")}><input type="time" value={hm(s.break_start)} onChange={(e) => setS({ ...s, break_start: e.target.value || null })} className={inputCls} /></Lbl>
        <Lbl l={t("نهاية الاستراحة", "Break end")}><input type="time" value={hm(s.break_end)} onChange={(e) => setS({ ...s, break_end: e.target.value || null })} className={inputCls} /></Lbl>
      </div>
      <Lbl l={t("المنطقة الزمنية", "Timezone")}>
        <select value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} className={inputCls + " bg-[#0c1224]"}>
          {["Africa/Cairo", "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Qatar", "Europe/London"].map((z) => <option key={z}>{z}</option>)}
        </select>
      </Lbl>
      <Lbl l={t("رابط الاجتماع الافتراضي", "Default meeting link")}>
        <input dir="ltr" value={s.default_meeting_url ?? ""} onChange={(e) => setS({ ...s, default_meeting_url: e.target.value })} placeholder="https://meet.google.com/... / https://zoom.us/j/..." className={inputCls} />
        <span className="text-[11px] text-white/40 mt-1 block">{t("يُضاف تلقائياً لكل حجز جديد، ويمكن تغييره لكل جلسة.", "Added automatically to every new booking; can be changed per session.")}</span>
      </Lbl>
      <div className="rounded-xl border border-[var(--gold)]/30 p-3 space-y-3">
        <div className="text-xs font-bold text-[var(--gold)] flex items-center gap-1.5"><Wand2 className="size-3.5" />{t("توليد المواعيد تلقائياً", "Auto-generate slots")}</div>
        <div className="grid grid-cols-2 gap-3">
          <Lbl l={t("من تاريخ", "From date")}><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></Lbl>
          <Lbl l={t("إلى تاريخ", "To date")}><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></Lbl>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={async () => { if (await save()) { toast.success(t("تم الحفظ", "Saved")); onClose(); } }} className="px-4 h-10 rounded-xl text-sm font-semibold text-white bg-white/5">{t("حفظ فقط", "Save only")}</button>
        <button onClick={generate} disabled={busy} className={`px-4 h-10 rounded-xl text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50 ${goldBtn}`}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}{t("حفظ وتوليد", "Save & generate")}
        </button>
      </div>
    </Modal>
  );
}

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState("");
  const [duration, setDuration] = useState(30);
  const [busy, setBusy] = useState(false);
  async function submit() {
    const list = times.split(/[,\n]/).map((s) => s.trim()).filter((s) => /^\d{1,2}:\d{2}$/.test(s));
    if (!date || !list.length) return toast.error(t("التاريخ والأوقات مطلوبة (مثال 10:00)", "Date and times required (e.g. 10:00)"));
    setBusy(true);
    const { error } = await supabase.from("consultation_slots").insert(list.map((tm) => ({ starts_at: new Date(`${date}T${tm.padStart(5, "0")}:00`).toISOString(), duration_minutes: duration })));
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t(`تمت إضافة ${list.length} موعد`, `${list.length} slots added`));
    onSaved();
  }
  return (
    <Modal title={t("إضافة مواعيد يدوياً", "Add slots manually")} onClose={onClose}>
      <Lbl l={t("التاريخ", "Date")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Lbl>
      <Lbl l={t("الأوقات (مفصولة بفواصل)", "Times (comma separated)")}><textarea dir="ltr" rows={3} value={times} onChange={(e) => setTimes(e.target.value)} placeholder="10:00, 10:40, 11:20" className={inputCls + " resize-none"} /></Lbl>
      <Lbl l={t("المدة (دقيقة)", "Duration (min)")}><input type="number" min={10} max={240} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls} /></Lbl>
      <div className="flex justify-end"><button onClick={submit} disabled={busy} className={`px-5 h-10 rounded-xl text-sm font-bold disabled:opacity-50 ${goldBtn}`}>{busy ? <Loader2 className="size-4 animate-spin" /> : t("إضافة", "Add")}</button></div>
    </Modal>
  );
}
