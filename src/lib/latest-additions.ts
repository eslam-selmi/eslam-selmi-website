import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Addition = Omit<Tables<"latest_additions">, "kind"> & {
  kind: "link" | "file" | "video" | "pdf" | "embed";
};

export const additionContactSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().transform(value => value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= "٩" ? 1632 : 1776))))
    .pipe(z.string().max(32).regex(/^\+?[0-9 ()-]{7,32}$/).refine(value => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    })),
  email: z.string().trim().toLowerCase().email().max(254),
});

export const latestAdditionsOptions = queryOptions({
  queryKey: ["latest-additions", "public"],
  staleTime: 60_000,
  queryFn: async () => {
    const [settings, items] = await Promise.all([
      supabase.from("latest_additions_settings").select("*").limit(1).maybeSingle(),
      supabase.from("latest_additions").select("*").order("created_at", { ascending: false }).limit(24),
    ]);
    if (settings.error) throw settings.error;
    if (items.error) throw items.error;
    return { settings: settings.data, items: (items.data ?? []) as Addition[] };
  },
});