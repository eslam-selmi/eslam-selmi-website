import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Award, PhoneOutgoing, Wrench, Loader2, CheckCircle2, Clock, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { TOOLS, TOOL_IDS, fetchMyTools, type ToolId } from "@/lib/tools";
import { toast } from "sonner";

type Enr = { status?: string | null; certificate_issued?: boolean | null };
type Pur = { status: string; sessions_remaining: number; consultation_packages?: { name_ar: string; name_en: string; sessions_count: number } | null };
const db = supabase as any;

/** One read-only place for everything the trainee owns or has asked for. Status comes from the same
 *  tables/functions the real pages use; nothing here grants access. */
export function MyAccessSection({ userId, enrollments, onGo }: {
  userId: string;
  enrollments: Enr[];
  onGo: (tab: "my-courses" | "certificates" | "packages") => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const t = (a: string, b: string) => (ar ? a : b);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<ToolId[]>([]);
  const [req, setReq] = useState<Record<string, string>>({});
  const [purchases, setPurchases] = useState<Pur[]>([]);
  const [busyTool, setBusyTool] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [mine, purRes, ...statuses] = await Promise.all([
      fetchMyTools().catch(() => [] as ToolId[]),
      supabase.from("consultation_package_purchases").select("status,sessions_remaining,consultation_packages(name_ar,name_en,sessions_count)").eq("user_id", userId),
      ...TOOL_IDS.map((id) => db.rpc("my_tool_request_status", { p_tool: id })),
    ]);
    setTools(mine);
    setPurchases(((purRes as any).data as Pur[]) || []);
    const r: Record<string, string> = {};
    TOOL_IDS.forEach((id, i) => { const d = (statuses[i] as any)?.data; if (typeof d === "string") r[id] = d; });
    setReq(r);
    setLoading(false);
  }
  useEffect(() => { load(); }, [userId]);

  async function requestTool(id: ToolId) {
    setBusyTool(id);
    const { data, error } = await db.rpc("request_tool_access", { p_tool: id });
    setBusyTool(null);
    if (error) { toast.error(t("تعذر إرسال الطلب", "Could not send the request")); return; }
    toast.success(data === "has_access" ? t("عندك الوصول بالفعل", "You already have access") : t("تم إرسال الطلب وهو قيد المراجعة", "Request sent, pending review"));
    load();
  }

  const approvedCourses = enrollments.filter((e) => e.status === "approved" || e.status === "completed").length;
  const pendingCourses = enrollments.filter((e) => e.status === "pending").length;
  const certs = enrollments.filter((e) => e.certificate_issued).length;
  const activePurchases = purchases.filter((p) => p.status === "approved");
  const sessionsLeft = activePurchases.reduce((n, p) => n + (p.sessions_remaining || 0), 0);
  const pendingPurchases = purchases.filter((p) => p.status === "pending").length;

  if (loading) return <div className="py-10 grid place-items-center text-white/60"><Loader2 className="size-5 animate-spin" /></div>;

  const Row = ({ icon: Icon, title, line, action }: { icon: any; title: string; line: string; action?: React.ReactNode }) => (
    <div className="nx-card p-4 flex items-center gap-3">
      <div className="size-10 rounded-xl grid place-items-center bg-white/5 shrink-0"><Icon className="w-5 h-5 text-[var(--nx-teal)]" /></div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-white/60 mt-0.5">{line}</div>
      </div>
      {action}
    </div>
  );
  const goBtn = (tab: "my-courses" | "certificates" | "packages") => (
    <button className="nx-btn text-xs shrink-0" onClick={() => onGo(tab)}>{t("فتح", "Open")}</button>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Row icon={BookOpen} title={t("كورساتي", "My courses")}
          line={t(`${approvedCourses} مفعّل${pendingCourses ? ` · ${pendingCourses} بانتظار الموافقة` : ""}`, `${approvedCourses} active${pendingCourses ? ` · ${pendingCourses} awaiting approval` : ""}`)}
          action={goBtn("my-courses")} />
        <Row icon={Award} title={t("شهاداتي", "My certificates")}
          line={t(`${certs} شهادة صادرة`, `${certs} issued`)} action={goBtn("certificates")} />
        <Row icon={PhoneOutgoing} title={t("باقات الاستشارات", "Consulting packages")}
          line={t(`${sessionsLeft} جلسة متبقية${pendingPurchases ? ` · ${pendingPurchases} طلب قيد المراجعة` : ""}`, `${sessionsLeft} sessions left${pendingPurchases ? ` · ${pendingPurchases} request(s) pending` : ""}`)}
          action={goBtn("packages")} />
      </div>

      <div>
        <h3 className="font-display font-extrabold text-base mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-[var(--nx-teal)]" />{t("الأدوات التفاعلية", "Interactive tools")}</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {TOOL_IDS.map((id) => {
            const has = tools.includes(id);
            const st = req[id];
            return (
              <div key={id} className="nx-card p-4 flex flex-col gap-3">
                <div className="font-bold text-sm">{ar ? TOOLS[id].ar : TOOLS[id].en}</div>
                {has ? (
                  <>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 className="size-3.5" />{t("متاح لك", "You have access")}</span>
                    <Link to="/tools" search={{ t: id }} className="nx-btn nx-btn-primary text-xs text-center">{t("فتح الأداة", "Open tool")}</Link>
                  </>
                ) : st === "pending" ? (
                  <span className="text-xs text-amber-700 dark:text-amber-300 inline-flex items-center gap-1"><Clock className="size-3.5" />{t("طلبك قيد المراجعة", "Request pending review")}</span>
                ) : (
                  <>
                    <span className="text-xs text-white/60 inline-flex items-center gap-1"><Lock className="size-3.5" />{st === "rejected" ? t("الطلب السابق لم يُقبل", "Previous request was not approved") : t("غير مفعّلة على حسابك", "Not enabled on your account")}</span>
                    <button className="nx-btn text-xs" disabled={busyTool === id} onClick={() => requestTool(id)}>{t("اطلب الوصول", "Request access")}</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-white/45 mt-2">{t("الطلب لا يفتح الأداة. الوصول بيتفعّل فقط بعد موافقة الإدارة.", "A request does not unlock a tool. Access starts only after it is approved.")}</p>
      </div>
    </div>
  );
}
