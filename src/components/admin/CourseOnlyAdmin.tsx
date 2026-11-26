import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createCourseOnlyAccount, listCourseOnlyAccounts, convertCourseOnlyToFull } from "@/lib/course-only.functions";

type Row = { user_id: string; email: string; full_name: string; courses: { id: string; title: string; status: string }[] };

/** Admin tab: course-only accounts. Email + temporary password + one course. Convert = same account becomes a regular trainee. */
export function CourseOnlyAdmin({ lang }: { lang: "ar" | "en" }) {
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [courses, setCourses] = useState<{ id: string; title: string; slug: string | null }[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [f, setF] = useState({ email: "", full_name: "", password: "", course_id: "" });
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try { setRows((await listCourseOnlyAccounts()) as Row[]); } catch { toast.error(t("تعذر تحميل الحسابات", "Could not load accounts")); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void supabase.from("courses").select("id,title,slug").order("title").then(({ data }) => setCourses((data ?? []) as any));
    void refresh();
  }, [refresh]);
  const input = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm";
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!f.course_id) return toast.error(t("اختر كورس", "Pick a course"));
    setBusy(true);
    try {
      await createCourseOnlyAccount({ data: f });
      toast.success(t("تم إنشاء الحساب. أرسل كلمة السر المؤقتة للشخص بنفسك.", "Account created. Send the temporary password to the person yourself."));
      setF({ email: "", full_name: "", password: "", course_id: "" });
      await refresh();
    } catch (err: any) { toast.error(err?.message || t("تعذر الإنشاء", "Could not create")); }
    setBusy(false);
  }
  return (
    <div className="space-y-8" dir={lang === "ar" ? "rtl" : "ltr"}>
      <form onSubmit={create} className="space-y-3 rounded-2xl border border-white/10 p-4">
        <h3 className="font-semibold">{t("حساب مرتبط بكورس واحد", "Course-only account")}</h3>
        <p className="text-xs opacity-70">{t("الشخص يدخل بإيميله وكلمة السر ويلاقي الكورس المسموح له بس، حتى في وضع الصيانة. كلمة السر مؤقتة وهيغيّرها عند أول دخول.", "The person signs in with email and password and sees only the allowed course, even during maintenance. The password is temporary and must be changed at first sign-in.")}</p>
        <input className={input} type="email" required placeholder={t("الإيميل", "Email")} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={input} required minLength={2} placeholder={t("الاسم", "Name")} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <input className={input} type="password" required minLength={8} autoComplete="new-password" placeholder={t("كلمة سر مؤقتة (8 أحرف على الأقل)", "Temporary password (8+ chars)")} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <select className={input} value={f.course_id} onChange={(e) => setF({ ...f, course_id: e.target.value })}>
          <option value="">{t("اختر الكورس", "Pick a course")}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button disabled={busy} className="rounded-lg bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{t("إنشاء الحساب", "Create account")}</button>
      </form>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-sm opacity-60">{t("لا توجد حسابات مرتبطة بكورس.", "No course-only accounts yet.")}</p>}
        {rows.map((r) => (
          <div key={r.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-3 text-sm">
            <div><div className="font-medium">{r.full_name || r.email}</div><div className="opacity-60" dir="ltr">{r.email}</div>
              <div className="text-xs opacity-70">{r.courses.map((c) => c.title).join("، ")}</div></div>
            <button className="rounded-lg border border-white/20 px-3 py-1.5" onClick={async () => {
              if (!confirm(t("تحويل الحساب لمتدرب عادي؟ نفس الحساب والتقدم يفضلوا.", "Convert to a regular trainee? Same account and progress are kept."))) return;
              await convertCourseOnlyToFull({ data: { user_id: r.user_id } }); toast.success(t("تم التحويل", "Converted")); await refresh();
            }}>{t("تحويل لمتدرب عادي", "Convert to regular trainee")}</button>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-xs opacity-80">
        <div className="font-medium">{t("الروابط الثابتة للكورسات (للتوجيه فقط، لا تعطي صلاحية)", "Stable course URLs (routing only, no access)")}</div>
        {courses.map((c) => <div key={c.id} dir="ltr">{c.title.slice(0, 40)} — {c.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/course-${c.slug}` : "—"}</div>)}
      </div>
    </div>
  );
}
