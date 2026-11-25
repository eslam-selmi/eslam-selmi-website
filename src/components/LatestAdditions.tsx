import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  FileText,
  Link as LinkIcon,
  Video,
  FileType2,
  PlaySquare,
  ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { MediaViewerModal, type MediaItem } from "./MediaViewerModal";
import { AdditionContactDialog } from "./AdditionContactDialog";
import { latestAdditionsOptions, type Addition } from "@/lib/latest-additions";
import { Button } from "@/components/ui/button";

const LAST_SEEN_KEY = "latest_additions_last_seen_at";

export type { Addition } from "@/lib/latest-additions";

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

/** Per-kind tint, taken from the site palette tokens only. */
const KIND_TOKEN: Record<Addition["kind"], string> = {
  link: "var(--accent)",
  file: "var(--cover-silver)",
  pdf: "var(--lavender)",
  video: "var(--booking-cyan)",
  embed: "var(--booking-cyan)",
};

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function relativeDate(iso: string, isAr: boolean) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const days = Math.round((Date.now() - then) / (24 * 60 * 60 * 1000));
  const rtf = new Intl.RelativeTimeFormat(isAr ? "ar" : "en", { numeric: "auto" });
  if (days < 1) return rtf.format(0, "day");
  if (days < 30) return rtf.format(-days, "day");
  if (days < 365) return rtf.format(-Math.round(days / 30), "month");
  return rtf.format(-Math.round(days / 365), "year");
}

export function LatestAdditionsSection({ onView }: { onView?: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const { data, isPending } = useQuery(latestAdditionsOptions);
  const settings = data?.settings;
  const items = data?.items ?? [];
  const [viewing, setViewing] = useState<MediaItem | null>(null);
  const [collecting, setCollecting] = useState<Addition | null>(null);
  const [opened, setOpened] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const latest = data?.items[0]?.created_at;
    if (latest) {
      localStorage.setItem(LAST_SEEN_KEY, latest);
      onView?.();
    }
  }, [data, onView]);

  function openItem(item: Addition) {
    setViewing({
      title: isAr ? item.title_ar : item.title_en,
      subtitle: isAr ? item.subtitle_ar : item.subtitle_en,
      kind: item.kind,
      url: item.url,
      isStoragePath: !/^https?:\/\//i.test(item.url) && ["file", "pdf", "video"].includes(item.kind),
    });
  }

  if (isPending) return null;

  const title = settings ? (isAr ? settings.title_ar : settings.title_en) : isAr ? "أحدث الإضافات" : "Latest Additions";
  const subtitle = settings ? (isAr ? settings.subtitle_ar : settings.subtitle_en) : null;

  return (
    <section id="latest-additions" className="additions-panel px-5 py-6 sm:px-8 sm:py-9">
      <span className="additions-scan" aria-hidden />
      <Sparkles className="additions-watermark" aria-hidden />

      <header className="additions-head">
        <div className="min-w-0">
          <span className="additions-pill">
            <span className="additions-live" aria-hidden />
            {isAr ? "مستجدات" : "Just added"}
          </span>
          <h2 className="additions-title">{title}</h2>
          {subtitle && <p className="additions-sub">{subtitle}</p>}
        </div>
        {items.length > 0 && (
          <div className="additions-count">
            <span className="additions-count-num">{items.length}</span>
            <span className="additions-count-label">{isAr ? "إضافة" : items.length === 1 ? "item" : "items"}</span>
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <div className="additions-empty">
          <Sparkles className="size-5" aria-hidden />
          <p>{isAr ? "لا توجد إضافات بعد." : "No additions yet."}</p>
        </div>
      ) : (
        <div className="additions-grid">
          {items.map((it, idx) => {
            const Icon = iconFor(it.kind);
            const t = isAr ? it.title_ar : it.title_en;
            const sub = isAr ? it.subtitle_ar : it.subtitle_en;
            const isNew = Date.now() - new Date(it.created_at).getTime() < NEW_WINDOW_MS;
            const when = relativeDate(it.created_at, isAr);
            return (
              <Button
                key={it.id}
                variant="ghost"
                type="button"
                onClick={() => it.collect_contacts && !opened.has(it.id) ? setCollecting(it) : openItem(it)}
                className="additions-card h-auto whitespace-normal text-start"
                style={{ "--i": idx, "--acc": KIND_TOKEN[it.kind] } as React.CSSProperties}
              >
                <span className="additions-tile" aria-hidden>
                  <Icon className="size-[18px]" />
                </span>
                <span className="additions-body">
                  {it.custom_label && <span className="additions-label">{it.custom_label}</span>}
                  <span className="additions-card-title">{t}</span>
                  {sub && <span className="additions-card-sub">{sub}</span>}
                  {when && (
                    <span className="additions-meta">
                      {isNew && <span className="additions-new-dot" aria-hidden />}
                      <span>{when}</span>
                    </span>
                  )}
                </span>
                <span className="additions-arrow" aria-hidden>
                  <ArrowUpRight className="size-[15px] rtl-flip" />
                </span>
              </Button>
            );
          })}
        </div>
      )}

      <MediaViewerModal item={viewing} onClose={() => setViewing(null)} />
      {collecting && <AdditionContactDialog key={collecting.id} item={collecting} onClose={() => setCollecting(null)} onSaved={() => {
        setOpened(previous => new Set(previous).add(collecting.id));
        setCollecting(null);
        openItem(collecting);
      }} />}
    </section>
  );
}
