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

export function NotificationsBell({ userId }: { userId: string | undefined }) {
  const { items, unread, markRead, markAllRead, remove } = useNotifications(userId);
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
          unread > 0
            ? "border-[var(--gold)]/55 bg-[var(--gold)]/10 hover:bg-[var(--gold)]/15 shadow-[0_0_18px_rgba(212,175,55,0.35)]"
            : "border-white/15 bg-white/5 hover:bg-white/10"
        }`}
        aria-label="notifications"
      >
        <Bell className={`w-4 h-4 ${unread > 0 ? "text-[var(--gold)]" : ""}`} />
        {unread > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0b1736]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-[360px] max-h-[520px] overflow-hidden rounded-2xl border border-[var(--gold)]/25 bg-gradient-to-b from-[#0d1a3d] to-[#0b1736] backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-[var(--gold)]/[0.08] to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">الإشعارات</p>
                <p className="text-[10px] text-white/55">{unread > 0 ? `${unread} غير مقروء` : "كل شيء محدّث"}</p>
              </div>
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-[var(--gold)] hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> تعليم الكل
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            {items.length === 0 ? (
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
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
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
