import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProposeInput = z.object({
  name_ar: z.string().trim().min(2).max(80),
  name_en: z.string().trim().min(2).max(80).optional(),
});

// Public (no auth required) — used by signup flow to suggest a new country.
// Strictly validated, dedup by normalized name. Uses service role to bypass
// admin-only INSERT RLS while keeping anti-pollution checks server-side.
export const proposeCustomCountry = createServerFn({ method: "POST" })
  .inputValidator((input) => ProposeInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const name_ar = data.name_ar.replace(/\s+/g, " ").trim();
    const name_en = (data.name_en ?? name_ar).replace(/\s+/g, " ").trim();
    const normalized = name_ar.toLowerCase();

    // Check duplicate
    const { data: existing } = await supabaseAdmin
      .from("custom_countries")
      .select("id,name_ar,name_en")
      .eq("normalized", normalized)
      .maybeSingle();
    if (existing) {
      return { id: existing.id, name_ar: existing.name_ar, name_en: existing.name_en };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("custom_countries")
      .insert({ name_ar, name_en, normalized })
      .select("id,name_ar,name_en")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });
