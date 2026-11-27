// Explicit ADMIN approval of a trainee's graduation project (user 2026-11-27).
// A score or a trainer's grade is not approval. Uses the graduation_approvals table and admin_approve_graduation (applied live 2026-11-27).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function GraduationApprovalControl({ assignmentId, userId }: { assignmentId: string; userId: string }) {
  const { lang } = useI18n(); const isAr = lang === "ar";
  const [approved, setApproved] = useState<boolean | null>(null); const [busy, setBusy] = useState(false);
  async function load() {
    const { data, error } = await (supabase as any).from("graduation_approvals").select("approved_at").eq("assignment_id", assignmentId).eq("user_id", userId).maybeSingle();
    setApproved(error ? null : !!data);
  }
  useEffect(() => { void load(); }, [assignmentId, userId]);
  async function act(approve: boolean) {
    if (!approve && !window.confirm(isAr ? "سحب اعتماد مشروع التخرّج؟" : "Withdraw the graduation project approval?")) return;
    setBusy(true);
    const { error } = approve
      ? await (supabase as any).rpc("admin_approve_graduation", { _assignment: assignmentId, _user: userId })
      : await (supabase as any).rpc("admin_revoke_graduation_approval", { _assignment: assignmentId, _user: userId });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(approve ? (isAr ? "تم اعتماد مشروع التخرّج" : "Graduation project approved") : (isAr ? "تم سحب الاعتماد" : "Approval withdrawn")); void load();
  }
  if (approved === null) return null;
  return (
    <div className="flex items-center gap-2 mt-2 text-xs">
      <span className={approved ? "text-emerald-300" : "text-amber-200"}>{approved ? (isAr ? "معتمد من الأدمن" : "Approved by admin") : (isAr ? "بانتظار اعتماد الأدمن (الدرجة وحدها لا تكفي)" : "Awaiting admin approval (a score alone is not enough)")}</span>
      <button disabled={busy} onClick={() => act(!approved)} className="px-3 h-8 rounded bg-white/10 border border-white/15">{approved ? (isAr ? "سحب الاعتماد" : "Withdraw") : (isAr ? "اعتماد المشروع" : "Approve project")}</button>
    </div>
  );
}
