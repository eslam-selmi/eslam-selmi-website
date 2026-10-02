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


export const PROOF_ALLOWED_EXT = ["jpg", "jpeg", "png", "pdf"];
export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

export function ProofUploader({ enrollmentId, userId, currency, remaining, onUploaded, isAr }: { enrollmentId: string; userId: string; currency: string; remaining: number; onUploaded: () => void; isAr: boolean }) {
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    supabase.from("payment_methods" as any).select("*").eq("active", true).order("order_index")
      .then(({ data }) => setMethods((data as any[]) ?? []));
  }, [remaining]);

  // Hide uploader entirely when nothing is owed
  if (remaining <= 0) return null;

  async function submit() {
    if (!selected) { toast.error(isAr ? "اختر طريقة الدفع أولاً" : "Select a payment method first"); return; }
    if (!amount || !file) { toast.error(isAr ? "أدخل المبلغ وصورة الإيصال" : "Enter amount and proof image"); return; }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!PROOF_ALLOWED_EXT.includes(ext)) {
      toast.error(isAr ? "الامتدادات المسموح بها: jpg, jpeg, png, pdf" : "Allowed extensions: jpg, jpeg, png, pdf");
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      toast.error(isAr ? "الحد الأقصى لحجم الملف 5 ميجابايت" : "Max file size is 5MB");
      return;
    }
    setBusy(true);
    try {
      const path = `${userId}/${enrollmentId}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("payments").insert({
        enrollment_id: enrollmentId,
        amount: Number(amount),
        currency,
        proof_url: path,
        status: "pending",
        submitted_by: userId,
        payment_method_id: selected.id,
        payment_method_name: isAr ? selected.name_ar : selected.name_en,
        note: isAr ? "إيصال من المتدرب" : "Trainee proof",
      } as any);
      if (insErr) throw insErr;
      toast.success(isAr ? "تم إرسال إيصال الدفع، بانتظار اعتماد الإدارة" : "Proof submitted, awaiting admin approval");
      setAmount(""); setFile(null); setSelected(null);
      onUploaded();
    } catch (e: any) {
      toast.error(e?.message ?? (isAr ? "حدث خطأ" : "Error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--gold)]/25 bg-[var(--gold)]/5 p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--gold)]">{isAr ? "📤 إرسال إيصال دفع" : "📤 Submit payment proof"}</p>

      {methods.length === 0 ? (
        <p className="text-xs text-white/50">{isAr ? "لا توجد طرق دفع متاحة حالياً. تواصل مع الإدارة." : "No payment methods available. Please contact admin."}</p>
      ) : (
        <>
          <div>
            <p className="text-[11px] text-white/60 mb-2">{isAr ? "1. اختر طريقة الدفع" : "1. Choose a payment method"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {methods.map((m) => {
                const active = selected?.id === m.id;
                return (
                  <button key={m.id} type="button" onClick={() => setSelected(m)}
                    className={`text-xs px-3 py-2 rounded-lg border text-start transition ${active ? "bg-[var(--gold)]/25 border-[var(--gold)] text-white" : "bg-white/5 border-white/15 text-white/80 hover:bg-white/10"}`}>
                    <span className="font-semibold block">{isAr ? m.name_ar : m.name_en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (selected.details_ar || selected.details_en) && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] text-[var(--gold)] mb-1.5 font-semibold">{isAr ? "تفاصيل الحساب — استخدم البيانات التالية للتحويل" : "Account details — use the info below to transfer"}</p>
              <pre dir={isAr ? "rtl" : "ltr"} className="text-xs whitespace-pre-wrap font-sans text-white/85">{isAr ? (selected.details_ar || selected.details_en) : (selected.details_en || selected.details_ar)}</pre>
            </div>
          )}

          {selected && (
            <>
              <p className="text-[11px] text-white/60">{isAr ? "2. أدخل المبلغ وارفع صورة الإيصال" : "2. Enter amount and upload proof"}</p>
              <div className="flex gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={isAr ? "المبلغ" : "Amount"}
                  className="flex-1 h-9 px-3 rounded-lg bg-white/5 border border-white/15 text-sm" />
                <span className="h-9 px-3 inline-flex items-center text-xs text-white/60 bg-white/5 rounded-lg border border-white/10">{currency}</span>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs file:me-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-white/10 file:text-white" />
              <p className="text-[10px] text-white/50">{isAr ? "الامتدادات المسموح بها: jpg, jpeg, png, pdf — حد أقصى 5MB" : "Allowed: jpg, jpeg, png, pdf — max 5MB"}</p>
              <button onClick={submit} disabled={busy}
                className="w-full h-9 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
                {busy ? (isAr ? "جاري الإرسال..." : "Submitting...") : (isAr ? "إرسال الإيصال للمراجعة" : "Send proof for review")}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

