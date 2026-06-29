import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  text: z.string().min(1).max(6000),
  // Optional hint about which kind of field this is, so the model picks
  // the right corporate register (title, description, challenge, etc.).
  context: z.enum(["title", "description", "challenge", "solution", "result", "generic"]).optional(),
});

/**
 * Dedicated AR -> EN translator tuned for executive / corporate portfolio
 * copy (interviews, case studies, success stories, training write-ups).
 * Returns natural, polished English suitable for a leadership audience.
 */
export const translateArToEnCorporate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { text: "", error: "AI translation unavailable" } as const;
    }

    const ctxHint =
      data.context === "title"
        ? "This is a TITLE — keep it tight, headline-style, no trailing period."
        : data.context === "challenge"
          ? "This describes the CHALLENGE / problem statement of a corporate case study."
          : data.context === "solution"
            ? "This describes the SOLUTION / methodology applied."
            : data.context === "result"
              ? "This describes RESULTS — quantitative outcomes, percentages, KPIs."
              : data.context === "description"
                ? "This is a short DESCRIPTION / subtitle."
                : "";

    const system = [
      "You are a senior bilingual translator and corporate copy editor.",
      "Translate Arabic into polished, professional English suited for an executive Learning & Development / Talent Management portfolio.",
      "Rules:",
      "- Use natural corporate English; do NOT translate literally.",
      "- Preserve numbers, percentages, brand names, acronyms, hashtags, and URLs verbatim.",
      "- Keep the same paragraph breaks. No quotation marks around the whole output.",
      "- Output English text only. No commentary, no labels, no JSON.",
      ctxHint,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: data.text },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error("translate-corporate gateway", res.status, body);
        return { text: "", error: `Gateway ${res.status}` } as const;
      }

      const json = await res.json();
      const out: string = (json.choices?.[0]?.message?.content ?? "").trim();
      if (!out) return { text: "", error: "empty" } as const;
      return { text: out, error: null } as const;
    } catch (e: any) {
      console.error("translate-corporate failed:", e);
      return { text: "", error: e?.message ?? "unknown" } as const;
    }
  });
