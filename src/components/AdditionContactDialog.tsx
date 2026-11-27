import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { additionContactSchema, type Addition } from "@/lib/latest-additions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function AdditionContactDialog({ item, onClose, onSaved }: {
  item: Addition; onClose: () => void; onSaved: () => void;
}) {
  const { lang } = useI18n();
  const t = (ar: string, en: string) => lang === "ar" ? ar : en;
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Keep the dialog inside the visible area above the on-screen keyboard (tablets keep it centered otherwise and the keyboard covers the fields).
  const [vv, setVv] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const sync = () => setVv({ top: v.offsetTop, height: v.height });
    sync();
    v.addEventListener("resize", sync);
    v.addEventListener("scroll", sync);
    return () => { v.removeEventListener("resize", sync); v.removeEventListener("scroll", sync); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const parsed = additionContactSchema.safeParse(form);
    if (!parsed.success) {
      setError(t("اكتب اسمًا كاملًا ورقم تليفون وإيميل صحيحين.", "Enter a full name, valid phone number and email."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await supabase.from("latest_addition_contacts").insert({ addition_id: item.id, ...parsed.data });
      if (result.error) throw result.error;
      onSaved();
    } catch {
      setError(t("تعذّر حفظ بياناتك. حاول مرة أخرى.", "Your details could not be saved. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <DialogContent
      dir={lang === "ar" ? "rtl" : "ltr"}
      onOpenAutoFocus={(e) => e.preventDefault()}
      style={vv ? { top: vv.top + 8, bottom: "auto", maxHeight: Math.max(240, vv.height - 16), translate: "-50% 0" } : undefined}
    >
      <DialogHeader className="pe-8 text-start">
        <DialogTitle>{t("بياناتك لعرض الملف", "Your details to view the resource")}</DialogTitle>
        <DialogDescription>{lang === "ar" ? item.title_ar : item.title_en}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4" onFocusCapture={(e) => { const el = e.target as HTMLElement; setTimeout(() => el.scrollIntoView?.({ block: "center", behavior: "smooth" }), 300); }}>
        <div className="space-y-2"><Label htmlFor="addition-name">{t("الاسم الكامل", "Full name")}</Label>
          <Input id="addition-name" autoComplete="name" required minLength={2} maxLength={120} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="addition-phone">{t("رقم التليفون", "Phone number")}</Label>
          <Input id="addition-phone" type="tel" dir="ltr" autoComplete="tel" required maxLength={32} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="addition-email">{t("الإيميل", "Email")}</Label>
          <Input id="addition-email" type="email" dir="ltr" autoComplete="email" required maxLength={254} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
        <p className="text-xs text-muted-foreground">{t("بالضغط على عرض الملف، توافق على مشاركة بياناتك مع إدارة الموقع لهذا الملف.", "By viewing this resource, you agree to share your details with site administration for this resource.")}</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="size-4 animate-spin" />}{t("عرض الملف", "View resource")}</Button>
      </form>
    </DialogContent>
  </Dialog>;
}