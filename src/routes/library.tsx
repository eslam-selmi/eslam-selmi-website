import { createFileRoute } from "@tanstack/react-router";
import {
  Nav,
  Library,
  Footer,
  WhatsAppFloat, AskSelmiFloat,
  CalendlyDialog,
  
} from "./index";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Knowledge Library — Eslam Selmi" },
      {
        name: "description",
        content:
          "Curated knowledge library: books, frameworks, and resources on L&D, Talent Management, and Performance.",
      },
      { property: "og:title", content: "Knowledge Library — Eslam Selmi" },
      {
        property: "og:description",
        content:
          "Curated knowledge library on L&D, Talent Management, and Performance by Eslam Selmi.",
      },
      { property: "og:url", content: "https://eslam-selmi.lovable.app/library" },
    ],
    links: [{ rel: "canonical", href: "https://eslam-selmi.lovable.app/library" }],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { dir } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/25" dir={dir}>
      <Nav />
      <div className="pt-24">
        <Library />
      </div>
      <Footer />
      <WhatsAppFloat />
      <AskSelmiFloat />
      <CalendlyDialog />
      
    </div>
  );
}
