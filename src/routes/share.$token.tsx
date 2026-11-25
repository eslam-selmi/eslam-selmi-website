import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShareVisitorView, type ShareViewState } from "@/components/share/ShareVisitorView";
import { ShareCourseView } from "@/components/share/ShareCourseView";
import { viewCourseShare, startCourseShare, openCourseShare, reportCourseShareProgress } from "@/lib/course-share.functions";
import type { Progress } from "@/lib/course-share-core";
import type { VisitorCourse } from "@/lib/course-share-service";

/** Visitor page for a course share link. Opening only views; the start click claims. Progress is reported so auto-close can lock the link. */
export const Route = createFileRoute("/share/$token")({
  component: SharePage,
  head: () => ({ meta: [{ title: "Course" }, { name: "robots", content: "noindex" }, { name: "referrer", content: "no-referrer" }] }),
});

const ck = (t: string) => `share-claim:${t.slice(0, 8)}`;
const pk = (t: string) => `share-progress:${t.slice(0, 8)}`;

function SharePage() {
  const { token } = Route.useParams();
  const [state, setState] = useState<ShareViewState>({ kind: "loading" });
  const [course, setCourse] = useState<VisitorCourse | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [finished, setFinished] = useState(false);
  const lang = typeof navigator !== "undefined" && navigator.language?.startsWith("en") ? "en" : "ar";
  const progressRef = useRef<Progress>({});

  const open = useCallback(async (claim: string | null) => {
    const r: any = await openCourseShare({ data: { token, claim } });
    if (r.ok) { setCourse(r.course); return true; }
    setState({ kind: "denied", reason: r.reason });
    return false;
  }, [token]);

  useEffect(() => {
    const claim = localStorage.getItem(ck(token));
    try { progressRef.current = JSON.parse(localStorage.getItem(pk(token)) || "{}"); setProgress(progressRef.current); } catch { /* ignore */ }
    viewCourseShare({ data: { token, claim } })
      .then(async (r: any) => {
        if (!r.ok) return setState({ kind: "denied", reason: r.reason });
        if (!r.needsClaim) { await open(claim); return; }
        setState({ kind: "ready", courseTitle: "", description: "", units: 0, needsStart: true });
      })
      .catch(() => setState({ kind: "denied", reason: "not_found" }));
  }, [token, open]);

  const onStart = async () => {
    const r: any = await startCourseShare({ data: { token, claim: localStorage.getItem(ck(token)) } });
    if (!r.ok) return setState({ kind: "denied", reason: r.reason });
    if (r.claim) localStorage.setItem(ck(token), r.claim);
    await open(r.claim ?? localStorage.getItem(ck(token)));
  };

  const onProgress = (id: string, patch: Progress[string]) => {
    const next = { ...progressRef.current, [id]: { ...progressRef.current[id], ...patch } };
    progressRef.current = next; setProgress(next);
    localStorage.setItem(pk(token), JSON.stringify(next));
    reportCourseShareProgress({ data: { token, claim: localStorage.getItem(ck(token)), progress: next } })
      .then((r: any) => { if (r?.finished) setFinished(true); })
      .catch(() => { /* link may have closed; the page stays as is */ });
  };

  if (course) return <ShareCourseView lang={lang} course={course} progress={progress} finished={finished} onProgress={onProgress} />;
  return <ShareVisitorView lang={lang} state={state} onStart={onStart} />;
}
