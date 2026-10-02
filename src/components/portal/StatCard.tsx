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


export function StatCard({ icon: Icon, label, value, accent, suffix }: { icon: any; label: string; value: number | string; accent: "emerald" | "amber" | "sky" | "gold"; suffix?: string }) {
  const tone = {
    emerald: { ring: "bg-emerald-400/10 border-emerald-400/30", text: "text-emerald-300", glow: "from-emerald-400/25" },
    amber:   { ring: "bg-amber-400/10 border-amber-400/30",     text: "text-amber-300",   glow: "from-amber-400/25" },
    sky:     { ring: "bg-sky-400/10 border-sky-400/30",         text: "text-sky-300",     glow: "from-sky-400/25" },
    gold:    { ring: "bg-[var(--gold)]/10 border-[var(--gold)]/30", text: "text-[var(--gold)]", glow: "from-[var(--gold)]/30" },
  }[accent];
  return (
    <div className="dash-card dash-card-hover relative overflow-hidden p-5">
      <div className={`pointer-events-none absolute -top-12 -end-12 w-32 h-32 rounded-full bg-gradient-to-br ${tone.glow} to-transparent blur-2xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-white/55 font-semibold">{label}</p>
          <p className="text-3xl font-bold mt-2 leading-none truncate">
            {value}{suffix && <span className="text-sm font-medium opacity-70 ms-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl border ${tone.ring} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${tone.text}`} />
        </div>
      </div>
    </div>
  );
}


