import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";

const FAQS = [
  {
    q: "What is CivicConnect?",
    a: "CivicConnect is a smart citizen issue-reporting platform that lets you report local civic problems — like potholes, broken streetlights, or garbage — and track them until they are resolved by the responsible authorities.",
  },
  {
    q: "How do I report an issue?",
    a: "Create an account, go to the Report Issue page, describe the problem, add your location (auto-detected via GPS), attach up to 4 photos or documents, and submit. You'll receive a unique ticket ID to track progress.",
  },
  {
    q: "How can I track my complaint?",
    a: "Use the Track Issue page and enter your ticket ID (for example, CC-2024-0001). You'll see the current status and a progress timeline from submission to resolution.",
  },
  {
    q: "What file types and sizes can I upload?",
    a: "You can upload up to 4 files in JPG, PNG, WEBP, or PDF format, each up to 10MB. Images show as previews and PDFs appear with a file icon and name.",
  },
  {
    q: "Will I be notified about updates?",
    a: "Yes. You receive real-time status updates at each stage of your complaint, so you always know what's happening.",
  },
  {
    q: "Is my personal information safe?",
    a: "Absolutely. We use encrypted storage, secure authentication, and strict access controls. Your data is only shared with authorities to help resolve your reported issues. See our Privacy Policy for details.",
  },
  {
    q: "Is CivicConnect free to use?",
    a: "Yes, CivicConnect is completely free for citizens to report and track civic issues.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — CivicConnect" },
      {
        name: "description",
        content: "Answers to the most common questions about using CivicConnect.",
      },
      { property: "og:title", content: "CivicConnect FAQ" },
      {
        property: "og:description",
        content: "Answers to the most common questions about reporting and tracking civic issues on CivicConnect.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://connect-citizen-pro.lovable.app/faq" },
    ],
    links: [{ rel: "canonical", href: "https://connect-citizen-pro.lovable.app/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      },
    ],
  }),
  component: Faq,
});


function Faq() {
  return (
    <LegalPage title="Frequently Asked Questions" updated="January 2026">
      <p>
        Have a question? Below are answers to the things people ask us most. If you can't find what
        you're looking for, feel free to reach out through our Contact page.
      </p>

      <div className="space-y-4">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-md transition-colors hover:border-primary/40"
          >
            <summary className="cursor-pointer list-none text-base font-semibold text-foreground marker:content-none">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span className="text-primary transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </LegalPage>
  );
}
