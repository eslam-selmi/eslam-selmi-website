import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { toast } from "sonner";
import { generateCertificatePdf } from "@/lib/certificate";
import { useI18n } from "@/lib/i18n";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Wallet,
  Loader2,
  Users,
  BookOpen,
  Award,
  FileText,
  X,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Layers,
  Link as LinkIcon,
  StickyNote,
  Paperclip,
  Pencil,
  Check,
  Clock,
  Settings2,
  Sparkles,
  Ticket,
  Percent,
  Archive,
  Camera,
  LifeBuoy,
  Star,
  CreditCard,
  Trophy,
  Video,
  ShieldCheck,
  LayoutDashboard,
  MoreHorizontal,
} from "lucide-react";
import { findCountry } from "@/lib/countries";
import { safeHref } from "@/lib/safe-url";
import { AdminSupportPanel } from "@/components/SupportTickets";
import { assertAdmin } from "@/lib/admin-guard.functions";
import { SiteManagementPanel } from "@/components/admin/SiteManagementPanel";
import { SuccessCasesPanel } from "@/components/admin/SuccessCasesPanel";
import { PartnersPanel } from "@/components/admin/PartnersPanel";
import { ContractsPanel } from "@/components/admin/ContractsPanel";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { PackagesPanel } from "@/components/admin/PackagesPanel";
import { InterviewsPanel } from "@/components/admin/InterviewsPanel";
import { TrainingsPanel } from "@/components/admin/TrainingsPanel";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { TraineeDrawer } from "@/components/admin/TraineeDrawer";
import { ExecutiveOverview } from "@/components/admin/ExecutiveOverview";
import { CourseFeedbackPanel } from "@/components/admin/CourseFeedbackPanel";
import { Button } from "@/components/ui/button";


export function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number; color?: string }) {
  return <div className="dash-card flex items-center justify-between gap-4 p-4">
    <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p></div>
    <Icon className="size-5 text-accent" />
  </div>;
}

export function StatusPill({ status }: { status: string }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const map: Record<string, { label: string; cls: string }> = {
    pending: {
      label: t("قيد المراجعة", "Pending"),
      cls: "text-amber-300 bg-amber-300/10 border-amber-300/30",
    },
    approved: {
      label: t("مقبول", "Approved"),
      cls: "text-emerald-300 bg-emerald-300/10 border-emerald-300/30",
    },
    rejected: {
      label: t("مرفوض", "Rejected"),
      cls: "text-rose-300 bg-rose-300/10 border-rose-300/30",
    },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ============= COURSES PANEL =============

export function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/60"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--gold)]/60"
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/15 text-white focus:outline-none focus:border-[var(--gold)]/60"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-[#0b1736]">
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProofLink({ path, label }: { path: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 300)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  if (!url) return <span className="text-[11px] text-white/40">…</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-[11px] px-2 h-7 inline-flex items-center gap-1 rounded bg-sky-500/20 text-sky-200 border border-sky-500/40"
    >
      <Paperclip className="w-3 h-3" /> {label}
    </a>
  );
}

export function AvatarUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [busy, setBusy] = useState(false);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("اختر ملف صورة", "Please pick an image"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("الحد الأقصى ٥ ميجا", "Max size is 5 MB"));
      return;
    }
    setBusy(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `testimonials/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("public-uploads")
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const { data: signed } = await supabase.storage
      .from("public-uploads")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    onChange(signed?.signedUrl || "");
    setBusy(false);
    toast.success(t("تم رفع الصورة", "Image uploaded"));
  }

  async function handleRemove() {
    if (!value) return;
    // Try to delete from bucket if it's our own URL
    const marker = "/public-uploads/";
    const idx = value.indexOf(marker);
    if (idx > -1) {
      const path = value.slice(idx + marker.length).split("?")[0];
      await supabase.storage.from("public-uploads").remove([path]);
    }
    onChange("");
  }

  return (
    <div className="block text-xs">
      <span className="text-white/70">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="w-14 h-14 rounded-full object-cover border border-white/15"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/5 border border-dashed border-white/15 grid place-items-center text-white/40">
            <Upload className="w-4 h-4" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label
            className={`inline-flex items-center gap-2 px-3 h-9 rounded-lg text-xs font-semibold cursor-pointer transition ${
              busy ? "opacity-50 pointer-events-none" : "bg-white/10 hover:bg-white/15"
            }`}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {value ? t("تغيير الصورة", "Change image") : t("رفع صورة", "Upload image")}
            <input type="file" accept="image/*" className="hidden" onChange={handlePick} disabled={busy} />
          </label>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-[11px] text-rose-300 hover:text-rose-200 text-start"
            >
              {t("إزالة", "Remove")}
            </button>
          )}
          <span className="text-[10px] text-white/40">{t("PNG/JPG حتى ٥ ميجا", "PNG/JPG up to 5 MB")}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Activations Panel — Pending account activation queue + settings
// ============================================================
