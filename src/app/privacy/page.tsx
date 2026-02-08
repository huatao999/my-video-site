import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-50">Privacy Policy</h1>
        <p className="text-sm text-neutral-400">Last updated: {new Date().toLocaleDateString("en-US")}</p>
      </div>

      <article className="prose prose-invert max-w-none space-y-4 text-sm text-neutral-300">
        <p>
          We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard
          information when you use our platform.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Information We Collect</h2>
        <p>
          When you visit our website, we and our advertising partners may collect certain information automatically,
          including:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>IP address (anonymized where possible)</li>
          <li>Pages visited and time spent on our site</li>
          <li>Referral source</li>
        </ul>

        <h2 className="text-lg font-semibold text-neutral-50">How We Use This Information</h2>
        <p>
          We use this information to deliver and improve our services, personalize your experience, and display
          relevant advertisements. Our advertising partners use browsing data to show you ads that may be of interest
          to you. This helps support our platform and keeps our services free for users.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Cookies and Similar Technologies</h2>
        <p>
          We use cookies and similar technologies to store preferences (such as language choice), analyze traffic, and
          support advertising. You can manage cookie settings through your browser.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your information against
          unauthorized access, alteration, or destruction.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Third-Party Services</h2>
        <p>
          Our site may include third-party advertising networks and analytics providers. These services have their
          own privacy policies. We encourage you to review them.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Your Rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, or delete your personal data. Contact us
          if you wish to exercise these rights.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. The updated version will be posted on this page with a
          revised &quot;Last updated&quot; date.
        </p>

        <p>
          If you have questions about this Privacy Policy, please contact us through the contact information provided
          on our site.
        </p>
      </article>

      <div className="pt-4">
        <Link
          href="/"
          className="text-sm text-neutral-400 underline underline-offset-2 hover:text-neutral-200"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
