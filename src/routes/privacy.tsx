import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CivicConnect" },
      {
        name: "description",
        content: "How CivicConnect collects, uses, and protects your personal information.",
      },
      { property: "og:title", content: "CivicConnect Privacy Policy" },
      {
        property: "og:description",
        content: "Learn how CivicConnect collects, uses, and protects your personal information.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://connect-citizen-pro.lovable.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://connect-citizen-pro.lovable.app/privacy" }],
  }),
  component: Privacy,
});


function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="January 2026">
      <p>
        At CivicConnect, your privacy matters. This Privacy Policy explains what information we
        collect, how we use it, and the choices you have. By using our platform, you agree to the
        practices described below.
      </p>

      <LegalSection heading="1. Information We Collect">
        <p>
          We collect information you provide directly, such as your name, email address, and mobile
          number during registration, as well as the details, location, and photos you submit when
          reporting an issue. We also collect limited technical data (device, browser, and usage
          information) to keep the service secure and reliable.
        </p>
      </LegalSection>

      <LegalSection heading="2. How We Use Your Information">
        <p>
          Your information is used to create and manage your account, process and route civic
          complaints to the appropriate authorities, send status notifications, and improve the
          overall experience. We never sell your personal data.
        </p>
      </LegalSection>

      <LegalSection heading="3. Location & Media Data">
        <p>
          GPS coordinates and uploaded images are used solely to help authorities identify and
          resolve reported issues. Attachments are stored securely and access is restricted through
          authenticated, time-limited links.
        </p>
      </LegalSection>

      <LegalSection heading="4. Data Security">
        <p>
          We apply industry-standard safeguards, including encrypted storage, role-based access
          control, and secure authentication, to protect your data against unauthorized access,
          alteration, or disclosure.
        </p>
      </LegalSection>

      <LegalSection heading="5. Your Rights">
        <p>
          You may access, update, or request deletion of your personal information at any time.
          Contact us to exercise these rights, and we will respond within a reasonable timeframe.
        </p>
      </LegalSection>

      <LegalSection heading="6. Contact Us">
        <p>
          For any privacy-related questions, reach out at{" "}
          <a href="mailto:gaikwadyashraj368@gmail.com" className="text-primary hover:underline">
            gaikwadyashraj368@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
