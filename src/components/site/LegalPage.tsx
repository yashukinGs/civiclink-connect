import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/site/Footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Subtle background glow for depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-hero-glow" />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-md transition-all duration-300 hover:-translate-x-0.5 hover:border-primary/40 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card mt-6 rounded-2xl p-6 sm:p-10"
        >
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          {updated && (
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
          )}
          <div className="legal-content mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{heading}</h2>
      {children}
    </section>
  );
}
