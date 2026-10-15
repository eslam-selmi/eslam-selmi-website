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
import { ActivationSettings, PendingProfile } from "@/components/admin/panels/types";

export function ActivationsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [list, setList] = useState<PendingProfile[]>([]);
  const [filter, setFilter] = useState<"pending" | "rejected" | "active">("pending");
  const [settings, setSettings] = useState<ActivationSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, country, country_code, activation_status, created_at")
      .eq("activation_status", filter)
      .order("created_at", { ascending: false });
    setList((data as any) ?? []);
  }
  async function loadSettings() {
    const { data } = await supabase.from("platform_settings").select("*").maybeSingle();
    if (data) setSettings(data as any);
  }
  useEffect(() => {
    load();
  }, [filter]);
  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("platform_settings")
      .update({
        admin_whatsapp_e164: settings.admin_whatsapp_e164,
        activation_request_template_ar: settings.activation_request_template_ar,
        activation_request_template_en: settings.activation_request_template_en,
        welcome_message_template_ar: settings.welcome_message_template_ar,
        welcome_message_template_en: settings.welcome_message_template_en,
      } as any)
      .eq("singleton", true);
    setSavingSettings(false);
    if (error) toast.error(error.message);
    else toast.success(t("تم حفظ الإعدادات", "Settings saved"));
  }

  async function approve(p: PendingProfile) {
    setBusyId(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ activation_status: "active", activated_at: new Date().toISOString() } as any)
      .eq("id", p.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("تم التفعيل", "Activated"));

    // Open WhatsApp with welcome message
    const phoneDigits = (p.phone || "").replace(/\D/g, "");
    if (phoneDigits && settings) {
      const loginUrl = `${window.location.origin}/auth`;
      const name = p.full_name || (lang === "ar" ? "متدرب" : "Trainee");
      const tmpl =
        lang === "ar" ? settings.welcome_message_template_ar : settings.welcome_message_template_en;
      const msg = (tmpl || "")
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{login_url\}\}/g, loginUrl)
        .replace(/\{\{email\}\}/g, p.email || "");
      const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } else if (!phoneDigits) {
      toast.message(
        t("لم يتم العثور على رقم هاتف للمتدرب", "No phone number on file for this trainee"),
      );
    }
    load();
  }

  async function reject(p: PendingProfile) {
    if (!confirm(t("تأكيد رفض التفعيل؟", "Reject activation?"))) return;
    setBusyId(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ activation_status: "rejected" } as any)
      .eq("id", p.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("تم رفض الطلب", "Request rejected"));
    load();
  }

  async function reinstate(p: PendingProfile) {
    setBusyId(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ activation_status: "pending" } as any)
      .eq("id", p.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      {/* Settings card */}
      <div className="dash-card dash-card-hover p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[var(--gold)]" />
          <h3 className="font-bold text-sm">
            {t("إعدادات تفعيل الحساب عبر واتساب", "WhatsApp activation settings")}
          </h3>
        </div>
        {settings ? (
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block md:col-span-2">
              <span className="block text-xs text-white/60 mb-1">
                {t(
                  "رقم واتساب الإدارة (بصيغة دولية بدون +)",
                  "Admin WhatsApp (international, no +)",
                )}
              </span>
              <input
                value={settings.admin_whatsapp_e164 ?? ""}
                onChange={(e) => setSettings({ ...settings, admin_whatsapp_e164: e.target.value })}
                placeholder="201001234567"
                dir="ltr"
                className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص طلب التفعيل (عربي)", "Activation request (Arabic)")}
              </span>
              <textarea
                rows={3}
                value={settings.activation_request_template_ar}
                onChange={(e) =>
                  setSettings({ ...settings, activation_request_template_ar: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص طلب التفعيل (إنجليزي)", "Activation request (English)")}
              </span>
              <textarea
                rows={3}
                dir="ltr"
                value={settings.activation_request_template_en}
                onChange={(e) =>
                  setSettings({ ...settings, activation_request_template_en: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص الترحيب عند التفعيل (عربي)", "Welcome message (Arabic)")}
              </span>
              <textarea
                rows={3}
                value={settings.welcome_message_template_ar}
                onChange={(e) =>
                  setSettings({ ...settings, welcome_message_template_ar: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-white/60 mb-1">
                {t("نص الترحيب عند التفعيل (إنجليزي)", "Welcome message (English)")}
              </span>
              <textarea
                rows={3}
                dir="ltr"
                value={settings.welcome_message_template_en}
                onChange={(e) =>
                  setSettings({ ...settings, welcome_message_template_en: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-[var(--gold)]/60"
              />
            </label>
            <p className="text-[10px] text-white/40 md:col-span-2">
              {t("المتغيرات المتاحة:", "Available variables:")}{" "}
              <code className="text-[var(--gold)]">{`{{name}}`}</code>,{" "}
              <code className="text-[var(--gold)]">{`{{email}}`}</code>,{" "}
              <code className="text-[var(--gold)]">{`{{login_url}}`}</code>
            </p>
            <div className="md:col-span-2">
              <button
                disabled={savingSettings}
                onClick={saveSettings}
                className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm disabled:opacity-50"
              >
                {savingSettings
                  ? t("جارٍ الحفظ...", "Saving...")
                  : t("حفظ الإعدادات", "Save settings")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> {t("جارٍ التحميل...", "Loading...")}
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(["pending", "rejected", "active"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 h-9 rounded-full text-xs font-semibold transition ${
              filter === f
                ? "bg-[var(--gold)] text-[#0b1736]"
                : "bg-white/5 text-white/60 hover:text-white border border-white/10"
            }`}
          >
            {f === "pending"
              ? t("بانتظار التفعيل", "Pending")
              : f === "rejected"
                ? t("مرفوضة", "Rejected")
                : t("مُفعّلة", "Active")}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="dash-card dash-card-hover overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-white/50 text-sm">
            {t("لا توجد حسابات في هذه الحالة.", "No accounts in this state.")}
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((p) => {
              const phoneDigits = (p.phone || "").replace(/\D/g, "");
              const country = findCountry(p.country || "");
              return (
                <li
                  key={p.id}
                  className="p-4 flex flex-wrap items-center gap-3 hover:bg-white/[0.02]"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)] font-bold">
                    {(p.full_name || p.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {p.full_name || t("بدون اسم", "No name")}
                    </p>
                    <p className="text-xs text-white/55 truncate" dir="ltr">
                      {p.email}
                    </p>
                    <p className="text-[11px] text-white/45 mt-0.5" dir="ltr">
                      {country?.flag} {p.phone || "—"} ·{" "}
                      {new Date(p.created_at).toLocaleString("ar-EG")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {phoneDigits && (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://wa.me/${phoneDigits}`}
                        className="px-3 h-9 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                    {filter === "pending" && (
                      <>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => approve(p)}
                          className="px-3 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                          {t("تفعيل وإرسال ترحيب", "Approve & welcome")}
                        </button>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => reject(p)}
                          className="px-3 h-9 rounded-lg border border-rose-400/40 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> {t("رفض", "Reject")}
                        </button>
                      </>
                    )}
                    {filter === "rejected" && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => reinstate(p)}
                        className="px-3 h-9 rounded-lg border border-white/15 text-white/80 hover:bg-white/5 text-xs font-semibold disabled:opacity-50"
                      >
                        {t("إعادة لقائمة الانتظار", "Move back to pending")}
                      </button>
                    )}
                    {filter === "active" && (
                      <span className="px-3 h-9 inline-flex items-center rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 me-1.5" /> {t("مفعّل", "Active")}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============= PAYMENT METHODS PANEL =============
