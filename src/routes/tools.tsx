import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Target, GraduationCap, Loader2, Lock, FileText, Download, X, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/portal-auth";
import { PortalShell } from "@/components/PortalShell";
import { useI18n } from "@/lib/i18n";
import { ExamTool } from "@/components/tools/ExamTool";
import { TOOLS, fetchMyTools, isToolId, loadWorkspace, saveWorkspace, type ToolId } from "@/lib/tools";

export const Route = createFileRoute("/tools")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { t?: ToolId } => ({ t: isToolId(s.t) ? s.t : undefined }),
  head: () => ({
    meta: [
      { title: "الأدوات التفاعلية · إسلام سلمي" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ToolsPage,
});

const ICONS = { tna: BarChart3, perf: Target, exam: GraduationCap } as const;
// Private bucket "tool-assets". Reads are decided by storage policies that call has_tool_access().
const BUCKET = "tool-assets";
const FILES: Partial<Record<ToolId, { handout?: string; excel?: string }>> = {
  tna: { handout: "tna/handbook.pdf", excel: "tna/original-workbook.xlsx" },
  perf: { handout: "perf/handbook.pdf" },
};
async function signedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 30);
  return error ? null : data.signedUrl;
}


function ToolsPage() {
  const { user, role, loading, activationStatus } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const { t: active } = Route.useSearch();
  const ar = lang === "ar";
  const [allowed, setAllowed] = useState<ToolId[] | null>(null);
  const [err, setErr] = useState(false);
  const [fb, setFb] = useState<{ id: string; email?: string | null } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const u = user ?? fb;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // The auth hook can briefly report no user on a slow device. Confirm with the session before sending the visitor to sign-in.
      let dead = false;
      supabase.auth.getSession().then(({ data }) => {
        if (dead) return;
        if (data.session?.user) setFb({ id: data.session.user.id, email: data.session.user.email });
        else nav({ to: "/auth" });
      }).catch(() => { if (!dead) nav({ to: "/auth" }); });
      return () => { dead = true; };
    }
    if (role !== "admin" && (activationStatus === "pending" || activationStatus === "rejected")) { nav({ to: "/onboarding" }); return; }
    setErr(false);
    fetchMyTools().then(setAllowed).catch(() => { setErr(true); setAllowed([]); });
  }, [user, role, loading, activationStatus, nav, attempt]);

  useEffect(() => {
    // Resolved through the session fallback: load the tool list too.
    if (!user && fb) { setErr(false); fetchMyTools().then(setAllowed).catch(() => { setErr(true); setAllowed([]); }); }
  }, [user, fb, attempt]);

  if (loading || !u || allowed === null) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (err && active) {
    return (
      <PortalShell userId={u.id} role={role === "admin" ? "admin" : "trainee"} userLabel={u.email ?? undefined}>
        <div className="dash-card p-8 max-w-md mx-auto text-center space-y-3">
          <h2 className="text-xl font-bold">{ar ? "تعذّر فتح الأداة" : "Could not open the tool"}</h2>
          <p className="text-sm opacity-70">{ar ? "مشكلة في الاتصال أو التحقق من الصلاحية. جرّب مرة أخرى." : "A connection or access-check problem. Please try again."}</p>
          <button className="h-11 px-5 rounded-xl bg-[var(--gold)] text-black font-bold" onClick={() => { setAllowed(null); setAttempt((n) => n + 1); }}>{ar ? "إعادة المحاولة" : "Try again"}</button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell userId={u.id} role={role === "admin" ? "admin" : "trainee"} userLabel={u.email ?? undefined}>
      <div className="space-y-5">
        {active ? (
          allowed.includes(active)
            ? <LockGate key={active} pageKey={`page.${active}_tool`} ar={ar}>
                {active === "exam" ? <ExamPage ar={ar} /> : <ToolWorkspace tool={active} userId={u.id} ar={ar} />}
              </LockGate>
            : <Denied ar={ar} tool={active} />
        ) : (
          <Chooser allowed={allowed} ar={ar} failed={err} />
        )}
      </div>
    </PortalShell>
  );
}

function ExamPage({ ar }: { ar: boolean }) {
  const m = TOOLS.exam;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/tools" className="h-10 w-10 grid place-items-center rounded-xl border border-white/15" aria-label={ar ? "رجوع" : "Back"}><ArrowLeft className="w-4 h-4 rtl-flip" /></Link>
        <h1 className="text-xl font-extrabold">{ar ? m.ar : m.en}</h1>
      </div>
      <ExamTool ar={ar} />
    </div>
  );
}

// Optional extra lock set by the admin (specific people or a password). The server answers; the tool's own access check still applies.
function LockGate({ pageKey, ar, children }: { pageKey: string; ar: boolean; children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "locked" | "error">("loading");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const db = supabase as any;
  async function check() {
    const { data, error } = await db.rpc("extra_lock_ok", { p_key: pageKey });
    setState(error ? "error" : data ? "ok" : "locked");
  }
  useEffect(() => { check(); }, [pageKey]); // eslint-disable-line react-hooks/exhaustive-deps
  async function unlock(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    const { data, error } = await db.rpc("unlock_page", { p_key: pageKey, p_password: pw });
    setBusy(false);
    if (error) { setMsg(ar ? "محاولات كثيرة، حاول لاحقًا." : "Too many attempts, try later."); return; }
    if (data) { setPw(""); setState("ok"); } else setMsg(ar ? "كلمة المرور غير صحيحة." : "Wrong password.");
  }
  if (state === "loading") return <div className="py-16 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (state === "ok") return <>{children}</>;
  if (state === "error") return <Denied ar={ar} />;
  return (
    <form onSubmit={unlock} className="dash-card p-8 max-w-md mx-auto space-y-3 text-center">
      <Lock className="w-8 h-8 mx-auto opacity-60" />
      <h2 className="text-xl font-bold">{ar ? "هذه الصفحة مقفلة" : "This page is locked"}</h2>
      <p className="text-sm opacity-70">{ar ? "أدخل كلمة المرور التي أعطتك إياها الإدارة، أو اطلب إضافتك." : "Enter the password from the administrator, or ask to be added."}</p>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3" aria-label={ar ? "كلمة المرور" : "Password"} />
      {msg && <p className="text-sm text-red-300">{msg}</p>}
      <button disabled={busy || !pw} className="h-11 px-5 rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-50">{ar ? "فتح" : "Unlock"}</button>
    </form>
  );
}

function Denied({ ar, tool }: { ar: boolean; tool?: ToolId }) {
  const [status, setStatus] = useState<"loading" | "none" | "pending" | "rejected" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const db = supabase as any;
  useEffect(() => {
    if (!tool) { setStatus("none"); return; }
    db.rpc("my_tool_request_status", { p_tool: tool }).then(({ data, error }: any) => setStatus(error ? "error" : data === "pending" ? "pending" : data === "rejected" ? "rejected" : "none"));
  }, [tool]); // eslint-disable-line react-hooks/exhaustive-deps
  async function ask() {
    if (!tool) return;
    setBusy(true);
    const { data, error } = await db.rpc("request_tool_access", { p_tool: tool });
    setBusy(false);
    if (error) { setStatus("error"); return; }
    setStatus(data === "pending" ? "pending" : "none");
    if (data === "has_access") window.location.reload();
  }
  return (
    <div className="dash-card p-8 text-center space-y-3">
      <Lock className="w-8 h-8 mx-auto opacity-60" />
      <h2 className="text-xl font-bold">{ar ? "هذه الأداة غير متاحة لحسابك" : "This tool is not available for your account"}</h2>
      {status === "pending" ? (
        <p className="text-sm text-[var(--accent,#5eead4)] font-semibold" role="status">{ar ? "تم إرسال طلبك وهو بانتظار موافقة الإدارة." : "Your request was sent and is waiting for the administrator."}</p>
      ) : (
        <>
          <p className="text-sm opacity-70">{status === "rejected" ? (ar ? "لم تتم الموافقة على طلبك السابق. يمكنك إرسال طلب جديد." : "Your earlier request was not approved. You can send a new one.") : (ar ? "يمكنك طلب الوصول، وستراجعه الإدارة." : "You can request access and the administrator will review it.")}</p>
          {tool && status !== "loading" && (
            <button type="button" onClick={ask} disabled={busy} className="inline-flex h-11 px-5 items-center gap-2 rounded-xl bg-[var(--gold)] text-black font-bold disabled:opacity-50">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}{ar ? "طلب الوصول للأداة" : "Request access to this tool"}
            </button>
          )}
          {status === "error" && <p className="text-sm text-red-300" role="alert">{ar ? "تعذّر إرسال الطلب. حاول مرة ثانية." : "Could not send the request. Try again."}</p>}
        </>
      )}
      <div><Link to="/tools" className="inline-flex h-10 px-4 items-center rounded-xl border border-white/15 text-sm font-semibold">{ar ? "رجوع" : "Back"}</Link></div>
    </div>
  );
}

function Chooser({ allowed, ar, failed }: { allowed: ToolId[]; ar: boolean; failed: boolean }) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold">{ar ? "الأدوات التفاعلية" : "Interactive tools"}</h1>
        <p className="text-sm opacity-70 mt-1">{ar ? "تحب تدخل على إيه؟ بياناتك محفوظة على حسابك ومتاحة من أي جهاز." : "Pick a tool. Your data is saved to your account and available on any device."}</p>
      </div>
      {failed && <div className="dash-card p-4 text-sm">{ar ? "تعذّر تحميل الأدوات المتاحة. حدّث الصفحة وحاول مرة ثانية." : "Could not load your tools. Refresh and try again."}</div>}
      {allowed.length === 0 && !failed && (
        <div className="dash-card p-8 text-center space-y-2">
          <Lock className="w-8 h-8 mx-auto opacity-60" />
          <p className="font-bold">{ar ? "لا توجد أدوات مفعّلة لحسابك حاليًا." : "No tools are enabled for your account yet."}</p>
          <p className="text-sm opacity-70">{ar ? "تواصل مع الإدارة لتفعيلها." : "Contact the administrator to enable them."}</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {allowed.map((id) => {
          const Icon = ICONS[id];
          const m = TOOLS[id];
          return (
            <Link key={id} to="/tools" search={{ t: id }} className="dash-card dash-card-hover p-5 flex gap-4 items-start text-start">
              <span className="w-11 h-11 rounded-xl grid place-items-center bg-[var(--gold)]/15 text-[var(--gold)] shrink-0"><Icon className="w-5 h-5" /></span>
              <span>
                <b className="block text-base">{ar ? m.ar : m.en}</b>
                <span className="block text-sm opacity-70 mt-1">{ar ? m.descAr : m.descEn}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

type Msg = { type?: string; tool?: string; data?: unknown; rev?: number; h?: number };

function ToolWorkspace({ tool, userId, ar }: { tool: ToolId; userId: string; ar: boolean }) {
  const m = TOOLS[tool];
  const files = FILES[tool] || {};
  const { lang } = useI18n();
  const frame = useRef<HTMLIFrameElement>(null);
  const rev = useRef(0);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const [height, setHeight] = useState(900);
  const [loadErr, setLoadErr] = useState(false);
  const [intro, setIntro] = useState(false);
  const [appUrl, setAppUrl] = useState<string | null>(null);
  const [appErr, setAppErr] = useState(false);
  const origin = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), []);
  const introKey = `tool-intro-${tool}`;
  const langRef = useRef(lang);
  langRef.current = lang;
  // Keep the embedded tool in the same language as the site.
  useEffect(() => { frame.current?.contentWindow?.postMessage({ type: "tool-lang", lang }, origin); }, [lang, origin]);

  // The tool page is not a public file. It is read from the private bucket under the user's own session.
  useEffect(() => {
    let url: string | null = null;
    let dead = false;
    // Prefer the patched copy when it has been uploaded; fall back to the original so nothing regresses.
    supabase.storage.from(BUCKET).download("app/workbook-v2.html")
      .then((r) => (r.error || !r.data ? supabase.storage.from(BUCKET).download("app/workbook.html") : r))
      .then(({ data, error }) => {
        if (dead) return;
        if (error || !data) { setAppErr(true); return; }
        url = URL.createObjectURL(new Blob([data], { type: "text/html" }));
        setAppUrl(`${url}#embed=${tool}${langRef.current === "en" ? "&lang=en" : ""}`);
      })
      .catch(() => !dead && setAppErr(true));
    return () => { dead = true; if (url) URL.revokeObjectURL(url); };
  }, [tool]);

  async function openFile(path: string | undefined, download: boolean) {
    if (!path) return;
    const u = await signedUrl(path);
    if (!u) return;
    const a = document.createElement("a");
    a.href = u; a.target = "_blank"; a.rel = "noreferrer";
    if (download) a.download = "";
    a.click();
  }

  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem(introKey)) setIntro(true);
  }, [introKey]);

  useEffect(() => {
    const post = (msg: Record<string, unknown>) => frame.current?.contentWindow?.postMessage(msg, origin);
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow) return;
      const msg = (e.data || {}) as Msg;
      if (msg.tool && msg.tool !== tool) return;
      if (msg.type === "tool-ready") {
        loadWorkspace(tool)
          .then((w) => { rev.current = w.revision; post({ type: "tool-init", tool, data: w.data }); post({ type: "tool-lang", lang: langRef.current }); })
          .catch(() => setLoadErr(true));
      } else if (msg.type === "tool-save") {
        // Saves run one at a time, in order, so an older save never lands after a newer one.
        chain.current = chain.current.then(async () => {
          try { rev.current = await saveWorkspace(tool, msg.data, rev.current, userId); post({ type: "tool-saved", ok: true }); }
          catch { post({ type: "tool-saved", ok: false }); }
        });
      } else if (msg.type === "tool-height" && typeof msg.h === "number") {
        setHeight(Math.max(600, Math.min(20000, Math.ceil(msg.h))));
      }
    };
    const flush = () => post({ type: "tool-flush" });
    window.addEventListener("message", onMsg);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    return () => { flush(); window.removeEventListener("message", onMsg); window.removeEventListener("pagehide", flush); };
  }, [tool, origin, userId]);

  function closeIntro() { sessionStorage.setItem(introKey, "1"); setIntro(false); }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-3">
          <Link to="/tools" className="h-10 w-10 grid place-items-center rounded-xl border border-white/15" aria-label={ar ? "رجوع" : "Back"}><ArrowLeft className="w-4 h-4 rtl-flip" /></Link>
          <h1 className="text-xl font-extrabold">{ar ? m.ar : m.en}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIntro(true)} className="h-10 px-3 rounded-xl border border-white/15 text-sm font-semibold inline-flex items-center gap-1.5"><FileText className="w-4 h-4" />{ar ? "دليل الاستخدام" : "Handbook"}</button>
          {files.excel && <button type="button" onClick={() => openFile(files.excel, true)} className="h-10 px-3 rounded-xl border border-white/15 text-sm font-semibold inline-flex items-center gap-1.5"><Download className="w-4 h-4" />{ar ? "تنزيل الإكسيل الأصلي" : "Original Excel"}</button>}
        </div>
      </div>
      {loadErr && <div className="dash-card p-4 text-sm">{ar ? "تعذّر تحميل بياناتك المحفوظة. حدّث الصفحة. لن نكتب فوق بياناتك." : "Could not load your saved data. Refresh. We will not overwrite your data."}</div>}
      <div className="dash-card overflow-hidden p-0">
        {appErr && <div className="p-4 text-sm">{ar ? "تعذّر تحميل الأداة. حدّث الصفحة." : "Could not load the tool. Refresh."}</div>}
        {appUrl && <iframe
          ref={frame}
          title={ar ? m.ar : m.en}
          src={appUrl}
          style={{ width: "100%", height, border: 0, display: loadErr ? "none" : "block" }}
        />}
      </div>
      {intro && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="dash-card max-w-md w-full p-6 space-y-4 relative">
            <button type="button" onClick={closeIntro} aria-label={ar ? "إغلاق" : "Close"} className="absolute top-3 end-3 w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
            <h2 className="text-lg font-bold">{ar ? m.handout.ar : m.handout.en}</h2>
            <p className="text-sm opacity-75">{ar ? "اقرأ الدليل قبل ما تبدأ. تقدر ترجع له في أي وقت من زر دليل الاستخدام." : "Read the handbook before you start. You can reopen it anytime."}</p>
            {!files.handout && <p className="text-sm opacity-75">{ar ? "الدليل سيُضاف قريبًا." : "The handbook will be added soon."}</p>}
            <div className="flex flex-wrap gap-2">
              {files.handout && <button type="button" onClick={() => openFile(files.handout, false)} className="h-10 px-4 rounded-xl bg-[var(--gold)] text-black font-bold text-sm inline-flex items-center gap-1.5"><FileText className="w-4 h-4" />{ar ? "قراءة الآن" : "Read now"}</button>}
              {files.handout && <button type="button" onClick={() => openFile(files.handout, true)} className="h-10 px-4 rounded-xl border border-white/15 text-sm font-semibold inline-flex items-center gap-1.5"><Download className="w-4 h-4" />{ar ? "تنزيل PDF" : "Download PDF"}</button>}
              <button type="button" onClick={closeIntro} className="h-10 px-4 rounded-xl border border-white/15 text-sm font-semibold">{ar ? "ابدأ العمل" : "Start"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

