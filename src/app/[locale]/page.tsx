import HomeClient from "@/components/pages/HomeClient";
import AdStatus from "@/components/ads/AdStatus";
import {Suspense} from "react";

type Props = {
  params: Promise<{locale: string}>;
};

export default async function HomePage({params}: Props) {
  const {locale} = await params;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">视频站</h1>
        <p className="text-sm text-neutral-300">Next.js + Cloudflare R2/CDN</p>
      </div>

      <AdStatus />

      <Suspense>
        <HomeClient locale={locale} />
      </Suspense>
    </div>
  );
}
