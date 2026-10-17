import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { lazy, useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import { useSiteContent } from "@/lib/site-content";
import { Hero } from "@/components/home/Hero";
import { Nav } from "@/components/home/Nav";
import { ScrollTop } from "@/components/home/Floating";
import { CalendlyDialog } from "@/components/home/shared";
import { DeferredSection } from "@/components/home/DeferredSection";
import type { ThemeMode } from "@/components/home/data";
const Journey = lazy(() => import("@/components/home/AboutSections").then(m => ({ default: m.Journey })));
const Pillars = lazy(() => import("@/components/home/AboutSections").then(m => ({ default: m.Pillars })));
const Programs = lazy(() => import("@/components/home/AboutSections").then(m => ({ default: m.Programs })));
const Services = lazy(() => import("@/components/home/AboutSections").then(m => ({ default: m.Services })));
const Contact = lazy(() => import("@/components/home/Contact").then(m => ({ default: m.Contact })));
const CurrentCourses = lazy(() => import("@/components/home/Courses").then(m => ({ default: m.CurrentCourses })));
const Footer = lazy(() => import("@/components/home/Footer").then(m => ({ default: m.Footer })));
const Interviews = lazy(() => import("@/components/home/Media").then(m => ({ default: m.Interviews })));
const Podcast = lazy(() => import("@/components/home/Media").then(m => ({ default: m.Podcast })));
const Brands = lazy(() => import("@/components/home/Showcase").then(m => ({ default: m.Brands })));
const Clients = lazy(() => import("@/components/home/Showcase").then(m => ({ default: m.Clients })));
const Snapshots = lazy(() => import("@/components/home/Showcase").then(m => ({ default: m.Snapshots })));
const BookCTA = lazy(() => import("@/components/home/Testimonials").then(m => ({ default: m.BookCTA })));
const Testimonials = lazy(() => import("@/components/home/Testimonials").then(m => ({ default: m.Testimonials })));
const TraineeReviews = lazy(() => import("@/components/TraineeReviews").then(m => ({ default: m.TraineeReviews })));
const LatestAdditionsSection = lazy(() => import("@/components/LatestAdditions").then(m => ({ default: m.LatestAdditionsSection })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eslam Selmi — Head of L&D & Talent" },
      {
        name: "description",
        content:
          "Portfolio of Eslam Selmi: Learning & Development, Talent Management, and Performance expertise across 12 countries. Book a free 1:1.",
      },
      { property: "og:url", content: "https://eslam-selmi.lovable.app/" },
      { property: "og:title", content: "Eslam Selmi — Head of L&D & Talent" },
      { property: "og:description", content: "Portfolio of Eslam Selmi: Learning & Development, Talent Management, and Performance expertise across 12 countries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://eslam-selmi.lovable.app/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": "https://eslam-selmi.lovable.app/#person",
              name: "Eslam Selmi",
              jobTitle: "Head of Learning & Development",
              url: "https://eslam-selmi.lovable.app/",
              image: "https://eslam-selmi.lovable.app/favicon.png",
              sameAs: ["https://www.linkedin.com/in/eslam-selmi/"],
              knowsAbout: [
                "Learning & Development",
                "Talent Management",
                "Performance Management",
                "KPIs",
                "Corporate Training",
              ],
              hasCredential: {
                "@type": "EducationalOccupationalCredential",
                name: "Certified Trainer by ETEC, Saudi Arabia",
                alternateName: "مدرب معتمد من هيئة تقويم التعليم والتدريب بالمملكة العربية السعودية",
                recognizedBy: {
                  "@type": "Organization",
                  name: "Education and Training Evaluation Commission (ETEC)",
                  alternateName: "هيئة تقويم التعليم والتدريب",
                  address: { "@type": "PostalAddress", addressCountry: "SA" },
                },
              },
            },
            {
              "@type": "WebSite",
              "@id": "https://eslam-selmi.lovable.app/#website",
              url: "https://eslam-selmi.lovable.app/",
              name: "Eslam Selmi — Head of L&D",
              inLanguage: ["en", "ar"],
              publisher: { "@id": "https://eslam-selmi.lovable.app/#person" },
            },
            {
              "@type": "Service",
              name: "Strategy Consulting & Corporate Training",
              serviceType: "Learning & Development consulting",
              provider: { "@id": "https://eslam-selmi.lovable.app/#person" },
              areaServed: ["Egypt", "Saudi Arabia", "MENA"],
              description:
                "L&D strategy, talent management, performance & KPIs design, and corporate training programs for enterprises across 12 countries.",
            },
          ],
        }),
      },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const { theme, toggle } = useTheme();
  const { isVisible } = useSiteContent();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, []);

  return (
    <MotionConfig reducedMotion={isMobile ? "always" : "user"}>
    <div className="home-page min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/25">
      <Nav theme={theme as ThemeMode} onThemeToggle={toggle} />
      {isVisible("home.hero") && <Hero />}
      
      {isVisible("home.pillars") && <DeferredSection id="pillars"><Pillars /></DeferredSection>}
      {isVisible("home.journey") && <DeferredSection id="journey"><Journey /></DeferredSection>}
      {isVisible("home.brands") && <DeferredSection id="brands"><Brands /></DeferredSection>}
      {isVisible("home.services") && <DeferredSection id="services"><Services /></DeferredSection>}
      {isVisible("home.programs") && <DeferredSection id="programs"><Programs /></DeferredSection>}

      {isVisible("home.latest_additions") && (
        <DeferredSection id="latest-additions"><div className="max-w-7xl mx-auto px-4 sm:px-5 py-12">
          <LatestAdditionsSection />
        </div></DeferredSection>
      )}

      {isVisible("home.current_courses") && <DeferredSection id="current-courses"><CurrentCourses /></DeferredSection>}

      {isVisible("home.podcast") && <DeferredSection id="podcast"><Podcast /></DeferredSection>}
      {isVisible("home.interviews") && <DeferredSection id="interviews"><Interviews /></DeferredSection>}
      {/* Trainings moved to dedicated /trainings page */}
      {isVisible("home.clients") && <DeferredSection id="clients"><Clients /></DeferredSection>}
      {isVisible("home.snapshots") && <DeferredSection id="snapshots"><Snapshots /></DeferredSection>}
      {isVisible("home.testimonials") && <DeferredSection id="testimonials"><Testimonials /></DeferredSection>}
      {isVisible("home.trainee_reviews", false) && <DeferredSection id="trainee-reviews"><TraineeReviews /></DeferredSection>}
      {isVisible("home.cta") && <DeferredSection id="book"><BookCTA /></DeferredSection>}
      {isVisible("home.contact") && <DeferredSection id="contact"><Contact /></DeferredSection>}
      {isVisible("home.footer") && <DeferredSection id="footer"><Footer /></DeferredSection>}
      
      <ScrollTop />
      <CalendlyDialog />
      
    </div>
    </MotionConfig>
  );
}

/* ---------- CALENDLY DIALOG ---------- */
