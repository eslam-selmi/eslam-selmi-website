import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShareLinksPanel, type AdminShareLink } from "./ShareLinksPanel";
import { createCourseShareLink, listCourseShareLinks, revokeCourseShareLink } from "@/lib/course-share.functions";

/** Admin tab: create, list and revoke course share links. The link is shown once, right after creation. */
export function ShareLinksAdmin({ lang }: { lang: "ar" | "en" }) {
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [links, setLinks] = useState<AdminShareLink[]>([]);
  const [created, setCreated] = useState<{ url: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setLinks((await listCourseShareLinks()) as AdminShareLink[]); setErr(null); }
    catch { setErr(lang === "ar" ? "تعذر تحميل الروابط" : "Could not load links"); }
  }, [lang]);
  useEffect(() => {
    void supabase.from("courses").select("id,title").order("title").then(({ data }) => setCourses((data ?? []) as { id: string; title: string }[]));
    void refresh();
  }, [refresh]);
  return (
    <div className="space-y-3">
      {err && <p className="text-sm text-rose-300">{err}</p>}
      <ShareLinksPanel lang={lang} courses={courses} links={links} justCreated={created}
        onCreate={async (v) => { const r = await createCourseShareLink({ data: v }); setCreated({ url: `${window.location.origin}/share/${r.token}` }); await refresh(); }}
        onRevoke={async (id) => { await revokeCourseShareLink({ data: { id } }); await refresh(); }} />
    </div>
  );
}
