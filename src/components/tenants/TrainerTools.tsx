import { useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tenant } from "@/lib/tenants";

type T = (a: string, b: string) => string;

/** Tool files of one trainer tenant, stored under t/<tenant_id>/ in tool-assets. Upload needs the owner's switch; the database enforces it. */
export function TrainerTools({ tenant, t }: { tenant: Tenant; t: T }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const prefix = `t/${tenant.id}`;
  const q = useQuery({
    queryKey: ["trainer-tools", tenant.id],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("tool-assets").list(prefix, { limit: 100 });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["trainer-tools", tenant.id] });
  async function upload(file?: File) {
    if (!file) return;
    const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
    const { error } = await supabase.storage.from("tool-assets").upload(`${prefix}/${safe}`, file, { upsert: true });
    if (error) return toast.error(error.message);
    if (input.current) input.current.value = "";
    refresh();
  }
  async function remove(name: string) {
    const { error } = await supabase.storage.from("tool-assets").remove([`${prefix}/${name}`]);
    if (error) return toast.error(error.message);
    refresh();
  }
  return (
    <section className="space-y-2">
      <h2 className="font-semibold">{t("أدواتك", "Your tools")}</h2>
      {!tenant.feature_tools_upload ? (
        <p className="text-sm text-muted-foreground">{t("رفع الأدوات غير مفعّل من المالك.", "Tool upload is not enabled by the owner.")}</p>
      ) : (
        <>
          <input ref={input} type="file" onChange={(e) => upload(e.target.files?.[0])} className="text-sm" />
          <ul className="rounded-xl border divide-y text-sm">
            {(q.data ?? []).length === 0 && <li className="p-3 text-muted-foreground">{t("لا ملفات بعد.", "No files yet.")}</li>}
            {(q.data ?? []).map((f) => (
              <li key={f.name} className="p-3 flex justify-between gap-2"><bdi dir="ltr">{f.name}</bdi>
                <button className="underline" onClick={() => remove(f.name)}>{t("حذف", "Delete")}</button></li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
