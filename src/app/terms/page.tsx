import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-50">Terms of Service</h1>
        <p className="text-sm text-neutral-400">Last updated: {new Date().toLocaleDateString("en-US")}</p>
      </div>

      <article className="prose prose-invert max-w-none space-y-4 text-sm text-neutral-300">
        <p>
          By using our platform, you agree to these Terms of Service. Please read them carefully.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">1. Acceptance of Terms</h2>
        <p>
          By accessing or using our website and services, you agree to be bound by these Terms. If you do not agree,
          please do not use our platform.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">2. User-Generated Content</h2>
        <p>
          Our platform allows users to upload and share content. You are solely responsible for the content you upload.
          By uploading content, you represent and warrant that you own or have the necessary rights, licenses, and
          permissions to distribute that content. You must not upload content that infringes the intellectual property
          or other rights of third parties.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">3. Content Moderation and Removal</h2>
        <p>
          We reserve the right to remove any content that violates these Terms, our policies, or applicable law,
          including but not limited to content that infringes copyright, promotes illegal activity, or is harmful or
          offensive. We may suspend or terminate accounts that repeatedly violate our policies.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">4. Intellectual Property</h2>
        <p>
          We respect intellectual property rights. If you believe content on our platform infringes your rights, please
          follow our{" "}
          <Link href="/dmca" className="text-neutral-200 underline underline-offset-2 hover:text-white">
            DMCA Policy
          </Link>
          . We will respond to valid takedown notices in accordance with applicable law.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">5. Prohibited Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Upload content you do not have the right to distribute</li>
          <li>Use the platform for any illegal purpose</li>
          <li>Harass, abuse, or harm others</li>
          <li>Attempt to circumvent security or access controls</li>
          <li>Interfere with the proper functioning of the platform</li>
        </ul>

        <h2 className="text-lg font-semibold text-neutral-50">6. Disclaimer of Warranties</h2>
        <p>
          The platform is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or
          error-free service.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, or
          consequential damages arising from your use of the platform.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">8. Changes</h2>
        <p>
          We may modify these Terms at any time. Continued use of the platform after changes constitutes acceptance
          of the updated Terms.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">9. Contact</h2>
        <p>
          For questions about these Terms of Service, please contact us using the information provided on our{" "}
          <Link href="/about" className="text-neutral-200 underline underline-offset-2 hover:text-white">
            About Us
          </Link>{" "}
          page.
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
