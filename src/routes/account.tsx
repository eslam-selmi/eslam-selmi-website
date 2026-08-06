import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Camera, Loader2, Save, UserCog, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "إعدادات الحساب · إسلام سلمي" },
      { name: "description", content: "إدارة بياناتك الشخصية وصورتك وكلمة المرور في منصة إسلام سلمي للتدريب والتطوير." },
      { property: "og:title", content: "إعدادات الحساب · إسلام سلمي" },
      { property: "og:description", content: "إدارة بياناتك الشخصية وصورتك وكلمة المرور." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Profile = { full_name: string | null; email: string | null; avatar_url?: string | null };

function AccountPage() {
  const { user, role, loading, session } = useAuth();
  const { lang } = useI18n();
  const isAr = lang === "ar";
  const nav = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  async function loadProfile() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name,email,avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(data as Profile);
    setName((data as Profile)?.full_name || "");
  }
  useEffect(() => { if (user) loadProfile(); }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    const path = profile?.avatar_url;
    if (!path) { setAvatarSrc(null); return; }
    supabase.storage.from("avatars").createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setAvatarSrc(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [profile?.avatar_url]);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      toast.error(isAr ? "الاسم يجب ألا يقل عن 3 أحرف" : "Name must be at least 3 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: trimmed }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isAr ? "تم تحديث اسمك بنجاح" : "Your name was updated");
    loadProfile();
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error(isAr ? "الرجاء اختيار ملف صورة" : "Please choose an image file");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error(isAr ? "أقصى حجم للصورة 3 ميجابايت" : "Max image size is 3MB");
      return;
    }
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const oldPath = profile?.avatar_url;
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    if (oldPath && oldPath !== path) await supabase.storage.from("avatars").remove([oldPath]);
    toast.success(isAr ? "تم تحديث صورتك الشخصية" : "Profile photo updated");
    loadProfile();
  }

  async function removeAvatar() {
    if (!user) return;
    const oldPath = profile?.avatar_url;
    if (!oldPath) return;
    setUploading(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    await supabase.storage.from("avatars").remove([oldPath]);
    toast.success(isAr ? "تم حذف الصورة" : "Photo removed");
    loadProfile();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const email = session?.user?.email;
    if (!email) { toast.error(isAr ? "لم يتم العثور على البريد الإلكتروني" : "User email not found"); return; }
    if (!currentPassword) { toast.error(isAr ? "الرجاء إدخال كلمة المرور الحالية" : "Please enter your current password"); return; }
    if (newPassword.length < 8) { toast.error(isAr ? "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" : "New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"); return; }

    setChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) { toast.error(isAr ? "كلمة المرور الحالية غير صحيحة" : "Current password is incorrect"); return; }
      const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updErr) { toast.error(updErr.message); return; }
      toast.success(isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center dash-bg">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" />
      </div>
    );
  }

  return (
    <PortalShell userId={user.id} role={(role as any) ?? "trainee"} userLabel={profile?.full_name || profile?.email}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs tracking-widest text-[var(--gold)] mb-2">{isAr ? "حسابك" : "Your account"}</p>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCog className="w-7 h-7 text-[var(--gold)]" /> {isAr ? "إعدادات الحساب" : "Account settings"}
            </h1>
          </div>
          <Link to="/portal" className="inline-flex items-center gap-2 text-xs px-4 h-10 rounded-xl border border-white/15 bg-white/[0.03] hover:bg-white/10 transition">
            {isAr ? "رجوع للوحة" : "Back to dashboard"} <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
          </Link>
        </div>

        {/* Profile */}
        <section className="dash-card p-6 grid md:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-[var(--gold)]/35 bg-white/5 flex items-center justify-center text-4xl font-bold text-[var(--gold)]">
              {avatarSrc
                ? <img src={avatarSrc} alt={profile?.full_name || "avatar"} className="w-full h-full object-cover" />
                : (profile?.full_name || profile?.email || "?").trim().charAt(0).toUpperCase()}
              {uploading && (
                <div className="absolute inset-0 bg-[#040818]/70 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" />
                </div>
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 h-9 rounded-lg bg-white/5 border border-white/15 hover:bg-white/10 transition">
              <Camera className="w-3.5 h-3.5" /> {isAr ? "تغيير الصورة" : "Change photo"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadAvatar(f); }} />
            </label>
            {profile?.avatar_url && (
              <button type="button" onClick={removeAvatar} disabled={uploading} className="text-[11px] text-rose-300 hover:text-rose-200 transition">
                {isAr ? "حذف الصورة" : "Remove photo"}
              </button>
            )}
          </div>

          <form onSubmit={saveName} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">
                {isAr ? "الاسم بالكامل" : "Full name"}
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="premium-input" placeholder={isAr ? "اكتب اسمك" : "Your name"} />
              <p className="text-[11px] text-white/45 mt-1.5">
                {isAr ? "هذا الاسم يظهر في لوحتك وفي التواصل مع الإدارة." : "This name appears on your dashboard and in admin communication."}
              </p>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input value={profile?.email || ""} readOnly disabled className="premium-input opacity-60 cursor-not-allowed" />
            </div>
            <button type="submit" disabled={saving}
              className="h-11 px-6 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:brightness-110 transition"
              style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isAr ? "حفظ التغييرات" : "Save changes"}
            </button>
          </form>
        </section>

        {/* Password */}
        <section className="dash-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <div>
              <h2 className="font-bold text-base">{isAr ? "تغيير كلمة المرور" : "Change password"}</h2>
              <p className="text-xs text-white/55 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {isAr ? "8 أحرف على الأقل." : "At least 8 characters."}
              </p>
            </div>
          </div>
          <form onSubmit={changePassword} className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">{isAr ? "الحالية" : "Current"}</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="premium-input" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">{isAr ? "الجديدة" : "New"}</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="premium-input" />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5 font-semibold">{isAr ? "تأكيد الجديدة" : "Confirm"}</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="premium-input" />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" disabled={changingPassword}
                className="h-11 px-6 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 hover:brightness-110 transition"
                style={{ background: "linear-gradient(135deg, var(--gold), #b8923f)", color: "#0b1736" }}>
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {isAr ? "تحديث كلمة المرور" : "Update password"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </PortalShell>
  );
}
