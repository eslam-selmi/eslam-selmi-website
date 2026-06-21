import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Calendar, Clock, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

type Slot = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  booked_by: string | null;
  booker_name: string | null;
  booker_phone: string | null;
  topic: string | null;
};

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "احجز استشارة مجانية | Book a Free Consultation — Eslam Selmi" },
      {
        name: "description",
        content:
          "احجز جلسة استشارية مجانية مدتها ٣٠ دقيقة مع إسلام السلمي. اختر موعداً متاحاً يناسبك. | Book a free 30-minute consultation with Eslam Selmi.",
      },
      { property: "og:title", content: "احجز استشارة مجانية | Book a Free Consultation" },
      {
        property: "og:description",
        content:
          "اختر موعداً متاحاً واحجز جلستك المجانية مع إسلام السلمي.",
      },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const t = (a: string, b: string) => (isAr ? a : b);
  const nav = useNavigate();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
        // Prefill name from profile
        supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", data.user.id)
          .maybeSingle()
          .then(({ data: p }) => {
            if (p?.full_name) setName(p.full_name);
            if (p?.phone) setPhone(p.phone);
          });
      }
    });
  }, []);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("consultation_slots")
      .select("id,starts_at,duration_minutes,booked_by,booker_name,booker_phone,topic")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    setSlots((data as Slot[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const myBookings = useMemo(
    () => (user ? slots.filter((s) => s.booked_by === user.id) : []),
    [slots, user],
  );
  const available = useMemo(() => slots.filter((s) => !s.booked_by), [slots]);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of available) {
      const d = new Date(s.starts_at);
      const key = d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [available, isAr]);

  async function book() {
    if (!user) {
      toast.error(t("سجّل دخول أولاً للحجز", "Sign in to book"));
      nav({ to: "/auth" });
      return;
    }
    if (!selectedId) return;
    if (!name.trim()) {
      toast.error(t("الاسم مطلوب", "Name is required"));
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      toast.error(t("رقم تواصل صحيح مطلوب", "Valid phone is required"));
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("consultation_slots")
      .update({
        booked_by: user.id,
        booker_name: name.trim().slice(0, 120),
        booker_phone: phone.trim().slice(0, 30),
        topic: topic.trim().slice(0, 500) || null,
      })
      .eq("id", selectedId)
      .is("booked_by", null);
    setBusy(false);
    if (error) {
      toast.error(t("تعذّر الحجز — قد يكون الموعد حُجز للتو", "Could not book — slot may be taken"));
      refresh();
      return;
    }
    toast.success(t("تم الحجز بنجاح ✅", "Booking confirmed ✅"));
    setSelectedId(null);
    setTopic("");
    refresh();
  }

  async function cancel(id: string) {
    if (!user) return;
    if (!window.confirm(t("إلغاء الحجز؟", "Cancel this booking?"))) return;
    // Only admin can fully unset; trainees can't via RLS. So we just tell them to contact admin.
    toast.message(
      t(
        "للإلغاء تواصل مع الإدارة من قسم تذاكر الدعم",
        "To cancel, please contact admin via support tickets",
      ),
    );
  }

  return (
    <div className="min-h-screen" dir={isAr ? "rtl" : "ltr"}
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <header className="sticky top-0 z-30 backdrop-blur-md border-b border-foreground/10"
        style={{ background: "color-mix(in oklab, var(--background) 80%, transparent)" }}>
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold hover:opacity-80">
            <ArrowLeft className={`size-4 ${isAr ? "rotate-180" : ""}`} />
            {t("الرئيسية", "Home")}
          </Link>
          <h1 className="font-display font-extrabold text-base sm:text-lg">
            {t("احجز استشارة مجانية", "Book a Free Consultation")}
          </h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {t("٣٠ دقيقة", "30 min")}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="rounded-3xl p-6 sm:p-8 shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--gold) 14%, var(--card)), var(--card))",
            border: "1px solid color-mix(in oklab, var(--gold) 35%, transparent)",
          }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] font-bold mb-2"
            style={{ color: "color-mix(in oklab, var(--gold) 70%, var(--foreground))" }}>
            <Calendar className="size-4" />
            {t("استشارة شخصية", "Personal session")}
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-2">
            {t("احجز موعدك في دقائق", "Reserve your slot in minutes")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            {t(
              "اختر موعداً متاحاً، أضف بياناتك وموضوع الجلسة، وسنؤكد الحجز فوراً. الجلسة مجانية ومدتها ٣٠ دقيقة.",
              "Pick an available slot, share your details and topic, and your booking is confirmed instantly. The session is free and lasts 30 minutes.",
            )}
          </p>
        </section>

        {/* My bookings */}
        {user && myBookings.length > 0 && (
          <section>
            <h3 className="font-display font-extrabold text-lg mb-3">
              {t("حجوزاتي القادمة", "My upcoming bookings")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {myBookings.map((s) => (
                <div key={s.id} className="rounded-2xl p-4 border"
                  style={{
                    background: "color-mix(in oklab, var(--card) 92%, transparent)",
                    borderColor: "color-mix(in oklab, var(--gold) 30%, transparent)",
                  }}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 className="size-4" style={{ color: "var(--gold)" }} />
                    {new Date(s.starts_at).toLocaleString(isAr ? "ar-EG" : "en-US", {
                      weekday: "long", month: "long", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                  {s.topic && (
                    <p className="text-xs text-muted-foreground mt-2">{s.topic}</p>
                  )}
                  <button onClick={() => cancel(s.id)}
                    className="mt-3 text-xs text-muted-foreground hover:text-destructive transition">
                    {t("إلغاء", "Cancel")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Slots */}
        <section>
          <h3 className="font-display font-extrabold text-lg mb-3">
            {t("المواعيد المتاحة", "Available slots")}
          </h3>

          {loading ? (
            <div className="py-12 grid place-items-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="rounded-2xl p-8 text-center text-sm text-muted-foreground border border-dashed border-foreground/15">
              {t(
                "لا توجد مواعيد متاحة حالياً. ابقَ على اطلاع، سيتم فتح مواعيد جديدة قريباً.",
                "No slots are open right now. Check back soon — new slots open regularly.",
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([day, items]) => (
                <div key={day}>
                  <div className="text-xs uppercase tracking-[0.22em] font-bold text-muted-foreground mb-2">
                    {day}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => {
                      const time = new Date(s.starts_at).toLocaleTimeString(
                        isAr ? "ar-EG" : "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      );
                      const active = selectedId === s.id;
                      return (
                        <button key={s.id}
                          onClick={() => setSelectedId(active ? null : s.id)}
                          className="px-4 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: active
                              ? "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))"
                              : "color-mix(in oklab, var(--card) 92%, transparent)",
                            color: active ? "var(--accent-foreground)" : "var(--foreground)",
                            border: `1px solid ${
                              active
                                ? "transparent"
                                : "color-mix(in oklab, var(--foreground) 10%, transparent)"
                            }`,
                          }}>
                          <Clock className="size-3.5" />
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Booking form */}
        {selectedId && (
          <section className="rounded-3xl p-6 sm:p-8 shadow-md"
            style={{
              background: "color-mix(in oklab, var(--card) 95%, transparent)",
              border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)",
            }}>
            <h3 className="font-display font-extrabold text-lg mb-4">
              {t("بياناتك", "Your details")}
            </h3>

            {!user && (
              <div className="mb-4 p-3 rounded-xl text-sm"
                style={{
                  background: "color-mix(in oklab, var(--gold) 14%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--gold) 40%, transparent)",
                }}>
                {t("لإكمال الحجز، ", "To complete booking, ")}
                <Link to="/auth" className="font-bold underline">
                  {t("سجّل دخول هنا", "sign in here")}
                </Link>
                {t(" أو أنشئ حساب جديد.", " or create a new account.")}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("الاسم", "Name")} required>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
                  style={{
                    background: "color-mix(in oklab, var(--background) 70%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
                  }} />
              </Field>
              <Field label={t("رقم التواصل", "Phone")} required>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30}
                  dir="ltr" placeholder="+20…"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--gold)]/40"
                  style={{
                    background: "color-mix(in oklab, var(--background) 70%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
                  }} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("موضوع الجلسة (اختياري)", "Session topic (optional)")}>
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} maxLength={500}
                    placeholder={t("ما الذي تحب نتناقش فيه؟", "What would you like to discuss?")}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--gold)]/40 resize-none"
                    style={{
                      background: "color-mix(in oklab, var(--background) 70%, transparent)",
                      border: "1px solid color-mix(in oklab, var(--foreground) 12%, transparent)",
                    }} />
                </Field>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={book} disabled={busy || !user}
                className="px-5 h-11 rounded-2xl font-bold text-sm inline-flex items-center gap-2 shadow-md disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition"
                style={{
                  background: "linear-gradient(135deg, var(--gold), color-mix(in oklab, var(--gold) 55%, var(--accent)))",
                  color: "var(--accent-foreground)",
                }}>
                {busy && <Loader2 className="size-4 animate-spin" />}
                {t("تأكيد الحجز", "Confirm booking")}
              </button>
              <button onClick={() => setSelectedId(null)}
                className="px-4 h-11 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground transition">
                {t("إلغاء", "Cancel")}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
        {label} {required && <span style={{ color: "var(--gold)" }}>*</span>}
      </span>
      {children}
    </label>
  );
}
