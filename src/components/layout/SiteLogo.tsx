"use client";

import Link from "next/link";

export default function SiteLogo() {
  return (
    <Link
      href="/"
      prefetch={true}
      className="flex min-h-[44px] items-center text-sm font-semibold tracking-wide text-neutral-50 underline-offset-4 transition-colors duration-200 hover:text-white hover:underline touch-manipulation"
    >
      视频站
    </Link>
  );
}
