import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { Addition } from "@/lib/latest-additions";

export function AdditionContacts({ items }: { items: Addition[] }) {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const [filter, setFilter] = useState("");
  const contacts = useQuery({
    queryKey: ["latest-addition-contacts", filter], staleTime: 30_000,
    queryFn: async () => {
      let query = supabase.from("latest_addition_contacts").select("*").order("created_at", { ascending: false });
      if (filter) query = query.eq("addition_id", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
  return <section className="dash-card p-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-bold"><Users className="size-4" />{t("بيانات مشاهدي الملفات", "Resource viewer details")} ({contacts.data?.length ?? 0})</h3>
      <Button size="icon" variant="outline" aria-label={t("تحديث البيانات", "Refresh details")} title={t("تحديث البيانات", "Refresh details")} disabled={contacts.isFetching} onClick={() => void contacts.refetch()}><RefreshCw className="size-4" /></Button>
    </div>
    <label className="block space-y-2 text-sm"><span>{t("الملف", "Resource")}</span>
      <select value={filter} onChange={e => setFilter(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground">
        <option value="">{t("كل الملفات", "All resources")}</option>
        {items.map(item => <option key={item.id} value={item.id}>{lang === "ar" ? item.title_ar : item.title_en}</option>)}
      </select>
    </label>
    {contacts.isPending ? <p className="text-sm text-muted-foreground">{t("جارٍ التحميل…", "Loading…")}</p> : contacts.isError ? <p role="alert" className="text-sm text-destructive">{t("تعذّر تحميل البيانات.", "Could not load details.")}</p> : !contacts.data.length ? <p className="text-sm text-muted-foreground">{t("لم تُسجَّل بيانات بعد.", "No details collected yet.")}</p> :
      <div className="overflow-x-auto"><table className="w-full text-start text-sm">
        <thead><tr className="border-b border-border">{[t("الاسم", "Name"), t("التليفون", "Phone"), t("الإيميل", "Email"), t("الملف", "Resource"), t("التاريخ", "Date")].map(label => <th key={label} className="p-3 text-start font-medium whitespace-nowrap">{label}</th>)}</tr></thead>
        <tbody>{contacts.data.map(contact => { const item = items.find(i => i.id === contact.addition_id); return <tr key={contact.id} className="border-b border-border">
          <td className="p-3 min-w-36">{contact.full_name}</td><td className="p-3 whitespace-nowrap"><span dir="ltr">{contact.phone}</span></td><td className="p-3"><span dir="ltr">{contact.email}</span></td>
          <td className="p-3 min-w-40">{item ? (lang === "ar" ? item.title_ar : item.title_en) : "—"}</td><td className="p-3 whitespace-nowrap">{new Date(contact.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}</td>
        </tr>; })}</tbody>
      </table></div>}
  </section>;
}