import { createFileRoute } from "@tanstack/react-router";
import { CertificateTemplate } from "@/components/CertificateTemplate";
export const Route = createFileRoute("/onboarding_/cert-preview")({
  head: () => ({ meta: [{ title: "Certificate preview · Eslam Selmi" }, { name: "description", content: "Preview an Eslam Selmi training certificate." }, { property: "og:title", content: "Certificate preview · Eslam Selmi" }, { property: "og:description", content: "Preview an Eslam Selmi training certificate." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <div className="min-h-screen bg-slate-200 p-6">
      <CertificateTemplate data={{ certificateId: "CERT-2026-8891", traineeName: "Mohamed Ahmed Ali", courseName: "Advanced Leadership & Team Management", trainingHours: "30 Training Hours", issueDate: "August 1, 2026", verificationUrl: "https://eslam-selmi.com/verify/8891" }} />
    </div>
  ),
});
