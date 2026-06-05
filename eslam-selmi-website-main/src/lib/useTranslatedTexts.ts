import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";
import { useI18n } from "@/lib/i18n";

const CACHE_KEY = "lov_translate_cache_v2";

function readCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function writeCache(c: Record<string, string>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}
function keyOf(text: string, target: string) { return `${target}::${text}`; }

// Auto-detect: if text contains any Arabic letters, source is "ar", else "en".
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
function detectSource(text: string): "ar" | "en" {
  return ARABIC_RE.test(text) ? "ar" : "en";
}

/**
 * Translate an array of dynamic admin-written strings to the current UI language.
 * Auto-detects source per string. Skips strings already in the target language.
 * Cached in localStorage.
 */
export function useTranslatedTexts(texts: string[]): string[] {
  const { lang } = useI18n();
  const translate = useServerFn(translateTexts);
  const [out, setOut] = useState<string[]>(texts);
  const joined = useMemo(() => texts.join("\u0001"), [texts]);

  useEffect(() => {
    if (texts.length === 0) { setOut(texts); return; }

    const cache = readCache();
    // For each text: if already in target lang, keep as-is. Otherwise look up cache.
    const result: (string | null)[] = texts.map((t) => {
      if (!t || !t.trim()) return t;
      if (detectSource(t) === lang) return t; // already in target language
      return cache[keyOf(t, lang)] ?? null;
    });
    const missingIdx = result
      .map((v, i) => (v === null ? i : -1))
      .filter((i) => i >= 0);

    if (missingIdx.length === 0) {
      setOut(result as string[]);
      return;
    }

    // Optimistically show originals while fetching.
    setOut(texts.map((t, i) => (result[i] ?? t)));

    const missingTexts = missingIdx.map((i) => texts[i]);
    let cancelled = false;
    translate({ data: { texts: missingTexts, target: lang as "en" | "ar" } })
      .then((res) => {
        if (cancelled) return;
        const filled = [...result];
        const newCache = { ...cache };
        missingIdx.forEach((origIdx, j) => {
          const tr = res.translations[j] ?? texts[origIdx];
          filled[origIdx] = tr;
          newCache[keyOf(texts[origIdx], lang)] = tr;
        });
        writeCache(newCache);
        setOut(filled as string[]);
      })
      .catch(() => { /* keep originals */ });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, joined]);

  return out;
}
