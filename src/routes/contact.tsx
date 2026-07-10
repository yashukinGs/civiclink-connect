import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — CivicConnect" },
      {
        name: "description",
        content:
          "Get in touch with the CivicConnect team for questions, partnerships, or feedback. Reach us by email, phone, or the contact form.",
      },
      { property: "og:title", content: "Contact CivicConnect" },
      {
        property: "og:description",
        content:
          "Questions, partnerships, or feedback? Contact the CivicConnect team by email, phone, or our online form.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://connect-citizen-pro.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://connect-citizen-pro.lovable.app/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "CivicConnect",
          url: "https://connect-citizen-pro.lovable.app/",
          email: "gaikwadyashraj368@gmail.com",
          telephone: "+91 7757886982",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Magicbus Center",
            addressLocality: "Thane",
            addressCountry: "IN",
          },
          contactPoint: {
            "@type": "ContactPoint",
            email: "gaikwadyashraj368@gmail.com",
            telephone: "+91 7757886982",
            contactType: "customer support",
          },
        }),
      },
    ],
  }),
  component: Contact,
});


const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Magicbus Center, Thane");

const INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "gaikwadyashraj368@gmail.com",
    href: "mailto:gaikwadyashraj368@gmail.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 7757886982",
    href: "tel:+917757886982",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Magicbus Center, Thane",
    href: MAPS_URL,
    external: true,
  },
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name is too long."),
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^[+\d][\d\s-]{6,}$/.test(v), "Please enter a valid phone number."),
  subject: z.string().trim().min(1, "Subject is required.").max(150, "Subject is too long."),
  message: z.string().trim().min(1, "Message is required.").max(2000, "Message is too long."),
});

type Errors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as keyof Errors] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });
      if (error) throw error;
      toast.success("Your message has been sent successfully.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast.error("Could not send your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <div className="py-8">
        <PageHeader
          eyebrow="Contact"
          title="Get in touch"
          subtitle="Questions, partnerships, or feedback — we're here to help."
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 px-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {INFO.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="glass-card flex items-center gap-4 rounded-2xl p-5 transition-colors hover:border-primary/40"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="break-all font-medium">{item.value}</div>
                </div>
              </a>
            ))}
            <div className="glass-card overflow-hidden rounded-2xl">
              <iframe
                title="Magicbus Center, Thane"
                src={`https://www.google.com/maps?q=${encodeURIComponent("Magicbus Center, Thane")}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-44 w-full border-0"
              />
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-t border-border p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <MapPin className="h-4 w-4" /> Magicbus Center, Thane
              </a>
            </div>

          </div>


          <motion.form
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            noValidate
            className="glass-card space-y-4 rounded-2xl p-6 lg:col-span-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Full Name</Label>
              <Input id="c-name" value={form.name} onChange={update("name")} placeholder="Your name" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" value={form.email} onChange={update("email")} placeholder="you@email.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">Phone Number <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="c-phone" value={form.phone} onChange={update("phone")} placeholder="+91 9XXXXXXXXX" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-subject">Subject</Label>
              <Input id="c-subject" value={form.subject} onChange={update("subject")} placeholder="What is this about?" />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-msg">Message</Label>
              <Textarea id="c-msg" rows={5} value={form.message} onChange={update("message")} placeholder="How can we help?" />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  Send Message <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.form>
        </div>
      </div>
    </SiteLayout>
  );
}
