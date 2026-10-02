/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { useI18n } from "@/lib/i18n";
import { useTranslatedTexts } from "@/lib/useTranslatedTexts";
import { toast } from "sonner";
import { findCountry } from "@/lib/countries";
import { safeHref } from "@/lib/safe-url";
import { Clock, CheckCircle2, XCircle, Download, Upload, BookOpen, Wallet, Loader2,
  ExternalLink, Sparkles, ArrowRight, Calendar, Layers, StickyNote, Link as LinkIcon,
  Paperclip, Check, ChevronLeft, PlayCircle, PhoneOutgoing, Award, GraduationCap, Hourglass,
  FileText, Send, AlertCircle, X, Star, UserCog, Camera, Save } from "lucide-react";
import { MediaViewerModal, type MediaItem } from "@/components/MediaViewerModal";
import { TraineeSupportButton } from "@/components/SupportTickets";
import { TraineePackagesSection } from "@/components/TraineePackagesSection";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";
import type { Course, Enrollment, Profile, ModuleRow } from "./types";
import { AssignmentsSection } from "./Assignments";
import { CertificatePanel } from "./CertificatePanel";
import { ProofUploader } from "./ProofUploader";
import { ModuleNotes } from "./ModuleNotes";
import { downloadSessionIcs } from "./ics";

export function CourseDetail({ enrollment, onBack, onDownloadCert, onRefresh }: { enrollment: Enrollment; onBack: () => void; onDownloadCert: (url: string) => void; onRefresh: () => void }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const c = enrollment.courses!;
  const [modules, setModules] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [viewItem, setViewItem] = useState<MediaItem | null>(null);




  async function load() {
    const [mRes, sRes, pRes, iRes] = await Promise.all([
      supabase.from("course_modules").select("*").eq("course_id", c.id).order("order_index"),
      supabase.from("course_sessions").select("*").eq("course_id", c.id).order("starts_at"),
      supabase.from("payments").select("*").eq("enrollment_id", enrollment.id).order("paid_at"),
      supabase.from("installments").select("*").eq("enrollment_id", enrollment.id).order("due_date"),
    ]);
    const mods = mRes.data ?? [];
    setModules(mods);
    setSessions(sRes.data ?? []);
    setPayments(pRes.data ?? []);
    setInstallments(iRes.data ?? []);
    if (mods.length) {
      const { data: its } = await supabase.from("module_items").select("*").in("module_id", mods.map((m: any) => m.id)).order("order_index");
      const grouped: Record<string, any[]> = {};
      (its ?? []).forEach((it: any) => { (grouped[it.module_id] ||= []).push(it); });
      setItems(grouped);
    }
  }
  useEffect(() => { load(); }, [c.id, enrollment.id]);

  const totalPaid = payments.filter((p) => p.status !== "rejected" && p.status !== "pending").reduce((s, p) => s + Number(p.amount), 0);
  const coursePrice = Number(c.price ?? 0);
  const completedCount = modules.filter((m) => m.completed_by_admin).length;
  const progressPct = modules.length ? Math.round((completedCount / modules.length) * 100) : 0;

  // Translate module titles + session titles
  const moduleTitles = useMemo(() => modules.map((m: any) => m.title || ""), [modules]);
  const trModuleTitles = useTranslatedTexts(moduleTitles);
  const sessionTitles = useMemo(() => sessions.map((s: any) => s.title || ""), [sessions]);
  const trSessionTitles = useTranslatedTexts(sessionTitles);

  return (
    <div className="space-y-7">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
        <ChevronLeft className="w-4 h-4 rtl-flip" /> {isAr ? "العودة لكورساتي" : "Back to my courses"}
      </button>

      <section className="dash-card p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-4xl">
            {c.cover_emoji || "🎓"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">{c.title}</h1>
            {c.description && <p className="text-white/65 mt-2 leading-relaxed">{c.description}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-white/60">
              {(c.starts_at || c.ends_at) && (
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[var(--gold)]" /> {c.starts_at || "—"} → {c.ends_at || "—"}</span>
              )}
              <span className="text-[var(--gold)] font-semibold">{coursePrice > 0 ? `${coursePrice.toLocaleString()} ${c.currency}` : (isAr ? "مجاني" : "Free")}</span>
              <span>{c.installments_count === 1 ? (isAr ? "دفعة كاملة" : "Single payment") : (isAr ? `${c.installments_count} أقساط` : `${c.installments_count} installments`)}</span>
              {Number(c.total_hours) > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[var(--gold)]" /> {c.total_hours} {isAr ? "ساعة تدريبية" : "training hrs"}</span>}
            </div>
            {safeHref(c.online_url) && (
              <a href={safeHref(c.online_url)!} target="_blank" rel="noopener"
                className="mt-4 inline-flex items-center gap-2 text-sm px-4 h-10 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/25 transition">
                <PlayCircle className="w-4 h-4" /> {isAr ? "رابط المحاضرة" : "Lecture link"} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {modules.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>{isAr ? "التقدّم" : "Progress"}</span><span className="font-semibold text-[var(--gold)]">{progressPct}% ({completedCount}/{modules.length})</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full transition-all rounded-full" style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, var(--gold), #b8923f)" }} />
            </div>
          </div>
        )}
      </section>


      {/* Sessions */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Calendar className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "المحاضرات القادمة" : "Upcoming sessions"}</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-white/50 rounded-xl border border-dashed border-white/15 p-6 text-center">{isAr ? "لم تُجدول محاضرات بعد." : "No sessions scheduled yet."}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {sessions.map((s) => {
              const dt = new Date(s.starts_at);
              const past = dt.getTime() < Date.now();
              return (
                <div key={s.id} className={`rounded-2xl border p-4 ${past ? "border-white/5 bg-white/[0.02] opacity-60" : "border-white/10 bg-white/5"}`}>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[var(--gold)] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{trSessionTitles[sessions.indexOf(s)] || s.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{dt.toLocaleString(isAr ? "ar-EG" : "en-GB")} · {s.duration_minutes}{isAr ? "د" : "m"}</p>
                      {safeHref(s.online_url) && !past && (
                        <a href={safeHref(s.online_url)!} target="_blank" rel="noopener"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold">
                          {isAr ? "الانضمام" : "Join"} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modules / content */}
      <section>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-[var(--gold)]" /> {isAr ? "محتوى الكورس" : "Course content"}</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-white/50 rounded-xl border border-dashed border-white/15 p-6 text-center">{isAr ? "المحتوى قيد التحضير." : "Content is being prepared."}</p>
        ) : (
          <div className="space-y-3">
            {modules.map((m: any, i: number) => (
              <div key={m.id} className={`rounded-2xl border p-5 ${m.completed_by_admin ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${m.completed_by_admin ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-[var(--gold)]"}`}>
                    {m.completed_by_admin ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold">{trModuleTitles[i] || m.title}</h4>
                    {m.completed_by_admin && <p className="text-[11px] text-emerald-300/80 mt-0.5">✓ {isAr ? "تم إكمال هذا الجزء" : "This module is complete"}</p>}
                  </div>
                  {safeHref(m.online_url) && (
                    <a href={safeHref(m.online_url)!} target="_blank" rel="noopener" className="text-xs px-3 h-9 rounded-lg bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30 flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" /> {isAr ? "رابط المحاضرة" : "Lecture"}
                    </a>
                  )}
                </div>


                {(items[m.id]?.length ?? 0) > 0 && (
                  <ul className="mt-4 space-y-1.5 ms-12">
                    {items[m.id].map((it: any) => {
                      const isStorage = it.kind === "file";
                      const openable = it.kind !== "note" && !!it.url;
                      return (
                        <li key={it.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm">
                          {it.kind === "note" ? <StickyNote className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" /> :
                           it.kind === "link" ? <LinkIcon className="w-4 h-4 mt-0.5 text-sky-300 shrink-0" /> :
                           <Paperclip className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{it.title}</p>
                            {it.content && <p className="text-xs text-white/60 whitespace-pre-wrap mt-1">{it.content}</p>}
                            {openable && (
                              <button
                                type="button"
                                onClick={() =>
                                  setViewItem({
                                    title: it.title,
                                    kind: it.kind === "file" ? "file" : "link",
                                    url: it.url,
                                    isStoragePath: isStorage,
                                  })
                                }
                                className="text-xs text-[var(--gold)] hover:underline mt-1 inline-flex items-center gap-1"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                {isAr ? "فتح المحتوى" : "Open content"}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <MediaViewerModal item={viewItem} onClose={() => setViewItem(null)} />


      <AssignmentsSection courseId={c.id} />



      {/* Payments + Certificate */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="dash-card dash-card-hover p-5">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-[var(--gold)]" /> {isAr ? "المدفوعات" : "Payments"}</h3>
          {coursePrice > 0 && (
            <p className="text-xs text-white/60 mb-3">
              {isAr ? "مدفوع" : "Paid"} <span className="text-[var(--gold)] font-semibold">{totalPaid.toLocaleString()} {c.currency}</span> {isAr ? "من" : "of"} {coursePrice.toLocaleString()} {c.currency}
            </p>
          )}
          {payments.length === 0 ? <p className="text-xs text-white/40">{isAr ? "لا توجد مدفوعات مسجلة بعد." : "No payments recorded yet."}</p> :
            <ul className="space-y-1.5">
              {payments.map((p) => (
                <li key={p.id} className={`flex justify-between items-center text-xs rounded px-2.5 py-2 ${p.status === "pending" ? "bg-amber-300/10 border border-amber-300/30" : p.status === "rejected" ? "bg-rose-500/10 border border-rose-500/30 opacity-70" : "bg-white/5"}`}>
                  <span className="font-semibold">{Number(p.amount).toLocaleString()} {p.currency}</span>
                  {p.status === "pending" && <span className="text-amber-300">{isAr ? "بانتظار التأكيد" : "Awaiting confirmation"}</span>}
                  {p.status === "rejected" && <span className="text-rose-300">{isAr ? "مرفوضة" : "Rejected"}</span>}
                  <span className="text-white/40">{new Date(p.paid_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}</span>
                </li>
              ))}
            </ul>
          }
          <ProofUploader
            enrollmentId={enrollment.id}
            userId={enrollment.user_id ?? ""}
            currency={c.currency}
            remaining={Math.max(0, coursePrice - Number((enrollment as any).discount_amount || 0) - totalPaid)}
            onUploaded={load}
            isAr={isAr}
          />
          {installments.length > 0 && (
            <>
              <p className="text-xs text-white/50 mt-4 mb-2">{isAr ? "الأقساط" : "Installments"}</p>
              <ul className="space-y-1.5">
                {installments.map((i) => (
                  <li key={i.id} className="flex justify-between items-center text-xs bg-white/5 rounded px-2.5 py-2">
                    <span className="font-semibold">{Number(i.amount).toLocaleString()} {i.currency}</span>
                    <span className="text-white/40">{i.due_date ?? "—"}</span>
                    <span className={i.paid ? "text-emerald-300" : "text-amber-300"}>{i.paid ? (isAr ? "مدفوع" : "Paid") : (isAr ? "مستحق" : "Due")}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>


        <CertificatePanel
          enrollment={enrollment}
          course={c}
          allModulesDone={modules.length > 0 && modules.every((m: any) => m.completed_by_admin)}
          totalModules={modules.length}
          completedModules={completedCount}
          onDownloadCert={onDownloadCert}
          onRefresh={onRefresh}
        />
      </section>
    </div>
  );
}

