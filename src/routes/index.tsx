import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, type CSSProperties } from "react";
import {
  MapPin,
  Camera,
  Bell,
  BarChart3,
  Building2,
  Smartphone,
  ArrowRight,
  UserPlus,
  Upload,
  FileText,
  Send,
  ClipboardCheck,
  CheckCircle2,

} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/lib/auth";
import { useIssueStats } from "@/lib/issues";
import heroCity from "@/assets/hero-city.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate({ to: "/login" });
    }
  }, [loading, isLoggedIn, navigate]);

  if (loading || !isLoggedIn) {
    return null;
  }

  return <Landing />;
}



const FEATURES = [
  {
    icon: MapPin,
    title: "GPS Location Detection",
    desc: "Auto-pinpoint the exact location of any issue with one tap.",
    iconGradient: "from-cyan-400 to-blue-500",
    glow: "rgba(34,211,238,0.28)",
    glowBorder: "rgba(34,211,238,0.55)",
  },
  {
    icon: Camera,
    title: "Photo Upload",
    desc: "Attach multiple images so authorities see the real picture.",
    iconGradient: "from-purple-500 to-pink-500",
    glow: "rgba(192,132,252,0.28)",
    glowBorder: "rgba(192,132,252,0.55)",
  },
  {
    icon: Bell,
    title: "Real-Time Updates",
    desc: "Instant notifications at every stage of your complaint.",
    iconGradient: "from-orange-400 to-yellow-400",
    glow: "rgba(251,146,60,0.28)",
    glowBorder: "rgba(251,146,60,0.55)",
  },
  {
    icon: BarChart3,
    title: "Issue Tracking",
    desc: "Follow your complaint from submission to resolution.",
    iconGradient: "from-green-400 to-emerald-500",
    glow: "rgba(52,211,153,0.28)",
    glowBorder: "rgba(52,211,153,0.55)",
  },
  {
    icon: Building2,
    title: "Authority Dashboard",
    desc: "A powerful control center for officials and admins.",
    iconGradient: "from-indigo-500 to-violet-500",
    glow: "rgba(129,140,248,0.28)",
    glowBorder: "rgba(129,140,248,0.55)",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    desc: "Beautifully responsive on every device, everywhere.",
    iconGradient: "from-teal-400 to-cyan-500",
    glow: "rgba(45,212,191,0.28)",
    glowBorder: "rgba(45,212,191,0.55)",
  },
];

const STEPS = [
  { icon: UserPlus, title: "Register / Login", desc: "Create your free citizen account in seconds." },
  { icon: Upload, title: "Upload Photo", desc: "Snap and upload a photo of the civic issue." },
  { icon: FileText, title: "Add Description", desc: "Describe the problem and set its priority." },
  { icon: Send, title: "Submit Complaint", desc: "Send it directly to the right authority." },
  { icon: ClipboardCheck, title: "Authority Reviews", desc: "Officials verify and assign the issue." },
  { icon: CheckCircle2, title: "Issue Resolved", desc: "Track progress until it's fully resolved." },
];

const STAT_LABELS: { key: "total" | "resolved" | "pending" | "in_progress"; label: string }[] = [
  { key: "total", label: "Issues Reported" },
  { key: "resolved", label: "Issues Resolved" },
  { key: "pending", label: "Pending Issues" },
  { key: "in_progress", label: "In Progress" },
];


const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-4 ${className}`}>{children}</section>;
}

function Landing() {
  const { stats } = useIssueStats();
  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative -mt-24 overflow-hidden pt-32">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroCity}
            alt="Smart city skyline with location markers"
            className="h-full w-full object-cover opacity-40"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          <div className="absolute inset-0 bg-hero-glow" />
        </div>

        <Section className="relative pb-24 pt-10 text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
          >
            Connecting Citizens. Solving Problems.
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl"
          >
            Report Civic Issues <span className="text-gradient">in Seconds</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Help build a cleaner, safer, and smarter city. Snap, report, and track local issues —
            all in one beautifully simple platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild variant="hero" size="xl">
              <Link to="/report">
                Report Issue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link to="/track">Track Issue</Link>
            </Button>
          </motion.div>

          {/* floating markers */}
          <div className="pointer-events-none absolute left-[8%] top-24 hidden lg:block">
            <div className="animate-float glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm shadow-glow">
              <MapPin className="h-4 w-4 text-primary" /> Pothole reported
            </div>
          </div>
          <div className="pointer-events-none absolute right-[8%] top-40 hidden lg:block">
            <div
              className="animate-float glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm shadow-glow"
              style={{ animationDelay: "1.5s" }}
            >
              <CheckCircle2 className="h-4 w-4 text-success" /> Issue resolved
            </div>
          </div>
        </Section>
      </section>

      {/* STATS */}
      <Section className="-mt-6">
        {stats && stats.total > 0 ? (
          <div className="glass-card grid grid-cols-2 gap-6 rounded-3xl p-8 sm:grid-cols-4">
            {STAT_LABELS.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-3xl font-extrabold text-gradient sm:text-4xl">
                  {stats[s.key].toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="text-base font-medium">No issues reported yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Statistics will appear once reports are submitted.
            </p>
          </div>
        )}
      </Section>

      {/* FEATURES */}
      <Section className="mt-28">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to fix your city"
          subtitle="A complete toolkit for citizens and authorities to collaborate and resolve issues faster."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: (i % 3) * 0.08 }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                const rect = el.getBoundingClientRect();
                el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
                el.style.setProperty("--my", `${e.clientY - rect.top}px`);
              }}
              style={
                {
                  "--card-glow": f.glow,
                  "--card-glow-border": f.glowBorder,
                } as CSSProperties
              }
              className="feature-card group glass-card rounded-2xl p-6"
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${f.iconGradient} text-white shadow-glow transition-transform duration-300 group-hover:scale-110`}
              >
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="mt-28">
        <SectionHeading
          eyebrow="How It Works"
          title="From report to resolution in 6 steps"
          subtitle="A transparent process that keeps you informed every step of the way."
        />
        <div className="relative mt-14">
          <div className="absolute left-0 top-7 hidden h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.06 }}
                className="relative text-center"
              >
                <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-card shadow-glow">
                  <step.icon className="h-6 w-6 text-primary" />
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-primary text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>



      {/* CTA */}
      <Section className="mt-28">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-surface p-10 text-center shadow-elegant sm:p-16">
          <div className="absolute inset-0 -z-10 bg-hero-glow opacity-70" />
          <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
            Ready to make your city better?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of citizens reporting and resolving issues every day. It's free.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/report">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={fadeUp}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}
