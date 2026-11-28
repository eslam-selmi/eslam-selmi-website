import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tenant } from "@/lib/tenants";

type T = (a: string, b: string) => string;
const db = supabase as any;

/** Finance and certificates for one trainer tenant. Every write is checked by the database against this tenant. */
export function TrainerFinance({ tenant, courses, t }: { tenant: Tenant; courses: { id: string; title: string }[]; t: T }) {
  const qc = useQueryClient();
  const ids = courses.map((c) => c.id);
  const q = useQuery({
    queryKey: ["trainer-finance", tenant.id, ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data: en, error } = await db.from("enrollments")
        .select("id,user_id,course_id,name_ar,name_en,status,discount_amount,certificate_issued,certificate_url,courses(title,price)")
        .in("course_id", ids).order("created_at", { ascending: false });
      if (error) throw error;
      const eids = (en ?? []).map((x: any) => x.id);
      const [p, i] = eids.length
        ? await Promise.all([db.from("payments").select("*").in("enrollment_id", eids), db.from("installments").select("*").in("enrollment_id", eids).order("due_date")])
        : [{ data: [] }, { data: [] }];
      return { en: (en ?? []) as any[], pay: (p.data ?? []) as any[], ins: (i.data ?? []) as any[] };
    },
  });
  const [open, setOpen] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["trainer-finance", tenant.id] });
  if (ids.length === 0) return null;
  if (q.error) return <p className="text-sm text-destructive">{(q.error as Error).message}</p>;
  const rows = q.data?.en ?? [];

  async function run(p: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await p;
    if (error) toast.error(error.message); else refresh();
  }
  async function addPayment(e: React.FormEvent<HTMLFormElement>, eid: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form); const amount = Number(f.get("amount"));
    if (!(amount > 0)) return toast.error(t("المبلغ غير صحيح", "Invalid amount"));
    await run(db.from("payments").insert({ enrollment_id: eid, amount, note: String(f.get("note") ?? "") || null }));
    form.reset();
  }
  async function addInstallment(e: React.FormEvent<HTMLFormElement>, eid: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form); const amount = Number(f.get("amount"));
    if (!(amount > 0)) return toast.error(t("المبلغ غير صحيح", "Invalid amount"));
    await run(db.from("installments").insert({ enrollment_id: eid, amount, due_date: String(f.get("due") ?? "") || null }));
    form.reset();
  }
  async function setDiscount(eid: string, v: string) {
    const n = Math.max(0, Number(v) || 0);
    await run(db.from("enrollments").update({ discount_amount: n }).eq("id", eid));
  }
  async function uploadCert(eid: string, file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error(t("PDF فقط", "PDF only"));
    const path = `t/${tenant.id}/${eid}.pdf`;
    const up = await supabase.storage.from("certificates").upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (up.error) return toast.error(up.error.message);
    await run(db.from("enrollments").update({ certificate_issued: true, certificate_url: path }).eq("id", eid));
  }

  return (
    <section className="space-y-2">
      <h2 className="font-semibold">{t("الماليات والشهادات", "Finance and certificates")}</h2>
      <ul className="rounded-xl border divide-y">
        {rows.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("لا تسجيلات بعد.", "No enrollments yet.")}</li>}
        {rows.map((r) => {
          const paid = (q.data!.pay.filter((p) => p.enrollment_id === r.id)).reduce((s, p) => s + Number(p.amount), 0);
          const price = Number(r.courses?.price ?? 0); const due = Math.max(price - Number(r.discount_amount ?? 0) - paid, 0);
          const ins = q.data!.ins.filter((x) => x.enrollment_id === r.id);
          return (
            <li key={r.id} className="p-3 text-sm space-y-2">
              <button className="w-full text-start flex justify-between gap-2" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
                <span>{r.name_ar || r.name_en || r.user_id.slice(0, 8)} · <bdi>{r.courses?.title}</bdi></span>
                <span dir="ltr">{paid} / {Math.max(price - Number(r.discount_amount ?? 0), 0)} · {t("متبقي", "due")} {due}</span>
              </button>
              {open === r.id && (
                <div className="space-y-3 border-t pt-2">
                  <label className="flex items-center gap-2">{t("خصم", "Discount")}
                    <input type="number" min={0} max={price} defaultValue={Number(r.discount_amount ?? 0)} onBlur={(e) => setDiscount(r.id, e.target.value)} className="w-24 border rounded px-2 py-1 bg-background" dir="ltr" />
                    <span className="text-xs text-muted-foreground" dir="ltr">≤ {price}</span>
                  </label>
                  <form onSubmit={(e) => addPayment(e, r.id)} className="flex flex-wrap gap-2 items-center">
                    <label className="flex items-center gap-1 text-xs">{t("مبلغ الدفعة", "Payment amount")}<input name="amount" type="number" step="0.01" min="0" placeholder={t("دفعة", "Payment")} className="w-24 border rounded px-2 py-1 bg-background text-sm" dir="ltr" /></label>
                    <label className="flex flex-1 items-center gap-1 text-xs">{t("ملاحظة", "Note")}<input name="note" className="flex-1 border rounded px-2 py-1 bg-background text-sm" /></label>
                    <button className="px-3 py-1 rounded border">{t("تسجيل دفعة", "Record payment")}</button>
                  </form>
                  <ul className="text-xs space-y-1">
                    {q.data!.pay.filter((p) => p.enrollment_id === r.id).map((p) => (
                      <li key={p.id} className="flex justify-between"><span dir="ltr">{Number(p.amount)} {p.currency}</span><span>{p.note}</span>
                        <button className="underline" onClick={() => run(db.from("payments").delete().eq("id", p.id))}>{t("حذف", "Delete")}</button></li>
                    ))}
                  </ul>
                  <form onSubmit={(e) => addInstallment(e, r.id)} className="flex flex-wrap gap-2 items-center">
                    <label className="flex items-center gap-1 text-xs">{t("مبلغ القسط", "Installment amount")}<input name="amount" type="number" step="0.01" min="0" className="w-24 border rounded px-2 py-1 bg-background text-sm" dir="ltr" /></label>
                    <label className="flex items-center gap-1 text-xs">{t("تاريخ الاستحقاق", "Due date")}<input name="due" type="date" className="border rounded px-2 py-1 bg-background text-sm" dir="ltr" /></label>
                    <button className="px-3 py-1 rounded border">{t("إضافة قسط", "Add installment")}</button>
                  </form>
                  <ul className="text-xs space-y-1">
                    {ins.map((x) => (
                      <li key={x.id} className="flex justify-between gap-2"><span dir="ltr">{Number(x.amount)} · {x.due_date ?? "-"}</span>
                        <label className="flex gap-1"><input type="checkbox" checked={!!x.paid} onChange={(e) => run(db.from("installments").update({ paid: e.target.checked, paid_at: e.target.checked ? new Date().toISOString() : null }).eq("id", x.id))} />{t("مدفوع", "Paid")}</label>
                        <button className="underline" onClick={() => run(db.from("installments").delete().eq("id", x.id))}>{t("حذف", "Delete")}</button></li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{t("الشهادة", "Certificate")}: {r.certificate_issued ? t("صادرة", "issued") : t("غير صادرة", "not issued")}</span>
                    <label className="flex items-center gap-1 text-xs">{t("ملف الشهادة (PDF)", "Certificate file (PDF)")}<input type="file" accept="application/pdf" onChange={(e) => uploadCert(r.id, e.target.files?.[0])} className="text-xs" /></label>
                    {r.certificate_issued && <button className="underline text-xs" onClick={() => run(db.from("enrollments").update({ certificate_issued: false, certificate_url: null }).eq("id", r.id))}>{t("سحب الشهادة", "Revoke")}</button>}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
