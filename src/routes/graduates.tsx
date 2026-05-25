import { createFileRoute } from "@tanstack/react-router";
import {
  Nav,
  EmpowermentTools,
  Footer,
  WhatsAppFloat,
  CalendlyDialog,
  LanguageHint,
} from "./index";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/graduates")({
  head: () => ({
    meta: [
      { title: "خريج جديد؟ — Eslam Selmi" },
      {
        name: "description",
        content:
          "برنامج عملي للخريجين الجدد لإتقان أدوات بيئة العمل: الذكاء الاصطناعي، Outlook، Canva، Trello، Google Sheets و Forms.",
      },
      { property: "og:title", content: "Empowerment Tools for New Graduates — Eslam Selmi" },
      {
        property: "og:description",
        content:
          "Hands-on program preparing fresh graduates to master AI, Outlook, Canva, Trello and Google Sheets & Forms.",
      },
      { property: "og:url", content: "https://eslam-selmi.lovable.app/graduates" },
    ],
    links: [{ rel: "canonical", href: "https://eslam-selmi.lovable.app/graduates" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Empowerment Tools for New Graduates",
          description:
            "Hands-on program preparing fresh graduates to master workplace tools: AI, Outlook, Canva, Trello, and Google Sheets & Forms.",
          inLanguage: ["ar", "en"],
          provider: {
            "@type": "Person",
            name: "Eslam Selmi",
            url: "https://eslam-selmi.lovable.app/",
          },
        }),
      },
    ],
  }),
  component: GraduatesPage,
});

function GraduatesPage() {
  const { dir } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/25" dir={dir}>
      <Nav />
      <div className="pt-24">
        <EmpowermentTools />
      </div>
      <Footer />
      <WhatsAppFloat />
      <CalendlyDialog />
      <LanguageHint />
    </div>
  );
}
