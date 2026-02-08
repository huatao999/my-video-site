import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us",
  description: "Learn about our user-generated content sharing platform that connects creators and audiences.",
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-50">About Us</h1>
        <p className="text-sm text-neutral-400">Connecting creators and audiences</p>
      </div>

      <article className="prose prose-invert max-w-none space-y-4 text-sm text-neutral-300">
        <p>
          Welcome to our platform. We are a user-generated content (UGC) sharing community that empowers content creators
          to share their work with audiences around the world.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">Our Mission</h2>
        <p>
          Our mission is to build a space where creators can publish, share, and connect with viewers. We believe in the
          power of community-driven content and the value that individual creators bring to the digital landscape.
        </p>

        <h2 className="text-lg font-semibold text-neutral-50">What We Offer</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>A platform for creators to upload and share their original content</li>
          <li>A welcoming environment for audiences to discover and engage with diverse content</li>
          <li>Tools that support content discovery and community interaction</li>
        </ul>

        <h2 className="text-lg font-semibold text-neutral-50">Our Values</h2>
        <p>
          We respect intellectual property rights and expect all users to do the same. Creators are responsible for
          ensuring they have the necessary rights to the content they upload. We maintain a robust process for handling
          copyright and other legal concerns. Please see our{" "}
          <Link href="/dmca" className="text-neutral-200 underline underline-offset-2 hover:text-white">
            DMCA Policy
          </Link>{" "}
          for details.
        </p>

        <p>
          If you have questions, please contact us. We are committed to building a responsible and respectful community.
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
