import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Trash2, Plus, Loader2, Calendar, Clock, User, Phone, MessageSquare, X } from "lucide-react";

type Slot = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  booked_by: string | null;
  booked_at: string | null;
  booker_name: string | null;
  booker_phone: string | null;
  topic: string | null;
  admin_notes: string | null;
  created_at: string;
};

export function BookingsPanel() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState(""); // "10:00, 10:30, 11:00"
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "available" | "booked">("all");

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("consultation_slots")
      .select("*")
      .order("starts_at", { ascending: true });
    setSlots((data as Slot[]) || []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function createSlots(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !times.trim()) {
      toast.error(t("التاريخ والأوقات مطلوبة", "Date and times required"));
      return;
    }
    const timeList = times.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (timeList.length === 0) {
      toast.error(t("أضف وقتاً واحداً على الأقل", "Add at least one time"));
      return;
    }
    setBusy(true);
    const rows = timeList.map((tm) => {
      // Local datetime → ISO
      const dt = new Date(`${date}T${tm}:00`);
      return {
        starts_at: dt.toISOString(),
        duration_minutes: 30,
        admin_notes: notes.trim() || null,
      };
    });
    const { error } = await supabase.from("consultation_slots").insert(rows);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t(`تم إضافة ${rows.length} موعد ✅`, `${rows.length} slots added ✅`));
    setOpen(false); setDate(""); setTimes(""); setNotes("");
    refresh();
  }

  async function deleteSlot(id: string, isBooked: boolean) {
    const msg = isBooked
      ? t("هذا الموعد محجوز. هل أنت متأكد من الحذف؟", "This slot is booked. Delete anyway?")
      : t("حذف هذا الموعد؟", "Delete this slot?");
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from("consultation_slots").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تم الحذف", "Deleted"));
    refresh();
  }

  async function clearBooking(id: string) {
    if (!window.confirm(t("إلغاء حجز هذا الموعد وإتاحته من جديد؟", "Cancel this booking and re-open the slot?"))) return;
    const { error } = await supabase.from("consultation_slots").update({
      booked_by: null, booked_at: null, booker_name: null, booker_phone: null, topic: null,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تم الإلغاء — الموعد متاح الآن", "Cancelled — slot is open"));
    refresh();
  }

  const filtered = useMemo(() => {
    if (filter === "available") return slots.filter((s) => !s.booked_by);
    if (filter === "booked") return slots.filter((s) => s.booked_by);
    return slots;
  }, [slots, filter]);

  const stats = useMemo(() => ({
    total: slots.length,
    booked: slots.filter((s) => s.booked_by).length,
    available: slots.filter((s) => !s.booked_by).length,
  }), [slots]);

  return (
    <div className="dash-card p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-extrabold text-lg text-white">
            {t("حجوزات الاستشارات", "Consultation bookings")}
          </h2>
          <p className="text-xs text-white/60 mt-1">
            {t(`${stats.total} موعد · ${stats.booked} محجوز · ${stats.available} متاح`,
               `${stats.total} slots · ${stats.booked} booked · ${stats.available} open`)}
          </p>
        </div>
        <button onClick={() => setOpen(true)}
          className="px-4 h-10 rounded-xl text-sm font-bold inline-flex items-center gap-2 bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736]">
          <Plus className="size-4" />
          {t("إضافة مواعيد", "Add slots")}
        </button>
      </div>

      <div className="flex gap-2 text-xs">
        {(["all", "available", "booked"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 h-8 rounded-lg font-semibold transition ${
              filter === f ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:text-white"
            }`}>
            {f === "all" ? t("الكل", "All") : f === "available" ? t("متاحة", "Open") : t("محجوزة", "Booked")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center text-white/60"><Loader2 className="size-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-white/60 text-sm">{t("لا توجد مواعيد", "No slots")}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const d = new Date(s.starts_at);
            const isBooked = !!s.booked_by;
            return (
              <div key={s.id}
                className={`rounded-xl p-3.5 border ${isBooked ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-sm font-bold text-white">
                      <Calendar className="size-4 text-white/60" />
                      {d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                        weekday: "short", year: "numeric", month: "short", day: "numeric",
                      })}
                      <Clock className="size-4 text-white/60 ms-2" />
                      {d.toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                      <span className="text-xs text-white/50">({s.duration_minutes} {t("د", "min")})</span>
                    </div>
                    {isBooked ? (
                      <div className="mt-2 text-xs text-white/80 space-y-1">
                        <div className="flex items-center gap-2"><User className="size-3.5 text-white/50" />{s.booker_name}</div>
                        <div className="flex items-center gap-2" dir="ltr"><Phone className="size-3.5 text-white/50" />{s.booker_phone}</div>
                        {s.topic && (
                          <div className="flex items-start gap-2"><MessageSquare className="size-3.5 text-white/50 mt-0.5" /><span className="text-white/70">{s.topic}</span></div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-xs text-white/50">{t("متاح للحجز", "Open for booking")}</div>
                    )}
                    {s.admin_notes && (
                      <div className="mt-2 text-[11px] text-white/50 italic">📝 {s.admin_notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isBooked && (
                      <button onClick={() => clearBooking(s.id)} title={t("إلغاء الحجز", "Clear booking")}
                        className="px-2.5 h-8 rounded-md text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-white/70 border border-white/15">
                        <X className="size-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteSlot(s.id, isBooked)} title={t("حذف", "Delete")}
                      className="size-8 grid place-items-center rounded-md text-white/60 hover:text-red-400 hover:bg-red-500/10 transition">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <form onSubmit={createSlots} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#0c1224] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-extrabold text-base text-white">{t("إضافة مواعيد جديدة", "Add new slots")}</h3>
              <button type="button" onClick={() => setOpen(false)} className="size-8 grid place-items-center rounded-md text-white/60 hover:text-white hover:bg-white/5">
                <X className="size-4" />
              </button>
            </div>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">{t("التاريخ", "Date")} *</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">{t("الأوقات (مفصولة بفواصل)", "Times (comma separated)")} *</span>
              <textarea value={times} onChange={(e) => setTimes(e.target.value)} rows={3} dir="ltr"
                placeholder="10:00, 10:30, 11:00, 11:30"
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50 resize-none" />
              <p className="text-[11px] text-white/40 mt-1">{t("صيغة 24 ساعة. كل وقت = موعد منفصل ٣٠ دقيقة.", "24-hour format. Each time = one 30-min slot.")}</p>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">{t("ملاحظات داخلية (اختياري)", "Internal notes (optional)")}</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-white/5 text-white border border-white/10 outline-none focus:border-[var(--gold)]/50" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 h-10 rounded-xl text-sm font-semibold text-white/70 hover:text-white">
                {t("إلغاء", "Cancel")}
              </button>
              <button type="submit" disabled={busy}
                className="px-4 h-10 rounded-xl text-sm font-bold bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] disabled:opacity-50 inline-flex items-center gap-2">
                {busy && <Loader2 className="size-4 animate-spin" />}
                {t("إضافة", "Add")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
