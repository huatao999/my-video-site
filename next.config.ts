import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{source: "/sw.js", destination: "/api/monetag-sw"}];
  },
};

export default withNextIntl(nextConfig);
