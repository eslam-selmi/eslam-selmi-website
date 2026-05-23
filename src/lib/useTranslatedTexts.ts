import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateTexts } from "@/lib/translate.functions";
import { useI18n } from "@/lib/i18n";

const CACHE_KEY = "lov_translate_cache_v1";

function readCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function writeCache(c: Record<string, string>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}
function keyOf(text: string, target: string) { return `${target}::${text}`; }

/**
 * Translate an array of dynamic admin-written strings to the current UI language.
 * - If lang is "ar", returns originals (content is already Arabic).
 * - If lang is "en", translates via Lovable AI Gateway (cached in localStorage).
 */
export function useTranslatedTexts(texts: string[]): string[] {
  const { lang } = useI18n();
  const translate = useServerFn(translateTexts);
  const [out, setOut] = useState<string[]>(texts);

  useEffect(() => {
    if (lang === "ar") { setOut(texts); return; }
    if (texts.length === 0) { setOut(texts); return; }

    const cache = readCache();
    const result: (string | null)[] = texts.map((t) => cache[keyOf(t, lang)] ?? null);
    const missingIdx = result.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);

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
        missingIdx.forEach((origIdx, j) => { filled[origIdx] = res.translations[j] ?? texts[origIdx]; });
        const newCache = { ...cache };
        missingIdx.forEach((origIdx, j) => { newCache[keyOf(texts[origIdx], lang)] = res.translations[j] ?? texts[origIdx]; });
        writeCache(newCache);
        setOut(filled as string[]);
      })
      .catch(() => { /* keep originals */ });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, texts.join("\u0001")]);

  return out;
}
