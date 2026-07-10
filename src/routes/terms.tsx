import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — CivicConnect" },
      {
        name: "description",
        content: "The terms governing your use of the CivicConnect platform.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="January 2026">
      <p>
        Welcome to CivicConnect. By accessing or using our platform, you agree to be bound by these
        Terms & Conditions. Please read them carefully before using the service.
      </p>

      <LegalSection heading="1. Acceptance of Terms">
        <p>
          By registering for or using CivicConnect, you confirm that you are at least 18 years old
          (or have guardian consent) and agree to comply with these terms and all applicable laws.
        </p>
      </LegalSection>

      <LegalSection heading="2. Use of the Platform">
        <p>
          CivicConnect is intended for genuine reporting of civic issues. You agree to provide
          accurate information and not to misuse the platform for spam, false complaints, harassment,
          or any unlawful activity.
        </p>
      </LegalSection>

      <LegalSection heading="3. User Content">
        <p>
          You retain ownership of the content you submit, but grant CivicConnect a license to use,
          store, and share it with relevant authorities for the purpose of resolving reported
          issues. You are responsible for ensuring your submissions do not violate any rights.
        </p>
      </LegalSection>

      <LegalSection heading="4. Account Responsibility">
        <p>
          You are responsible for maintaining the confidentiality of your login credentials and for
          all activity under your account. Notify us immediately of any unauthorized use.
        </p>
      </LegalSection>

      <LegalSection heading="5. Service Availability">
        <p>
          We strive to keep the platform available and accurate, but we do not guarantee
          uninterrupted service. Features may change, and complaint resolution timelines depend on
          the responsible authorities.
        </p>
      </LegalSection>

      <LegalSection heading="6. Limitation of Liability">
        <p>
          CivicConnect acts as a facilitator between citizens and authorities. We are not liable for
          the actions, delays, or decisions of third-party agencies handling reported issues.
        </p>
      </LegalSection>

      <LegalSection heading="7. Changes to Terms">
        <p>
          We may update these terms periodically. Continued use of the platform after changes
          constitutes acceptance of the revised terms.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
