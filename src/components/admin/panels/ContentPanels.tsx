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
import { LatestAdditionAdminRow, LatestAdditionsSettingsRow, SnapshotRow, TestimonialAdminRow } from "@/components/admin/panels/types";
import { AvatarUploadField, Input, Select } from "@/components/admin/panels/ui";

export function LatestAdditionsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<LatestAdditionAdminRow[]>([]);
  const [settings, setSettings] = useState<LatestAdditionsSettingsRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    custom_label: "",
    kind: "link" as "link" | "embed",
    url: "",
  });

  async function load() {
    const [{ data: s }, { data: list }] = await Promise.all([
      supabase.from("latest_additions_settings").select("*").limit(1).maybeSingle(),
      supabase.from("latest_additions").select("*").order("created_at", { ascending: false }),
    ]);
    setSettings((s as LatestAdditionsSettingsRow) ?? null);
    setItems((list as LatestAdditionAdminRow[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings() {
    if (!settings) return;
    const { error } = await supabase
      .from("latest_additions_settings")
      .update({
        title_ar: settings.title_ar,
        title_en: settings.title_en,
        subtitle_ar: settings.subtitle_ar,
        subtitle_en: settings.subtitle_en,
      })
      .eq("id", settings.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم حفظ الإعدادات", "Settings saved"));
    load();
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_ar.trim() || !form.title_en.trim() || !form.url.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("latest_additions").insert({
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim(),
      subtitle_ar: form.subtitle_ar.trim() || null,
      subtitle_en: form.subtitle_en.trim() || null,
      custom_label: form.custom_label.trim() || null,
      kind: form.kind,
      url: form.url.trim(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة العنصر", "Item added"));
    setForm({
      title_ar: "",
      title_en: "",
      subtitle_ar: "",
      subtitle_en: "",
      custom_label: "",
      kind: "link",
      url: "",
    });
    load();
  }

  async function del(id: string) {
    if (!confirm(t("حذف هذا العنصر؟", "Delete this item?"))) return;
    const { error } = await supabase.from("latest_additions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="space-y-6">
      {settings && (
        <div className="dash-card dash-card-hover p-5 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--gold)]" />{" "}
            {t("إعدادات قسم أحدث الإضافات", "Latest additions settings")}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label={t("العنوان عربي", "Title AR")}
              value={settings.title_ar ?? ""}
              onChange={(v) => setSettings({ ...settings, title_ar: v })}
            />
            <Input
              label={t("العنوان إنجليزي", "Title EN")}
              value={settings.title_en ?? ""}
              onChange={(v) => setSettings({ ...settings, title_en: v })}
            />
            <Input
              label={t("وصف عربي", "Subtitle AR")}
              value={settings.subtitle_ar ?? ""}
              onChange={(v) => setSettings({ ...settings, subtitle_ar: v })}
            />
            <Input
              label={t("وصف إنجليزي", "Subtitle EN")}
              value={settings.subtitle_en ?? ""}
              onChange={(v) => setSettings({ ...settings, subtitle_en: v })}
            />
          </div>
          <button
            onClick={saveSettings}
            className="text-xs px-4 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
          >
            {t("حفظ الإعدادات", "Save settings")}
          </button>
        </div>
      )}

      <form onSubmit={addItem} className="dash-card dash-card-hover p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--gold)]" /> {t("إضافة عنصر جديد", "Add new item")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label={t("العنوان عربي", "Title AR")}
            value={form.title_ar}
            onChange={(v) => setForm({ ...form, title_ar: v })}
            required
          />
          <Input
            label={t("العنوان إنجليزي", "Title EN")}
            value={form.title_en}
            onChange={(v) => setForm({ ...form, title_en: v })}
            required
          />
          <Input
            label={t("وصف عربي", "Subtitle AR")}
            value={form.subtitle_ar}
            onChange={(v) => setForm({ ...form, subtitle_ar: v })}
          />
          <Input
            label={t("وصف إنجليزي", "Subtitle EN")}
            value={form.subtitle_en}
            onChange={(v) => setForm({ ...form, subtitle_en: v })}
          />
          <Input
            label={t("شارة", "Badge")}
            value={form.custom_label}
            onChange={(v) => setForm({ ...form, custom_label: v })}
          />
          <Select
            label={t("النوع", "Kind")}
            value={form.kind}
            onChange={(v) => setForm({ ...form, kind: v as "link" | "embed" })}
            options={[
              { v: "link", l: t("رابط", "Link") },
              { v: "embed", l: t("فيديو مضمن", "Embed") },
            ]}
          />
        </div>
        <Input
          label={t("الرابط", "URL")}
          value={form.url}
          onChange={(v) => setForm({ ...form, url: v })}
          required
        />
        <button
          disabled={busy}
          type="submit"
          className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm disabled:opacity-50"
        >
          {busy ? t("جارٍ الإضافة...", "Adding...") : t("إضافة", "Add")}
        </button>
      </form>

      <div className="dash-card dash-card-hover p-5">
        <h3 className="font-bold mb-3">
          {t("العناصر الحالية", "Current items")} ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-white/40">{t("لا توجد عناصر بعد.", "No items yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <FileText className="w-4 h-4 text-[var(--gold)] mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {it.title_ar} <span className="text-white/40">·</span>{" "}
                    <span className="text-white/60">{it.title_en}</span>
                  </p>
                  <p className="text-[11px] text-white/45 mt-0.5">
                    [{it.kind}] {it.custom_label ? `· ${it.custom_label}` : ""} ·{" "}
                    {new Date(it.created_at).toLocaleString("ar-EG")}
                  </p>
                </div>
                <button
                  onClick={() => del(it.id)}
                  className="p-2 rounded-lg md:hover:bg-rose-500/10 text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Testimonials Panel — manage "What Clients Say" entries
// ============================================================

export function TestimonialsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<TestimonialAdminRow[]>([]);
  const [busy, setBusy] = useState(false);
  const emptyForm = { name: "", role: "", company: "", quote: "", avatar_url: "", display_order: 0 };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("testimonials" as any)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(((data as unknown) as TestimonialAdminRow[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(it: TestimonialAdminRow) {
    setEditingId(it.id);
    setForm({
      name: it.name,
      role: it.role || "",
      company: it.company || "",
      quote: it.quote,
      avatar_url: it.avatar_url || "",
      display_order: it.display_order,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim()) return;
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || null,
      company: form.company.trim() || null,
      quote: form.quote.trim(),
      avatar_url: form.avatar_url.trim() || null,
      display_order: Number(form.display_order) || 0,
    };
    const { error } = editingId
      ? await supabase.from("testimonials" as any).update(payload as any).eq("id", editingId)
      : await supabase.from("testimonials" as any).insert(payload as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? t("تم التحديث", "Updated") : t("تمت الإضافة", "Added"));
    cancelEdit();
    load();
  }

  async function toggleVisible(it: TestimonialAdminRow) {
    const { error } = await supabase
      .from("testimonials" as any)
      .update({ is_visible: !it.is_visible } as any)
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function del(id: string) {
    if (!confirm(t("حذف هذه الشهادة؟", "Delete this testimonial?"))) return;
    const { error } = await supabase.from("testimonials" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (editingId === id) cancelEdit();
    load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="dash-card dash-card-hover p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--gold)]" />{" "}
          {editingId
            ? t("تعديل الشهادة", "Edit testimonial")
            : t("إضافة شهادة عميل", "Add testimonial")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label={t("الاسم", "Name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Input label={t("المسمى الوظيفي", "Role")} value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          <Input label={t("الشركة", "Company")} value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <AvatarUploadField label={t("صورة العميل", "Client photo")} value={form.avatar_url} onChange={(v) => setForm({ ...form, avatar_url: v })} />
          <Input label={t("ترتيب العرض", "Display order")} value={String(form.display_order)} onChange={(v) => setForm({ ...form, display_order: Number(v) || 0 })} />
        </div>
        <label className="block text-xs text-white/70">
          {t("نص الشهادة", "Quote")}
          <textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} required rows={4}
            className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 p-3 text-sm text-white" />
        </label>
        <div className="flex items-center gap-2">
          <button disabled={busy} type="submit"
            className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm disabled:opacity-50">
            {busy
              ? t("جارٍ الحفظ...", "Saving...")
              : editingId
                ? t("حفظ التعديلات", "Save changes")
                : t("إضافة", "Add")}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit}
              className="px-4 h-10 rounded-lg bg-white/[0.06] border border-white/10 text-sm">
              {t("إلغاء", "Cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="dash-card dash-card-hover p-5">
        <h3 className="font-bold mb-3">
          {t("الشهادات الحالية", "Current testimonials")} ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-sm text-white/40">{t("لا توجد شهادات بعد.", "No testimonials yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id}
                className={`flex items-start gap-3 p-3 rounded-xl border ${editingId === it.id ? "bg-[var(--gold)]/10 border-[var(--gold)]/30" : "bg-white/[0.03] border-white/5"}`}>
                {it.avatar_url ? (
                  <img src={it.avatar_url} alt={it.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 grid place-items-center text-xs font-bold">{it.name.charAt(0)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {it.name}
                    {it.role || it.company ? (
                      <span className="text-white/50 text-[11px] ms-2">{[it.role, it.company].filter(Boolean).join(" · ")}</span>
                    ) : null}
                  </p>
                  <p className="text-[12px] text-white/70 mt-1 line-clamp-2">{it.quote}</p>
                  <p className="text-[10px] text-white/40 mt-1">
                    #{it.display_order} · {it.is_visible ? t("ظاهرة", "Visible") : t("مخفية", "Hidden")}
                  </p>
                </div>
                <button onClick={() => startEdit(it)}
                  className="text-[11px] px-2 h-7 rounded-md bg-[var(--gold)]/15 border border-[var(--gold)]/30 text-[var(--gold)]">
                  {t("تعديل", "Edit")}
                </button>
                <button onClick={() => toggleVisible(it)}
                  className="text-[11px] px-2 h-7 rounded-md bg-white/[0.06] border border-white/10">
                  {it.is_visible ? t("إخفاء", "Hide") : t("إظهار", "Show")}
                </button>
                <button onClick={() => del(it.id)} className="p-2 rounded-lg md:hover:bg-rose-500/10 text-rose-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SnapshotsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<SnapshotRow[]>([]);
  const [busy, setBusy] = useState(false);
  const empty = { image_url: "", caption_ar: "", caption_en: "", display_order: 0 as number };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("snapshots" as any)
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(((data as unknown) as SnapshotRow[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url.trim()) return toast.error(t("ارفع صورة أولاً", "Upload an image first"));
    setBusy(true);
    // Auto-append to the SAME unified gallery: new items get max(order)+1 so they
    // slot into the existing collection instead of appearing as a separate group.
    const nextOrder = editingId
      ? Number(form.display_order) || 0
      : (items.reduce((m, it) => Math.max(m, it.display_order || 0), 0) + 1);
    const payload = {
      image_url: form.image_url.trim(),
      caption_ar: form.caption_ar.trim() || null,
      caption_en: form.caption_en.trim() || null,
      display_order: nextOrder,
      is_visible: true,
    };
    const { error } = editingId
      ? await supabase.from("snapshots" as any).update(payload as any).eq("id", editingId)
      : await supabase.from("snapshots" as any).insert(payload as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? t("تم التحديث", "Updated") : t("تمت الإضافة إلى المعرض", "Added to gallery"));
    setForm(empty); setEditingId(null); load();
  }
  async function toggle(it: SnapshotRow) {
    await supabase.from("snapshots" as any).update({ is_visible: !it.is_visible } as any).eq("id", it.id);
    load();
  }
  async function del(id: string) {
    if (!confirm(t("حذف هذه اللحظة؟", "Delete this snapshot?"))) return;
    await supabase.from("snapshots" as any).delete().eq("id", id);
    if (editingId === id) { setEditingId(null); setForm(empty); }
    load();
  }
  function edit(it: SnapshotRow) {
    setEditingId(it.id);
    setForm({
      image_url: it.image_url,
      caption_ar: it.caption_ar || "",
      caption_en: it.caption_en || "",
      display_order: it.display_order,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="dash-card dash-card-hover p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Plus className="w-4 h-4 text-[var(--gold)]" />
          {editingId ? t("تعديل اللحظة", "Edit snapshot") : t("إضافة لحظة", "Add snapshot")}
        </h3>
        <AvatarUploadField
          label={t("الصورة", "Image")}
          value={form.image_url}
          onChange={(v) => setForm({ ...form, image_url: v })}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label={t("تعليق بالعربية", "Arabic caption")} value={form.caption_ar} onChange={(v) => setForm({ ...form, caption_ar: v })} />
          <Input label={t("تعليق بالإنجليزية", "English caption")} value={form.caption_en} onChange={(v) => setForm({ ...form, caption_en: v })} />
          <Input label={t("ترتيب العرض", "Display order")} value={String(form.display_order)} onChange={(v) => setForm({ ...form, display_order: Number(v) || 0 })} />
        </div>
        <div className="flex items-center gap-2">
          <button disabled={busy} type="submit"
            className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm disabled:opacity-50">
            {busy ? t("جارٍ الحفظ...", "Saving...") : editingId ? t("حفظ", "Save") : t("إضافة", "Add")}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}
              className="px-4 h-10 rounded-lg bg-white/[0.06] border border-white/10 text-sm">
              {t("إلغاء", "Cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="dash-card dash-card-hover p-5">
        <h3 className="font-bold mb-1">{t("المعرض الموحّد للحظات", "Unified moments gallery")} ({items.length})</h3>
        <p className="text-[11px] text-white/50 mb-3">{t("كل صورة تُضاف تدخل ضمن نفس المعرض تلقائياً.", "Every image you add joins the same gallery automatically.")}</p>
        {items.length === 0 ? (
          <p className="text-sm text-white/40">{t("لم تُضاف لحظات بعد.", "No snapshots yet.")}</p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((it) => (
              <li key={it.id} className={`p-2 rounded-xl border ${editingId === it.id ? "bg-[var(--gold)]/10 border-[var(--gold)]/30" : "bg-white/[0.03] border-white/5"}`}>
                <img src={it.image_url} alt="" className="w-full aspect-[4/5] object-cover rounded-lg border border-white/10" />
                <p className="text-[11px] text-white/70 mt-2 line-clamp-1">{it.caption_ar || it.caption_en || "—"}</p>
                <p className="text-[10px] text-white/40 mt-1">#{it.display_order} · {it.is_visible ? t("ظاهرة", "Visible") : t("مخفية", "Hidden")}</p>
                <div className="flex items-center gap-1 mt-2">
                  <button onClick={() => edit(it)} className="text-[11px] px-2 h-7 rounded-md bg-[var(--gold)]/15 border border-[var(--gold)]/30 text-[var(--gold)]">{t("تعديل", "Edit")}</button>
                  <button onClick={() => toggle(it)} className="text-[11px] px-2 h-7 rounded-md bg-white/[0.06] border border-white/10">{it.is_visible ? t("إخفاء", "Hide") : t("إظهار", "Show")}</button>
                  <button onClick={() => del(it.id)} className="ms-auto p-2 rounded-lg md:hover:bg-rose-500/10 text-rose-300"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
