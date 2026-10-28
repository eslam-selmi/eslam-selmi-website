import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  texts: z.array(z.string().min(1).max(4000)).min(1).max(50),
  target: z.enum(["en", "ar"]),
});

export const translateTexts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { translations: data.texts, error: "AI translation unavailable" };
    }

    const targetName = data.target === "en" ? "English" : "Arabic";
    const systemPrompt = `You are a professional translator for an executive Learning & Development training platform. Translate the user-supplied items into clear, direct ${targetName}. Use a confident, factual business register focused on concrete services, work requirements, KPIs, and training ROI when present in the source. Avoid canned marketing language such as "innovative solutions", "unlock potential", "transform your journey", "حلول مبتكرة", and "إطلاق الإمكانات"; express the underlying meaning plainly without adding claims. Preserve meaning, numbers, percentages, qualifications, brand names, hashtags, URLs, and emojis. Never invent statistics, achievements, guarantees, or outcomes. Arabic and English must convey the same facts. Return strictly a JSON object: {"items":["...","..."]} in the SAME ORDER as input. No extra text.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify({ items: data.texts }) },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("AI gateway error:", res.status, txt);
        return { translations: data.texts, error: `Gateway ${res.status}` };
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed.items) ? parsed.items : data.texts;
      const out = data.texts.map((orig, i) =>
        typeof items[i] === "string" && items[i].trim() ? items[i] : orig,
      );
      return { translations: out, error: null };
    } catch (e: any) {
      console.error("Translate failed:", e);
      return { translations: data.texts, error: e?.message ?? "unknown" };
    }
  });
