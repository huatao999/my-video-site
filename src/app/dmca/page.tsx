import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "DMCA Policy",
  description: "Digital Millennium Copyright Act policy and takedown procedures.",
};

// Replace with your actual DMCA contact email for copyright complaints
const DMCA_EMAIL = "dmca@example.com";

export default function DMCAPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-50">DMCA Policy</h1>
        <p className="text-sm text-neutral-400">Digital Millennium Copyright Act Notice and Takedown Procedures</p>
      </div>

      <article className="prose prose-invert max-w-none space-y-4 text-sm text-neutral-300">
        <p>
          We respect the intellectual property rights of others and expect our users to do the same. In accordance with
          the Digital Millennium Copyright Act (DMCA) and other applicable laws, we have adopted a policy of
          terminating, in appropriate circumstances, users who are repeat infringers.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Filing a DMCA Takedown Notice</h2>
        <p>
          If you believe that content on our platform infringes your copyright, please send a written notice to our
          designated DMCA agent. Your notice must include:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Identification of the copyrighted work you claim has been infringed</li>
          <li>Identification of the material that you claim is infringing, with enough detail for us to locate it (e.g., URL)</li>
          <li>Your contact information (name, address, telephone number, and email)</li>
          <li>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner</li>
          <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are authorized to act on behalf of the copyright owner</li>
          <li>Your physical or electronic signature</li>
        </ul>

        <h2 className="text-lg font-semibold text-neutral-50">DMCA Agent Contact</h2>
        <p>
          Please send DMCA takedown notices to:
        </p>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900/50 px-4 py-3">
          <p className="font-medium text-neutral-200">DMCA Agent</p>
          <p className="text-neutral-300">
            Email:{" "}
            <a
              href={`mailto:${DMCA_EMAIL}`}
              className="text-neutral-200 underline underline-offset-2 hover:text-white"
            >
              {DMCA_EMAIL}
            </a>
          </p>
        </div>

        <h2 className="text-lg font-semibold text-neutral-50">Counter-Notification</h2>
        <p>
          If you believe that your content was removed by mistake or misidentification, you may submit a
          counter-notification. It must include your physical or electronic signature, identification of the material
          that was removed, a statement under penalty of perjury that you have a good faith belief the material was
          removed in error, and your consent to the jurisdiction of the federal court. Send counter-notifications to the
          same email address above.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Repeat Infringers</h2>
        <p>
          We will terminate the accounts of users who are repeat infringers in appropriate circumstances.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Misrepresentation</h2>
        <p>
          Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that
          material is infringing may be subject to liability.
        </p>

        <p>
          For other inquiries, please see our{" "}
          <Link href="/about" className="text-neutral-200 underline underline-offset-2 hover:text-white">
            About Us
          </Link>{" "}
          or{" "}
          <Link href="/terms" className="text-neutral-200 underline underline-offset-2 hover:text-white">
            Terms of Service
          </Link>
          .
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
