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


export function EnrollmentCard({ en, onOpen, onWithdraw, progress = 0, doneCount = 0, totalCount = 0 }: { en: Enrollment; onOpen: () => void; onWithdraw: (id: string) => void; progress?: number; doneCount?: number; totalCount?: number }) {
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const c = en.courses;
  const hasCert = Boolean(en.certificate_url || en.certificate_url_ar || en.certificate_url_en);

  const status = {
    pending: { label: isAr ? "قيد المراجعة" : "Under review", icon: Clock, ring: "border-amber-300/30", chip: "text-amber-200 bg-amber-300/10 border-amber-300/30", glow: "rgba(245,190,90,0.18)" },
    approved: { label: isAr ? "مقبول" : "Approved", icon: CheckCircle2, ring: "border-[var(--gold)]/35", chip: "text-emerald-200 bg-emerald-300/10 border-emerald-300/30", glow: "rgba(212,175,55,0.22)" },
    rejected: { label: isAr ? "مرفوض" : "Rejected", icon: XCircle, ring: "border-rose-400/30", chip: "text-rose-200 bg-rose-400/10 border-rose-400/30", glow: "rgba(244,114,140,0.15)" },
  }[en.status];
  const SIcon = status.icon;

  // Circular progress geometry
  const R = 22, CIRC = 2 * Math.PI * R;

  return (
    <div className={`group relative overflow-hidden rounded-[22px] border ${status.ring} bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.85)] flex flex-col`}>
      {/* top hairline + ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/70 to-transparent" />
      <div className="pointer-events-none absolute -top-24 -end-20 w-64 h-64 rounded-full blur-3xl opacity-70 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${status.glow}, transparent 65%)` }} />
      {/* subtle engraved grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

      <div className="relative p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gold)]/30 via-[var(--gold)]/10 to-transparent border border-[var(--gold)]/35 flex items-center justify-center text-3xl shadow-[0_14px_34px_-18px_rgba(212,175,55,0.9)]">
              {c?.cover_emoji || "🎓"}
            </div>
            {hasCert && (
              <span className="absolute -bottom-1.5 -end-1.5 w-7 h-7 rounded-xl bg-[var(--gold)] text-[#0b1736] flex items-center justify-center shadow-lg" title={isAr ? "شهادة جاهزة" : "Certificate ready"}>
                <Award className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-snug line-clamp-2">{c?.title}</h3>
            <span className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${status.chip}`}>
              <SIcon className="w-3 h-3" /> {status.label}
            </span>
          </div>

          {en.status === "approved" && totalCount > 0 && (
            <div className="relative shrink-0 w-14 h-14">
              <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r={R} fill="none" strokeWidth="4" className="stroke-white/10" />
                <circle cx="28" cy="28" r={R} fill="none" strokeWidth="4" strokeLinecap="round"
                  stroke="var(--gold)" strokeDasharray={CIRC}
                  strokeDashoffset={CIRC - (CIRC * progress) / 100}
                  style={{ transition: "stroke-dashoffset 900ms ease" }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-[var(--gold)]">{progress}%</span>
            </div>
          )}
        </div>

        {/* meta chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-white/60">
          {Number((c as any)?.total_hours) > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-white/5 border border-white/10">
              <Clock className="w-3 h-3 text-[var(--gold)]" /> {(c as any).total_hours} {isAr ? "ساعة" : "hrs"}
            </span>
          )}
          {totalCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-white/5 border border-white/10">
              <Layers className="w-3 h-3 text-[var(--gold)]" /> {doneCount}/{totalCount} {isAr ? "وحدة" : "modules"}
            </span>
          )}
          {(c?.starts_at || c?.ends_at) && (
            <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg bg-white/5 border border-white/10">
              <Calendar className="w-3 h-3 text-[var(--gold)]" /> {c?.starts_at || "—"} → {c?.ends_at || "—"}
            </span>
          )}
        </div>

        {en.status === "approved" && totalCount > 0 && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #e8c870, var(--gold))" }} />
            </div>
          </div>
        )}

        {en.status === "pending" && (
          <>
            <p className="mt-4 text-xs text-amber-200/80 bg-amber-300/5 border border-amber-300/15 rounded-xl p-3 leading-relaxed">
              {isAr ? "لم تتم الموافقة على انضمامك حتى الآن. يمكنك تصفح عناوين المحاضرات (المحتوى مقفل 🔒) أو سحب الطلب."
                    : "Your enrollment isn't approved yet. You can preview lecture titles (content locked 🔒) or withdraw the request."}
            </p>
            <div className="flex gap-2 mt-auto pt-4">
              <button onClick={onOpen} className="flex-1 text-xs h-11 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 transition font-semibold">
                {isAr ? "معاينة المحاضرات 🔒" : "Preview lectures 🔒"}
              </button>
              <button onClick={() => onWithdraw(en.id)} className="text-xs px-4 h-11 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition font-semibold">
                {isAr ? "انسحاب" : "Withdraw"}
              </button>
            </div>
          </>
        )}

        {en.status === "rejected" && en.notes && (
          <p className="mt-4 text-sm text-rose-200/80 bg-rose-500/5 border border-rose-400/15 rounded-xl p-3">{en.notes}</p>
        )}

        {en.status === "approved" && (
          <button onClick={onOpen}
            className="mt-auto w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition shadow-[0_16px_34px_-18px_rgba(212,175,55,0.9)]"
            style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736", marginTop: "1.25rem" }}>
            {isAr ? "متابعة الكورس" : "Continue course"} <ArrowRight className="w-4 h-4 rtl-flip" />
          </button>
        )}
      </div>
    </div>
  );
}


// ============= COURSE DETAIL (trainee) =============
