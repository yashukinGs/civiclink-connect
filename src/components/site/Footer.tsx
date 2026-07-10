import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin, Instagram, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Report Issue", to: "/report" },
      { label: "Track Issue", to: "/track" },
      { label: "Community", to: "/community" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "How It Works", to: "/works" },
      { label: "Contact", to: "/contact" },
      { label: "Analytics", to: "/analytics" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms & Conditions", to: "/terms" },
      { label: "FAQ", to: "/faq" },
    ],
  },
];

const SOCIALS = [
  { Icon: Twitter, label: "CivicConnect on Twitter" },
  { Icon: Linkedin, label: "CivicConnect on LinkedIn" },
  { Icon: Instagram, label: "CivicConnect on Instagram" },
  { Icon: Github, label: "CivicConnect on GitHub" },
  { Icon: Mail, label: "Email CivicConnect" },
];

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Connecting Citizens. Solving Problems. Report and track local civic issues to build a
              cleaner, safer, and smarter city.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© 2026 CivicConnect. All rights reserved.</p>
          <p>Built for smarter, more responsive cities.</p>
        </div>
      </div>
    </footer>
  );
}
