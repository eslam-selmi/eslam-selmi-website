import { createFileRoute } from "@tanstack/react-router";
import { CertificateTemplate } from "@/components/CertificateTemplate";
import { CertificatePreview } from "@/components/certificates/CertificateDocument";
import { Button } from "@/components/ui/button";
import { useState } from "react";
export const Route = createFileRoute("/onboarding_/cert-preview")({
  head: () => ({ meta: [{ title: "Certificate preview · Eslam Selmi" }, { name: "description", content: "Preview an Eslam Selmi training certificate." }, { property: "og:title", content: "Certificate preview · Eslam Selmi" }, { property: "og:description", content: "Preview an Eslam Selmi training certificate." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: PreviewPage,
});

function PreviewPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  return <div className="min-h-screen bg-muted p-4 sm:p-6">
    <div className="mb-5 flex justify-center gap-2">
      <Button variant={lang === "ar" ? "default" : "outline"} onClick={() => setLang("ar")} aria-pressed={lang === "ar"}>العربية</Button>
      <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")} aria-pressed={lang === "en"}>English</Button>
    </div>
    {lang === "ar" ? <CertificatePreview payload={{ certificateId: "CERT-2026-8891", studentName: "محمد أحمد علي", courseTitle: "القيادة المتقدمة وإدارة فرق العمل", totalHours: 30, issueDate: new Date("2026-10-15T12:00:00Z"), lang }} /> : <CertificateTemplate data={{ certificateId: "CERT-2026-8891", traineeName: "Mohamed Ahmed Ali", courseName: "Advanced Leadership & Team Management", trainingHours: "30 Training Hours", issueDate: "October 15, 2026", verificationUrl: "https://eslam-selmi.com/verify/8891" }} />}
  </div>;
}
