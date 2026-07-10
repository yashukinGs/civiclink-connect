import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileText, ShieldCheck, UserCog, Wrench, CheckCircle2, Lock } from "lucide-react";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/works")({
  head: () => ({
    meta: [
      { title: "How It Works — CivicConnect" },
      { name: "description", content: "The full lifecycle of a civic complaint on CivicConnect." },
      { property: "og:title", content: "How CivicConnect Works" },
      { property: "og:description", content: "From report to resolution — see the workflow." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://connect-citizen-pro.lovable.app/works" },
    ],
    links: [{ rel: "canonical", href: "https://connect-citizen-pro.lovable.app/works" }],
  }),
  component: Works,
});


const LIFECYCLE = [
  { icon: FileText, title: "Submitted", desc: "Citizen reports an issue with photos and location." },
  { icon: ShieldCheck, title: "Verified", desc: "Ward inspector validates the complaint." },
  { icon: UserCog, title: "Assigned", desc: "Admin assigns it to the right officer & department." },
  { icon: Wrench, title: "In Progress", desc: "Field crew works on resolving the issue." },
  { icon: CheckCircle2, title: "Resolved", desc: "Resolution images & officer remarks added." },
  { icon: Lock, title: "Closed", desc: "Citizen confirms and the complaint is closed." },
];

function Works() {
  return (
    <SiteLayout>
      <div className="py-8">
        <PageHeader
          eyebrow="Works"
          title="The complaint lifecycle"
          subtitle="A transparent, accountable workflow that connects citizens, admins, and field officers."
        />

        <div className="mx-auto mt-14 max-w-3xl px-4">
          <div className="relative border-l border-border pl-8">
            {LIFECYCLE.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative pb-10 last:pb-0"
              >
                <div className="absolute -left-[42px] grid h-9 w-9 place-items-center rounded-full border border-primary/30 bg-card shadow-glow">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-primary text-[10px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <h2 className="font-semibold">{step.title}</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl px-4">
          <div className="glass-card rounded-3xl p-8 text-center">
            <h2 className="text-xl font-bold">Architecture at a glance</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              React frontend → Node/Express APIs → MongoDB Atlas, with AWS S3 for images, SNS for
              notifications, Lambda for background processing, and JWT for secure access.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
              {["Citizen App", "API Gateway", "Express APIs", "MongoDB", "AWS S3", "AWS SNS"].map(
                (node, i, arr) => (
                  <span key={node} className="flex items-center gap-2">
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-medium text-primary">
                      {node}
                    </span>
                    {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
