import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { safeHref } from "@/lib/safe-url";
import { X } from "lucide-react";

type Popup = {
  id: string;
  title_ar: string; title_en: string | null;
  body_ar: string | null; body_en: string | null;
  image_url: string | null;
  cta_label_ar: string | null; cta_label_en: string | null;
  cta_url: string | null;
  starts_at: string | null; ends_at: string | null;
  delay_seconds: number;
  frequency: "once" | "every_visit" | "every_n_days";
  frequency_days: number;
};

const STORAGE_KEY = "site_popup_shown_v1";

function readShownMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function writeShown(id: string) {
  const map = readShownMap();
  map[id] = Date.now();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}
function shouldShow(p: Popup, shownAt: number | undefined): boolean {
  if (p.frequency === "every_visit") return true;
  if (!shownAt) return true;
  if (p.frequency === "once") return false;
  // every_n_days
  const daysMs = Math.max(1, p.frequency_days) * 24 * 60 * 60 * 1000;
  return Date.now() - shownAt >= daysMs;
}

export function SitePopup() {
  const { lang } = useI18n();
  const [popup, setPopup] = useState<Popup | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    (async () => {
      const { data, error } = await supabase
        .from("site_popups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !data || cancelled) return;
      const shownMap = readShownMap();
      const candidate = (data as Popup[]).find((p) => shouldShow(p, shownMap[p.id]));
      if (!candidate) return;
      setPopup(candidate);
      timer = window.setTimeout(() => {
        if (!cancelled) {
          setVisible(true);
          writeShown(candidate.id);
        }
      }, Math.max(0, candidate.delay_seconds) * 1000);
    })();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, []);

  if (!popup || !visible) return null;
  const title = lang === "ar" ? popup.title_ar : (popup.title_en || popup.title_ar);
  const body = lang === "ar" ? popup.body_ar : (popup.body_en || popup.body_ar);
  const ctaLabel = lang === "ar" ? popup.cta_label_ar : (popup.cta_label_en || popup.cta_label_ar);
  const href = popup.cta_url ? safeHref(popup.cta_url) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative max-w-md w-full rounded-2xl border border-[var(--gold)]/30 bg-gradient-to-b from-[#0c1a3a] to-[#0b1430] text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 end-3 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          aria-label="close"
        ><X className="w-4 h-4" /></button>
        {popup.image_url ? (
          <img src={popup.image_url} alt="" className="w-full h-48 object-cover" />
        ) : null}
        <div className="p-6 sm:p-7">
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--gold)] mb-2">{title}</h3>
          {body ? <p className="text-white/80 text-sm sm:text-base leading-relaxed whitespace-pre-line">{body}</p> : null}
          {href && ctaLabel ? (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={() => setVisible(false)}
              className="mt-5 inline-flex items-center justify-center w-full h-11 rounded-xl bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] font-bold hover:brightness-110 transition"
            >{ctaLabel}</a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
