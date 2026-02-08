"use client";

import Image from "next/image";
import Link from "next/link";

export default function SiteLogo() {
  return (
    <Link
      href="/"
      prefetch={true}
      className="flex min-h-[44px] items-center touch-manipulation"
      aria-label="Home"
    >
      <Image src="/biao.png" alt="Logo" width={120} height={44} className="h-9 w-auto object-contain" priority />
    </Link>
  );
}
