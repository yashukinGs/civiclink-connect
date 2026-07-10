import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Target, Eye, Rocket, Heart, Code2 } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CivicConnect" },
      { name: "description", content: "Our mission, vision, and the team building CivicConnect." },
      { property: "og:title", content: "About CivicConnect" },
      { property: "og:description", content: "Our mission, vision, and the team building CivicConnect — connecting citizens and solving problems." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://connect-citizen-pro.lovable.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://connect-citizen-pro.lovable.app/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "CivicConnect",
          url: "https://connect-citizen-pro.lovable.app/",
          description:
            "Smart citizen issue reporting platform bridging the gap between citizens and local authorities.",
          email: "gaikwadyashraj368@gmail.com",
          telephone: "+91 7757886982",
        }),
      },
    ],
  }),
  component: About,
});


const PILLARS = [
  {
    icon: Target,
    title: "Mission",
    desc: "Empower every citizen to report and resolve local civic issues effortlessly, building accountable cities.",
  },
  {
    icon: Eye,
    title: "Vision",
    desc: "A future where every neighborhood is responsive, transparent, and continuously improving through data.",
  },
  {
    icon: Rocket,
    title: "Objectives",
    desc: "Faster resolution, transparent tracking, civic engagement, and data-driven governance for all.",
  },
];

const BENEFITS = [
  "Faster issue resolution",
  "Full transparency & tracking",
  "Stronger community participation",
  "Data-driven decision making",
  "Accountable local authorities",
  "Reward-based engagement",
];

const STACK = [
  "React.js",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "Node.js",
  "Express.js",
  "MongoDB Atlas",
  "JWT Auth",
  "AWS S3 / SNS / Lambda",
];

const TEAM: { name: string; role: string; photo?: string }[] = [
  { name: "Yashraj Gaikwad", role: "Founder & Lead" },
  { name: "Priyam Rai", role: "Design & UX" },
  { name: "Karina Prajapati", role: "Database & Backend Support" },
];

function About() {
  return (
    <SiteLayout>
      <div className="py-8">
        <PageHeader
          eyebrow="About"
          title="About CivicConnect"
          subtitle="CivicConnect bridges the gap between citizens and authorities with technology that makes civic action simple."
        />

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <p.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 px-4 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-semibold">Why CivicConnect?</h2>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-primary" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Technology Stack</h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {STACK.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">Meet the Team</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="mx-auto h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-primary text-xl font-bold text-primary-foreground">
                    {m.name.charAt(0)}
                  </div>
                )}
                <h3 className="mt-4 font-semibold">{m.name}</h3>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </SiteLayout>
  );
}
