import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Wrench, Loader2, CheckCircle2, Clock, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { TOOLS, TOOL_IDS, fetchMyTools, type ToolId } from "@/lib/tools";
import { toast } from "sonner";

const db = supabase as any;

/** Lists interactive tools; courses, certificates, and packages have their own tabs. */
export function MyAccessSection() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const t = (a: string, b: string) => (ar ? a : b);
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<ToolId[]>([]);
  const [req, setReq] = useState<Record<string, string>>({});
  const [busyTool, setBusyTool] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [mine, ...statuses] = await Promise.all([
      fetchMyTools().catch(() => [] as ToolId[]),
      ...TOOL_IDS.map((id) => db.rpc("my_tool_request_status", { p_tool: id })),
    ]);
    setTools(mine);
    const r: Record<string, string> = {};
    TOOL_IDS.forEach((id, i) => { const d = (statuses[i] as any)?.data; if (typeof d === "string") r[id] = d; });
    setReq(r);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function requestTool(id: ToolId) {
    setBusyTool(id);
    const { data, error } = await db.rpc("request_tool_access", { p_tool: id });
    setBusyTool(null);
    if (error) { toast.error(t("تعذر إرسال الطلب", "Could not send the request")); return; }
    toast.success(data === "has_access" ? t("عندك الوصول بالفعل", "You already have access") : t("تم إرسال الطلب وهو قيد المراجعة", "Request sent, pending review"));
    load();
  }


  if (loading) return <div className="py-10 grid place-items-center text-white/60"><Loader2 className="size-5 animate-spin" /></div>;

  return (
    <div>
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
