import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase, GraduationCap, Sparkles, Users, Globe2, Layers,
  MessageCircle, Mail, Linkedin, Phone, ArrowRight, CheckCircle2,
  Menu, X, Calendar, Target, Lightbulb, HeartHandshake
} from "lucide-react";

import headshot from "@/assets/portfolio/headshot.jpg";
import snap1 from "@/assets/portfolio/snap-1.jpg";
import snap2 from "@/assets/portfolio/snap-2.jpg";
import snap3 from "@/assets/portfolio/snap-3.jpg";
import snap4 from "@/assets/portfolio/snap-4.jpg";
import snap5 from "@/assets/portfolio/snap-5.jpg";
import snap6 from "@/assets/portfolio/snap-6.jpg";
import snap7 from "@/assets/portfolio/snap-7.jpg";

export const Route = createFileRoute("/")({ component: Portfolio });

const WHATSAPP = "https://wa.me/966555376228?text=Hi%20Eslam%2C%20I%27d%20like%20to%20book%20a%20free%201%3A1%20session.";

const NAV = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "journey", label: "Journey" },
  { id: "services", label: "Services" },
  { id: "programs", label: "Programs" },
  { id: "clients", label: "Clients" },
  { id: "snapshots", label: "Snapshots" },
  { id: "contact", label: "Contact" },
];

const COUNTRIES = [
  { name: "Egypt", flag: "🇪🇬" }, { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "UAE", flag: "🇦🇪" }, { name: "Algeria", flag: "🇩🇿" },
  { name: "Palestine", flag: "🇵🇸" }, { name: "Oman", flag: "🇴🇲" },
  { name: "Lebanon", flag: "🇱🇧" }, { name: "Qatar", flag: "🇶🇦" },
  { name: "Morocco", flag: "🇲🇦" }, { name: "Tunisia", flag: "🇹🇳" },
  { name: "Jordan", flag: "🇯🇴" }, { name: "Yemen", flag: "🇾🇪" },
];

const JOURNEY = [
  { year: "2017", role: "L&D Specialist", place: "Egypt" },
  { year: "2022", role: "Senior L&D Specialist", place: "Egypt" },
  { year: "2023", role: "Control Supervisor", place: "Egypt" },
  { year: "2024", role: "L&D Supervisor", place: "KSA" },
  { year: "2026", role: "Head of L&D", place: "Egypt" },
  { year: "Now",  role: "Head of L&D", place: "KSA" },
];

const CREDENTIALS = [
  "Design Thinking", "Performance & KPIs", "Instructional Design",
  "IDPCC", "Human Resource Management", "Leaders of Learning",
  "Learning with Coaching",
];

const SERVICES = [
  { icon: Target, title: "L&D Strategy Consulting", desc: "Tailored strategies that align training initiatives with business goals." },
  { icon: Layers, title: "Hybrid Corporate Training", desc: "Flexible sessions for companies — online and offline." },
  { icon: Lightbulb, title: "Instructional Design", desc: "Engaging learning experiences crafted with innovative methods." },
  { icon: HeartHandshake, title: "One-on-One Coaching", desc: "Personalized sessions to unlock individual potential and growth." },
];

const PROGRAMS = [
  {
    track: "Talent Management",
    intro: "Hands-on, immersive program — real-world strategies for talent acquisition, employee development, and strategic planning.",
    items: [
      { name: "Instructional Designing | ID", desc: "Impactful training through expertly crafted, engaging learning experiences." },
      { name: "Recruitment Excellence", desc: "Enhances recruitment skills with practical strategies to secure top talent." },
      { name: "TOT Mastery", desc: "Advanced facilitation skills and innovative teaching strategies." },
    ],
  },
  {
    track: "Learning & Development",
    intro: "Dynamic L&D program to nurture talent, foster continuous improvement and build a culture of learning.",
    items: [
      { name: "L&D From Scratch", desc: "From TNA to annual plans, training kits, ROI analysis and budget management." },
    ],
  },
  {
    track: "Soft Skills",
    intro: "Dynamic workshops that transform how you connect, lead, and grow.",
    items: [
      { name: "Communication Skills", desc: "Clear, persuasive, empathetic communication with diverse audiences." },
      { name: "Leadership Skills", desc: "Inspire and guide teams toward collaborative success and innovation." },
      { name: "Problem Solving", desc: "Analytical abilities and strategic thinking for confident decisions." },
      { name: "Negotiation Skills", desc: "Practical strategies for win-win solutions in any setting." },
      { name: "Teamwork", desc: "Foster collaboration and cooperation in dynamic environments." },
      { name: "Time Management", desc: "Prioritization and efficiency to maximize productivity." },
    ],
  },
];

const SNAPSHOTS = [snap1, snap2, snap3, snap4, snap5, snap6, snap7];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.21, 0.5, 0.3, 1] as const },
};

function Portfolio() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <About />
      <Journey />
      <Services />
      <Programs />
      <Clients />
      <Snapshots />
      <BookCTA />
      <Contact />
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

/* ---------- NAV ---------- */
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "py-2" : "py-4"}`}>
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 transition-all ${scrolled ? "" : ""}`}>
        <div className={`glass rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all`}>
          <a href="#home" className="flex items-center gap-2 group">
            <span className="size-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-bold text-sm">ES</span>
            <span className="font-semibold tracking-tight hidden sm:inline">Eslam Selmi</span>
          </a>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
                {n.label}
              </a>
            ))}
          </nav>
          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition">
            <Calendar className="size-4" /> Book free 1:1
          </a>
          <button className="lg:hidden p-2" onClick={() => setOpen(v => !v)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden mt-2 glass rounded-2xl p-3 grid gap-1">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm">{n.label}</a>
            ))}
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
              <Calendar className="size-4" /> Book free 1:1
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section id="home" ref={ref} className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-aurora animate-float-slow" />
      <div className="absolute inset-0 grain" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-10 items-center">
        <motion.div style={{ y }} className="order-2 lg:order-1">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-primary font-medium" style={{ fontFamily: "Caveat, cursive", fontSize: "1.6rem" }}>
            Hello,
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
            className="mt-2 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Meet <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Eslam Selmi</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="mt-4 text-lg text-muted-foreground max-w-xl text-balance">
            Head of L&D & Talent Management Leader with 8+ years driving human capital excellence across 12 countries.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-8 flex flex-wrap gap-3">
            <a href={WHATSAPP} target="_blank" rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium hover:shadow-[0_0_40px_-10px] hover:shadow-primary transition">
              <MessageCircle className="size-5" /> Book free 1:1 session
              <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
            </a>
            <a href="#programs" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 font-medium hover:bg-white/10 transition">
              Explore programs
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <Stat n="3000+" l="Trainees" />
            <Stat n="12" l="Countries" />
            <Stat n="15+" l="Programs" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
          className="order-1 lg:order-2 relative">
          <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 via-accent/30 to-transparent blur-3xl" />
          <div className="relative rounded-3xl overflow-hidden glass aspect-[4/5] max-w-md mx-auto">
            <img src={headshot} alt="Eslam Selmi, Head of L&D" className="w-full h-full object-cover object-top" />
            <div className="absolute bottom-4 left-4 right-4 glass rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Currently</div>
                <div className="font-semibold">Head of L&D · KSA</div>
              </div>
              <span className="size-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">{n}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{l}</div>
    </div>
  );
}

/* ---------- ABOUT ---------- */
function About() {
  const strengths = [
    { t: "Corporate Training Management", d: "End-to-end training operations within large-scale environments to boost productivity." },
    { t: "Project Management", d: "PMP methodologies to lead complex training projects across diverse regions." },
    { t: "Performance Excellence", d: "Robust KPIs and performance frameworks that drive organizational growth." },
    { t: "Strategic Development", d: "Competency models and dynamic training plans that optimize budgets and talent ROI." },
  ];
  return (
    <Section id="about" eyebrow="About me" title="Driving human capital excellence">
      <motion.p {...fadeUp} className="text-lg text-muted-foreground max-w-3xl">
        L&D Head & Talent Management Leader with 8+ years across Egypt, Saudi Arabia and 12 other countries.
        Expertise spans Education, Retail, FMCG and Logistics — partnering with global leaders like
        <span className="text-foreground"> KnowledgeCity, G4S, Aramex</span> and <span className="text-foreground">Imtenan</span>.
      </motion.p>
      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        {strengths.map((s, i) => (
          <motion.div key={s.t} {...fadeUp} transition={{ duration: 0.6, delay: i * 0.08 }}
            className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition group">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div {...fadeUp} className="mt-10">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <GraduationCap className="size-4" /> Educational credentials
        </h3>
        <div className="flex flex-wrap gap-2">
          {CREDENTIALS.map(c => (
            <span key={c} className="glass px-3 py-1.5 rounded-full text-sm">{c}</span>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}

/* ---------- JOURNEY ---------- */
function Journey() {
  return (
    <Section id="journey" eyebrow="My journey" title="From specialist to head of L&D">
      <div className="relative">
        <div className="absolute left-0 right-0 top-8 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent hidden md:block" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {JOURNEY.map((j, i) => (
            <motion.div key={j.year + j.role} {...fadeUp} transition={{ delay: i * 0.08, duration: 0.6 }} className="relative text-center">
              <div className="mx-auto size-4 rounded-full bg-primary shadow-[0_0_20px] shadow-primary/60 relative z-10" />
              <div className="mt-4 glass rounded-2xl p-4">
                <div className="text-xs text-primary uppercase tracking-wider font-semibold">{j.place}</div>
                <div className="mt-2 font-semibold leading-tight">{j.role}</div>
                <div className="mt-2 text-xs text-muted-foreground">{j.year}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- SERVICES ---------- */
function Services() {
  return (
    <Section id="services" eyebrow="Services" title="How I can help">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SERVICES.map((s, i) => (
          <motion.div key={s.title} {...fadeUp} transition={{ delay: i * 0.08, duration: 0.6 }}
            className="relative glass rounded-2xl p-6 group overflow-hidden hover:bg-white/[0.06] transition">
            <div className="absolute -top-12 -right-12 size-32 rounded-full bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition" />
            <s.icon className="size-7 text-primary" />
            <div className="mt-4 text-xs text-muted-foreground">0{i + 1}</div>
            <h3 className="mt-1 font-semibold text-lg">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- PROGRAMS ---------- */
function Programs() {
  return (
    <Section id="programs" eyebrow="Programs" title="Curated learning tracks">
      <div className="grid lg:grid-cols-3 gap-6">
        {PROGRAMS.map((p, i) => (
          <motion.div key={p.track} {...fadeUp} transition={{ delay: i * 0.08, duration: 0.6 }}
            className="glass rounded-3xl p-6 flex flex-col">
            <div className="inline-flex items-center gap-2 self-start glass rounded-full px-3 py-1 text-xs text-primary font-medium">
              <Sparkles className="size-3.5" /> Track {i + 1}
            </div>
            <h3 className="mt-4 text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.track}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.intro}</p>
            <div className="mt-5 space-y-3 flex-1">
              {p.items.map(it => (
                <div key={it.name} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                  <div className="font-medium text-sm">{it.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{it.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- CLIENTS ---------- */
function Clients() {
  return (
    <Section id="clients" eyebrow="Clients" title="Borders don't stop us">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <motion.div {...fadeUp}>
          <div className="text-[8rem] lg:text-[10rem] leading-none font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>12</div>
          <p className="text-xl font-medium">Worldwide learning, delivered online & on-site.</p>
          <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm">
            <Stat n="3000+" l="Trainees" />
            <Stat n="12+" l="Clients" />
            <Stat n="15+" l="Programs" />
          </div>
        </motion.div>
        <div className="grid grid-cols-4 gap-3">
          {COUNTRIES.map((c, i) => (
            <motion.div key={c.name}
              initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.04 }}
              className="glass aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition">
              <span className="text-3xl">{c.flag}</span>
              <span className="text-[10px] text-muted-foreground text-center px-1">{c.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- SNAPSHOTS ---------- */
function Snapshots() {
  return (
    <Section id="snapshots" eyebrow="Snapshots" title="2017 — 2026 in pictures">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[180px] md:auto-rows-[220px]">
        {SNAPSHOTS.map((src, i) => {
          const spans = [
            "row-span-2", "md:col-span-2", "", "row-span-2",
            "", "md:col-span-2", ""
          ];
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.6 }}
              className={`relative overflow-hidden rounded-2xl group ${spans[i] || ""}`}>
              <img src={src} alt={`Training snapshot ${i + 1}`} loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------- BOOK CTA ---------- */
function BookCTA() {
  return (
    <section id="book" className="px-4 sm:px-6 py-16">
      <motion.div {...fadeUp}
        className="relative mx-auto max-w-6xl rounded-[2rem] p-8 sm:p-12 lg:p-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10" />
        <div className="absolute inset-0 bg-aurora opacity-60" />
        <div className="absolute inset-0 grain" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" /> Free 30-minute session
            </div>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-balance"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Book a free <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">1‑to‑1</span> with me.
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Tell me about your L&D challenge or coaching goal. I'll reply on WhatsApp and we'll
              schedule a call that fits your timezone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={WHATSAPP} target="_blank" rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white px-6 py-3 font-semibold hover:bg-emerald-400 transition shadow-[0_0_40px_-10px] shadow-emerald-500">
                <MessageCircle className="size-5" /> Chat on WhatsApp
                <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
              </a>
              <a href="tel:+966555376228" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 font-medium hover:bg-white/10 transition">
                <Phone className="size-4" /> +966 555 376 228
              </a>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              { i: Target, t: "Clarify your goal", d: "We define the outcome in the first 10 minutes." },
              { i: Lightbulb, t: "Get a tailored plan", d: "Walk away with concrete next steps." },
              { i: HeartHandshake, t: "No strings attached", d: "Free, no obligations — just value." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="glass rounded-2xl p-4 flex items-start gap-3">
                <span className="size-9 rounded-xl bg-primary/20 grid place-items-center text-primary"><Icon className="size-5" /></span>
                <div>
                  <div className="font-semibold text-sm">{t}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- CONTACT ---------- */
function Contact() {
  return (
    <Section id="contact" eyebrow="Get in touch" title="Let's collaborate">
      <div className="grid sm:grid-cols-3 gap-4">
        <ContactCard icon={Phone} label="Mobile" lines={["🇸🇦 +966 555 376 228", "🇪🇬 +20 10 9727 9900"]} href="tel:+966555376228" />
        <ContactCard icon={Mail} label="Email" lines={["eslam.m.selmi@gmail.com"]} href="mailto:eslam.m.selmi@gmail.com" />
        <ContactCard icon={Linkedin} label="LinkedIn" lines={["Connect with Eslam"]} href="https://www.linkedin.com/" />
      </div>
    </Section>
  );
}

function ContactCard({ icon: Icon, label, lines, href }: { icon: any; label: string; lines: string[]; href: string }) {
  return (
    <motion.a {...fadeUp} href={href} target="_blank" rel="noreferrer"
      className="glass rounded-2xl p-6 hover:bg-white/[0.06] transition group block">
      <Icon className="size-6 text-primary" />
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      {lines.map(l => <div key={l} className="font-medium mt-1">{l}</div>)}
      <div className="mt-4 inline-flex items-center gap-1 text-xs text-primary group-hover:gap-2 transition-all">
        Open <ArrowRight className="size-3" />
      </div>
    </motion.a>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="border-t border-white/5 mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="size-8 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-bold text-sm">ES</span>
          <div>
            <div className="font-semibold leading-none">Eslam Selmi</div>
            <div className="text-xs text-muted-foreground mt-1">Portfolio 2026 — Head of L&D</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Eslam Selmi. All rights reserved.</div>
      </div>
    </footer>
  );
}

/* ---------- SECTION WRAPPER ---------- */
function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-4 sm:px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeUp} className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-primary text-sm uppercase tracking-[0.2em] font-medium">
            <span className="h-px w-8 bg-primary" /> {eyebrow}
          </div>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-balance"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {title}
          </h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}

/* ---------- WHATSAPP FLOAT ---------- */
function WhatsAppFloat() {
  return (
    <a href={WHATSAPP} target="_blank" rel="noreferrer"
      aria-label="Book free 1:1 on WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-3 font-semibold shadow-[0_10px_40px_-10px] shadow-emerald-500 transition">
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Book free 1:1</span>
    </a>
  );
}
