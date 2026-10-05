import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Download, User, BookOpen, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type Prof = { full_name?: string | null; email?: string | null; phone?: string | null; country?: string | null } | null;
export type ToolbarEnrollment = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  certificate_issued: boolean;
  discount_amount?: number | null;
  coupon_code?: string | null;
  profiles?: Prof;
  courses?: { title?: string | null; price?: number | null; currency?: string | null } | null;
};
export type ToolbarCourse = { id: string; title: string; active: boolean };

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportEnrollmentsCsv(rows: ToolbarEnrollment[]) {
  const header = ["Trainee", "Email", "Phone", "Country", "Course", "Status", "Price", "Currency", "Coupon", "Discount", "Certificate", "Enrolled at"];
  const lines = rows.map((r) =>
    [
      r.profiles?.full_name, r.profiles?.email, r.profiles?.phone, r.profiles?.country,
      r.courses?.title, r.status, r.courses?.price, r.courses?.currency, r.coupon_code,
      r.discount_amount ?? 0, r.certificate_issued ? "yes" : "no", r.created_at.slice(0, 10),
    ].map(csvCell).join(","),
  );
  const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trainees-enrollments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminToolbar({
  enrollments, courses, onTrainee, onCourse,
}: {
  enrollments: ToolbarEnrollment[];
  courses: ToolbarCourse[];
  onTrainee: (userId: string) => void;
  onCourse: (courseId: string) => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return { trainees: [], courses: [] };
    const seen = new Map<string, ToolbarEnrollment & { count: number }>();
    for (const e of enrollments) {
      const p = e.profiles;
      const hay = `${p?.full_name ?? ""} ${p?.email ?? ""} ${p?.phone ?? ""}`.toLowerCase();
      if (!hay.includes(s)) continue;
      const ex = seen.get(e.user_id);
      if (ex) ex.count++; else seen.set(e.user_id, { ...e, count: 1 });
    }
    return {
      trainees: Array.from(seen.values()).slice(0, 8),
      courses: courses.filter((c) => c.title.toLowerCase().includes(s)).slice(0, 5),
    };
  }, [q, enrollments, courses]);

  const has = results.trainees.length + results.courses.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div ref={box} className="relative flex-1">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-white/40" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t("ابحث عن متدرب (الاسم، البريد، الهاتف) أو كورس…", "Search trainees (name, email, phone) or courses…")}
          className="w-full h-11 ps-9 pe-9 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--gold)] outline-none text-sm text-white placeholder:text-white/40"
        />
        {q && (
          <Button type="button" size="icon" variant="ghost" onClick={() => setQ("")} className="absolute top-1/2 -translate-y-1/2 end-1 h-9 w-9 text-muted-foreground" aria-label={t("مسح البحث", "Clear search")}>
            <X className="w-4 h-4" />
          </Button>
        )}
        {open && q.trim().length >= 2 && (
          <div className="absolute z-40 mt-2 w-full rounded-xl border border-white/10 bg-[#0e1d44] shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
            {!has && <p className="p-4 text-sm text-white/50">{t("لا توجد نتائج", "No results")}</p>}
            {results.trainees.length > 0 && (
              <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">{t("المتدربون", "Trainees")}</p>
            )}
            {results.trainees.map((r) => (
              <button key={r.user_id} onClick={() => { onTrainee(r.user_id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-start">
                <User className="w-4 h-4 text-[var(--gold)] shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-white truncate">{r.profiles?.full_name || "—"}</span>
                  <span className="block text-xs text-white/50 truncate">{r.profiles?.email} {r.profiles?.phone ? `· ${r.profiles.phone}` : ""}</span>
                </span>
                <span className="text-[10px] text-white/50">{r.count} {t("اشتراك", "enr.")}</span>
              </button>
            ))}
            {results.courses.length > 0 && (
              <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-white/40 font-bold">{t("الكورسات", "Courses")}</p>
            )}
            {results.courses.map((c) => (
              <button key={c.id} onClick={() => { onCourse(c.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-start">
                <BookOpen className="w-4 h-4 text-[var(--gold)] shrink-0" />
                <span className="flex-1 text-sm text-white truncate">{c.title}</span>
                {!c.active && <span className="text-[10px] text-white/40">{t("غير نشط", "inactive")}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button type="button" variant="outline"
        onClick={() => exportEnrollmentsCsv(enrollments)}
        className="h-11 px-4 rounded-md border-border text-foreground text-sm font-semibold inline-flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        {t("تصدير CSV", "Export CSV")}
      </Button>
    </div>
  );
}
