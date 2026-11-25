import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShareCourseView } from "@/components/share/ShareCourseView";
import { listGuestCourses, openGuestCourse } from "@/lib/guest-access.functions";
import { GuestCourseList } from "@/components/share/GuestCourseList";
import type { VisitorCourse } from "@/lib/course-share-service";

/** Read-only browsing of every active course for the shared guest login. Nothing here writes. */
export const Route = createFileRoute("/guest")({
  ssr: false,
  component: GuestPage,
  head: () => ({ meta: [{ title: "Courses" }, { name: "robots", content: "noindex" }] }),
});

function GuestPage() {
  const nav = useNavigate();
  const lang = typeof navigator !== "undefined" && navigator.language?.startsWith("en") ? "en" : "ar";
  const [courses, setCourses] = useState<{ id: string; title: string; description: string }[] | null>(null);
  const [course, setCourse] = useState<VisitorCourse | null>(null);
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return void nav({ to: "/auth" });
      try {
        const r: any = await listGuestCourses();
        if (!r.ok) return void nav({ to: "/portal" });
        setCourses(r.courses);
      } catch { void nav({ to: "/portal" }); }
    })();
  }, [nav]);
  if (course) return (
    <div>
      <button onClick={() => setCourse(null)} className="fixed top-3 start-3 z-20 rounded-lg bg-white/10 px-3 h-9 text-sm text-white">{lang === "ar" ? "رجوع" : "Back"}</button>
      <ShareCourseView lang={lang} course={course} progress={{}} onProgress={() => {}} />
    </div>
  );
  return <GuestCourseList lang={lang} courses={courses} onOpen={async (id) => { const r: any = await openGuestCourse({ data: { courseId: id } }); if (r.ok) setCourse(r.course); }} />;
}
