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


export function MyCertificatesSection({ enrollments, onDownload, lang }: {
  enrollments: Enrollment[];
  onDownload: (url: string) => void;
  lang: "ar" | "en";
}) {
  const isAr = lang === "ar";
  if (enrollments.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-[var(--gold)]" />
        {isAr ? "شهاداتي" : "My Certificates"}
        <span className="text-xs font-normal text-white/50">({enrollments.length})</span>
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrollments.map((en) => {
          const course = en.courses;
          if (!course) return null;
          const hours = Number(course.total_hours) || 0;
          return (
            <div key={en.id}
              className="group relative overflow-hidden rounded-2xl p-5 border border-[var(--gold)]/25 bg-gradient-to-br from-[var(--gold)]/[0.08] via-white/[0.03] to-transparent hover:border-[var(--gold)]/50 transition-all">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[var(--gold)]/10 blur-2xl pointer-events-none" />

              <div className="relative flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--gold)]/30 to-[var(--gold)]/10 border border-[var(--gold)]/40 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--gold)]/80">
                    {isAr ? "شهادة إتمام" : "Certificate of completion"}
                  </p>
                  <h3 className="font-bold leading-tight text-white line-clamp-2 mt-0.5">{course.title}</h3>
                </div>
              </div>

              <div className="relative flex flex-wrap items-center gap-2 text-[11px] text-white/60 mb-4">
                {hours > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    <Clock className="w-3 h-3" /> {hours} {isAr ? "ساعة" : "hrs"}
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> {isAr ? "معتمدة" : "Verified"}
                </span>
              </div>

              <div className="relative space-y-2">
                {en.certificate_url_ar && (
                  <button onClick={() => onDownload(en.certificate_url_ar!)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--gold)] text-[#0b1736] hover:brightness-110 transition">
                    <Download className="w-3.5 h-3.5" /> {isAr ? "تحميل النسخة العربية" : "Download Arabic"}
                  </button>
                )}
                {en.certificate_url_en && (
                  <button onClick={() => onDownload(en.certificate_url_en!)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-[#0b1736] hover:bg-white/90 transition">
                    <Download className="w-3.5 h-3.5" /> Download English
                  </button>
                )}
                {!en.certificate_url_ar && !en.certificate_url_en && en.certificate_url && (
                  <button onClick={() => onDownload(en.certificate_url!)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--gold)] text-[#0b1736] hover:brightness-110 transition">
                    <Download className="w-3.5 h-3.5" /> {isAr ? "تحميل الشهادة" : "Download certificate"}
                  </button>
                )}

                <a href={`/verify/${en.id}`} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-semibold border border-white/15 bg-white/5 text-white/85 hover:bg-white/10 transition">
                  <ExternalLink className="w-3.5 h-3.5" /> {isAr ? "التحقق من الشهادة" : "Verify certificate"}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}




