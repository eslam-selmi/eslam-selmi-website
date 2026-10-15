import { BookingDialog } from "@/components/booking/BookingDialog";
import { TraineeReviews } from "@/components/TraineeReviews";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform, MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Globe2,
  Layers,
  MessageCircle,
  Mail,
  Linkedin,
  Phone,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  Calendar,
  Target,
  Lightbulb,
  HeartHandshake,
  GraduationCap,
  Award,
  Users,
  TrendingUp,
  BarChart3,
  UserCheck,
  Languages,
  ArrowUp,
  Loader2,
  Briefcase,
  BadgeCheck,
  
  Presentation,
  Moon,
  Sun,
  Mic,
  BookOpen,
  Library as LibraryIcon,
  FileText,
  Download,
  ExternalLink,
  Rocket,
  Wand2,
  Mail as MailIcon,
  Palette,
  Trello,
  Table2,
  Bot,
  Quote,
  ShieldCheck,
  KeyRound,
  LogIn,
  Clock,
  User as UserIcon,
  MessageSquare,
  Check,
  Video,
  PlayCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LatestAdditionsSection } from "@/components/LatestAdditions";
import { useSiteContent } from "@/lib/site-content";
import { SitePopup } from "@/components/SitePopup";
import { UniversalEmbedModal } from "@/components/UniversalEmbedModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  COUNTRIES as PHONE_COUNTRIES,
  findCountry as findDialCountry,
  sanitizeNationalNumber,
  validatePhoneForCountry,
} from "@/lib/countries";
import headshotAsset from "@/assets/portfolio/headshot-cutout.png.asset.json";
import brandLogoAsset from "@/assets/brand-logo.webp.asset.json";
import snap1Asset from "@/assets/snapshots/snap-1.jpg.asset.json";
import snap2Asset from "@/assets/snapshots/snap-2.jpg.asset.json";
import snap3Asset from "@/assets/snapshots/snap-3.jpg.asset.json";
import snap4Asset from "@/assets/snapshots/snap-4.jpg.asset.json";
import snap5Asset from "@/assets/snapshots/snap-5.jpg.asset.json";
import snap6Asset from "@/assets/snapshots/snap-6.jpg.asset.json";
import snap7Asset from "@/assets/snapshots/snap-7.jpg.asset.json";
import etecLicenseAsset from "@/assets/etec-license.png.asset.json";
import snap8Asset from "@/assets/snapshots/snap-8.jpg.asset.json";
import logoAramexAsset from "@/assets/clients/aramex.jpg.asset.json";
import logoG4sAsset from "@/assets/clients/g4s.jpg.asset.json";
import logoAllerAquaAsset from "@/assets/clients/aller-aqua.jpg.asset.json";
import logoEvnoAsset from "@/assets/clients/evno.jpg.asset.json";
import logoBadreldinAsset from "@/assets/clients/badreldin.jpg.asset.json";
import logoAmazonEgAsset from "@/assets/clients/amazon-eg.jpg.asset.json";
import logoAlmajarahAsset from "@/assets/clients/almajarah.jpg.asset.json";
import logoImtenanAsset from "@/assets/clients/imtenan.jpg.asset.json";
import logoDaralnokbaAsset from "@/assets/clients/daralnokba.jpg.asset.json";
import logoMallOfEgyptAsset from "@/assets/clients/mall-of-egypt.jpg.asset.json";
import logoNewBrandAsset from "@/assets/clients/new-brand.jpg.asset.json";
import snap10Asset from "@/assets/snapshots/snap-10.jpg.asset.json";
import snap11Asset from "@/assets/snapshots/snap-11.jpg.asset.json";
import snap12Asset from "@/assets/snapshots/snap-12.jpg.asset.json";
import snap13Asset from "@/assets/snapshots/snap-13.jpg.asset.json";
import snap15Asset from "@/assets/snapshots/snap-15.jpg.asset.json";
import snap16Asset from "@/assets/snapshots/snap-16.jpg.asset.json";
import { Journey, Pillars, Programs, Services } from "@/components/home/AboutSections";
import { Contact } from "@/components/home/Contact";
import { CurrentCourses } from "@/components/home/Courses";
import { ScrollTop } from "@/components/home/Floating";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Interviews, Podcast } from "@/components/home/Media";
import { Nav } from "@/components/home/Nav";
import { Brands, Clients, Snapshots } from "@/components/home/Showcase";
import { BookCTA, Testimonials } from "@/components/home/Testimonials";
import { Trainings } from "@/components/home/Trainings";
import { ThemeMode, headshot } from "@/components/home/data";
import { CalendlyDialog } from "@/components/home/shared";

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
      { rel: "preload", as: "image", href: headshot, fetchPriority: "high" },
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
    <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/25">
      <Nav theme={theme as ThemeMode} onThemeToggle={toggle} />
      {isVisible("home.hero") && <Hero />}
      
      {isVisible("home.pillars") && <Pillars />}
      {isVisible("home.journey") && <Journey />}
      {isVisible("home.brands") && <Brands />}
      {isVisible("home.services") && <Services />}
      {isVisible("home.programs") && <Programs />}

      {isVisible("home.latest_additions") && (
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-12">
          <LatestAdditionsSection />
        </div>
      )}

      {isVisible("home.current_courses") && <CurrentCourses />}

      {isVisible("home.podcast") && <Podcast />}
      {isVisible("home.interviews") && <Interviews />}
      {/* Trainings moved to dedicated /trainings page */}
      {isVisible("home.clients") && <Clients />}
      {isVisible("home.snapshots") && <Snapshots />}
      {isVisible("home.testimonials") && <Testimonials />}
      {isVisible("home.trainee_reviews", false) && <TraineeReviews />}
      {isVisible("home.cta") && <BookCTA />}
      {isVisible("home.contact") && <Contact />}
      {isVisible("home.footer") && <Footer />}
      
      <ScrollTop />
      <CalendlyDialog />
      
    </div>
    </MotionConfig>
  );
}

/* ---------- CALENDLY DIALOG ---------- */
