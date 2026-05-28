import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { LifeBuoy, X, Send, Loader2, Plus, MessageSquare, Sparkles, BookOpen, CircleDot, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export type Ticket = {
  id: string;
  user_id: string;
  course_id: string | null;
  subject: string;
  status: "open" | "pending_admin" | "pending_user" | "closed";
  unread_for_admin: boolean;
  unread_for_user: boolean;
  last_message_at: string;
  created_at: string;
};
export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

type EnrolledCourse = { id: string; title: string };

/* -------------------------------------------------------------------------- */
/*  Trainee — bell-style button + popup                                       */
/* -------------------------------------------------------------------------- */
export function TraineeSupportButton({
  userId,
  enrolledCourses,
}: {
  userId: string;
  enrolledCourses: EnrolledCourse[];
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  async function load() {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`tickets-user-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unreadCount = tickets.filter((t) => t.unread_for_user).length;
  const glowing = unreadCount > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative flex items-center gap-2 px-5 h-12 rounded-xl font-semibold transition-all hover:scale-[1.02] ${
          glowing
            ? "ring-2 ring-[var(--gold)] shadow-[0_0_25px_rgba(212,175,55,0.55)] animate-[pulse_1.6s_ease-in-out_infinite]"
            : ""
        }`}
        style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
      >
        <LifeBuoy className="w-4 h-4" />
        {isAr ? "مركز الدعم" : "Support Center"}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -end-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0b1736]">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <SupportPopup
          role="user"
          currentUserId={userId}
          tickets={tickets}
          enrolledCourses={enrolledCourses}
          onClose={() => setOpen(false)}
          onAnyChange={load}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Admin — inline panel                                                      */
/* -------------------------------------------------------------------------- */
export function AdminSupportPanel({ adminUserId }: { adminUserId: string }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [tickets, setTickets] = useState<(Ticket & { profile?: { full_name: string | null; email: string | null } | null; course?: { title: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("support_tickets")
      .select("*, course:courses(title)")
      .order("last_message_at", { ascending: false });
    const rows = (data as any[]) ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);
    let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      profilesMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, { full_name: p.full_name, email: p.email }]));
    }
    setTickets(rows.map((r) => ({ ...r, profile: profilesMap[r.user_id] ?? null })));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`tickets-admin-${adminUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUserId]);

  const unread = tickets.filter((t) => t.unread_for_admin).length;
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? null;

  return (
    <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? "تذاكر الدعم" : "Support tickets"}</h2>
            <p className="text-xs text-white/55">
              {isAr ? `${tickets.length} إجمالي · ${unread} في انتظار الرد` : `${tickets.length} total · ${unread} awaiting reply`}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-white/50 text-center py-10">{isAr ? "جاري التحميل..." : "Loading..."}</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-white/50 text-center py-10">{isAr ? "لا توجد تذاكر بعد." : "No tickets yet."}</p>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTicketId(t.id)}
              className={`w-full text-start rounded-xl border p-3.5 transition group flex items-start gap-3 ${
                t.unread_for_admin
                  ? "border-[var(--gold)]/45 bg-[var(--gold)]/[0.06] hover:bg-[var(--gold)]/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/5"
              }`}
            >
              <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${t.unread_for_admin ? "bg-[var(--gold)] animate-pulse" : "bg-white/25"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm leading-tight truncate">{t.subject}</p>
                  <span className="text-[10px] text-white/45 shrink-0">{new Date(t.last_message_at).toLocaleString(isAr ? "ar-EG" : "en-US")}</span>
                </div>
                <p className="text-xs text-white/55 mt-1 truncate">
                  {t.profile?.full_name || t.profile?.email || "—"}
                  {t.course?.title ? ` · ${t.course.title}` : ""}
                </p>
                <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] px-2 py-0.5 rounded-full ${statusClass(t.status)}`}>
                  {statusLabel(t.status, isAr)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTicket && (
        <SupportPopup
          role="admin"
          currentUserId={adminUserId}
          tickets={tickets}
          enrolledCourses={[]}
          initialTicketId={activeTicket.id}
          onClose={() => setActiveTicketId(null)}
          onAnyChange={load}
        />
      )}
    </section>
  );
}

function statusLabel(s: Ticket["status"], isAr: boolean) {
  if (s === "pending_admin") return isAr ? "بانتظار رد الإدارة" : "Awaiting admin";
  if (s === "pending_user") return isAr ? "بانتظار ردك" : "Awaiting user";
  if (s === "closed") return isAr ? "مغلقة" : "Closed";
  return isAr ? "مفتوحة" : "Open";
}
function statusClass(s: Ticket["status"]) {
  if (s === "pending_admin") return "bg-amber-500/15 text-amber-200 border border-amber-400/30";
  if (s === "pending_user") return "bg-sky-500/15 text-sky-200 border border-sky-400/30";
  if (s === "closed") return "bg-white/5 text-white/55 border border-white/15";
  return "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30";
}

/* -------------------------------------------------------------------------- */
/*  Shared popup (modal)                                                      */
/* -------------------------------------------------------------------------- */
function SupportPopup({
  role,
  currentUserId,
  tickets,
  enrolledCourses,
  initialTicketId,
  onClose,
  onAnyChange,
}: {
  role: "user" | "admin";
  currentUserId: string;
  tickets: Ticket[];
  enrolledCourses: EnrolledCourse[];
  initialTicketId?: string;
  onClose: () => void;
  onAnyChange: () => void;
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [selectedId, setSelectedId] = useState<string | null>(initialTicketId ?? null);
  const [composing, setComposing] = useState(false);
  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) ?? null, [tickets, selectedId]);

  // Listen for ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="absolute inset-0 bg-[#040818]/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl h-[78vh] max-h-[720px] rounded-3xl overflow-hidden border border-[var(--gold)]/25 bg-gradient-to-br from-[#0d1a3d] via-[#0b1736] to-[#08122a] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[var(--gold)]/[0.08] via-transparent to-[var(--gold)]/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.25)]">
              <LifeBuoy className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <h2 className="font-bold text-base">{isAr ? "مركز الدعم" : "Support center"}</h2>
              <p className="text-[11px] text-white/55">{isAr ? "نرد عادةً خلال ساعات قليلة" : "We usually reply within a few hours"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg border border-white/15 hover:bg-white/10 flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <aside className={`w-72 shrink-0 border-e border-white/10 bg-white/[0.02] flex flex-col ${role === "admin" ? "hidden" : "hidden md:flex"}`}>
            <div className="p-3">
              <button
                onClick={() => { setComposing(true); setSelectedId(null); }}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[var(--gold)] text-[#0b1736] font-bold text-sm hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" /> {isAr ? "تذكرة جديدة" : "New ticket"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {tickets.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-8 px-3">
                  {isAr ? "لا توجد تذاكر بعد. ابدأ بإنشاء واحدة." : "No tickets yet. Create one to get started."}
                </p>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedId(t.id); setComposing(false); }}
                    className={`w-full text-start p-3 rounded-xl border transition flex items-start gap-2 ${
                      selectedId === t.id
                        ? "border-[var(--gold)]/55 bg-[var(--gold)]/10"
                        : "border-transparent hover:bg-white/5"
                    }`}
                  >
                    {t.unread_for_user
                      ? <CircleDot className="w-3.5 h-3.5 text-[var(--gold)] mt-0.5 animate-pulse shrink-0" />
                      : <CheckCircle2 className="w-3.5 h-3.5 text-white/30 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">{t.subject}</p>
                      <p className="text-[10px] text-white/45 mt-0.5">{new Date(t.last_message_at).toLocaleString(isAr ? "ar-EG" : "en-US")}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0 flex flex-col">
            {composing && role === "user" ? (
              <NewTicketForm
                userId={currentUserId}
                enrolledCourses={enrolledCourses}
                onCreated={(t) => { setComposing(false); setSelectedId(t.id); onAnyChange(); }}
                onCancel={() => setComposing(false)}
              />
            ) : selected ? (
              <ConversationView
                ticket={selected}
                role={role}
                currentUserId={currentUserId}
                onChange={onAnyChange}
              />
            ) : (
              <EmptyState isAr={isAr} role={role} onStart={role === "user" ? () => setComposing(true) : undefined} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ isAr, role, onStart }: { isAr: boolean; role: "user" | "admin"; onStart?: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-[var(--gold)]" />
      </div>
      <h3 className="font-bold text-lg mb-1">{isAr ? "كيف يمكننا مساعدتك؟" : "How can we help?"}</h3>
      <p className="text-sm text-white/55 max-w-md mb-5">
        {role === "user"
          ? isAr
            ? "افتح تذكرة جديدة بأي استفسار أو مشكلة، وسيتم الرد عليك مباشرة من الإدارة."
            : "Open a new ticket with any question or issue and the admin team will reply directly."
          : isAr ? "اختر تذكرة من القائمة للرد عليها." : "Select a ticket to reply."}
      </p>
      {onStart && (
        <button onClick={onStart} className="px-5 h-11 rounded-xl bg-[var(--gold)] text-[#0b1736] font-bold text-sm hover:brightness-110 transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> {isAr ? "إنشاء تذكرة" : "Create ticket"}
        </button>
      )}
    </div>
  );
}

function NewTicketForm({
  userId,
  enrolledCourses,
  onCreated,
  onCancel,
}: {
  userId: string;
  enrolledCourses: EnrolledCourse[];
  onCreated: (t: Ticket) => void;
  onCancel: () => void;
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [subject, setSubject] = useState("");
  const [relatedToCourse, setRelatedToCourse] = useState(false);
  const [courseId, setCourseId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    if (relatedToCourse && !courseId) {
      toast.error(isAr ? "اختر الكورس المتعلق بالتذكرة" : "Please pick the related course");
      return;
    }
    setSubmitting(true);
    try {
      const { data: t, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: userId,
          subject: subject.trim().slice(0, 200),
          course_id: relatedToCourse ? courseId : null,
        })
        .select("*")
        .single();
      if (error || !t) throw error;
      const { error: mErr } = await supabase.from("support_ticket_messages").insert({
        ticket_id: t.id,
        sender_id: userId,
        sender_role: "user",
        body: message.trim().slice(0, 4000),
      });
      if (mErr) throw mErr;
      toast.success(isAr ? "تم إرسال التذكرة" : "Ticket sent");
      onCreated(t as Ticket);
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "تعذّر إنشاء التذكرة" : "Failed to create ticket"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 space-y-4">
      <div>
        <h3 className="font-bold text-base mb-1">{isAr ? "تذكرة جديدة" : "New ticket"}</h3>
        <p className="text-xs text-white/55">{isAr ? "اكتب موضوعاً مختصراً ووصفاً واضحاً للمشكلة." : "Use a short subject and a clear description."}</p>
      </div>

      <div>
        <label className="block text-xs text-white/65 mb-1.5">{isAr ? "الموضوع" : "Subject"}</label>
        <input
          required maxLength={200}
          value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder={isAr ? "مثال: مشكلة في تشغيل المحاضرة" : "e.g. Lecture not playing"}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-11 text-sm focus:outline-none focus:border-[var(--gold)]/50"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
          <input type="checkbox" checked={relatedToCourse} onChange={(e) => setRelatedToCourse(e.target.checked)} className="accent-[var(--gold)]" />
          <BookOpen className="w-3.5 h-3.5" />
          {isAr ? "هذه التذكرة متعلقة بكورس" : "This ticket is related to a course"}
        </label>
        {relatedToCourse && (
          <select
            required value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 h-11 text-sm focus:outline-none focus:border-[var(--gold)]/50"
          >
            <option value="" disabled className="bg-[#0b1736]">{isAr ? "اختر الكورس..." : "Pick a course..."}</option>
            {enrolledCourses.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0b1736]">{c.title}</option>
            ))}
            {enrolledCourses.length === 0 && (
              <option disabled className="bg-[#0b1736]">{isAr ? "لا توجد كورسات مسجّلة" : "No enrolled courses"}</option>
            )}
          </select>
        )}
      </div>

      <div>
        <label className="block text-xs text-white/65 mb-1.5">{isAr ? "وصف المشكلة" : "Describe the issue"}</label>
        <textarea
          required maxLength={4000} rows={6}
          value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder={isAr ? "اشرح بالتفصيل ما الذي تحتاج المساعدة فيه..." : "Describe what you need help with..."}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--gold)]/50 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition">
          {isAr ? "إلغاء" : "Cancel"}
        </button>
        <button type="submit" disabled={submitting} className="flex-1 h-11 rounded-xl bg-[var(--gold)] text-[#0b1736] font-bold text-sm hover:brightness-110 transition disabled:opacity-60 inline-flex items-center justify-center gap-2">
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <Send className="w-4 h-4" /> {isAr ? "إرسال" : "Send"}
        </button>
      </div>
    </form>
  );
}

function ConversationView({
  ticket, role, currentUserId, onChange,
}: {
  ticket: Ticket;
  role: "user" | "admin";
  currentUserId: string;
  onChange: () => void;
}) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    setMessages((data as TicketMessage[]) ?? []);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 30);
  }

  // mark as read
  useEffect(() => {
    (async () => {
      if (role === "user" && ticket.unread_for_user) {
        await supabase.from("support_tickets").update({ unread_for_user: false }).eq("id", ticket.id);
        onChange();
      } else if (role === "admin" && ticket.unread_for_admin) {
        await supabase.from("support_tickets").update({ unread_for_admin: false }).eq("id", ticket.id);
        onChange();
      }
    })();
    load();
    const ch = supabase
      .channel(`ticket-msg-${ticket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${ticket.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const { error } = await supabase.from("support_ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: currentUserId,
      sender_role: role,
      body: body.trim().slice(0, 4000),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setBody("");
    onChange();
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{ticket.subject}</p>
          <p className="text-[10px] text-white/45">{new Date(ticket.created_at).toLocaleString(isAr ? "ar-EG" : "en-US")}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusClass(ticket.status)}`}>{statusLabel(ticket.status, isAr)}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-transparent to-black/20">
        {messages.length === 0 ? (
          <p className="text-xs text-white/40 text-center py-10">{isAr ? "لا توجد رسائل بعد." : "No messages yet."}</p>
        ) : messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow ${
                mine
                  ? "bg-gradient-to-br from-[var(--gold)] to-[#b8923f] text-[#0b1736] rounded-br-sm"
                  : "bg-white/10 border border-white/10 text-white rounded-bl-sm"
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? "text-[#0b1736]/70" : "text-white/45"}`}>
                  {new Date(m.created_at).toLocaleString(isAr ? "ar-EG" : "en-US")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status !== "closed" ? (
        <form onSubmit={send} className="border-t border-white/10 p-3 flex items-end gap-2 bg-white/[0.02]">
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)}
            rows={1} maxLength={4000}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).form?.requestSubmit(); }}
            placeholder={isAr ? "اكتب ردك..." : "Type your reply..."}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--gold)]/50 resize-none max-h-32"
          />
          <button type="submit" disabled={sending || !body.trim()} className="h-11 px-4 rounded-xl bg-[var(--gold)] text-[#0b1736] font-bold text-sm hover:brightness-110 transition disabled:opacity-60 inline-flex items-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">{isAr ? "إرسال" : "Send"}</span>
          </button>
          {role === "admin" && (
            <button
              type="button"
              onClick={async () => {
                await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticket.id);
                onChange();
                toast.success(isAr ? "تم إغلاق التذكرة" : "Ticket closed");
              }}
              className="h-11 px-3 rounded-xl border border-white/15 hover:bg-white/10 text-xs text-white/75 transition"
            >
              {isAr ? "إغلاق التذكرة" : "Close"}
            </button>
          )}
        </form>
      ) : (
        <div className="border-t border-white/10 p-4 text-center text-xs text-white/50 bg-white/[0.02]">
          {isAr ? "هذه التذكرة مغلقة." : "This ticket is closed."}
          {role === "admin" && (
            <button
              onClick={async () => {
                await supabase.from("support_tickets").update({ status: "pending_admin" }).eq("id", ticket.id);
                onChange();
              }}
              className="ms-3 text-[var(--gold)] hover:underline text-xs"
            >
              {isAr ? "إعادة فتحها" : "Reopen"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* mobile fallback list trigger for trainee — when sidebar is hidden, show inline list above conversation */
