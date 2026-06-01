import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { invalidateSiteContent } from "@/lib/site-content";
import { toast } from "sonner";
import { Eye, EyeOff, Save, Plus, Trash2, Pencil, X, Calendar, Clock, Link as LinkIcon } from "lucide-react";

type Row = {
  id: string;
  section_key: string;
  label: string | null;
  content: Record<string, any>;
  is_visible: boolean;
};

type Popup = {
  id: string;
  title_ar: string; title_en: string | null;
  body_ar: string | null; body_en: string | null;
  image_url: string | null;
  cta_label_ar: string | null; cta_label_en: string | null;
  cta_url: string | null;
  starts_at: string | null; ends_at: string | null;
  delay_seconds: number;
  frequency: "once" | "every_visit" | "every_n_days";
  frequency_days: number;
  is_active: boolean;
};

export function SiteManagementPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [sub, setSub] = useState<"content" | "popups">("content");

  return (
    <div className="space-y-4">
      <div className="dash-card p-1.5 inline-flex gap-1">
        {[
          { id: "content", label: t("محتوى الموقع", "Site content") },
          { id: "popups", label: t("النوافذ المنبثقة", "Popups") },
        ].map((x) => (
          <button
            key={x.id}
            onClick={() => setSub(x.id as any)}
            className={`px-4 h-9 rounded-lg text-sm font-semibold transition ${
              sub === x.id
                ? "bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736]"
                : "text-white/65 hover:text-white hover:bg-white/5"
            }`}
          >{x.label}</button>
        ))}
      </div>
      {sub === "content" ? <ContentPanel /> : <PopupsPanel />}
    </div>
  );
}

/* ---------------- CONTENT ---------------- */

function ContentPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  async function refresh() {
    const { data } = await supabase.from("site_content").select("*").order("section_key");
    setRows((data as Row[]) || []);
    invalidateSiteContent();
  }
  useEffect(() => { refresh(); }, []);

  async function toggleVisibility(r: Row) {
    const { error } = await supabase.from("site_content").update({ is_visible: !r.is_visible }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم التحديث", "Updated"));
    refresh();
  }

  return (
    <div className="dash-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{t("إدارة محتوى الموقع", "Site content management")}</h3>
          <p className="text-xs text-white/55 mt-1">
            {t("عدّل النصوص أو أخفِ/أظهر أي قسم في الصفحة الرئيسية.", "Edit text or show/hide any homepage section.")}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm">{r.label || r.section_key}</div>
                <div className="text-[10px] text-white/40 font-mono">{r.section_key}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleVisibility(r)}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    r.is_visible
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/25"
                      : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {r.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {r.is_visible ? t("ظاهر", "Visible") : t("مخفي", "Hidden")}
                </button>
                {Object.keys(r.content || {}).length > 0 ? (
                  <button
                    onClick={() => setEditing(editing === r.id ? null : r.id)}
                    className="h-9 px-3 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />{t("تعديل", "Edit")}
                  </button>
                ) : null}
              </div>
            </div>
            {editing === r.id ? <ContentEditor row={r} onClose={() => setEditing(null)} onSaved={refresh} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentEditor({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [content, setContent] = useState<Record<string, any>>(row.content || {});
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("site_content").update({ content }).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
    onClose();
  }

  return (
    <div className="border-t border-white/10 p-4 space-y-3">
      {Object.keys(content).map((k) => {
        const val = content[k];
        const isLong = typeof val === "string" && val.length > 60;
        return (
          <div key={k}>
            <label className="text-[11px] text-white/55 font-mono block mb-1">{k}</label>
            {isLong ? (
              <textarea
                rows={3}
                value={val ?? ""}
                onChange={(e) => setContent({ ...content, [k]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white"
              />
            ) : (
              <input
                value={val ?? ""}
                onChange={(e) => setContent({ ...content, [k]: e.target.value })}
                className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white"
              />
            )}
          </div>
        );
      })}
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className="h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10">
          {t("إلغاء", "Cancel")}
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="h-10 px-4 rounded-lg bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />{saving ? t("جارٍ الحفظ...", "Saving...") : t("حفظ", "Save")}
        </button>
      </div>
    </div>
  );
}

/* ---------------- POPUPS ---------------- */

const emptyPopup: Omit<Popup, "id"> = {
  title_ar: "", title_en: "", body_ar: "", body_en: "",
  image_url: "", cta_label_ar: "", cta_label_en: "", cta_url: "",
  starts_at: null, ends_at: null,
  delay_seconds: 3,
  frequency: "once", frequency_days: 1,
  is_active: true,
};

function PopupsPanel() {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [items, setItems] = useState<Popup[]>([]);
  const [editing, setEditing] = useState<Popup | (Omit<Popup, "id"> & { id?: string }) | null>(null);

  async function refresh() {
    const { data } = await supabase.from("site_popups").select("*").order("created_at", { ascending: false });
    setItems((data as Popup[]) || []);
  }
  useEffect(() => { refresh(); }, []);

  async function remove(p: Popup) {
    if (!confirm(t("متأكد من الحذف؟", "Delete this popup?"))) return;
    const { error } = await supabase.from("site_popups").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحذف", "Deleted"));
    refresh();
  }

  async function toggleActive(p: Popup) {
    const { error } = await supabase.from("site_popups").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  return (
    <div className="space-y-3">
      <div className="dash-card p-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{t("النوافذ المنبثقة للزوار", "Visitor popups")}</h3>
          <p className="text-xs text-white/55 mt-1">
            {t("جدولة وقتية، تأخير، تحكم في التكرار، وزر CTA.", "Schedule, delay, frequency control, and CTA button.")}
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...emptyPopup })}
          className="h-10 px-4 rounded-lg bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5"
        ><Plus className="w-4 h-4" />{t("إضافة نافذة", "Add popup")}</button>
      </div>

      {items.length === 0 ? (
        <div className="dash-card p-10 text-center text-white/55">{t("لا توجد نوافذ بعد.", "No popups yet.")}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((p) => (
            <div key={p.id} className="dash-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{p.title_ar}</div>
                  {p.title_en ? <div className="text-xs text-white/55 truncate">{p.title_en}</div> : null}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  p.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"
                }`}>{p.is_active ? t("نشطة", "Active") : t("معطّلة", "Off")}</span>
              </div>
              <div className="text-xs text-white/60 space-y-1">
                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{t("تأخير", "Delay")}: {p.delay_seconds}s · {t("تكرار", "Freq")}: {p.frequency}{p.frequency === "every_n_days" ? ` (${p.frequency_days}d)` : ""}</div>
                {(p.starts_at || p.ends_at) ? (
                  <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />
                    {p.starts_at ? new Date(p.starts_at).toLocaleDateString() : "—"} → {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : "—"}
                  </div>
                ) : null}
                {p.cta_url ? <div className="flex items-center gap-1.5 truncate"><LinkIcon className="w-3 h-3" />{p.cta_url}</div> : null}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => toggleActive(p)} className="flex-1 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold">
                  {p.is_active ? t("إيقاف", "Disable") : t("تفعيل", "Enable")}
                </button>
                <button onClick={() => setEditing(p)} className="flex-1 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1">
                  <Pencil className="w-3 h-3" />{t("تعديل", "Edit")}
                </button>
                <button onClick={() => remove(p)} className="h-8 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-300 text-xs">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? <PopupEditor initial={editing} onClose={() => setEditing(null)} onSaved={() => { refresh(); setEditing(null); }} /> : null}
    </div>
  );
}

function PopupEditor({
  initial, onClose, onSaved,
}: { initial: Popup | (Omit<Popup, "id"> & { id?: string }); onClose: () => void; onSaved: () => void }) {
  const { lang } = useI18n();
  const t = (a: string, b: string) => (lang === "ar" ? a : b);
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);
  const isNew = !("id" in p) || !p.id;

  function set<K extends keyof typeof p>(k: K, v: any) { setP((prev) => ({ ...prev, [k]: v })); }

  function toLocal(v: string | null) {
    if (!v) return "";
    try { const d = new Date(v); const off = d.getTimezoneOffset() * 60000; return new Date(d.getTime() - off).toISOString().slice(0, 16); } catch { return ""; }
  }

  async function save() {
    if (!p.title_ar.trim()) return toast.error(t("العنوان بالعربي مطلوب", "Arabic title required"));
    setSaving(true);
    const payload: any = {
      title_ar: p.title_ar, title_en: p.title_en || null,
      body_ar: p.body_ar || null, body_en: p.body_en || null,
      image_url: p.image_url || null,
      cta_label_ar: p.cta_label_ar || null, cta_label_en: p.cta_label_en || null,
      cta_url: p.cta_url || null,
      starts_at: p.starts_at || null, ends_at: p.ends_at || null,
      delay_seconds: Number(p.delay_seconds) || 0,
      frequency: p.frequency,
      frequency_days: Number(p.frequency_days) || 1,
      is_active: p.is_active,
    };
    const { error } = isNew
      ? await supabase.from("site_popups").insert(payload)
      : await supabase.from("site_popups").update(payload).eq("id", (p as Popup).id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="dash-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{isNew ? t("نافذة جديدة", "New popup") : t("تعديل النافذة", "Edit popup")}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label={t("العنوان (عربي)", "Title (AR)")}><input value={p.title_ar} onChange={(e) => set("title_ar", e.target.value)} className={input} /></Field>
          <Field label={t("العنوان (إنجليزي)", "Title (EN)")}><input value={p.title_en || ""} onChange={(e) => set("title_en", e.target.value)} className={input} /></Field>
          <Field label={t("النص (عربي)", "Body (AR)")} full><textarea rows={3} value={p.body_ar || ""} onChange={(e) => set("body_ar", e.target.value)} className={input} /></Field>
          <Field label={t("النص (إنجليزي)", "Body (EN)")} full><textarea rows={3} value={p.body_en || ""} onChange={(e) => set("body_en", e.target.value)} className={input} /></Field>
          <Field label={t("رابط صورة (اختياري)", "Image URL (optional)")} full><input value={p.image_url || ""} onChange={(e) => set("image_url", e.target.value)} className={input} placeholder="https://..." /></Field>
          <Field label={t("نص الزر (عربي)", "Button label (AR)")}><input value={p.cta_label_ar || ""} onChange={(e) => set("cta_label_ar", e.target.value)} className={input} /></Field>
          <Field label={t("نص الزر (إنجليزي)", "Button label (EN)")}><input value={p.cta_label_en || ""} onChange={(e) => set("cta_label_en", e.target.value)} className={input} /></Field>
          <Field label={t("رابط الزر", "Button URL")} full><input value={p.cta_url || ""} onChange={(e) => set("cta_url", e.target.value)} className={input} placeholder="https://wa.me/... or /portal" /></Field>

          <Field label={t("تاريخ البداية", "Starts at")}>
            <input type="datetime-local" value={toLocal(p.starts_at)} onChange={(e) => set("starts_at", e.target.value ? new Date(e.target.value).toISOString() : null)} className={input} />
          </Field>
          <Field label={t("تاريخ النهاية", "Ends at")}>
            <input type="datetime-local" value={toLocal(p.ends_at)} onChange={(e) => set("ends_at", e.target.value ? new Date(e.target.value).toISOString() : null)} className={input} />
          </Field>

          <Field label={t("تأخير الظهور (ثوانٍ)", "Delay (seconds)")}>
            <input type="number" min={0} value={p.delay_seconds} onChange={(e) => set("delay_seconds", e.target.value)} className={input} />
          </Field>
          <Field label={t("تكرار الظهور", "Frequency")}>
            <select value={p.frequency} onChange={(e) => set("frequency", e.target.value)} className={input}>
              <option value="once">{t("مرة واحدة فقط", "Once")}</option>
              <option value="every_visit">{t("كل زيارة", "Every visit")}</option>
              <option value="every_n_days">{t("كل عدد أيام", "Every N days")}</option>
            </select>
          </Field>
          {p.frequency === "every_n_days" ? (
            <Field label={t("عدد الأيام", "Days")}>
              <input type="number" min={1} value={p.frequency_days} onChange={(e) => set("frequency_days", e.target.value)} className={input} />
            </Field>
          ) : null}
          <Field label={t("الحالة", "Status")}>
            <label className="flex items-center gap-2 h-10 px-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
              <input type="checkbox" checked={p.is_active} onChange={(e) => set("is_active", e.target.checked)} />
              <span className="text-sm">{p.is_active ? t("نشطة", "Active") : t("معطّلة", "Disabled")}</span>
            </label>
          </Field>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="h-10 px-4 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10">{t("إلغاء", "Cancel")}</button>
          <button onClick={save} disabled={saving} className="h-10 px-5 rounded-lg bg-gradient-to-b from-[var(--gold)] to-[#c89a3a] text-[#0b1736] font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />{saving ? t("جارٍ الحفظ...", "Saving...") : t("حفظ", "Save")}
          </button>
        </div>
      </div>
    </div>
  );
}

const input = "w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-[var(--gold)]/50";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="text-[11px] text-white/55 block mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}
