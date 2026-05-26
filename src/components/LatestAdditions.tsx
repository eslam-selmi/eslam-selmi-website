import { useEffect, useState } from "react";
import { Sparkles, FileText, Link as LinkIcon, Video, FileType2, PlaySquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { MediaViewerModal, type MediaItem } from "./MediaViewerModal";

const LAST_SEEN_KEY = "latest_additions_last_seen_at";

export type Addition = {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  custom_label: string | null;
  kind: "link" | "file" | "video" | "pdf" | "embed";
  url: string;
  created_at: string;
};

type Settings = {
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
};

export function useLatestAdditionsBadge() {
  const [hasNew, setHasNew] = useState(false);
  const [latestAt, setLatestAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("latest_additions")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!mounted) return;
      const latest = data?.[0]?.created_at ?? null;
      setLatestAt(latest);
      const seen = typeof window !== "undefined" ? localStorage.getItem(LAST_SEEN_KEY) : null;
      setHasNew(!!latest && (!seen || new Date(latest) > new Date(seen)));
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const markSeen = () => {
    if (latestAt) {
      localStorage.setItem(LAST_SEEN_KEY, latestAt);
      setHasNew(false);
    }
  };
  return { hasNew, markSeen };
}

function iconFor(kind: Addition["kind"]) {
  if (kind === "video") return Video;
  if (kind === "pdf") return FileType2;
  if (kind === "file") return FileText;
  if (kind === "embed") return PlaySquare;
  return LinkIcon;
}

export function LatestAdditionsSection({ onView }: { onView?: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const [settings, setSettings] = useState<Settings | null>(null);
  const [items, setItems] = useState<Addition[]>([]);
  const [viewing, setViewing] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: list }] = await Promise.all([
        supabase.from("latest_additions_settings").select("*").limit(1).maybeSingle(),
        supabase.from("latest_additions").select("*").order("created_at", { ascending: false }).limit(24),
      ]);
      setSettings((s as Settings) ?? null);
      setItems((list ?? []) as Addition[]);
      setLoading(false);
      // mark seen as soon as the section is rendered
      const latest = list?.[0]?.created_at;
      if (latest) {
        localStorage.setItem(LAST_SEEN_KEY, latest);
        onView?.();
      }
    })();
  }, [onView]);

  if (loading) return null;
  if (!items.length && !settings) return null;

  const title = settings ? (isAr ? settings.title_ar : settings.title_en) : isAr ? "أحدث الإضافات" : "Latest Additions";
  const subtitle = settings ? (isAr ? settings.subtitle_ar : settings.subtitle_en) : null;

  return (
    <section
      id="latest-additions"
      className="rounded-3xl border border-[var(--gold)]/25 bg-gradient-to-br from-[var(--gold)]/[0.07] via-white/[0.02] to-transparent p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 text-[10px] text-[var(--gold)] tracking-widest uppercase mb-2">
            <Sparkles className="w-3 h-3" /> NEW
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-white/60 mt-1.5 max-w-xl">{subtitle}</p>}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-6">
          {isAr ? "لا توجد إضافات بعد." : "No additions yet."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => {
            const Icon = iconFor(it.kind);
            const t = isAr ? it.title_ar : it.title_en;
            const sub = isAr ? it.subtitle_ar : it.subtitle_en;
            const isStorage = it.kind === "file" || it.kind === "pdf" || (it.kind === "video" && !/^https?:\/\//i.test(it.url));
            return (
              <button
                key={it.id}
                type="button"
                onClick={() =>
                  setViewing({
                    title: t,
                    subtitle: sub,
                    kind: it.kind,
                    url: it.url,
                    isStoragePath: isStorage,
                  })
                }
                className="group text-start rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:border-[var(--gold)]/45 hover:bg-white/[0.06] transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[var(--gold)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {it.custom_label && (
                      <p className="text-[10px] text-[var(--gold)]/80 uppercase tracking-wider mb-0.5">
                        {it.custom_label}
                      </p>
                    )}
                    <p className="font-bold text-sm leading-tight truncate">{t}</p>
                    {sub && <p className="text-xs text-white/55 mt-1 line-clamp-2">{sub}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <MediaViewerModal item={viewing} onClose={() => setViewing(null)} />
    </section>
  );
}
