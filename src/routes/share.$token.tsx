import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShareVisitorView, type ShareViewState } from "@/components/share/ShareVisitorView";
import { viewCourseShare, startCourseShare } from "@/lib/course-share.functions";

/** DRAFT visitor page. Shows link state and the explicit start button. Opening the course content for the visitor is not built yet. */
export const Route = createFileRoute("/share/$token")({
  component: SharePage,
  head: () => ({ meta: [{ title: "Course" }, { name: "robots", content: "noindex" }] }),
});

const key = (t: string) => `share-claim:${t.slice(0, 8)}`;

function SharePage() {
  const { token } = Route.useParams();
  const [state, setState] = useState<ShareViewState>({ kind: "loading" });
  const lang = typeof navigator !== "undefined" && navigator.language?.startsWith("en") ? "en" : "ar";
  useEffect(() => {
    const claim = localStorage.getItem(key(token));
    viewCourseShare({ data: { token, claim } })
      .then((r: any) => setState(r.ok
        ? { kind: "ready", courseTitle: r.courseTitle ?? "", description: r.description ?? "", units: r.units ?? 0, needsStart: !!r.needsClaim }
        : { kind: "denied", reason: r.reason }))
      .catch(() => setState({ kind: "denied", reason: "not_found" }));
  }, [token]);
  const onStart = async () => {
    const r: any = await startCourseShare({ data: { token, claim: localStorage.getItem(key(token)) } });
    if (r.ok && r.claim) localStorage.setItem(key(token), r.claim);
    setState(r.ok ? { kind: "ready", courseTitle: "", description: "", units: 0, needsStart: false } : { kind: "denied", reason: r.reason });
  };
  return <ShareVisitorView lang={lang} state={state} onStart={onStart} />;
}
