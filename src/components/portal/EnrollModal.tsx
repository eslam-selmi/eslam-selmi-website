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


export function EnrollModal({ course, onClose, onConfirm }: { course: Course; onClose: () => void; onConfirm: (code?: string) => void }) {
  const { lang, dir } = useI18n();
  const isAr = lang === "ar";
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [preview, setPreview] = useState<{ ok: boolean; discount?: number; final?: number; error?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rawPrice = Number(course.price ?? 0);

  async function check() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return setPreview(null);
    setChecking(true);
    const { data, error } = await supabase.rpc("validate_coupon", { _code: trimmed, _course_id: course.id });
    setChecking(false);
    const payload = data as any;
    if (error) return setPreview({ ok: false, error: error.message });
    if (payload?.ok) setPreview({ ok: true, discount: Number(payload.discount_amount), final: Number(payload.final_price) });
    else setPreview({ ok: false, error: payload?.error || (isAr ? "كود غير صالح" : "Invalid code") });
  }

  const errorLabels: Record<string, string> = isAr ? {
    invalid_code: "كود غير صحيح",
    expired: "الكوبون منتهي الصلاحية",
    exhausted: "تم استنفاد عدد مرات الاستخدام",
    wrong_course: "هذا الكوبون لا يصلح لهذا الكورس",
    already_used: "لقد استخدمت هذا الكوبون من قبل",
    unauthenticated: "الرجاء تسجيل الدخول",
  } : {
    invalid_code: "Invalid code",
    expired: "Coupon has expired",
    exhausted: "Coupon usage limit reached",
    wrong_course: "This coupon isn't valid for this course",
    already_used: "You've already used this coupon",
    unauthenticated: "Please sign in",
  };

  async function submit() {
    setSubmitting(true);
    await onConfirm(preview?.ok ? code.trim().toUpperCase() : undefined);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div dir={dir} className="bg-[#0b1736] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-[var(--gold)] mb-1">{isAr ? "تأكيد طلب الالتحاق" : "Confirm enrollment request"}</p>
            <h3 className="text-lg font-bold">{course.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/60">{isAr ? "السعر" : "Price"}</span>
            <span className="font-semibold">{rawPrice > 0 ? `${rawPrice.toLocaleString()} ${course.currency}` : (isAr ? "مجاني" : "Free")}</span>
          </div>
          {preview?.ok && (
            <>
              <div className="flex justify-between text-emerald-300"><span>{isAr ? "خصم الكوبون" : "Coupon discount"}</span>
                <span>−{preview.discount?.toLocaleString()} {course.currency}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-[var(--gold)] font-bold">
                <span>{isAr ? "الإجمالي" : "Total"}</span>
                <span>{preview.final?.toLocaleString()} {course.currency}</span>
              </div>
            </>
          )}
        </div>

        {rawPrice > 0 && (
          <div>
            <label className="text-xs text-white/60 block mb-1.5">{isAr ? "كوبون خصم (اختياري)" : "Discount coupon (optional)"}</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setPreview(null); }}
                onBlur={check}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); check(); } }}
                placeholder="SUMMER25"
                className="flex-1 h-11 px-3 rounded-lg bg-white/5 border border-white/15 font-mono uppercase tracking-wider"
              />
              <button onClick={check} disabled={checking || !code.trim()}
                className="px-4 h-11 rounded-lg bg-white/10 border border-white/15 text-sm font-semibold disabled:opacity-50">
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "تحقق" : "Check")}
              </button>
            </div>
            {preview && !preview.ok && (
              <p className="text-xs text-rose-300 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errorLabels[preview.error || ""] || preview.error}
              </p>
            )}
            {preview?.ok && (
              <p className="text-xs text-emerald-300 mt-1.5 flex items-center gap-1">
                <Check className="w-3 h-3" /> {isAr ? "تم تطبيق الكوبون" : "Coupon applied"}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 h-11 rounded-lg bg-white/5 border border-white/15 text-sm">{isAr ? "إلغاء" : "Cancel"}</button>
          <button onClick={submit} disabled={submitting}
            className="flex-1 h-11 rounded-lg bg-[var(--gold)] text-[#0b1736] text-sm font-semibold disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isAr ? "تأكيد الطلب" : "Confirm request")}
          </button>
        </div>
      </div>

    </div>
  );
}

