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
import { Course } from "@/components/admin/panels/types";
import { Input, Select, TextArea } from "@/components/admin/panels/ui";

export function CourseContent({ courseId }: { courseId: string }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [modules, setModules] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [newTitle, setNewTitle] = useState("");

  async function loadModules() {
    const { data } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");
    const mods = data ?? [];
    setModules(mods);
    if (mods.length) {
      const ids = mods.map((m: any) => m.id);
      const { data: its } = await supabase
        .from("module_items")
        .select("*")
        .in("module_id", ids)
        .order("order_index");
      const grouped: Record<string, any[]> = {};
      (its ?? []).forEach((it: any) => {
        (grouped[it.module_id] ||= []).push(it);
      });
      setItems(grouped);
    } else {
      setItems({});
    }
  }
  useEffect(() => {
    loadModules();
  }, [courseId]);

  async function addModule() {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("course_modules").insert({
      course_id: courseId,
      title: newTitle,
      order_index: modules.length,
    });
    if (error) return toast.error(error.message);
    setNewTitle("");
    loadModules();
  }

  async function toggleComplete(m: any) {
    const { error } = await supabase
      .from("course_modules")
      .update({ completed_by_admin: !m.completed_by_admin })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(
      !m.completed_by_admin
        ? t("تم وضع علامة الإكمال", "Marked as complete")
        : t("تم إلغاء الإكمال", "Marked as incomplete"),
    );
    loadModules();
  }

  async function delModule(id: string) {
    if (!confirm(t("حذف الباب وكل محتوياته؟", "Delete module and all its contents?"))) return;
    await supabase.from("course_modules").delete().eq("id", id);
    loadModules();
  }

  async function updateOnlineUrl(id: string, value: string) {
    await supabase
      .from("course_modules")
      .update({ online_url: value || null })
      .eq("id", id);
    loadModules();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t("عنوان باب جديد...", "New module title...")}
          className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-[var(--gold)]/60"
        />
        <button
          onClick={addModule}
          className="px-4 h-10 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> {t("إضافة باب", "Add module")}
        </button>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-white/40 text-center py-8">
          {t("لا توجد أبواب بعد.", "No modules yet.")}
        </p>
      ) : (
        <div className="space-y-3">
          {modules.map((m, i) => (
            <ModuleCard
              key={m.id}
              m={m}
              index={i}
              items={items[m.id] ?? []}
              onToggle={() => toggleComplete(m)}
              onDelete={() => delModule(m.id)}
              onChangeOnlineUrl={(url: string) => updateOnlineUrl(m.id, url)}
              onItemsChanged={loadModules}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ModuleCard({
  m,
  index,
  items,
  onToggle,
  onDelete,
  onChangeOnlineUrl,
  onItemsChanged,
}: any) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [open, setOpen] = useState(true);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlVal, setUrlVal] = useState(m.online_url ?? "");
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemKind, setItemKind] = useState<"note" | "link" | "file">("note");
  const [itemTitle, setItemTitle] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemUrl, setItemUrl] = useState("");

  async function addItem() {
    if (!itemTitle.trim()) return;
    let url = itemUrl;
    if (itemKind === "file" && (window as any).__pendingFile) {
      const file: File = (window as any).__pendingFile;
      const path = `${m.course_id}/${m.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("course-files").upload(path, file);
      if (upErr) return toast.error(upErr.message);
      url = path; // store storage path; signed URL generated on access
      (window as any).__pendingFile = null;
    }
    const { error } = await supabase.from("module_items").insert({
      module_id: m.id,
      kind: itemKind,
      title: itemTitle,
      content: itemKind === "note" ? itemContent : null,
      url: itemKind !== "note" ? url : null,
      order_index: items.length,
    });
    if (error) return toast.error(error.message);
    setItemTitle("");
    setItemContent("");
    setItemUrl("");
    setShowAddItem(false);
    onItemsChanged();
  }

  async function delItem(id: string) {
    await supabase.from("module_items").delete().eq("id", id);
    onItemsChanged();
  }

  return (
    <div
      className={`rounded-2xl border ${m.completed_by_admin ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}
    >
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg bg-white/5 text-[var(--gold)] font-bold text-sm flex items-center justify-center shrink-0"
        >
          {index + 1}
        </button>
        <div className="flex-1 min-w-0">
          <h5 className="font-bold">{m.title}</h5>
          {m.online_url && (
            <p className="text-[11px] text-[var(--gold)]/80 mt-0.5 truncate" dir="ltr">
              {m.online_url}
            </p>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1 text-xs px-2.5 h-8 rounded-lg ${m.completed_by_admin ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/5 border border-white/15 text-white/70"}`}
        >
          <Check className="w-3.5 h-3.5" />{" "}
          {m.completed_by_admin ? t("مكتمل", "Complete") : t("وضع علامة الإكمال", "Mark complete")}
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          <div className="pt-3 flex gap-2 items-center">
            <span className="text-xs text-white/50 shrink-0">
              {t("رابط المحاضرة:", "Session link:")}
            </span>
            {editingUrl ? (
              <>
                <input
                  value={urlVal}
                  onChange={(e) => setUrlVal(e.target.value)}
                  dir="ltr"
                  className="flex-1 h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs"
                  placeholder="https://meet..."
                />
                <button
                  onClick={() => {
                    onChangeOnlineUrl(urlVal);
                    setEditingUrl(false);
                  }}
                  className="text-xs px-3 h-9 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
                >
                  {t("حفظ", "Save")}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingUrl(true)}
                className="text-xs text-white/60 hover:text-white flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />{" "}
                {m.online_url ? t("تعديل", "Edit") : t("إضافة رابط", "Add link")}
              </button>
            )}
          </div>

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((it: any) => (
                <li
                  key={it.id}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-sm"
                >
                  {it.kind === "note" ? (
                    <StickyNote className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
                  ) : it.kind === "link" ? (
                    <LinkIcon className="w-4 h-4 mt-0.5 text-sky-300 shrink-0" />
                  ) : (
                    <Paperclip className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{it.title}</p>
                    {it.content && (
                      <p className="text-xs text-white/55 whitespace-pre-wrap mt-0.5">
                        {it.content}
                      </p>
                    )}
                    {it.url &&
                      (it.kind === "file" ? (
                        <button
                          onClick={async () => {
                            const { data, error } = await supabase.storage
                              .from("course-files")
                              .createSignedUrl(it.url, 120);
                            if (error) return toast.error(error.message);
                            window.open(data.signedUrl, "_blank", "noopener");
                          }}
                          className="text-xs text-[var(--gold)] truncate block mt-0.5 hover:underline"
                          dir="ltr"
                        >
                          {it.url}
                        </button>
                      ) : (
                        safeHref(it.url) && (
                          <a
                            href={safeHref(it.url)!}
                            target="_blank"
                            rel="noopener"
                            className="text-xs text-[var(--gold)] truncate block mt-0.5"
                            dir="ltr"
                          >
                            {it.url}
                          </a>
                        )
                      ))}
                  </div>
                  <button
                    onClick={() => delItem(it.id)}
                    className="text-rose-300/60 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showAddItem ? (
            <div className="rounded-xl border border-[var(--gold)]/30 bg-white/[0.03] p-3 space-y-2">
              <div className="flex gap-1">
                {(["note", "link", "file"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setItemKind(k)}
                    className={`text-xs px-2.5 h-8 rounded-lg ${itemKind === k ? "bg-[var(--gold)] text-[#0b1736] font-semibold" : "bg-white/5 text-white/60"}`}
                  >
                    {k === "note"
                      ? t("ملاحظة", "Note")
                      : k === "link"
                        ? t("رابط", "Link")
                        : t("ملف", "File")}
                  </button>
                ))}
              </div>
              <input
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
                required
                placeholder={t(
                  "العنوان المخصص * (يظهر للمتدرب بدلاً من الرابط)",
                  "Custom title * (shown to trainee instead of URL)",
                )}
                className="w-full h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs"
              />

              {itemKind === "note" && (
                <textarea
                  value={itemContent}
                  onChange={(e) => setItemContent(e.target.value)}
                  placeholder={t("المحتوى", "Content")}
                  rows={3}
                  className="w-full px-2.5 py-2 rounded-lg bg-white/5 border border-white/15 text-xs"
                />
              )}
              {itemKind === "link" && (
                <input
                  value={itemUrl}
                  onChange={(e) => setItemUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="w-full h-9 px-2.5 rounded-lg bg-white/5 border border-white/15 text-xs"
                />
              )}
              {itemKind === "file" && (
                <input
                  type="file"
                  onChange={(e) => {
                    (window as any).__pendingFile = e.target.files?.[0];
                  }}
                  className="block w-full text-xs file:me-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-[var(--gold)] file:text-[#0b1736] file:font-semibold file:cursor-pointer cursor-pointer"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={addItem}
                  className="text-xs px-3 h-8 rounded-lg bg-[var(--gold)] text-[#0b1736] font-semibold"
                >
                  {t("حفظ", "Save")}
                </button>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="text-xs px-3 h-8 rounded-lg bg-white/5 text-white/60"
                >
                  {t("إلغاء", "Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddItem(true)}
              className="text-xs text-[var(--gold)] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />{" "}
              {t("إضافة بند (ملاحظة / رابط / ملف)", "Add item (note / link / file)")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CourseSessions({ courseId }: { courseId: string }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", starts_at: "", duration_minutes: "60" });

  async function load() {
    const { data } = await supabase
      .from("course_sessions")
      .select("*")
      .eq("course_id", courseId)
      .order("starts_at");
    setSessions(data ?? []);
  }
  useEffect(() => {
    load();
  }, [courseId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.starts_at)
      return toast.error(t("العنوان والتاريخ مطلوبين", "Title and date are required"));
    const { error } = await supabase.from("course_sessions").insert({
      course_id: courseId,
      title: form.title,
      starts_at: new Date(form.starts_at).toISOString(),
      duration_minutes: Number(form.duration_minutes),
    });
    if (error) return toast.error(error.message);
    toast.success(t("تمت إضافة المحاضرة وإشعار المتدربين", "Session added and trainees notified"));
    setForm({ title: "", starts_at: "", duration_minutes: "60" });
    load();
  }

  async function del(id: string) {
    await supabase.from("course_sessions").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="dash-card dash-card-hover p-4 space-y-3">
        <Input
          label={t("عنوان المحاضرة", "Session title")}
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("التاريخ والوقت", "Date & time")}
            type="datetime-local"
            value={form.starts_at}
            onChange={(v) => setForm({ ...form, starts_at: v })}
            required
          />
          <Input
            label={t("المدة (دقيقة)", "Duration (min)")}
            type="number"
            value={form.duration_minutes}
            onChange={(v) => setForm({ ...form, duration_minutes: v })}
          />
        </div>
        <button
          type="submit"
          className="w-full h-10 rounded-xl text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
        >
          {t("إضافة المحاضرة", "Add session")}
        </button>
      </form>

      {sessions.length === 0 ? (
        <p className="text-xs text-white/40 text-center py-6">
          {t("لا توجد محاضرات.", "No sessions.")}
        </p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-[var(--gold)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-white/55">
                  {new Date(s.starts_at).toLocaleString("ar-EG")} · {s.duration_minutes}
                  {t("د", "m")}
                </p>
              </div>
              <button
                onClick={() => del(s.id)}
                className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CourseSettings({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);

  const [f, setF] = useState({
    title: course.title,
    description: course.description ?? "",
    price: String(course.price ?? 0),
    currency: course.currency,
    starts_at: course.starts_at ?? "",
    ends_at: course.ends_at ?? "",
    installments_count: String(course.installments_count),
    online_url: course.online_url ?? "",
    cover_emoji: course.cover_emoji ?? "🎓",
    total_hours: String(course.total_hours ?? 0),
    slug: (course as any).slug ?? "",
    logo_url: (course as any).logo_url ?? "",
    brand_name: (course as any).brand_name ?? "",
    brand_primary_color: (course as any).brand_primary_color ?? "",
    brand_tagline_ar: (course as any).brand_tagline_ar ?? "",
    brand_tagline_en: (course as any).brand_tagline_en ?? "",
    course_goals: (course as any).course_goals ?? "",
    target_audience: (course as any).target_audience ?? "",
    is_upcoming: Boolean((course as any).is_upcoming),
  });

  async function save() {
    const slugClean = f.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const { error } = await supabase
      .from("courses")
      .update({
        title: f.title,
        description: f.description || null,
        price: Number(f.price) || 0,
        currency: f.currency,
        starts_at: f.starts_at || null,
        ends_at: f.ends_at || null,
        installments_count: Number(f.installments_count) || 1,
        online_url: f.online_url || null,
        cover_emoji: f.cover_emoji || "🎓",
        total_hours: Number(f.total_hours) || 0,
        slug: slugClean || null,
        logo_url: f.logo_url.trim() || null,
        brand_name: f.brand_name.trim() || null,
        brand_primary_color: f.brand_primary_color.trim() || null,
        brand_tagline_ar: f.brand_tagline_ar.trim() || null,
        brand_tagline_en: f.brand_tagline_en.trim() || null,
        course_goals: f.course_goals.trim() || null,
        target_audience: f.target_audience.trim() || null,
        is_upcoming: f.is_upcoming,
      } as any)
      .eq("id", course.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
  }

  const whiteLabelUrl = f.slug
    ? `${window.location.origin}/c/${f.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")}`
    : "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[80px_1fr] gap-3">
        <Input
          label={t("إيموجي", "Emoji")}
          value={f.cover_emoji}
          onChange={(v) => setF({ ...f, cover_emoji: v })}
        />
        <Input
          label={t("اسم الكورس", "Course name")}
          value={f.title}
          onChange={(v) => setF({ ...f, title: v })}
        />
      </div>
      <TextArea
        label={t("الوصف", "Description")}
        value={f.description}
        onChange={(v) => setF({ ...f, description: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("السعر", "Price")}
          type="number"
          value={f.price}
          onChange={(v) => setF({ ...f, price: v })}
        />
        <Select
          label={t("العملة", "Currency")}
          value={f.currency}
          onChange={(v) => setF({ ...f, currency: v })}
          options={[
            { v: "EGP", l: t("جنيه", "EGP") },
            { v: "SAR", l: t("ريال", "SAR") },
            { v: "USD", l: t("دولار", "USD") },
            { v: "AED", l: t("درهم", "AED") },
          ]}
        />
      </div>
      <Select
        label={t("نظام الدفع", "Payment plan")}
        value={f.installments_count}
        onChange={(v) => setF({ ...f, installments_count: v })}
        options={[
          { v: "1", l: t("دفعة كاملة", "Full payment") },
          { v: "2", l: t("دفعتين", "2 installments") },
          { v: "3", l: t("ثلاث دفعات", "3 installments") },
          { v: "4", l: t("أربع دفعات", "4 installments") },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("تاريخ البدء", "Start date")}
          type="date"
          value={f.starts_at}
          onChange={(v) => setF({ ...f, starts_at: v })}
        />
        <Input
          label={t("تاريخ الانتهاء", "End date")}
          type="date"
          value={f.ends_at}
          onChange={(v) => setF({ ...f, ends_at: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("رابط الكورس", "Course link")}
          value={f.online_url}
          onChange={(v) => setF({ ...f, online_url: v })}
        />
        <Input
          label={t("عدد ساعات الكورس", "Total hours")}
          type="number"
          value={f.total_hours}
          onChange={(v) => setF({ ...f, total_hours: v })}
        />
      </div>

      <TextArea
        label={t("مخرجات الكورس", "Course outcomes")}
        value={f.course_goals}
        onChange={(v) => setF({ ...f, course_goals: v })}
      />
      <TextArea
        label={t("هذا الكورس مناسب لـ", "This course is best for")}
        value={f.target_audience}
        onChange={(v) => setF({ ...f, target_audience: v })}
      />

      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={f.is_upcoming}
          onChange={(e) => setF({ ...f, is_upcoming: e.target.checked })}
          className="size-4 accent-[var(--gold)]"
        />
        <div className="min-w-0">
          <div className="font-semibold text-sm">
            {t("كورس قادم (لم يُفتح التسجيل بعد)", "Upcoming course (enrollment not yet open)")}
          </div>
          <div className="text-[11px] text-white/55">
            {t(
              "سيظهر في قسم 'كورسات قادمة' بنموذج تسجيل اهتمام بدل زر الاشتراك.",
              "Shows in the 'Upcoming' section with an interest form instead of an enroll button.",
            )}
          </div>
        </div>
      </label>

      <button
        onClick={save}
        className="w-full h-11 rounded-xl font-semibold"
        style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}
      >
        {t("حفظ التعديلات", "Save changes")}
      </button>
    </div>
  );
}

// ============= ENROLLMENT DRAWER =============
