import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Check, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!userId) return;
    refresh();
    const ch = supabase
      .channel(`notifs-${userId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev]);
          toast(n.title, { description: n.body ?? undefined });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  async function markAllRead() {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setItems((p) => p.map((n) => ({ ...n, read: true })));
  }
  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setItems((p) => p.filter((n) => n.id !== id));
  }

  const unread = items.filter((n) => !n.read).length;
  return { items, loading, unread, markRead, markAllRead, remove, refresh };
}

export type PendingAction = { key: string; title: string; detail?: string; count: number; onOpen: () => void };

export function NotificationsBell({ userId, pending = [] }: { userId: string | undefined; pending?: PendingAction[] }) {
  const { items, unread, markRead, markAllRead, remove } = useNotifications(userId);
  const actions = pending.filter((a) => a.count > 0);
  const pendingTotal = actions.reduce((n, a) => n + a.count, 0);
  // Enrollment/activation notices describe items already counted in the pending list: keep them listed but do not count them twice
  const represented = (n: Notification) => actions.length > 0 && !n.read && /انضمام|تفعيل|enroll|activation/i.test(n.title);
  const unreadOther = items.filter((n) => !n.read && !represented(n)).length;
  const badge = unreadOther + pendingTotal;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition ${
          badge > 0
            ? "border-[var(--gold)]/55 bg-[var(--gold)]/10 hover:bg-[var(--gold)]/15 shadow-[0_0_18px_rgba(212,175,55,0.35)]"
            : "border-white/15 bg-white/5 hover:bg-white/10"
        }`}
        aria-label="notifications"
      >
        <Bell className={`w-4 h-4 ${badge > 0 ? "text-[var(--gold)]" : ""}`} />
        {badge > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0b1736]">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      {open && (
        <div data-bell-panel className="fixed inset-x-3 top-[72px] sm:absolute sm:inset-x-auto sm:top-auto sm:end-0 sm:mt-2 sm:w-[360px] max-h-[520px] overflow-hidden text-white rounded-2xl border border-[var(--gold)]/25 bg-[#0b1736] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-[var(--gold)]/[0.08] to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">الإشعارات</p>
                <p className="text-[10px] text-white/55">{unreadOther > 0 || pendingTotal > 0 ? [pendingTotal > 0 ? `${pendingTotal} بانتظار إجراء` : "", unreadOther > 0 ? `${unreadOther} إشعار غير مقروء` : ""].filter(Boolean).join(" · ") : "كل شيء محدّث"}</p>
              </div>
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-[var(--gold)] hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> تعليم الكل
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 py-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.25)_transparent]">
            {actions.length > 0 && (
              <div className="mx-2 mt-1 mb-2">
                <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-wide text-[var(--gold)]">بانتظار إجراء منك</p>
                {actions.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => { a.onOpen(); setOpen(false); }}
                    className="w-full text-start flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/[0.06] hover:bg-[var(--gold)]/10 mb-1 transition"
                  >
                    <span className="min-w-6 h-6 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">{a.count}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-white leading-tight">{a.title}</span>
                      {a.detail && <span className="block text-[11px] text-white/60 mt-0.5">{a.detail}</span>}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {items.length === 0 && actions.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto mb-3 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white/30" />
                </div>
                <p className="text-xs text-white/45">لا توجد إشعارات</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`group mx-2 my-1 px-3 py-3 rounded-xl border transition cursor-pointer ${
                    !n.read
                      ? "border-[var(--gold)]/30 bg-[var(--gold)]/[0.06] hover:bg-[var(--gold)]/10"
                      : "border-transparent hover:bg-white/5"
                  }`}
                  onClick={() => {
                    markRead(n.id);
                    if (n.link) { nav({ to: n.link as any }); setOpen(false); }
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.read
                      ? <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--gold)] shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.7)]" />
                      : <span className="mt-1.5 w-2 h-2 rounded-full bg-white/15 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight text-white">{n.title}</p>
                      {n.body && <p className="text-xs text-white/60 mt-1 leading-relaxed line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-white/40 mt-1.5">{new Date(n.created_at).toLocaleString("ar-EG")}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-rose-300 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
