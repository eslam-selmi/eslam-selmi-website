import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShareCourseView } from "@/components/share/ShareCourseView";
import { GuestCourseList } from "@/components/share/GuestCourseList";
import { GuestLoginForm } from "@/components/share/GuestLoginForm";
import { listGuestCourses, openGuestCourse, guestSignIn, guestSignOut } from "@/lib/guest-access.functions";
import type { VisitorCourse } from "@/lib/course-share-service";

/** Read-only browsing of the active courses for the shared guest login. A signed server cookie, no database session. */
export const Route = createFileRoute("/guest")({
  ssr: false,
  component: GuestPage,
  head: () => ({ meta: [{ title: "Courses" }, { name: "robots", content: "noindex" }, { name: "referrer", content: "no-referrer" }] }),
});

function GuestPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  useEffect(() => { try { if (window.localStorage.getItem("lang") === "en") setLang("en"); } catch { /* keep Arabic */ } }, []);
  const [state, setState] = useState<"loading" | "login" | "list">("loading");
  const [courses, setCourses] = useState<{ id: string; title: string; description: string }[] | null>(null);
  const [course, setCourse] = useState<VisitorCourse | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const load = async () => { try { const r: any = await listGuestCourses(); if (r.ok) { setCourses(r.courses); setState("list"); } else setState("login"); } catch { setState("login"); } };
  useEffect(() => { void load(); }, []);
  const out = async () => { await guestSignOut(); setCourse(null); setCourseId(null); setCourses(null); setState("login"); };
  // Fresh signed URLs every 3 minutes while a course is open; a disabled guest or removed course stops getting them.
  useEffect(() => {
    if (!courseId) return;
    let stop = false;
    const t = window.setInterval(async () => {
      if (stop || [...document.querySelectorAll("video")].some((v) => !v.paused && !v.ended)) return;
      try {
        const r: any = await openGuestCourse({ data: { courseId } });
        if (r.ok) setCourse(r.course); else { stop = true; window.clearInterval(t); }
      } catch { /* keep the current page */ }
    }, 180_000);
    return () => { stop = true; window.clearInterval(t); };
  }, [courseId]);
  const bar = (back?: () => void) => (
    <div className="fixed top-3 start-3 end-3 z-20 flex justify-between pointer-events-none">
      {back ? <button onClick={back} className="pointer-events-auto rounded-lg bg-white/10 px-3 h-9 text-sm text-white">{lang === "ar" ? "رجوع" : "Back"}</button> : <span />}
      <button onClick={out} className="pointer-events-auto rounded-lg bg-white/10 px-3 h-9 text-sm text-white">{lang === "ar" ? "خروج" : "Sign out"}</button>
    </div>
  );
  if (state === "loading") return null;
  if (state === "login") return <GuestLoginForm lang={lang} onSubmit={async (email, password) => { const r: any = await guestSignIn({ data: { email, password } }); if (r.ok) { await load(); return null; } return r.reason; }} />;
  if (course) return <div>{bar(() => { setCourse(null); setCourseId(null); })}<ShareCourseView lang={lang} course={course} progress={{}} onProgress={() => {}} /></div>;
  return <div>{bar()}<GuestCourseList lang={lang} courses={courses} onOpen={async (id) => { const r: any = await openGuestCourse({ data: { courseId: id } }); if (r.ok) { setCourse(r.course); setCourseId(id); } else void load(); }} /></div>;
}
