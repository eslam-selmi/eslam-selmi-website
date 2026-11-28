import { useState } from "react";
import { CourseContent, CourseSessions } from "@/components/admin/panels/CourseContent";
import { CourseAssignmentsAdmin } from "@/components/admin/panels/CourseAssignments";

type T = (a: string, b: string) => string;

/** Course authoring for a trainer tenant: the same editors the owner uses (modules, lessons and files, live sessions,
 *  assignments and grading), mounted for ONE of the trainer's own courses. The database decides what is allowed. */
export function TrainerCourseWorkspace({ tenantId, courses, t }: { tenantId: string; courses: { id: string; title: string }[]; t: T }) {
  const [id, setId] = useState<string>(courses[0]?.id ?? "");
  const [tab, setTab] = useState<"content" | "sessions" | "assignments">("content");
  if (courses.length === 0) return null;
  const current = courses.find((c) => c.id === id) ? id : courses[0].id;
  const tabs: [typeof tab, string][] = [["content", t("المحتوى", "Content")], ["sessions", t("الجلسات", "Sessions")], ["assignments", t("الواجبات والتقييم", "Assignments and grading")]];
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">{t("بناء الكورس", "Course builder")}</h2>
      <div className="flex flex-wrap gap-3 items-end text-sm">
        <label className="flex flex-col gap-1">{t("الكورس", "Course")}
          <select value={current} onChange={(e) => setId(e.target.value)} className="border rounded px-2 py-1 bg-background">
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <div role="tablist" className="flex gap-2">
          {tabs.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg border ${tab === k ? "bg-primary text-primary-foreground" : ""}`}>{label}</button>
          ))}
        </div>
      </div>
      <div key={current + tab}>
        {tab === "content" && <CourseContent courseId={current} pathPrefix={`t/${tenantId}`} />}
        {tab === "sessions" && <CourseSessions courseId={current} />}
        {tab === "assignments" && <CourseAssignmentsAdmin courseId={current} />}
      </div>
    </section>
  );
}
