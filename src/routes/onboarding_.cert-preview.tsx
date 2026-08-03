import { createFileRoute } from "@tanstack/react-router";
import { CertificateTemplate } from "@/components/CertificateTemplate";
export const Route = createFileRoute("/onboarding/cert-preview")({
  component: () => (
    <div className="min-h-screen bg-slate-200 p-6">
      <CertificateTemplate data={{ certificateId: "CERT-2026-8891", traineeName: "Mohamed Ahmed Ali", courseName: "Advanced Leadership & Team Management", trainingHours: "30 Training Hours", issueDate: "August 1, 2026", verificationUrl: "https://eslam-selmi.com/verify/8891" }} />
    </div>
  ),
});
