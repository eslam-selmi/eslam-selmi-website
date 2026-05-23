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
      .channel(`notifs-${userId}`)
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
        className="relative w-10 h-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
        aria-label="notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-[340px] max-h-[480px] overflow-hidden rounded-2xl border border-white/15 bg-[rgba(11,23,54,0.98)] backdrop-blur-2xl shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-sm font-bold">الإشعارات</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-[var(--gold)] hover:underline flex items-center gap-1">
                <Check className="w-3 h-3" /> تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8">لا توجد إشعارات</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`group px-4 py-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!n.read ? "bg-[var(--gold)]/5" : ""}`}
                  onClick={() => {
                    markRead(n.id);
                    if (n.link) { nav({ to: n.link as any }); setOpen(false); }
                  }}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--gold)] shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      {n.body && <p className="text-xs text-white/60 mt-1 leading-relaxed">{n.body}</p>}
                      <p className="text-[10px] text-white/40 mt-1.5">{new Date(n.created_at).toLocaleString("ar-EG")}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-rose-300 transition"
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
